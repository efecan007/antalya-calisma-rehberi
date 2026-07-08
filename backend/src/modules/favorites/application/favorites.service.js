const { NotFoundError } = require('../../../common/errors');

class FavoritesService {
  constructor({ favoriteRepository, placeRepository }) {
    this.favoriteRepository = favoriteRepository;
    this.placeRepository = placeRepository;
  }

  async addFavorite({ userId, placeId }) {
    const place = await this.placeRepository.findById(placeId);
    if (!place || place.status !== 'APPROVED') {
      throw new NotFoundError('Mekan bulunamadı');
    }

    await this.favoriteRepository.add(userId, placeId);
  }

  async removeFavorite({ userId, placeId }) {
    await this.favoriteRepository.remove(userId, placeId);
  }

  async listFavorites({ userId }) {
    const places = await this.favoriteRepository.listPlacesByUser(userId);
    return places.map((place) => place.toJSON());
  }
}

module.exports = FavoritesService;
