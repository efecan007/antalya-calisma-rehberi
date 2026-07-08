const { getRedisClient } = require('./redisClient');

/**
 * Cache-aside helper: cache'te varsa döner, yoksa fetchFn'i çalıştırıp sonucu cache'ler.
 * Redis erişilemezse (ör. testlerde/lokal geliştirmede kapalıysa) sessizce fetchFn'e düşer,
 * böylece cache katmanı bir "nice-to-have" olur, sistemi kilitlemez.
 */
async function getOrSet(key, ttlSeconds, fetchFn) {
  const redis = getRedisClient();
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn(`Cache okuma başarısız (${key}):`, err.message);
  }

  const fresh = await fetchFn();

  try {
    await redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
  } catch (err) {
    console.warn(`Cache yazma başarısız (${key}):`, err.message);
  }

  return fresh;
}

async function invalidate(pattern) {
  const redis = getRedisClient();
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn(`Cache invalidation başarısız (${pattern}):`, err.message);
  }
}

async function del(key) {
  const redis = getRedisClient();
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`Cache silme başarısız (${key}):`, err.message);
  }
}

module.exports = { getOrSet, invalidate, del };
