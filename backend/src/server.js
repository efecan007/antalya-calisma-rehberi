require('dotenv').config();
const http = require('http');
const { createApp } = require('./app');
const { attachStreamingGateway } = require('./modules/streaming/infrastructure/streaming.gateway');

const app = createApp();
const server = http.createServer(app);
attachStreamingGateway(server);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Work From Hotel API listening on port ${PORT}`);
});
