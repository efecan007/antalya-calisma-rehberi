const Redis = require('ioredis');
const logger = require('../../common/logging/logger');

let client = null;

function getRedisClient() {
  if (client) return client;

  client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    retryStrategy: () => 1000,
    lazyConnect: false,
  });

  client.on('error', (err) => {
    logger.warn('Redis bağlantı hatası (cache devre dışı kalabilir)', err.message);
  });

  return client;
}

module.exports = { getRedisClient };
