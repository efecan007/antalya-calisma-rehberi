const { ValidationError } = require('../../../shared/domain/errors');
const PlaceType = require('../domain/PlaceType');
const Region = require('../domain/Region');
const LevelRating = require('../domain/LevelRating');

function normalizePhotoUrls(photoUrls) {
  if (!Array.isArray(photoUrls)) return [];
  return photoUrls.map((url) => String(url).trim()).filter(Boolean);
}

class CreatePlaceUseCase {
  constructor({ placeRepository, cache }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async execute({
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
}

module.exports = CreatePlaceUseCase;
