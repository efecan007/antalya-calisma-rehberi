const { NotFoundError, ForbiddenError, ValidationError } = require('../../../common/errors');
const PlaceType = require('../domain/PlaceType');
const Region = require('../domain/Region');
const LevelRating = require('../domain/LevelRating');

const LIST_CACHE_TTL_SECONDS = 60;
const DETAIL_CACHE_TTL_SECONDS = 60;

const SORTABLE_FIELDS = new Set([
  'internetSpeed',
  'outletCount',
  'noiseLevel',
  'coffeeQuality',
  'overallRating',
]);

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
  constructor({ placeRepository, cache }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
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

  async getPlace({ id, requesterId, requesterRole }) {
    const cacheKey = `places:detail:${id}`;

    const fetch = async () => {
      const place = await this.placeRepository.findById(id);
      if (!place) {
        throw new NotFoundError('Mekan bulunamadı');
      }
      return place.toJSON();
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

    return result;
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
      hasWifi: hasWifi ?? true,
      hasAC: hasAC ?? true,
      meetingSuitable: meetingSuitable ?? false,
      laptopFriendly: laptopFriendly ?? true,
      status: requesterRole === 'ADMIN' ? 'APPROVED' : 'PENDING',
      createdById,
    });

    if (this.cache) {
      await this.cache.invalidate('places:list:*');
    }

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
    if (changes.hasWifi !== undefined) data.hasWifi = changes.hasWifi;
    if (changes.hasAC !== undefined) data.hasAC = changes.hasAC;
    if (changes.meetingSuitable !== undefined) data.meetingSuitable = changes.meetingSuitable;
    if (changes.laptopFriendly !== undefined) data.laptopFriendly = changes.laptopFriendly;

    const updated = await this.placeRepository.update(id, data);

    if (this.cache) {
      await this.cache.del(`places:detail:${id}`);
      await this.cache.invalidate('places:list:*');
    }

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

    if (this.cache) {
      await this.cache.del(`places:detail:${id}`);
      await this.cache.invalidate('places:list:*');
    }
  }
}

module.exports = PlacesService;
