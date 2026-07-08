const CreatePlaceUseCase = require('../../../src/modules/places/application/createPlace.usecase');
const Place = require('../../../src/modules/places/domain/Place');
const { ValidationError } = require('../../../src/shared/domain/errors');

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

  it('coworking türü ve Belek bölgesi kabul edilir', async () => {
    const deps = buildDeps();
    const useCase = new CreatePlaceUseCase(deps);
    const place = await useCase.execute(
      validInput({ createdById: 1, requesterRole: 'ADMIN', type: 'COWORKING', region: 'BELEK' })
    );
    expect(place.type).toBe('COWORKING');
    expect(place.region).toBe('BELEK');
  });

  it('geçersiz outletLevel ValidationError fırlatır', async () => {
    const deps = buildDeps();
    const useCase = new CreatePlaceUseCase(deps);
    await expect(
      useCase.execute(validInput({ createdById: 1, requesterRole: 'ADMIN', outletLevel: 'ÇOK' }))
    ).rejects.toThrow(ValidationError);
  });

  it('yeni alanlar belirtilmezse mantıklı varsayılanlar kullanılır', async () => {
    const deps = buildDeps();
    const useCase = new CreatePlaceUseCase(deps);
    const place = await useCase.execute(validInput({ createdById: 1, requesterRole: 'ADMIN' }));
    expect(place.photoUrls).toEqual([]);
    expect(place.outletLevel).toBe('MEDIUM');
    expect(place.noiseLevel).toBe('MEDIUM');
    expect(place.hasWifi).toBe(true);
    expect(place.meetingSuitable).toBe(false);
  });

  it('photoUrls boşlukları temizler ve boş girdileri eler', async () => {
    const deps = buildDeps();
    const useCase = new CreatePlaceUseCase(deps);
    const place = await useCase.execute(
      validInput({
        createdById: 1,
        requesterRole: 'ADMIN',
        photoUrls: [' https://example.com/1.jpg ', '', 'https://example.com/2.jpg'],
      })
    );
    expect(place.photoUrls).toEqual(['https://example.com/1.jpg', 'https://example.com/2.jpg']);
  });
});
