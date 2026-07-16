const { NotFoundError, ForbiddenError, ValidationError } = require('../../../common/errors');
const PlaceType = require('../domain/PlaceType');
const Region = require('../domain/Region');
const LevelRating = require('../domain/LevelRating');
const { invalidatePlaceListCaches, invalidatePlaceDetailCache } = require('../../cache/place-cache-keys');

const LIST_CACHE_TTL_SECONDS = 60;
const DETAIL_CACHE_TTL_SECONDS = 60;
const POPULAR_CACHE_TTL_SECONDS = 120;
const TOP_RATED_CACHE_TTL_SECONDS = 120;
const RECOMMENDATIONS_CACHE_TTL_SECONDS = 120;
const DEFAULT_POPULAR_LIMIT = 10;
const DEFAULT_TOP_RATED_LIMIT = 10;
const DEFAULT_RECOMMENDATIONS_LIMIT = 6;

const SORTABLE_FIELDS = new Set([
  'internetSpeed',
  'outletCount',
  'noiseLevel',
  'coffeeQuality',
  'overallRating',
]);

// priceLevel mekanın kendi fiyat kademesidir (place.priceLevel), yorum
// ortalamalarından (ratings.priceLevel) ayrı tutulur; bu yüzden ayrı sette.
const PLACE_SORTABLE_FIELDS = new Set(['priceLevel']);

function normalizePhotoUrls(photoUrls) {
  if (!Array.isArray(photoUrls)) return [];
  return photoUrls.map((url) => String(url).trim()).filter(Boolean);
}

function assertValidCoordinates(lat, lng) {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
    throw new ValidationError('lat -90 ile 90 arasında bir sayı olmalıdır');
  }
  if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) {
    throw new ValidationError('lng -180 ile 180 arasında bir sayı olmalıdır');
  }
}

function assertValidPriceLevel(priceLevel) {
  const num = Number(priceLevel);
  if (!Number.isInteger(num) || num < 1 || num > 4) {
    throw new ValidationError('priceLevel 1 ile 4 arasında bir tam sayı olmalıdır');
  }
}

class PlacesService {
  constructor({ placeRepository, cache, occupancyService }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
    this.occupancyService = occupancyService;
  }

  // Doluluk bilgisi dakikalar içinde bayatlar, bu yüzden place list/detail
  // cache'inin İÇİNE değil, cache'ten okunduktan SONRA eklenir — her istekte
  // taze kalır, place cache'inin 60sn TTL'inden etkilenmez.
  async _attachOccupancy(serializedPlaces) {
    if (!this.occupancyService || !serializedPlaces.length) {
      return serializedPlaces.map((p) => ({ ...p, occupancy: null }));
    }
    const summaries = await this.occupancyService.getSummaries({
      placeIds: serializedPlaces.map((p) => p.id),
    });
    return serializedPlaces.map((p) => ({ ...p, occupancy: summaries[p.id] ?? null }));
  }

  async listPlaces(filters = {}) {
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

      if (filters.minInternetSpeed) {
        const min = Number(filters.minInternetSpeed);
        serialized = serialized.filter(
          (p) => p.ratings.internetSpeed !== null && p.ratings.internetSpeed >= min
        );
      }

      if (filters.sortBy && (SORTABLE_FIELDS.has(filters.sortBy) || PLACE_SORTABLE_FIELDS.has(filters.sortBy))) {
        const direction = filters.sortOrder === 'asc' ? 1 : -1;
        const field = filters.sortBy;
        const isPlaceField = PLACE_SORTABLE_FIELDS.has(field);
        serialized = [...serialized].sort((a, b) => {
          const aVal = isPlaceField ? a[field] : a.ratings[field];
          const bVal = isPlaceField ? b[field] : b.ratings[field];
          if (aVal === null && bVal === null) return 0;
          if (aVal === null) return 1;
          if (bVal === null) return -1;
          return (aVal - bVal) * direction;
        });
      }

      return serialized;
    };

