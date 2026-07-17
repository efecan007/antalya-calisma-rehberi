require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { createApp } = require('./app');
const { parseCorsOrigin } = require('./common/security/cors-origin');
const { attachStreamingGateway } = require('./modules/streaming/infrastructure/streaming.gateway');
const { attachChatGateway } = require('./modules/chat/infrastructure/chat.gateway');
const { startLowOccupancyWatcher } = require('./jobs/lowOccupancyNotifier');

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  path: '/socket.io',
  cors: { origin: parseCorsOrigin(process.env.CORS_ORIGIN) },
});
attachStreamingGateway(io);
attachChatGateway(io);
startLowOccupancyWatcher();

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Work From Hotel API listening on port ${PORT}`);
});
