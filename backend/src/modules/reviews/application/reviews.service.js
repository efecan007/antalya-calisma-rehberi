const Rating = require('../domain/Rating');
const Review = require('../domain/Review');
const { NotFoundError, ConflictError, ForbiddenError } = require('../../../common/errors');

class ReviewsService {
  constructor({ reviewRepository, placeRepository, cache }) {
    this.reviewRepository = reviewRepository;
    this.placeRepository = placeRepository;
    this.cache = cache;
  }

  async createReview({ placeId, userId, ratings, comment }) {
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

  async updateReview({ reviewId, userId, ratings = {}, comment }) {
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

  async deleteReview({ reviewId, userId, requesterRole }) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Yorum bulunamadı');
    }
    if (review.userId !== userId && requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Bu yorumu silme yetkiniz yok');
    }

    await this.reviewRepository.delete(reviewId);

    if (this.cache) {
      await this.cache.del(`places:detail:${review.placeId}`);
      await this.cache.invalidate('places:list:*');
    }
  }
}

module.exports = ReviewsService;
