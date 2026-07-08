const PlaceType = require('./PlaceType');
const Region = require('./Region');
const RatingAggregator = require('../../reviews/domain/RatingAggregator');

class Place {
  constructor({
    id,
    name,
    type,
    region,
    address,
    lat,
    lng,
    description,
    priceLevel,
    imageUrl,
    createdById,
    createdAt,
    reviews = [],
  }) {
    PlaceType.assertValid(type);
    Region.assertValid(region);

    this.id = id;
    this.name = name;
    this.type = type;
    this.region = region;
    this.address = address;
    this.lat = lat;
    this.lng = lng;
    this.description = description ?? null;
    this.priceLevel = priceLevel;
    this.imageUrl = imageUrl ?? null;
    this.createdById = createdById ?? null;
    this.createdAt = createdAt;
    this.reviews = reviews;
  }

  toJSON() {
    const { reviews, ...rest } = this;
    return { ...rest, ratings: RatingAggregator.computeAverages(reviews) };
  }
}

module.exports = Place;
