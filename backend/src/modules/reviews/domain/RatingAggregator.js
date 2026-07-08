const Review = require('./Review');

/**
 * Domain servisi: bir mekanın review listesinden ortalama puanları hesaplar.
 * DRY — bu mantık tek yerde yaşar, hem places hem reviews modülü tarafından kullanılır.
 */
class RatingAggregator {
  static computeAverages(reviews) {
    if (!reviews.length) {
      return Review.RATING_FIELDS.reduce(
        (acc, field) => ({ ...acc, [field]: null }),
        { reviewCount: 0 }
      );
    }

    const sums = Review.RATING_FIELDS.reduce((acc, field) => ({ ...acc, [field]: 0 }), {});
    for (const review of reviews) {
      for (const field of Review.RATING_FIELDS) {
        sums[field] += review[field];
      }
    }

    const averages = Review.RATING_FIELDS.reduce((acc, field) => {
      acc[field] = Math.round((sums[field] / reviews.length) * 10) / 10;
      return acc;
    }, {});

    averages.reviewCount = reviews.length;
    return averages;
  }
}

module.exports = RatingAggregator;
