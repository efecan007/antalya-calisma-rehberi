/**
 * Place ile ilgili tüm cache anahtarlarının tek doğruluk kaynağı.
 * Places, reviews, favorites ve suggestions modülleri mekan/review/favori
 * değiştiren her mutasyondan sonra bu yardımcıları çağırır; böylece
 * "popüler", "en yüksek puanlı" ve "ana sayfa önerileri" gibi türetilmiş
 * listeler bayat kalmaz.
 */

async function invalidatePlaceListCaches(cache) {
  if (!cache) return;
  await Promise.all([
    cache.invalidate('places:list:*'),
    cache.invalidate('places:popular:*'),
    cache.invalidate('places:top-rated:*'),
    cache.invalidate('places:recommendations:*'),
  ]);
}

async function invalidatePlaceDetailCache(cache, id) {
  if (!cache) return;
  await cache.del(`places:detail:${id}`);
}

// Favori sayısı değiştiğinde yalnızca "popüler" sıralaması bayatlar;
// liste/detay/top-rated/recommendations cache'lerine dokunmaya gerek yok.
async function invalidatePopularCache(cache) {
  if (!cache) return;
  await cache.invalidate('places:popular:*');
}

module.exports = { invalidatePlaceListCaches, invalidatePlaceDetailCache, invalidatePopularCache };
