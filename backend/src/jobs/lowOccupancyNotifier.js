/**
 * Favori mekanlardan biri "az yoğun" hale geldiğinde favorileyen kullanıcılara
 * bildirim gönderen periyodik iş. Doluluk check-in bazlı ve hızlı değiştiğinden,
 * kontrol düzenli aralıklarla tekrarlanır; aynı kullanıcı+mekan çifti için
 * kısa sürede tekrar bildirim gönderilmesini önlemek amacıyla bir bekleme
 * süresi (cooldown) uygulanır.
 */
const prisma = require('../database/prisma.client');
const { placeRepository } = require('../modules/places/infrastructure/places.container');
const { occupancyService } = require('../modules/occupancy/infrastructure/occupancy.container');
const { notificationsService } = require('../modules/notifications/infrastructure/notifications.container');
const FavoritesRepository = require('../modules/favorites/infrastructure/favorites.repository');
const logger = require('../common/logging/logger');

const CHECK_INTERVAL_MS = 10 * 60 * 1000;
const NOTIFICATION_COOLDOWN_MINUTES = 6 * 60;

const favoriteRepository = new FavoritesRepository(prisma);

async function checkLowOccupancyFavorites() {
  try {
    const places = await placeRepository.findMany({ status: 'APPROVED' });
    if (!places.length) return;

    const placeIds = places.map((place) => place.id);
    const summaries = await occupancyService.getSummaries({ placeIds });

    for (const place of places) {
      const summary = summaries[place.id];
      if (!summary || summary.level !== 'LOW') continue;

      const favoriteUserIds = await favoriteRepository.findUserIdsByPlace(place.id);
      for (const userId of favoriteUserIds) {
        const alreadyNotified = await notificationsService.hasRecentNotification({
          userId,
          type: 'FAVORITE_LOW_OCCUPANCY',
          placeId: place.id,
          sinceMinutes: NOTIFICATION_COOLDOWN_MINUTES,
        });
        if (alreadyNotified) continue;

        await notificationsService.notify({
          userId,
          type: 'FAVORITE_LOW_OCCUPANCY',
          message: `Favorindeki "${place.name}" şu anda az yoğun, tam sırası!`,
          placeId: place.id,
        });
      }
    }
  } catch (err) {
    logger.error('Doluluk bildirimi kontrolü başarısız', err);
  }
}

function startLowOccupancyWatcher() {
  checkLowOccupancyFavorites();
  return setInterval(checkLowOccupancyFavorites, CHECK_INTERVAL_MS);
}

module.exports = { startLowOccupancyWatcher, checkLowOccupancyFavorites };
