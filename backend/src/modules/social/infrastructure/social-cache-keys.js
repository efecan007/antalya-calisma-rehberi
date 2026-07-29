/**
 * Social Feed cache anahtarlarının tek doğruluk kaynağı.
 *
 * Feed yanıtları Redis'te cache'lenir; yeni gönderi, yorum veya beğeni geldiğinde
 * tüm feed sayfaları geçersiz kılınır. Cache'lenen veri gönderi + sayaçları içerir
 * ama izleyiciye özel "beğendim mi" bilgisini içermez — o bilgi her istekte taze
 * hesaplanır (bkz. social.service.js). Böylece aynı sayfa tüm izleyiciler için
 * paylaşılabilir ve sayaçlar mutasyonlarda invalidate edildiği için bayatlamaz.
 */

const FEED_TTL_SECONDS = 30;

// "Tüm kullanıcılar" akışı tüm izleyiciler için ortaktır.
function allFeedKey(page) {
  return `social:feed:all:${page}`;
}

// "Takip edilenler" akışı kullanıcıya özeldir (takip listesine bağlı).
function followingFeedKey(userId, page) {
  return `social:feed:following:${userId}:${page}`;
}

async function invalidateFeedCaches(cache) {
  if (!cache) return;
  await cache.invalidate('social:feed:*');
}

module.exports = { FEED_TTL_SECONDS, allFeedKey, followingFeedKey, invalidateFeedCaches };
