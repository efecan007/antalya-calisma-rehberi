const SuggestionsService = require('../../../src/modules/suggestions/application/suggestions.service');
const Place = require('../../../src/modules/places/domain/Place');
const { NotFoundError } = require('../../../src/common/errors');

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
      async findMany() {
        return existing ? [existing] : [];
      },
    },
    cache: { del: jest.fn(), invalidate: jest.fn() },
  };
}

describe('SuggestionsService.approve', () => {
  it('mekan yoksa NotFoundError fırlatır', async () => {
    const service = new SuggestionsService(buildDeps(null));
    await expect(service.approve({ id: 1 })).rejects.toThrow(NotFoundError);
  });

  it('PENDING mekanı APPROVED yapar ve cache invalidate eder', async () => {
    const deps = buildDeps(makePlace('PENDING'));
    const service = new SuggestionsService(deps);
    const result = await service.approve({ id: 1 });
    expect(result.status).toBe('APPROVED');
    expect(deps.cache.del).toHaveBeenCalledWith('places:detail:1');
    expect(deps.cache.invalidate).toHaveBeenCalledWith('places:list:*');
  });
});

describe('SuggestionsService.reject', () => {
  it('PENDING mekanı REJECTED yapar', async () => {
    const deps = buildDeps(makePlace('PENDING'));
    const service = new SuggestionsService(deps);
    const result = await service.reject({ id: 1 });
    expect(result.status).toBe('REJECTED');
  });
});

describe('SuggestionsService.listPending', () => {
  it('bekleyen mekanları serialize edip döner', async () => {
    const deps = buildDeps(makePlace('PENDING'));
    const service = new SuggestionsService(deps);
    const result = await service.listPending();
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('PENDING');
  });
});
