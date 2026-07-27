const { verifyToken } = require('../../../common/security/jwt');
const { userRepository } = require('../../users/infrastructure/users.container');

// Sabit oda listesi: her oda kendi yayın slotuna sahiptir, aynı anda her odada
// yalnızca bir kişi yayın yapabilir, herkes (misafir dahil) izleyebilir.
// Sinyalleşme mesajları (offer/answer/ice-candidate) sunucu üzerinden doğrudan
// hedef sokete iletilir; medya akışı taraflar arasında doğrudan (WebRTC
// peer-to-peer) gerçekleşir.
const ROOM_COUNT = 21;
const ROOM_IDS = Array.from({ length: ROOM_COUNT }, (_, i) => `oda-${i + 1}`);
const MAX_COMMENT_LENGTH = 300;

function attachStreamingGateway(io) {
  const broadcasters = new Map(); // roomId -> { socketId, userId }
  const viewers = new Map(); // roomId -> Set<socketId>

  function currentStatus(roomId) {
    return { roomId, live: Boolean(broadcasters.get(roomId)) };
  }

  function allStatuses() {
    return ROOM_IDS.map(currentStatus);
  }

  function viewerCount(roomId) {
    return viewers.get(roomId)?.size ?? 0;
  }

  function emitViewerCount(roomId) {
    io.to(roomId).emit('viewer-count', { roomId, count: viewerCount(roomId) });
  }

  function addViewer(socket, roomId) {
    if (!viewers.has(roomId)) viewers.set(roomId, new Set());
    viewers.get(roomId).add(socket.id);
    socket.data.viewerRoomId = roomId;
    emitViewerCount(roomId);
  }

  function removeViewer(socket) {
    const roomId = socket.data.viewerRoomId;
    if (!roomId) return;
    viewers.get(roomId)?.delete(socket.id);
    socket.data.viewerRoomId = null;
    emitViewerCount(roomId);
  }

  function resetViewers(roomId) {
    viewers.delete(roomId);
    emitViewerCount(roomId);
  }

  io.on('connection', (socket) => {
    socket.emit('rooms-status', allStatuses());

    socket.on('start-broadcast', ({ roomId, token } = {}, ack) => {
      if (!ROOM_IDS.includes(roomId)) {
        return ack?.({ error: 'Geçersiz oda' });
      }

      let payload;
      try {
        payload = verifyToken(token);
      } catch {
        return ack?.({ error: 'Yayın başlatmak için giriş yapmalısınız' });
      }

      if (broadcasters.get(roomId)) {
        return ack?.({ error: 'Bu odada şu anda başka bir yayın devam ediyor' });
      }

      broadcasters.set(roomId, { socketId: socket.id, userId: payload.id });
      socket.data.isBroadcaster = true;
      socket.data.roomId = roomId;
      socket.join(roomId);
      ack?.({ ok: true });
      socket.broadcast.emit('stream-status', currentStatus(roomId));
    });

    socket.on('stop-broadcast', ({ roomId } = {}) => {
      if (broadcasters.get(roomId)?.socketId === socket.id) {
        broadcasters.delete(roomId);
        socket.leave(roomId);
        io.emit('stream-status', currentStatus(roomId));
        resetViewers(roomId);
      }
    });

    socket.on('viewer-join', ({ roomId } = {}, ack) => {
      const broadcaster = broadcasters.get(roomId);
      if (!broadcaster) {
        return ack?.({ live: false });
      }
      socket.join(roomId);
      addViewer(socket, roomId);
      io.to(broadcaster.socketId).emit('viewer-joined', { viewerId: socket.id });
      ack?.({ live: true, viewerCount: viewerCount(roomId) });
    });

    // WebRTC offer/answer/ice-candidate mesajlarını hedef sokete olduğu gibi iletir.
    socket.on('signal', ({ targetId, data } = {}) => {
      if (!targetId) return;
      io.to(targetId).emit('signal', { senderId: socket.id, data });
    });

    // Yayın sırasındaki yorumlar ve kalpler kalıcı değildir; yalnızca o anda
    // odada bulunanlara (yayıncı + izleyiciler) anlık olarak iletilir.
    socket.on('stream:comment', async ({ roomId, token, content } = {}) => {
      if (!roomId || !token || !content) return;
      const trimmed = String(content).trim().slice(0, MAX_COMMENT_LENGTH);
      if (!trimmed) return;

      let payload;
      try {
        payload = verifyToken(token);
      } catch {
        return;
      }

      const user = await userRepository.findById(payload.id);
      if (!user) return;

      io.to(roomId).emit('stream:comment', {
        roomId,
        id: `${socket.id}-${Date.now()}`,
        userId: user.id,
        name: user.name,
        content: trimmed,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('stream:heart', ({ roomId, token } = {}) => {
      if (!roomId || !token) return;

      let payload;
      try {
        payload = verifyToken(token);
      } catch {
        return;
      }

      io.to(roomId).emit('stream:heart', {
        roomId,
        id: `${socket.id}-${Date.now()}`,
        userId: payload.id,
      });
    });

    socket.on('disconnect', () => {
      const { roomId } = socket.data;
      if (roomId && broadcasters.get(roomId)?.socketId === socket.id) {
        broadcasters.delete(roomId);
        io.emit('stream-status', currentStatus(roomId));
        resetViewers(roomId);
      }
      removeViewer(socket);
    });
  });
}

module.exports = { attachStreamingGateway, ROOM_IDS };
