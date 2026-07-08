const { NotFoundError } = require('../../../shared/domain/errors');

class ApprovePlaceUseCase {
  constructor({ placeRepository, cache }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async execute({ id }) {
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
}

module.exports = ApprovePlaceUseCase;