    const serialized = this.cache
      ? await this.cache.getOrSet(cacheKey, LIST_CACHE_TTL_SECONDS, fetch)
      : await fetch();
    return this._attachOccupancy(serialized);
  }

  async getPopularPlaces({ limit = DEFAULT_POPULAR_LIMIT } = {}) {
    const cacheKey = `places:popular:${limit}`;
    const fetch = async () => {
      const places = await this.placeRepository.findPopular(limit);
      return places.map((place) => place.toJSON());
    };

    const serialized = this.cache
      ? await this.cache.getOrSet(cacheKey, POPULAR_CACHE_TTL_SECONDS, fetch)
      : await fetch();
    return this._attachOccupancy(serialized);
  }

  async getTopRatedPlaces({ limit = DEFAULT_TOP_RATED_LIMIT } = {}) {
    const cacheKey = `places:top-rated:${limit}`;
    const fetch = async () => {
      const places = await this.placeRepository.findMany({ status: 'APPROVED' });
      const serialized = places.map((place) => place.toJSON());
      return this._sortByRatingDesc(serialized).slice(0, limit);
    };

    const serialized = this.cache
      ? await this.cache.getOrSet(cacheKey, TOP_RATED_CACHE_TTL_SECONDS, fetch)
      : await fetch();
    return this._attachOccupancy(serialized);
  }

  async getRecommendations({ limit = DEFAULT_RECOMMENDATIONS_LIMIT } = {}) {
    // Ana sayfa önerileri: en az bir yorumu olan, en yüksek puanlı mekanlar.
    // Yeterli yorumlanmış mekan yoksa en yeni onaylı mekanlarla tamamlanır.
    const cacheKey = `places:recommendations:${limit}`;
    const fetch = async () => {
      const places = await this.placeRepository.findMany({ status: 'APPROVED' });
      const serialized = places.map((place) => place.toJSON());

      const reviewed = this._sortByRatingDesc(serialized.filter((p) => p.ratings.reviewCount > 0));
      if (reviewed.length >= limit) return reviewed.slice(0, limit);

      const unreviewed = serialized
        .filter((p) => p.ratings.reviewCount === 0)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return [...reviewed, ...unreviewed].slice(0, limit);
    };

    const serialized = this.cache
      ? await this.cache.getOrSet(cacheKey, RECOMMENDATIONS_CACHE_TTL_SECONDS, fetch)
      : await fetch();
    return this._attachOccupancy(serialized);
  }

  _sortByRatingDesc(serializedPlaces) {
    return [...serializedPlaces].sort((a, b) => {
      const aVal = a.ratings.overallRating;
      const bVal = b.ratings.overallRating;
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return bVal - aVal;
    });
  }

  async getPlace({ id, requesterId, requesterRole }) {
    const cacheKey = `places:detail:${id}`;

    const fetch = async () => {
      const place = await this.placeRepository.findById(id);
      if (!place) {
        throw new NotFoundError('Mekan bulunamadı');
      }
      return place.toDetailJSON();
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

    const [withOccupancy] = await this._attachOccupancy([result]);
    return withOccupancy;
  }

  async createPlace({
    createdById,
    requesterRole,
    name,
    type,
    region,
    address,
    lat,
    lng,
    description,
    priceLevel,
    photoUrls,
    outletLevel,
    noiseLevel,
    deskFriendly,
    openingHours,
    openTime,
    closeTime,
    hasWifi,
    hasAC,
    meetingSuitable,
    laptopFriendly,
  }) {
    if (!name || !type || !region || !address || lat === undefined || lng === undefined) {
      throw new ValidationError('name, type, region, address, lat, lng zorunludur');
    }
    PlaceType.assertValid(type);
    Region.assertValid(region);
    assertValidCoordinates(lat, lng);
    if (priceLevel !== undefined) assertValidPriceLevel(priceLevel);
    if (outletLevel !== undefined) LevelRating.assertValid(outletLevel, 'outletLevel');
    if (noiseLevel !== undefined) LevelRating.assertValid(noiseLevel, 'noiseLevel');

    const place = await this.placeRepository.create({
      name,
      type,
      region,
      address,
      lat: Number(lat),
      lng: Number(lng),
      description,
      priceLevel: priceLevel ? Number(priceLevel) : 2,
      photoUrls: normalizePhotoUrls(photoUrls),
      outletLevel: outletLevel ?? 'MEDIUM',
      noiseLevel: noiseLevel ?? 'MEDIUM',
      deskFriendly: deskFriendly ?? true,
      openingHours: openingHours || null,
      openTime: openTime || null,
      closeTime: closeTime || null,
      hasWifi: hasWifi ?? true,
      hasAC: hasAC ?? true,
      meetingSuitable: meetingSuitable ?? false,
      laptopFriendly: laptopFriendly ?? true,
      status: requesterRole === 'ADMIN' ? 'APPROVED' : 'PENDING',
      createdById,
    });

    await invalidatePlaceListCaches(this.cache);

    return place.toJSON();
  }

  async updatePlace({ id, requesterRole, changes }) {
    const place = await this.placeRepository.findById(id);
    if (!place) {
      throw new NotFoundError('Mekan bulunamadı');
    }
    if (requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Bu mekanı düzenleme yetkiniz yok');
    }

    if (changes.type !== undefined) PlaceType.assertValid(changes.type);
    if (changes.region !== undefined) Region.assertValid(changes.region);
    if (changes.lat !== undefined || changes.lng !== undefined) {
      assertValidCoordinates(changes.lat ?? place.lat, changes.lng ?? place.lng);
    }
    if (changes.priceLevel !== undefined) assertValidPriceLevel(changes.priceLevel);
    if (changes.outletLevel !== undefined) LevelRating.assertValid(changes.outletLevel, 'outletLevel');
    if (changes.noiseLevel !== undefined) LevelRating.assertValid(changes.noiseLevel, 'noiseLevel');

    const data = {};
    if (changes.name !== undefined) data.name = changes.name;
    if (changes.type !== undefined) data.type = changes.type;
    if (changes.region !== undefined) data.region = changes.region;
    if (changes.address !== undefined) data.address = changes.address;
    if (changes.lat !== undefined) data.lat = Number(changes.lat);
    if (changes.lng !== undefined) data.lng = Number(changes.lng);
    if (changes.description !== undefined) data.description = changes.description;
    if (changes.priceLevel !== undefined) data.priceLevel = Number(changes.priceLevel);
    if (changes.photoUrls !== undefined) data.photoUrls = normalizePhotoUrls(changes.photoUrls);
    if (changes.outletLevel !== undefined) data.outletLevel = changes.outletLevel;
    if (changes.noiseLevel !== undefined) data.noiseLevel = changes.noiseLevel;
    if (changes.deskFriendly !== undefined) data.deskFriendly = changes.deskFriendly;
    if (changes.openingHours !== undefined) data.openingHours = changes.openingHours || null;
    if (changes.openTime !== undefined) data.openTime = changes.openTime || null;
    if (changes.closeTime !== undefined) data.closeTime = changes.closeTime || null;
    if (changes.hasWifi !== undefined) data.hasWifi = changes.hasWifi;
    if (changes.hasAC !== undefined) data.hasAC = changes.hasAC;
    if (changes.meetingSuitable !== undefined) data.meetingSuitable = changes.meetingSuitable;
    if (changes.laptopFriendly !== undefined) data.laptopFriendly = changes.laptopFriendly;

    const updated = await this.placeRepository.update(id, data);

    await invalidatePlaceDetailCache(this.cache, id);
    await invalidatePlaceListCaches(this.cache);

    return updated.toJSON();
  }

  async deletePlace({ id, requesterRole }) {
    const place = await this.placeRepository.findById(id);
    if (!place) {
      throw new NotFoundError('Mekan bulunamadı');
    }
    if (requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Bu mekanı silme yetkiniz yok');
    }

    await this.placeRepository.delete(id);

    await invalidatePlaceDetailCache(this.cache, id);
    await invalidatePlaceListCaches(this.cache);
  }
}

module.exports = PlacesService;
