const ListPlacesUseCase = require('../../../src/modules/places/application/listPlaces.usecase');
const Place = require('../../../src/modules/places/domain/Place');

function makePlace(id, internetSpeed) {
  return new Place({
    id,
    name: `Place ${id}`,
    type: 'CAFE',
    region: 'MURATPASA',
    address: 'Adres',
    lat: 0,
    lng: 0,
    priceLevel: 2,
    status: 'APPROVED',
    reviews: [
      {
        internetSpeed,
        outletCount: 3,
        noiseLevel: 3,
        coffeeQuality: 3,
        workEnvironment: 3,
        priceLevel: 2,
        overallRating: internetSpeed,
      },
    ],
  });
}

function buildDeps(places) {
  return {
    placeRepository: {
      async findMany(filters) {
        this.lastFilters = filters;
        return places;
      },
    },
    cache: null,
  };
}

describe('ListPlacesUseCase', () => {
  it('status filtresini her zaman APPROVED olarak zorlar', async () => {
    const deps = buildDeps([]);
    const useCase = new ListPlacesUseCase(deps);
    await useCase.execute({ status: 'PENDING' });
    expect(deps.placeRepository.lastFilters.status).toBe('APPROVED');
  });

  it('sortBy=internetSpeed ve sortOrder=asc ile artan sıralar', async () => {
    const places = [makePlace(1, 5), makePlace(2, 2), makePlace(3, 4)];
    const deps = buildDeps(places);
    const useCase = new ListPlacesUseCase(deps);
    const result = await useCase.execute({ sortBy: 'internetSpeed', sortOrder: 'asc' });
    expect(result.map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it('sortBy varsayılan olarak (desc) azalan sıralar', async () => {
    const places = [makePlace(1, 2), makePlace(2, 5), makePlace(3, 3)];
    const deps = buildDeps(places);
    const useCase = new ListPlacesUseCase(deps);
    const result = await useCase.execute({ sortBy: 'internetSpeed' });
    expect(result.map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it('minRating filtresi düşük puanlıları eler', async () => {
    const places = [makePlace(1, 2), makePlace(2, 5)];
    const deps = buildDeps(places);
    const useCase = new ListPlacesUseCase(deps);
    const result = await useCase.execute({ minRating: '4' });
    expect(result.map((p) => p.id)).toEqual([2]);
  });

  it('minInternetSpeed filtresi düşük hızlıları eler', async () => {
    const places = [makePlace(1, 2), makePlace(2, 5)];
    const deps = buildDeps(places);
    const useCase = new ListPlacesUseCase(deps);
    const result = await useCase.execute({ minInternetSpeed: '4' });
    expect(result.map((p) => p.id)).toEqual([2]);
  });

  it('outletLevel ve noiseLevel filtrelerini repository katmanına iletir', async () => {
    const deps = buildDeps([]);
    const useCase = new ListPlacesUseCase(deps);
    await useCase.execute({ outletLevel: 'HIGH', noiseLevel: 'LOW' });
    expect(deps.placeRepository.lastFilters.outletLevel).toBe('HIGH');
    expect(deps.placeRepository.lastFilters.noiseLevel).toBe('LOW');
  });
});
