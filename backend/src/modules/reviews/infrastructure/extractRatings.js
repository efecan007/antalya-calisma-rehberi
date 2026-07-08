const Review = require('../domain/Review');

function extractRatings(body) {
  return Review.RATING_FIELDS.reduce((acc, field) => {
    acc[field] = body[field];
    return acc;
  }, {});
}

module.exports = { extractRatings };
