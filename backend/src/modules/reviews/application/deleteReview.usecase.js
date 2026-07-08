const { NotFoundError, ForbiddenError } = require('../../../shared/domain/errors');

class DeleteReviewUseCase {
  constructor({ reviewRepository, cache }) {
    this.reviewRepository = reviewRepository;
    this.cache = cache;
  }

  async execute({ reviewId, userId, requesterRole }) {
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

module.exports = DeleteReviewUseCase;
