const { NotFoundError, ForbiddenError } = require('../../../shared/domain/errors');
const PlaceType = require('../domain/PlaceType');
const Region = require('../domain/Region');

class UpdatePlaceUseCase {
  constructor({ placeRepository, cache }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async execute({ id, requesterId, requesterRole, changes }) {
    const place = await this.placeRepository.findById(id);
    if (!place) {
      throw new NotFoundError('Mekan bulunamadı');
    }
    if (place.createdById !== requesterId && requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Bu mekanı düzenleme yetkiniz yok');
    }

    if (changes.type !== undefined) PlaceType.assertValid(changes.type);
    if (changes.region !== undefined) Region.assertValid(changes.region);

    const data = {};
    if (changes.name !== undefined) data.name = changes.name;
    if (changes.type !== undefined) data.type = changes.type;
    if (changes.region !== undefined) data.region = changes.region;
    if (changes.address !== undefined) data.address = changes.address;
    if (changes.lat !== undefined) data.lat = Number(changes.lat);
    if (changes.lng !== undefined) data.lng = Number(changes.lng);
    if (changes.description !== undefined) data.description = changes.description;
    if (changes.priceLevel !== undefined) data.priceLevel = Number(changes.priceLevel);
    if (changes.imageUrl !== undefined) data.imageUrl = changes.imageUrl;

    const updated = await this.placeRepository.update(id, data);

    if (this.cache) {
      await this.cache.del(`places:detail:${id}`);
      await this.cache.invalidate('places:list:*');
    }

    return updated.toJSON();
  }
}

module.exports = UpdatePlaceUseCase;
