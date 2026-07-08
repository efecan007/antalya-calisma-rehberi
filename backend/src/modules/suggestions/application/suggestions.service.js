const { NotFoundError } = require('../../../common/errors');

class SuggestionsService {
  constructor({ placeRepository, cache }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
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

    if (this.cache) {
      await this.cache.del(`places:detail:${id}`);
      await this.cache.invalidate('places:list:*');
    }

    return updated.toJSON();
  }

  async reject({ id }) {
    const place = await this.placeRepository.findById(id);
    if (!place) {
      throw new NotFoundError('Mekan bulunamadı');
    }

    const updated = await this.placeRepository.update(id, { status: 'REJECTED' });

    if (this.cache) {
      await this.cache.del(`places:detail:${id}`);
      await this.cache.invalidate('places:list:*');
    }

    return updated.toJSON();
  }
}

module.exports = SuggestionsService;
