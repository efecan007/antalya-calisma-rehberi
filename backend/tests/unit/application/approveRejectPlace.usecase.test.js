const ApprovePlaceUseCase = require('../../../src/modules/places/application/approvePlace.usecase');
const RejectPlaceUseCase = require('../../../src/modules/places/application/rejectPlace.usecase');
const Place = require('../../../src/modules/places/domain/Place');
const { NotFoundError } = require('../../../src/shared/domain/errors');

function makePlace(status) {
  return new Place({
    id: 1,
    name: 'Test',
    type: 'CAFE',
    region: 'MURATPASA',
    address: 'Adres',
    lat: 0,
    lng: 0,
    priceLevel: 2,
    status,
  });
}

function buildDeps(existing) {
  return {
    placeRepository: {
      async findById() {
        return existing;
      },
      async update(id, data) {
        return makePlace(data.status);
      },
    },
    cache: { del: jest.fn(), invalidate: jest.fn() },
  };
}

describe('ApprovePlaceUseCase', () => {
  it('mekan yoksa NotFoundError fırlatır', async () => {
    const useCase = new ApprovePlaceUseCase(buildDeps(null));
    await expect(useCase.execute({ id: 1 })).rejects.toThrow(NotFoundError);
  });

  it('PENDING mekanı APPROVED yapar ve cache invalidate eder', async () => {
    const deps = buildDeps(makePlace('PENDING'));
    const useCase = new ApprovePlaceUseCase(deps);
    const result = await useCase.execute({ id: 1 });
    expect(result.status).toBe('APPROVED');
    expect(deps.cache.del).toHaveBeenCalledWith('places:detail:1');
    expect(deps.cache.invalidate).toHaveBeenCalledWith('places:list:*');
  });
});

describe('RejectPlaceUseCase', () => {
  it('PENDING mekanı REJECTED yapar', async () => {
    const deps = buildDeps(makePlace('PENDING'));
    const useCase = new RejectPlaceUseCase(deps);
    const result = await useCase.execute({ id: 1 });
    expect(result.status).toBe('REJECTED');
  });
});
