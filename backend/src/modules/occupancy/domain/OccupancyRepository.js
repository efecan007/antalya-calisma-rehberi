class OccupancyRepository {
  async create(_data) {
    throw new Error('Not implemented');
  }

  async findLatestByUserAndPlace(_userId, _placeId) {
    throw new Error('Not implemented');
  }

  async findRecentByPlaceIds(_placeIds, _since) {
    throw new Error('Not implemented');
  }
}

module.exports = OccupancyRepository;
