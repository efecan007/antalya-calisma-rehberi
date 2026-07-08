const Rating = require('./Rating');

const RATING_FIELDS = [
  'internetSpeed',
  'outletCount',
  'noiseLevel',
  'coffeeQuality',
  'workEnvironment',
  'priceLevel',
  'overallRating',
];

class Review {
  constructor({
    id,
    placeId,
    userId,
    internetSpeed,
    outletCount,
    noiseLevel,
    coffeeQuality,
    workEnvironment,
    priceLevel,
    overallRating,
    comment,
    createdAt,
    user,
  }) {
    this.id = id;
    this.placeId = placeId;
    this.userId = userId;
    this.internetSpeed = new Rating(internetSpeed, 'internetSpeed').value;
    this.outletCount = new Rating(outletCount, 'outletCount').value;
    this.noiseLevel = new Rating(noiseLevel, 'noiseLevel').value;
    this.coffeeQuality = new Rating(coffeeQuality, 'coffeeQuality').value;
    this.workEnvironment = new Rating(workEnvironment, 'workEnvironment').value;
    this.priceLevel = new Rating(priceLevel, 'priceLevel').value;
    this.overallRating = new Rating(overallRating, 'overallRating').value;
    this.comment = comment ?? null;
    this.createdAt = createdAt;
    this.user = user;
  }
}

Review.RATING_FIELDS = RATING_FIELDS;

module.exports = Review;
