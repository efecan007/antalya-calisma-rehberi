const Rating = require('../domain/Rating');
const Review = require('../domain/Review');
const { NotFoundError, ConflictError } = require('../../../shared/domain/errors');

class CreateReviewUseCase {
  /**
   * @param {{ reviewRepository, placeRepository, cache }} deps
   */
  constructor({ reviewRepository, placeRepository, cache }) {
    this.reviewRepository = reviewRepository;
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async execute({ placeId, userId, ratings, comment }) {
    const place = await this.placeRepository.findById(placeId);
    if (!place) {
      throw new NotFoundError('Mekan bulunamadı');
    }

    const existing = await this.reviewRepository.findByPlaceAndUser(placeId, userId);
    if (existing) {
      throw new ConflictError('Bu mekan için zaten bir yorumunuz var');
    }

    const validatedRatings = {};
    for (const field of Review.RATING_FIELDS) {
      validatedRatings[field] = new Rating(ratings[field], field).value;
    }

    const review = await this.reviewRepository.create({
      placeId,
      userId,
      ...validatedRatings,
      comment,
    });

    if (this.cache) {
      await this.cache.del(`places:detail:${placeId}`);
      await this.cache.invalidate('places:list:*');
    }

    return review;
  }
}

module.exports = CreateReviewUseCase;
