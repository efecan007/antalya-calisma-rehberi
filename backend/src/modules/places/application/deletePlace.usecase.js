const { NotFoundError, ForbiddenError } = require('../../../shared/domain/errors');

class DeletePlaceUseCase {
  constructor({ placeRepository, cache }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async execute({ id, requesterId, requesterRole }) {
    const place = await this.placeRepository.findById(id);
    if (!place) {
      throw new NotFoundError('Mekan bulunamadı');
    }
    if (place.createdById !== requesterId && requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Bu mekanı silme yetkiniz yok');
    }

    await this.placeRepository.delete(id);

    if (this.cache) {
      await this.cache.del(`places:detail:${id}`);
      await this.cache.invalidate('places:list:*');
    }
  }
}

module.exports = DeletePlaceUseCase;
