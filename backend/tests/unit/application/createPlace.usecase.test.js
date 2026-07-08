const CreatePlaceUseCase = require('../../../src/modules/places/application/createPlace.usecase');
const Place = require('../../../src/modules/places/domain/Place');

function buildDeps() {
  return {
    placeRepository: {
      async create(data) {
        return new Place({ id: 1, ...data });
      },
    },
    cache: { invalidate: jest.fn() },
  };
}

function validInput(overrides = {}) {
  return {
    name: 'Test Mekan',
    type: 'CAFE',
    region: 'MURATPASA',
    address: 'Adres',
    lat: 36.9,
    lng: 30.7,
    ...overrides,
  };
}

describe('CreatePlaceUseCase', () => {
  it('admin oluşturunca status APPROVED olur', async () => {
    const deps = buildDeps();
    const useCase = new CreatePlaceUseCase(deps);
    const place = await useCase.execute(validInput({ createdById: 1, requesterRole: 'ADMIN' }));
    expect(place.status).toBe('APPROVED');
  });

  it('normal kullanıcı oluşturunca status PENDING olur', async () => {
    const deps = buildDeps();
    const useCase = new CreatePlaceUseCase(deps);
    const place = await useCase.execute(validInput({ createdById: 2, requesterRole: 'USER' }));
    expect(place.status).toBe('PENDING');
  });
});
