const CreateReviewUseCase = require('../../../src/modules/reviews/application/createReview.usecase');
const { NotFoundError, ConflictError, ValidationError } = require('../../../src/shared/domain/errors');

function validRatings(overrides = {}) {
  return {
    internetSpeed: 4,
    outletCount: 4,
    noiseLevel: 4,
    coffeeQuality: 4,
    workEnvironment: 4,
    priceLevel: 3,
    overallRating: 4,
    ...overrides,
  };
}

function buildDeps({ placeExists = true, existingReview = null } = {}) {
  const created = [];
  return {
    reviewRepository: {
      async findByPlaceAndUser() {
        return existingReview;
      },
      async create(data) {
        created.push(data);
        return { id: 1, ...data };
      },
    },
    placeRepository: {
      async findById(id) {
        return placeExists ? { id } : null;
      },
    },
    cache: { del: jest.fn(), invalidate: jest.fn() },
    created,
  };
}

describe('CreateReviewUseCase', () => {
  it('mekan yoksa NotFoundError fırlatır', async () => {
    const deps = buildDeps({ placeExists: false });
    const useCase = new CreateReviewUseCase(deps);
    await expect(
      useCase.execute({ placeId: 1, userId: 1, ratings: validRatings() })
    ).rejects.toThrow(NotFoundError);
  });

  it('kullanıcı aynı mekana ikinci kez yorum yapamaz', async () => {
    const deps = buildDeps({ existingReview: { id: 1 } });
    const useCase = new CreateReviewUseCase(deps);
    await expect(
      useCase.execute({ placeId: 1, userId: 1, ratings: validRatings() })
    ).rejects.toThrow(ConflictError);
  });

  it('geçersiz puan değeri ValidationError fırlatır', async () => {
    const deps = buildDeps();
    const useCase = new CreateReviewUseCase(deps);
    await expect(
      useCase.execute({ placeId: 1, userId: 1, ratings: validRatings({ overallRating: 9 }) })
    ).rejects.toThrow(ValidationError);
  });

  it('geçerli veriyle review oluşturur ve cache invalidate eder', async () => {
    const deps = buildDeps();
    const useCase = new CreateReviewUseCase(deps);
    const review = await useCase.execute({ placeId: 5, userId: 1, ratings: validRatings(), comment: 'Süper' });

    expect(review.placeId).toBe(5);
    expect(deps.cache.del).toHaveBeenCalledWith('places:detail:5');
    expect(deps.cache.invalidate).toHaveBeenCalledWith('places:list:*');
  });
});
