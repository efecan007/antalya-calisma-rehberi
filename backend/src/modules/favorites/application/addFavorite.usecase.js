const { NotFoundError } = require('../../../shared/domain/errors');

class AddFavoriteUseCase {
  constructor({ favoriteRepository, placeRepository }) {
    this.favoriteRepository = favoriteRepository;
    this.placeRepository = placeRepository;
  }

  async execute({ userId, placeId }) {
    const place = await this.placeRepository.findById(placeId);
    if (!place || place.status !== 'APPROVED') {
      throw new NotFoundError('Mekan bulunamadı');
    }

    await this.favoriteRepository.add(userId, placeId);
  }
}

module.exports = AddFavoriteUseCase;
