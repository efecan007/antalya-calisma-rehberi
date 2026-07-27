import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getSocket } from '../lib/socket';
import { ROOMS } from '../lib/rooms';

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

const MAX_VISIBLE_COMMENTS = 50;
const MAX_VISIBLE_HEARTS = 20;

export default function StreamPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isLive, setIsLive] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [hearts, setHearts] = useState([]);

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

    setViewerCount(0);
    setComments([]);
    setHearts([]);

    const socket = getSocket();
    socket.connect();

    function handleStreamStatus({ roomId: statusRoomId, live }) {
      if (statusRoomId !== roomId) return;
      setIsLive(live);
      if (!live) {
        cleanupViewer();
        setViewerCount(0);
      }
    }

    function handleViewerCount({ roomId: countRoomId, count }) {
      if (countRoomId !== roomId) return;
      setViewerCount(count);
    }

    function handleStreamComment(comment) {
      if (comment.roomId !== roomId) return;
      setComments((prev) => [...prev, comment].slice(-MAX_VISIBLE_COMMENTS));
    }

    function handleStreamHeart(heart) {
      if (heart.roomId !== roomId) return;
      setHearts((prev) => [...prev, heart].slice(-MAX_VISIBLE_HEARTS));
      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== heart.id));
      }, 2000);
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
    socket.on('viewer-count', handleViewerCount);
    socket.on('stream:comment', handleStreamComment);
    socket.on('stream:heart', handleStreamHeart);

    return () => {
      socket.off('rooms-status', handleRoomsStatus);
      socket.off('stream-status', handleStreamStatus);
      socket.off('viewer-joined', handleViewerJoined);
      socket.off('signal', handleSignal);
      socket.off('viewer-count', handleViewerCount);
      socket.off('stream:comment', handleStreamComment);
      socket.off('stream:heart', handleStreamHeart);
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
        setError(t('stream.noCamera'));
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
      setError(t('stream.cameraError'));
    }
  }

  function stopBroadcast() {
    getSocket().emit('stop-broadcast', { roomId });
    cleanupBroadcaster();
  }

  function joinAsViewer() {
    setError('');
    getSocket().emit('viewer-join', { roomId }, (res) => {
      if (!res?.live) {
        setError(t('stream.noneLive'));
        return;
      }
      if (typeof res.viewerCount === 'number') setViewerCount(res.viewerCount);
    });
  }

  function submitComment(e) {
    e.preventDefault();
    const content = commentText.trim();
    if (!content) return;
    const token = localStorage.getItem('wfh_token');
    getSocket().emit('stream:comment', { roomId, token, content });
    setCommentText('');
  }

  function sendHeart() {
    const token = localStorage.getItem('wfh_token');
    getSocket().emit('stream:heart', { roomId, token });
  }

  if (!ROOMS.some((room) => room.id === roomId)) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-sm text-gray-600">{t('stream.roomNotFound')}</p>
          <Link to="/yayin" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
            {t('stream.backToRooms')}
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
            {t('stream.rooms')}
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-semibold text-gray-900">{t('stream.roomName', { n: roomId.split('-')[1] })}</h1>
          {(isBroadcasting || isWatching) && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
              👁 {viewerCount}
            </span>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}

        {isBroadcasting ? (
          <div className="space-y-3">
            <div className="relative">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full rounded-2xl bg-black aspect-video" />
              <FloatingHearts hearts={hearts} />
            </div>
            <button
              onClick={stopBroadcast}
              className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-700 transition"
            >
              {t('stream.stopBroadcast')}
            </button>
            <StreamComments
              comments={comments}
              commentText={commentText}
              setCommentText={setCommentText}
              onSubmit={submitComment}
              onHeart={sendHeart}
              user={user}
              t={t}
            />
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
              <FloatingHearts hearts={hearts} />
              {isMuted && (
                <button
                  onClick={() => {
                    setIsMuted(false);
                    remoteVideoRef.current?.play().catch(() => {});
                  }}
                  className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/90 transition"
                >
                  {t('stream.unmute')}
                </button>
              )}
            </div>

            {!isWatching && (
              <div className="w-full aspect-video rounded-2xl bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                {isLive ? t('stream.connecting') : t('stream.noneLive')}
              </div>
            )}

            <div className="flex gap-3">
              {isLive && !isWatching && (
                <button
                  onClick={joinAsViewer}
                  className="bg-brand-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-brand-700 transition"
                >
                  {t('stream.watch')}
                </button>
              )}
              {user && !isLive && (
                <button
                  onClick={startBroadcast}
                  className="bg-brand-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-brand-700 transition"
                >
                  {t('stream.start')}
                </button>
              )}
            </div>

            {isWatching && (
              <StreamComments
                comments={comments}
                commentText={commentText}
                setCommentText={setCommentText}
                onSubmit={submitComment}
                onHeart={sendHeart}
                user={user}
                t={t}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FloatingHearts({ hearts }) {
  if (hearts.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {hearts.map((heart, i) => (
        <span
          key={heart.id}
          className="absolute bottom-2 text-2xl animate-float-heart"
          style={{ right: `${8 + (i % 6) * 12}%` }}
        >
          ❤️
        </span>
      ))}
    </div>
  );
}

function StreamComments({ comments, commentText, setCommentText, onSubmit, onHeart, user, t }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 space-y-3">
      <div className="h-40 overflow-y-auto space-y-1.5">
        {comments.length === 0 && <p className="text-sm text-gray-400">{t('stream.commentsEmpty')}</p>}
        {comments.map((c) => (
          <p key={c.id} className="text-sm text-gray-700 break-words">
            <span className="font-medium text-brand-700">{c.name}</span> {c.content}
          </p>
        ))}
      </div>

      {user ? (
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={300}
            placeholder={t('stream.commentPlaceholder')}
            className="flex-1 min-w-0 border border-gray-200 rounded-md px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={onHeart}
            className="text-lg px-2 rounded-md hover:bg-gray-100 transition"
            title={t('stream.sendHeart')}
          >
            ❤️
          </button>
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="bg-brand-600 text-white text-sm px-4 py-1.5 rounded-md font-medium hover:bg-brand-700 transition disabled:opacity-50"
          >
            {t('common.send')}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500">
          {t('stream.loginToCommentPre')}{' '}
          <Link to="/giris" className="text-brand-600 hover:underline">
            {t('detail.loginLink')}
          </Link>
          .
        </p>
      )}
    </div>
  );
}
