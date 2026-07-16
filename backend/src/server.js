require('dotenv').config();
const http = require('http');
const { createApp } = require('./app');
const { attachStreamingGateway } = require('./modules/streaming/infrastructure/streaming.gateway');
const { startLowOccupancyWatcher } = require('./jobs/lowOccupancyNotifier');

const app = createApp();
const server = http.createServer(app);
attachStreamingGateway(server);
startLowOccupancyWatcher();

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Work From Hotel API listening on port ${PORT}`);
});
