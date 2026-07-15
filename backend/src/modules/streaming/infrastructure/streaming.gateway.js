const { Server } = require('socket.io');
const { verifyToken } = require('../../../common/security/jwt');
const { parseCorsOrigin } = require('../../../common/security/cors-origin');

// Sabit oda listesi: her oda kendi yayın slotuna sahiptir, aynı anda her odada
// yalnızca bir kişi yayın yapabilir, herkes (misafir dahil) izleyebilir.
// Sinyalleşme mesajları (offer/answer/ice-candidate) sunucu üzerinden doğrudan
// hedef sokete iletilir; medya akışı taraflar arasında doğrudan (WebRTC
// peer-to-peer) gerçekleşir.
const ROOM_IDS = ['oda-1', 'oda-2', 'oda-3'];

function attachStreamingGateway(httpServer) {
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: parseCorsOrigin(process.env.CORS_ORIGIN) },
  });

  const broadcasters = new Map(); // roomId -> { socketId, userId }

  function currentStatus(roomId) {
    return { roomId, live: Boolean(broadcasters.get(roomId)) };
  }

  function allStatuses() {
    return ROOM_IDS.map(currentStatus);
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
      }
    });

    socket.on('viewer-join', ({ roomId } = {}, ack) => {
      const broadcaster = broadcasters.get(roomId);
      if (!broadcaster) {
        return ack?.({ live: false });
      }
      socket.join(roomId);
      io.to(broadcaster.socketId).emit('viewer-joined', { viewerId: socket.id });
      ack?.({ live: true });
    });

    // WebRTC offer/answer/ice-candidate mesajlarını hedef sokete olduğu gibi iletir.
    socket.on('signal', ({ targetId, data } = {}) => {
      if (!targetId) return;
      io.to(targetId).emit('signal', { senderId: socket.id, data });
    });

    socket.on('disconnect', () => {
      const { roomId } = socket.data;
      if (roomId && broadcasters.get(roomId)?.socketId === socket.id) {
        broadcasters.delete(roomId);
        io.emit('stream-status', currentStatus(roomId));
      }
    });
  });

  return io;
}

module.exports = { attachStreamingGateway, ROOM_IDS };
