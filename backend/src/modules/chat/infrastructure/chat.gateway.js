const { verifyToken } = require('../../../common/security/jwt');

// "Yazıyor..." göstergesi hiçbir yerde saklanmaz, sadece anlık olarak ilgili
// mekanın sohbet odasındaki diğer kullanıcılara iletilir.
function roomName(placeId) {
  return `place-chat-${placeId}`;
}

function attachChatGateway(io) {
  io.on('connection', (socket) => {
    socket.on('chat:join', ({ placeId } = {}) => {
      if (!placeId) return;
      socket.join(roomName(placeId));
    });

    socket.on('chat:leave', ({ placeId } = {}) => {
      if (!placeId) return;
      socket.leave(roomName(placeId));
    });

    socket.on('chat:typing', ({ placeId, token, isTyping } = {}) => {
      if (!placeId || !token) return;
      let payload;
      try {
        payload = verifyToken(token);
      } catch {
        return;
      }
      socket.to(roomName(placeId)).emit('chat:typing', {
        placeId,
        userId: payload.id,
        isTyping: Boolean(isTyping),
      });
    });
  });
}

module.exports = { attachChatGateway };
