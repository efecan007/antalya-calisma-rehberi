const Rating = require('../domain/Rating');
const Review = require('../domain/Review');
const { NotFoundError, ForbiddenError } = require('../../../shared/domain/errors');

class UpdateReviewUseCase {
  constructor({ reviewRepository, cache }) {
    this.reviewRepository = reviewRepository;
    this.cache = cache;
  }

  async execute({ reviewId, userId, ratings = {}, comment }) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Yorum bulunamadı');
    }
    if (review.userId !== userId) {
      throw new ForbiddenError('Bu yorumu düzenleme yetkiniz yok');
    }

    const validatedRatings = {};
    for (const field of Review.RATING_FIELDS) {
      if (ratings[field] !== undefined) {
        validatedRatings[field] = new Rating(ratings[field], field).value;
      }
    }

    const updated = await this.reviewRepository.update(reviewId, {
      ...validatedRatings,
      comment,
    });

    if (this.cache) {
      await this.cache.del(`places:detail:${review.placeId}`);
      await this.cache.invalidate('places:list:*');
    }

    return updated;
  }
}

module.exports = UpdateReviewUseCase;
