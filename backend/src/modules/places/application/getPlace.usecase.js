const { NotFoundError } = require('../../../shared/domain/errors');

const DETAIL_CACHE_TTL_SECONDS = 60;

class GetPlaceUseCase {
  constructor({ placeRepository, cache }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async execute({ id, requesterId, requesterRole }) {
    const cacheKey = `places:detail:${id}`;

    const fetch = async () => {
      const place = await this.placeRepository.findById(id);
      if (!place) {
        throw new NotFoundError('Mekan bulunamadı');
      }
      return place.toJSON();
    };

    const result = this.cache
      ? await this.cache.getOrSet(cacheKey, DETAIL_CACHE_TTL_SECONDS, fetch)
      : await fetch();

    // Visibility check runs on every call (cache hit or miss) so a cached
    // pending/rejected place can never leak to an unauthorized requester.
    if (result.status !== 'APPROVED') {
      const isOwner = requesterId != null && result.createdById === requesterId;
      const isAdmin = requesterRole === 'ADMIN';
      if (!isOwner && !isAdmin) {
        throw new NotFoundError('Mekan bulunamadı');
      }
    }

    return result;
  }
}

module.exports = GetPlaceUseCase;
