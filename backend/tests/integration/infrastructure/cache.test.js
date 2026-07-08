/**
 * Integration test: gerçek Redis'e karşı çalışır.
 * Önkoşul: `docker compose up -d redis` (veya tüm stack) ayakta olmalı ve
 * REDIS_URL ortam değişkeni o Redis'i göstermeli.
 */
const cache = require('../../../src/modules/cache/cache.service');
const { getRedisClient } = require('../../../src/modules/cache/redis.client');

afterAll(async () => {
  await getRedisClient().quit();
});

describe('cache (integration)', () => {
  const key = 'test:cache:key';

  afterEach(async () => {
    await cache.del(key);
  });

  it('getOrSet ilk çağrıda fetchFn çalıştırır, ikinci çağrıda cache’ten döner', async () => {
    let callCount = 0;
    const fetchFn = async () => {
      callCount += 1;
      return { value: 'fresh' };
    };

    const first = await cache.getOrSet(key, 10, fetchFn);
    const second = await cache.getOrSet(key, 10, fetchFn);

    expect(first).toEqual({ value: 'fresh' });
    expect(second).toEqual({ value: 'fresh' });
    expect(callCount).toBe(1);
  });

  it('invalidate ile pattern eşleşen anahtarlar silinir', async () => {
    await cache.getOrSet('test:cache:pattern:1', 10, async () => 'a');
    await cache.getOrSet('test:cache:pattern:2', 10, async () => 'b');

    await cache.invalidate('test:cache:pattern:*');

    const redis = getRedisClient();
    const remaining = await redis.keys('test:cache:pattern:*');
    expect(remaining).toHaveLength(0);
  });
});
