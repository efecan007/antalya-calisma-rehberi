const RatingAggregator = require('../../../src/modules/reviews/domain/RatingAggregator');

function makeReview(overrides = {}) {
  return {
    internetSpeed: 4,
    outletCount: 4,
    noiseLevel: 4,
    coffeeQuality: 4,
    workEnvironment: 4,
    priceLevel: 4,
    overallRating: 4,
    ...overrides,
  };
}

describe('RatingAggregator', () => {
  it('review yoksa tüm alanları null ve reviewCount 0 döner', () => {
    const result = RatingAggregator.computeAverages([]);
    expect(result.reviewCount).toBe(0);
    expect(result.overallRating).toBeNull();
  });

  it('tek review için ortalama review ile aynıdır', () => {
    const result = RatingAggregator.computeAverages([makeReview({ overallRating: 5 })]);
    expect(result.overallRating).toBe(5);
    expect(result.reviewCount).toBe(1);
  });

  it('birden çok review için doğru ortalama hesaplar', () => {
    const reviews = [makeReview({ overallRating: 5 }), makeReview({ overallRating: 3 })];
    const result = RatingAggregator.computeAverages(reviews);
    expect(result.overallRating).toBe(4);
    expect(result.reviewCount).toBe(2);
  });
});
