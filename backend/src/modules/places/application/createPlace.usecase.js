const { ValidationError } = require('../../../shared/domain/errors');
const PlaceType = require('../domain/PlaceType');
const Region = require('../domain/Region');

class CreatePlaceUseCase {
  constructor({ placeRepository, cache }) {
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async execute({ createdById, name, type, region, address, lat, lng, description, priceLevel, imageUrl }) {
    if (!name || !type || !region || !address || lat === undefined || lng === undefined) {
      throw new ValidationError('name, type, region, address, lat, lng zorunludur');
    }
    PlaceType.assertValid(type);
    Region.assertValid(region);

    const place = await this.placeRepository.create({
      name,
      type,
      region,
      address,
      lat: Number(lat),
      lng: Number(lng),
      description,
      priceLevel: priceLevel ? Number(priceLevel) : 2,
      imageUrl,
      createdById,
    });

    if (this.cache) {
      await this.cache.invalidate('places:list:*');
    }

    return place.toJSON();
  }
}

module.exports = CreatePlaceUseCase;
