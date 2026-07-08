const LIST_CACHE_TTL_SECONDS = 60;

class ListPlacesUseCase {
  constructor({ placeRepository, cache }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async execute(filters = {}) {
    const cacheKey = `places:list:${JSON.stringify(filters)}`;

    const fetch = async () => {
      const places = await this.placeRepository.findMany(filters);
      let serialized = places.map((place) => place.toJSON());

      if (filters.minRating) {
        const min = Number(filters.minRating);
        serialized = serialized.filter(
          (p) => p.ratings.overallRating !== null && p.ratings.overallRating >= min
        );
      }

      return serialized;
    };

    if (!this.cache) return fetch();
    return this.cache.getOrSet(cacheKey, LIST_CACHE_TTL_SECONDS, fetch);
  }
}

module.exports = ListPlacesUseCase;
