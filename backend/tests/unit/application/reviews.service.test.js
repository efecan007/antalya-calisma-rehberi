const ReviewsService = require('../../../src/modules/reviews/application/reviews.service');
const { NotFoundError, ConflictError, ValidationError, ForbiddenError } = require('../../../src/common/errors');

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

function buildDeps({ placeExists = true, existingReview = null, findByIdResult, reviewsForPlace = [] } = {}) {
  const created = [];
  const deleted = [];
  return {
    reviewRepository: {
      async findByPlaceAndUser() {
        return existingReview;
      },
      async findById() {
        return findByIdResult !== undefined ? findByIdResult : existingReview;
      },
      async findByPlace() {
        return reviewsForPlace;
      },
      async create(data) {
        created.push(data);
        return { id: 1, ...data };
      },
      async update(id, data) {
        return { id, ...data };
      },
      async delete(id) {
        deleted.push(id);
      },
    },
    placeRepository: {
      async findById(id) {
        return placeExists ? { id } : null;
      },
    },
    cache: { del: jest.fn(), invalidate: jest.fn() },
    created,
    deleted,
  };
}

describe('ReviewsService.listByPlace', () => {
  it('mekan yoksa NotFoundError fırlatır', async () => {
    const service = new ReviewsService(buildDeps({ placeExists: false }));
    await expect(service.listByPlace({ placeId: 1 })).rejects.toThrow(NotFoundError);
  });

  it('mekana ait yorumları döner', async () => {
    const reviewsForPlace = [{ id: 1 }, { id: 2 }];
    const service = new ReviewsService(buildDeps({ reviewsForPlace }));
    const result = await service.listByPlace({ placeId: 1 });
    expect(result).toEqual(reviewsForPlace);
  });
});

describe('ReviewsService.createReview', () => {
  it('mekan yoksa NotFoundError fırlatır', async () => {
    const deps = buildDeps({ placeExists: false });
    const service = new ReviewsService(deps);
    await expect(
      service.createReview({ placeId: 1, userId: 1, ratings: validRatings() })
    ).rejects.toThrow(NotFoundError);
  });

  it('kullanıcı aynı mekana ikinci kez yorum yapamaz', async () => {
    const deps = buildDeps({ existingReview: { id: 1 } });
    const service = new ReviewsService(deps);
    await expect(
      service.createReview({ placeId: 1, userId: 1, ratings: validRatings() })
    ).rejects.toThrow(ConflictError);
  });

  it('geçersiz puan değeri ValidationError fırlatır', async () => {
    const deps = buildDeps();
    const service = new ReviewsService(deps);
    await expect(
      service.createReview({ placeId: 1, userId: 1, ratings: validRatings({ overallRating: 9 }) })
    ).rejects.toThrow(ValidationError);
  });

  it('geçerli veriyle review oluşturur ve cache invalidate eder', async () => {
    const deps = buildDeps();
    const service = new ReviewsService(deps);
    const review = await service.createReview({
      placeId: 5,
      userId: 1,
      ratings: validRatings(),
      comment: 'Süper',
    });

    expect(review.placeId).toBe(5);
    expect(deps.cache.del).toHaveBeenCalledWith('places:detail:5');
    expect(deps.cache.invalidate).toHaveBeenCalledWith('places:list:*');
  });
});

describe('ReviewsService.updateReview', () => {
  const review = { id: 1, userId: 10, placeId: 5 };

  it('sahibi olmayan düzenleyemez', async () => {
    const deps = buildDeps({ existingReview: review });
    const service = new ReviewsService(deps);
    await expect(
      service.updateReview({ reviewId: 1, userId: 99, ratings: validRatings() })
    ).rejects.toThrow(ForbiddenError);
  });

  it('sahibi kendi yorumunu günceller', async () => {
    const deps = buildDeps({ existingReview: review });
    const service = new ReviewsService(deps);
    const updated = await service.updateReview({
      reviewId: 1,
      userId: 10,
      ratings: validRatings({ overallRating: 5 }),
      comment: 'Güncellendi',
    });
    expect(updated.overallRating).toBe(5);
  });
});

describe('ReviewsService.deleteReview', () => {
  const review = { id: 1, userId: 10, placeId: 5 };

  it('yorum yoksa NotFoundError fırlatır', async () => {
    const service = new ReviewsService(buildDeps({ existingReview: null }));
    await expect(service.deleteReview({ reviewId: 1, userId: 10 })).rejects.toThrow(NotFoundError);
  });

  it('sahibi olmayan normal kullanıcı silemez', async () => {
    const service = new ReviewsService(buildDeps({ existingReview: review }));
    await expect(
      service.deleteReview({ reviewId: 1, userId: 99, requesterRole: 'USER' })
    ).rejects.toThrow(ForbiddenError);
  });

  it('sahibi kendi yorumunu silebilir', async () => {
    const deps = buildDeps({ existingReview: review });
    const service = new ReviewsService(deps);
    await service.deleteReview({ reviewId: 1, userId: 10, requesterRole: 'USER' });
    expect(deps.deleted).toEqual([1]);
  });

  it('admin başkasının yorumunu silebilir', async () => {
    const deps = buildDeps({ existingReview: review });
    const service = new ReviewsService(deps);
    await service.deleteReview({ reviewId: 1, userId: 99, requesterRole: 'ADMIN' });
    expect(deps.deleted).toEqual([1]);
  });
});
