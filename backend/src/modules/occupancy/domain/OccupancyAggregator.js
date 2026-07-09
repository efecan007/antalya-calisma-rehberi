const LevelRating = require('../../places/domain/LevelRating');

/**
 * Bir mekan için zaman penceresi içindeki check-in'lerden tek bir doluluk
 * özeti üretir: en çok bildirilen seviye kazanır, eşitlikte en güncel
 * check-in'in seviyesi tercih edilir (durumun ne kadar taze olduğu daha
 * önemli çünkü doluluk hızlı değişir).
 */
function summarize(checkins) {
  if (!checkins.length) return null;

  const counts = LevelRating.VALUES.reduce((acc, level) => ({ ...acc, [level]: 0 }), {});
  let latest = checkins[0];
  for (const checkin of checkins) {
    counts[checkin.level] += 1;
    if (new Date(checkin.createdAt) > new Date(latest.createdAt)) {
      latest = checkin;
    }
  }

  const maxCount = Math.max(...Object.values(counts));
  const topLevels = LevelRating.VALUES.filter((level) => counts[level] === maxCount);
  const level = topLevels.includes(latest.level) ? latest.level : topLevels[0];

  return { level, count: checkins.length, updatedAt: latest.createdAt };
}

module.exports = { summarize };
