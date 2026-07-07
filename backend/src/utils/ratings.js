const RATING_FIELDS = [
  'internetSpeed',
  'outletCount',
  'noiseLevel',
  'coffeeQuality',
  'workEnvironment',
  'priceLevel',
  'overallRating',
];

function computeAverages(reviews) {
  if (!reviews.length) {
    return RATING_FIELDS.reduce((acc, field) => {
      acc[field] = null;
      return acc;
    }, { reviewCount: 0 });
  }

  const sums = RATING_FIELDS.reduce((acc, field) => {
    acc[field] = 0;
    return acc;
  }, {});

  for (const review of reviews) {
    for (const field of RATING_FIELDS) {
      sums[field] += review[field];
    }
  }

  const averages = RATING_FIELDS.reduce((acc, field) => {
    acc[field] = Math.round((sums[field] / reviews.length) * 10) / 10;
    return acc;
  }, {});

  averages.reviewCount = reviews.length;
  return averages;
}

module.exports = { computeAverages, RATING_FIELDS };
