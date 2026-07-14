import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export default function StreamPage() {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // viewerId -> RTCPeerConnection (yayıncı tarafı)
  const viewerPeerRef = useRef(null); // izleyici tarafındaki tek bağlantı
  const broadcasterIdRef = useRef(null);

  const cleanupBroadcaster = useCallback(() => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setIsBroadcasting(false);
  }, []);

  const cleanupViewer = useCallback(() => {
    viewerPeerRef.current?.close();
    viewerPeerRef.current = null;
    broadcasterIdRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsWatching(false);
    setIsMuted(true);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    function handleStreamStatus({ live }) {
      setIsLive(live);
      if (!live) cleanupViewer();
    }

    function createViewerPeerConnection(broadcasterId) {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pc.ontrack = (event) => {
        const videoEl = remoteVideoRef.current;
        if (!videoEl) return;
        videoEl.srcObject = event.streams[0];
        // Tarayıcılar kullanıcı etkileşimi olmadan sesli video autoplay'ine izin vermez;
        // play() burada muted=true olduğu için güvenle çalışır, aksi halde promise
        // sessizce reddedilir ve video kalıcı olarak siyah/duraklamış kalır.
        videoEl.play().catch(() => {});
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('signal', {
            targetId: broadcasterId,
            data: { type: 'ice-candidate', candidate: event.candidate },
          });
        }
      };
      return pc;
    }

    function createBroadcasterPeerConnection(viewerId) {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('signal', {
            targetId: viewerId,
            data: { type: 'ice-candidate', candidate: event.candidate },
          });
        }
      };
      return pc;
    }

    async function handleViewerJoined({ viewerId }) {
      const pc = createBroadcasterPeerConnection(viewerId);
      peersRef.current.set(viewerId, pc);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('signal', { targetId: viewerId, data: { type: 'offer', offer } });
    }

    async function handleSignal({ senderId, data }) {
      if (data.type === 'offer') {
        broadcasterIdRef.current = senderId;
        const pc = createViewerPeerConnection(senderId);
        viewerPeerRef.current = pc;
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal', { targetId: senderId, data: { type: 'answer', answer } });
        setIsWatching(true);
        return;
      }

      if (data.type === 'answer') {
        const pc = peersRef.current.get(senderId);
        await pc?.setRemoteDescription(new RTCSessionDescription(data.answer));
        return;
      }

      if (data.type === 'ice-candidate') {
        const pc = peersRef.current.get(senderId) || (senderId === broadcasterIdRef.current ? viewerPeerRef.current : null);
        try {
          await pc?.addIceCandidate(data.candidate);
        } catch {
          // ICE adayı geç geldiyse ya da bağlantı zaten kapandıysa görmezden gel.
        }
      }
    }

    socket.on('stream-status', handleStreamStatus);
    socket.on('viewer-joined', handleViewerJoined);
    socket.on('signal', handleSignal);

    return () => {
      socket.off('stream-status', handleStreamStatus);
      socket.off('viewer-joined', handleViewerJoined);
      socket.off('signal', handleSignal);
      cleanupBroadcaster();
      cleanupViewer();
      socket.disconnect();
    };
  }, [cleanupBroadcaster, cleanupViewer]);

  useEffect(() => {
    if (isBroadcasting && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  }, [isBroadcasting]);

  async function startBroadcast() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (stream.getVideoTracks().length === 0) {
        stream.getTracks().forEach((track) => track.stop());
        setError('Kamera bulunamadı ya da izin verilmedi.');
        return;
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      const socket = getSocket();
      const token = localStorage.getItem('wfh_token');
      socket.emit('start-broadcast', { token }, (res) => {
        if (res?.error) {
          setError(res.error);
          cleanupBroadcaster();
          return;
        }
        setIsBroadcasting(true);
      });
    } catch {
      setError('Kameraya erişilemedi. Tarayıcı izinlerini kontrol edin.');
    }
  }

  function stopBroadcast() {
    getSocket().emit('stop-broadcast');
    cleanupBroadcaster();
  }

  function joinAsViewer() {
    setError('');
    getSocket().emit('viewer-join', {}, (res) => {
      if (!res?.live) setError('Şu anda canlı yayın yok');
    });
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Canlı Yayın</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}

        {isBroadcasting ? (
          <div className="space-y-3">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full rounded-2xl bg-black aspect-video" />
            <button
              onClick={stopBroadcast}
              className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-700 transition"
            >
              Yayını Bitir
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative" style={{ display: isWatching ? 'block' : 'none' }}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={isMuted}
                className="w-full rounded-2xl bg-black aspect-video"
              />
              {isMuted && (
                <button
                  onClick={() => {
                    setIsMuted(false);
                    remoteVideoRef.current?.play().catch(() => {});
                  }}
                  className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/90 transition"
                >
                  Sesi Aç
                </button>
              )}
            </div>

            {!isWatching && (
              <div className="w-full aspect-video rounded-2xl bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                {isLive ? 'Yayına bağlanılıyor...' : 'Şu anda canlı yayın yok'}
              </div>
            )}

            <div className="flex gap-3">
              {isLive && !isWatching && (
                <button
                  onClick={joinAsViewer}
                  className="bg-brand-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-brand-700 transition"
                >
                  Yayını İzle
                </button>
              )}
              {user && !isLive && (
                <button
                  onClick={startBroadcast}
                  className="bg-brand-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-brand-700 transition"
                >
                  Yayın Başlat
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
