const { NotFoundError } = require('../../../common/errors');
const { invalidatePopularCache } = require('../../cache/place-cache-keys');

class FavoritesService {
  constructor({ favoriteRepository, placeRepository, cache }) {
    this.favoriteRepository = favoriteRepository;
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async addFavorite({ userId, placeId }) {
    const place = await this.placeRepository.findById(placeId);
    if (!place || place.status !== 'APPROVED') {
      throw new NotFoundError('Mekan bulunamadı');
    }

    await this.favoriteRepository.add(userId, placeId);
    await invalidatePopularCache(this.cache);
  }

  async removeFavorite({ userId, placeId }) {
    await this.favoriteRepository.remove(userId, placeId);
    await invalidatePopularCache(this.cache);
  }

  async listFavorites({ userId }) {
    const places = await this.favoriteRepository.listPlacesByUser(userId);
    return places.map((place) => place.toJSON());
  }
}

module.exports = FavoritesService;
