const DeleteReviewUseCase = require('../../../src/modules/reviews/application/deleteReview.usecase');
const { NotFoundError, ForbiddenError } = require('../../../src/shared/domain/errors');

function buildDeps(review) {
  const deleted = [];
  return {
    reviewRepository: {
      async findById() {
        return review;
      },
      async delete(id) {
        deleted.push(id);
      },
    },
    cache: { del: jest.fn(), invalidate: jest.fn() },
    deleted,
  };
}

describe('DeleteReviewUseCase', () => {
  const review = { id: 1, userId: 10, placeId: 5 };

  it('yorum yoksa NotFoundError fırlatır', async () => {
    const useCase = new DeleteReviewUseCase(buildDeps(null));
    await expect(useCase.execute({ reviewId: 1, userId: 10 })).rejects.toThrow(NotFoundError);
  });

  it('sahibi olmayan normal kullanıcı silemez', async () => {
    const useCase = new DeleteReviewUseCase(buildDeps(review));
    await expect(
      useCase.execute({ reviewId: 1, userId: 99, requesterRole: 'USER' })
    ).rejects.toThrow(ForbiddenError);
  });

  it('sahibi kendi yorumunu silebilir', async () => {
    const deps = buildDeps(review);
    const useCase = new DeleteReviewUseCase(deps);
    await useCase.execute({ reviewId: 1, userId: 10, requesterRole: 'USER' });
    expect(deps.deleted).toEqual([1]);
  });

  it('admin başkasının yorumunu silebilir', async () => {
    const deps = buildDeps(review);
    const useCase = new DeleteReviewUseCase(deps);
    await useCase.execute({ reviewId: 1, userId: 99, requesterRole: 'ADMIN' });
    expect(deps.deleted).toEqual([1]);
  });
});
