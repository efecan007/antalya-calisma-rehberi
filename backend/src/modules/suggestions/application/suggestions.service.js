const { NotFoundError } = require('../../../common/errors');
const { invalidatePlaceListCaches, invalidatePlaceDetailCache } = require('../../cache/place-cache-keys');

class SuggestionsService {
  constructor({ placeRepository, cache, placesService }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
    this.placesService = placesService;
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

    return updated.toJSON();
  }
}

module.exports = SuggestionsService;
