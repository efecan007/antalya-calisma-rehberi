const LIST_CACHE_TTL_SECONDS = 60;

const SORTABLE_FIELDS = new Set([
  'internetSpeed',
  'outletCount',
  'noiseLevel',
  'coffeeQuality',
  'overallRating',
]);

class ListPlacesUseCase {
  constructor({ placeRepository, cache }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async execute(filters = {}) {
    // Public listing only ever shows approved places; any incoming `status`
    // is ignored so it can't be used to expose pending/rejected ones.
    const safeFilters = { ...filters, status: 'APPROVED' };
    const cacheKey = `places:list:${JSON.stringify(safeFilters)}`;

    const fetch = async () => {
      const places = await this.placeRepository.findMany(safeFilters);
      let serialized = places.map((place) => place.toJSON());

      if (filters.minRating) {
        const min = Number(filters.minRating);
        serialized = serialized.filter(
          (p) => p.ratings.overallRating !== null && p.ratings.overallRating >= min
        );
      }

      if (filters.sortBy && SORTABLE_FIELDS.has(filters.sortBy)) {
        const direction = filters.sortOrder === 'asc' ? 1 : -1;
        const field = filters.sortBy;
        serialized = [...serialized].sort((a, b) => {
          const aVal = a.ratings[field];
          const bVal = b.ratings[field];
          if (aVal === null && bVal === null) return 0;
          if (aVal === null) return 1;
          if (bVal === null) return -1;
          return (aVal - bVal) * direction;
        });
      }

      return serialized;
    };

    if (!this.cache) return fetch();
    return this.cache.getOrSet(cacheKey, LIST_CACHE_TTL_SECONDS, fetch);
  }
}

module.exports = ListPlacesUseCase;
