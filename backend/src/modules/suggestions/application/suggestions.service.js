const { NotFoundError } = require('../../../common/errors');
const { invalidatePlaceListCaches, invalidatePlaceDetailCache } = require('../../cache/place-cache-keys');

class SuggestionsService {
  constructor({ placeRepository, cache, placesService, notificationsService }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
    this.placesService = placesService;
    this.notificationsService = notificationsService;
  }

  async submit({ createdById, ...placeData }) {
    // Bir öneri her zaman PENDING olarak oluşturulur; kim gönderirse göndersin
    // (admin dahil), bu uç nokta yayına almaz, yalnızca onay kuyruğuna ekler.
    return this.placesService.createPlace({
      ...placeData,
      createdById,
      requesterRole: 'USER',
    });
  }

  async listPending() {
    const places = await this.placeRepository.findMany({ status: 'PENDING' });
    return places.map((place) => place.toJSON());
  }

  async approve({ id }) {
    const place = await this.placeRepository.findById(id);
    if (!place) {
      throw new NotFoundError('Mekan bulunamadı');
    }

    const updated = await this.placeRepository.update(id, { status: 'APPROVED' });

    await invalidatePlaceDetailCache(this.cache, id);
    await invalidatePlaceListCaches(this.cache);

    if (place.createdById && this.notificationsService) {
      await this.notificationsService.notify({
        userId: place.createdById,
        type: 'SUGGESTION_APPROVED',
        message: `"${updated.name}" mekan önerin onaylandı!`,
        placeId: id,
      });
    }

    return updated.toJSON();
  }

  async reject({ id }) {
    const place = await this.placeRepository.findById(id);
    if (!place) {
      throw new NotFoundError('Mekan bulunamadı');
    }

    const updated = await this.placeRepository.update(id, { status: 'REJECTED' });

    await invalidatePlaceDetailCache(this.cache, id);
    await invalidatePlaceListCaches(this.cache);

    if (place.createdById && this.notificationsService) {
      await this.notificationsService.notify({
        userId: place.createdById,
        type: 'SUGGESTION_REJECTED',
        message: `"${updated.name}" mekan önerin reddedildi.`,
        placeId: id,
      });
    }

    return updated.toJSON();
  }
}

module.exports = SuggestionsService;
