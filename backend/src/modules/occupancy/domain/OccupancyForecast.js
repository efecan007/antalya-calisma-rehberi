const LEVEL_SCORE = { LOW: 0, MEDIUM: 1, HIGH: 2 };
const DAYS = 7;
const HOURS = 24;
// Bir hücrenin (gün+saat) tahmine dahil edilebilmesi için gereken en az
// check-in sayısı; az veri varken yanlış güvenli bir örüntü göstermemek için.
const MIN_SAMPLES_FOR_PREDICTION = 3;

function scoreToLevel(avgScore) {
  if (avgScore < 2 / 3) return 'LOW';
  if (avgScore < 4 / 3) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Geçmiş check-in'lerden 7 (gün) x 24 (saat) bir doluluk ısı haritası ve
 * bunun üzerinden "genellikle yoğun" öngörülü zaman aralıkları üretir.
 * Gün indeksi JS Date.getDay() ile aynıdır (0 = Pazar ... 6 = Cumartesi).
 */
function buildForecast(checkins) {
  const cells = Array.from({ length: DAYS }, () =>
    Array.from({ length: HOURS }, () => ({ sum: 0, count: 0 }))
  );

  for (const checkin of checkins) {
    const date = new Date(checkin.createdAt);
    const day = date.getDay();
    const hour = date.getHours();
    const cell = cells[day][hour];
    cell.sum += LEVEL_SCORE[checkin.level] ?? 0;
    cell.count += 1;
  }

  const heatmap = [];
  for (let day = 0; day < DAYS; day += 1) {
    for (let hour = 0; hour < HOURS; hour += 1) {
      const { sum, count } = cells[day][hour];
      heatmap.push({
        day,
        hour,
        sampleCount: count,
        score: count ? sum / count : null,
        level: count ? scoreToLevel(sum / count) : null,
      });
    }
  }

  const predictions = buildPredictions(cells);

  return { heatmap, predictions };
}

function buildPredictions(cells) {
  const windows = [];

  for (let day = 0; day < DAYS; day += 1) {
    let runStart = null;
    let runScoreSum = 0;
    let runHours = 0;

    const flushRun = (endHourExclusive) => {
      if (runStart === null) return;
      windows.push({
        day,
        startHour: runStart,
        endHour: endHourExclusive,
        avgScore: runScoreSum / runHours,
      });
      runStart = null;
      runScoreSum = 0;
      runHours = 0;
    };

    for (let hour = 0; hour < HOURS; hour += 1) {
      const { sum, count } = cells[day][hour];
      const isBusy = count >= MIN_SAMPLES_FOR_PREDICTION && sum / count >= 4 / 3; // HIGH sınırı

      if (isBusy) {
        if (runStart === null) runStart = hour;
        runScoreSum += sum / count;
        runHours += 1;
      } else {
        flushRun(hour);
      }
    }
    flushRun(HOURS);
  }

  return windows
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5)
    .sort((a, b) => a.day - b.day || a.startHour - b.startHour);
}

module.exports = { buildForecast, LEVEL_SCORE, MIN_SAMPLES_FOR_PREDICTION };
