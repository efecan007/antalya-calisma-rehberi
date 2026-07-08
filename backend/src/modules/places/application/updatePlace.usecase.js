const { NotFoundError, ForbiddenError } = require('../../../shared/domain/errors');
const PlaceType = require('../domain/PlaceType');
const Region = require('../domain/Region');
const LevelRating = require('../domain/LevelRating');

function normalizePhotoUrls(photoUrls) {
  if (!Array.isArray(photoUrls)) return [];
  return photoUrls.map((url) => String(url).trim()).filter(Boolean);
}

class UpdatePlaceUseCase {
  constructor({ placeRepository, cache }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async execute({ id, requesterRole, changes }) {
    const place = await this.placeRepository.findById(id);
    if (!place) {
      throw new NotFoundError('Mekan bulunamadı');
    }
    if (requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Bu mekanı düzenleme yetkiniz yok');
    }

    if (changes.type !== undefined) PlaceType.assertValid(changes.type);
    if (changes.region !== undefined) Region.assertValid(changes.region);
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
}

module.exports = UpdatePlaceUseCase;
