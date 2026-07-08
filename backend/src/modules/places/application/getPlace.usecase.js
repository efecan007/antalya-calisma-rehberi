const { NotFoundError } = require('../../../shared/domain/errors');

const DETAIL_CACHE_TTL_SECONDS = 60;

class GetPlaceUseCase {
  constructor({ placeRepository, cache }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async execute({ id }) {
    const cacheKey = `places:detail:${id}`;

    const fetch = async () => {
      const place = await this.placeRepository.findById(id);
      if (!place) {
        throw new NotFoundError('Mekan bulunamadı');
      }
      return place.toJSON();
    };

    if (!this.cache) return fetch();
    return this.cache.getOrSet(cacheKey, DETAIL_CACHE_TTL_SECONDS, fetch);
  }
}

module.exports = GetPlaceUseCase;
