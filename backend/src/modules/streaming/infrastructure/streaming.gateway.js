const { Server } = require('socket.io');
const { verifyToken } = require('../../../common/security/jwt');

// Tek bir global yayın odası: aynı anda yalnızca bir kişi yayın yapabilir,
// herkes (misafir dahil) izleyebilir. Sinyalleşme mesajları (offer/answer/ice-candidate)
// sunucu üzerinden doğrudan hedef sokete iletilir; medya akışı taraflar arasında
// doğrudan (WebRTC peer-to-peer) gerçekleşir.
function attachStreamingGateway(httpServer) {
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: process.env.CORS_ORIGIN || '*' },
  });

  let broadcaster = null; // { socketId, userId, name }

  function currentStatus() {
    return { live: Boolean(broadcaster) };
  }

  io.on('connection', (socket) => {
    socket.emit('stream-status', currentStatus());

    socket.on('start-broadcast', ({ token } = {}, ack) => {
      let payload;
      try {
        payload = verifyToken(token);
      } catch {
        return ack?.({ error: 'Yayın başlatmak için giriş yapmalısınız' });
      }

      if (broadcaster) {
        return ack?.({ error: 'Şu anda başka bir yayın devam ediyor' });
      }

      broadcaster = { socketId: socket.id, userId: payload.id };
      socket.data.isBroadcaster = true;
      ack?.({ ok: true });
      socket.broadcast.emit('stream-status', currentStatus());
    });

    socket.on('stop-broadcast', () => {
      if (broadcaster?.socketId === socket.id) {
        broadcaster = null;
        io.emit('stream-status', currentStatus());
      }
    });

    socket.on('viewer-join', (_payload, ack) => {
      if (!broadcaster) {
        return ack?.({ live: false });
      }
      io.to(broadcaster.socketId).emit('viewer-joined', { viewerId: socket.id });
      ack?.({ live: true });
    });

    // WebRTC offer/answer/ice-candidate mesajlarını hedef sokete olduğu gibi iletir.
    socket.on('signal', ({ targetId, data } = {}) => {
      if (!targetId) return;
      io.to(targetId).emit('signal', { senderId: socket.id, data });
    });

    socket.on('disconnect', () => {
      if (broadcaster?.socketId === socket.id) {
        broadcaster = null;
        io.emit('stream-status', currentStatus());
      }
    });
  });

  return io;
}

module.exports = { attachStreamingGateway };
