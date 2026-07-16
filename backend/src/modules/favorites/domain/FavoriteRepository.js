class FavoriteRepository {
  async add(_userId, _placeId) {
    throw new Error('Not implemented');
  }

  async remove(_userId, _placeId) {
    throw new Error('Not implemented');
  }

  async listPlacesByUser(_userId) {
    throw new Error('Not implemented');
  }

  async findUserIdsByPlace(_placeId) {
    throw new Error('Not implemented');
  }
}

module.exports = FavoriteRepository;
