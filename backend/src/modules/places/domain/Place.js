const PlaceType = require('./PlaceType');
const Region = require('./Region');
const LevelRating = require('./LevelRating');
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
    status,
    createdById,
    createdAt,
    reviews = [],
  }) {
    PlaceType.assertValid(type);
    Region.assertValid(region);
    LevelRating.assertValid(outletLevel ?? 'MEDIUM', 'outletLevel');
    LevelRating.assertValid(noiseLevel ?? 'MEDIUM', 'noiseLevel');

    this.id = id;
    this.name = name;
    this.type = type;
    this.region = region;
    this.address = address;
    this.lat = lat;
    this.lng = lng;
    this.description = description ?? null;
    this.priceLevel = priceLevel;
    this.photoUrls = photoUrls ?? [];
    this.outletLevel = outletLevel ?? 'MEDIUM';
    this.noiseLevel = noiseLevel ?? 'MEDIUM';
    this.deskFriendly = deskFriendly ?? true;
    this.openingHours = openingHours ?? null;
    this.openTime = openTime ?? null;
    this.closeTime = closeTime ?? null;
    this.hasWifi = hasWifi ?? true;
    this.hasAC = hasAC ?? true;
    this.meetingSuitable = meetingSuitable ?? false;
    this.laptopFriendly = laptopFriendly ?? true;
    this.status = status ?? 'APPROVED';
    this.createdById = createdById ?? null;
    this.createdAt = createdAt;
    this.reviews = reviews;
  }

  toJSON() {
    const { reviews, ...rest } = this;
    return { ...rest, ratings: RatingAggregator.computeAverages(reviews) };
  }

  toDetailJSON() {
    return { ...this.toJSON(), reviews: this.reviews };
  }
}

module.exports = Place;
