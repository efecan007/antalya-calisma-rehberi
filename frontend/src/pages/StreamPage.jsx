import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { ROOMS, getRoomName } from '../lib/rooms';

// STUN tek başına yalnızca aynı ağdaki (LAN) bağlantılar için yeterlidir; farklı ağlardaki
// (ör. biri mobil veri, biri farklı wifi) taraflar arasında simetrik NAT'lar STUN ile
// aşılamayabilir, bu yüzden trafiği aktarabilecek bir TURN sunucusu da gerekir. Metered'in
// ücretsiz Open Relay TURN sunucusu geliştirme/test amaçlı kullanılıyor; üretimde kendi
// TURN sunucunuzu (ör. coturn) veya ücretli bir TURN sağlayıcısını kullanmanız önerilir.
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export default function StreamPage() {
  const { roomId } = useParams();
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
    if (!ROOMS.some((room) => room.id === roomId)) return undefined;

    const socket = getSocket();
    socket.connect();

    function handleStreamStatus({ roomId: statusRoomId, live }) {
      if (statusRoomId !== roomId) return;
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

    function handleRoomsStatus(statuses) {
      const status = statuses.find((s) => s.roomId === roomId);
      if (status) handleStreamStatus(status);
    }

    socket.on('rooms-status', handleRoomsStatus);
    socket.on('stream-status', handleStreamStatus);
    socket.on('viewer-joined', handleViewerJoined);
    socket.on('signal', handleSignal);

    return () => {
      socket.off('rooms-status', handleRoomsStatus);
      socket.off('stream-status', handleStreamStatus);
      socket.off('viewer-joined', handleViewerJoined);
      socket.off('signal', handleSignal);
      cleanupBroadcaster();
      cleanupViewer();
      socket.disconnect();
    };
  }, [roomId, cleanupBroadcaster, cleanupViewer]);

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
      socket.emit('start-broadcast', { roomId, token }, (res) => {
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
    getSocket().emit('stop-broadcast', { roomId });
    cleanupBroadcaster();
  }

  function joinAsViewer() {
    setError('');
    getSocket().emit('viewer-join', { roomId }, (res) => {
      if (!res?.live) setError('Şu anda canlı yayın yok');
    });
  }

  if (!ROOMS.some((room) => room.id === roomId)) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-sm text-gray-600">Oda bulunamadı.</p>
          <Link to="/yayin" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
            Odalara geri dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/yayin" className="text-sm text-gray-500 hover:text-brand-700 transition">
            Odalar
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-semibold text-gray-900">{getRoomName(roomId)}</h1>
        </div>
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
