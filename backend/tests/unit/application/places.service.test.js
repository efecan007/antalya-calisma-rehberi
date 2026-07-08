const PlacesService = require('../../../src/modules/places/application/places.service');
const Place = require('../../../src/modules/places/domain/Place');
const { ValidationError, ForbiddenError, NotFoundError } = require('../../../src/common/errors');

function makePlace(id, internetSpeed, overrides = {}) {
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
    ...overrides,
  });
}

function buildDeps({ places = [], findByIdResult, updateResult } = {}) {
  return {
    placeRepository: {
      lastFilters: null,
      async findMany(filters) {
        this.lastFilters = filters;
        return places;
      },
      async findById() {
        return findByIdResult !== undefined ? findByIdResult : places[0] ?? null;
      },
      async create(data) {
        return new Place({ id: 1, ...data });
      },
      async update(id, data) {
        return updateResult ?? new Place({ id, ...(findByIdResult ?? {}), ...data });
      },
      async delete() {},
    },
    cache: { invalidate: jest.fn(), del: jest.fn(), getOrSet: (_key, _ttl, fetchFn) => fetchFn() },
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

describe('PlacesService.createPlace', () => {
  it('admin oluşturunca status APPROVED olur', async () => {
    const service = new PlacesService(buildDeps());
    const place = await service.createPlace(validInput({ createdById: 1, requesterRole: 'ADMIN' }));
    expect(place.status).toBe('APPROVED');
  });

  it('normal kullanıcı oluşturunca status PENDING olur', async () => {
    const service = new PlacesService(buildDeps());
    const place = await service.createPlace(validInput({ createdById: 2, requesterRole: 'USER' }));
    expect(place.status).toBe('PENDING');
  });

  it('coworking türü ve Belek bölgesi kabul edilir', async () => {
    const service = new PlacesService(buildDeps());
    const place = await service.createPlace(
      validInput({ createdById: 1, requesterRole: 'ADMIN', type: 'COWORKING', region: 'BELEK' })
    );
    expect(place.type).toBe('COWORKING');
    expect(place.region).toBe('BELEK');
  });

  it('geçersiz outletLevel ValidationError fırlatır', async () => {
    const service = new PlacesService(buildDeps());
    await expect(
      service.createPlace(validInput({ createdById: 1, requesterRole: 'ADMIN', outletLevel: 'ÇOK' }))
    ).rejects.toThrow(ValidationError);
  });

  it('geçersiz lat/lng ValidationError fırlatır', async () => {
    const service = new PlacesService(buildDeps());
    await expect(
      service.createPlace(validInput({ createdById: 1, requesterRole: 'ADMIN', lat: 200 }))
    ).rejects.toThrow(ValidationError);
    await expect(
      service.createPlace(validInput({ createdById: 1, requesterRole: 'ADMIN', lng: 'abc' }))
    ).rejects.toThrow(ValidationError);
  });

  it('geçersiz priceLevel ValidationError fırlatır', async () => {
    const service = new PlacesService(buildDeps());
    await expect(
      service.createPlace(validInput({ createdById: 1, requesterRole: 'ADMIN', priceLevel: 9 }))
    ).rejects.toThrow(ValidationError);
  });

  it('yeni alanlar belirtilmezse mantıklı varsayılanlar kullanılır', async () => {
    const service = new PlacesService(buildDeps());
    const place = await service.createPlace(validInput({ createdById: 1, requesterRole: 'ADMIN' }));
    expect(place.photoUrls).toEqual([]);
    expect(place.outletLevel).toBe('MEDIUM');
    expect(place.noiseLevel).toBe('MEDIUM');
    expect(place.hasWifi).toBe(true);
    expect(place.meetingSuitable).toBe(false);
  });

  it('photoUrls boşlukları temizler ve boş girdileri eler', async () => {
    const service = new PlacesService(buildDeps());
    const place = await service.createPlace(
      validInput({
        createdById: 1,
        requesterRole: 'ADMIN',
        photoUrls: [' https://example.com/1.jpg ', '', 'https://example.com/2.jpg'],
      })
    );
    expect(place.photoUrls).toEqual(['https://example.com/1.jpg', 'https://example.com/2.jpg']);
  });
});

describe('PlacesService.listPlaces', () => {
  it('status filtresini her zaman APPROVED olarak zorlar', async () => {
    const deps = buildDeps({ places: [] });
    const service = new PlacesService(deps);
    await service.listPlaces({ status: 'PENDING' });
    expect(deps.placeRepository.lastFilters.status).toBe('APPROVED');
  });

  it('sortBy=internetSpeed ve sortOrder=asc ile artan sıralar', async () => {
    const places = [makePlace(1, 5), makePlace(2, 2), makePlace(3, 4)];
    const service = new PlacesService(buildDeps({ places }));
    const result = await service.listPlaces({ sortBy: 'internetSpeed', sortOrder: 'asc' });
    expect(result.map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it('sortBy varsayılan olarak (desc) azalan sıralar', async () => {
    const places = [makePlace(1, 2), makePlace(2, 5), makePlace(3, 3)];
    const service = new PlacesService(buildDeps({ places }));
    const result = await service.listPlaces({ sortBy: 'internetSpeed' });
    expect(result.map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it('minRating filtresi düşük puanlıları eler', async () => {
    const places = [makePlace(1, 2), makePlace(2, 5)];
    const service = new PlacesService(buildDeps({ places }));
    const result = await service.listPlaces({ minRating: '4' });
    expect(result.map((p) => p.id)).toEqual([2]);
  });

  it('minInternetSpeed filtresi düşük hızlıları eler', async () => {
    const places = [makePlace(1, 2), makePlace(2, 5)];
    const service = new PlacesService(buildDeps({ places }));
    const result = await service.listPlaces({ minInternetSpeed: '4' });
    expect(result.map((p) => p.id)).toEqual([2]);
  });

  it('outletLevel ve noiseLevel filtrelerini repository katmanına iletir', async () => {
    const deps = buildDeps({ places: [] });
    const service = new PlacesService(deps);
    await service.listPlaces({ outletLevel: 'HIGH', noiseLevel: 'LOW' });
    expect(deps.placeRepository.lastFilters.outletLevel).toBe('HIGH');
    expect(deps.placeRepository.lastFilters.noiseLevel).toBe('LOW');
  });
});

describe('PlacesService.getPlace', () => {
  it('PENDING mekanı sahibi olmayan/admin olmayan biri göremez (404)', async () => {
    const place = makePlace(1, 4, { status: 'PENDING', createdById: 7 });
    const deps = buildDeps({ findByIdResult: place });
    const service = new PlacesService(deps);
    await expect(service.getPlace({ id: 1, requesterId: 99, requesterRole: 'USER' })).rejects.toThrow(
      NotFoundError
    );
  });

  it('PENDING mekanı sahibi görebilir', async () => {
    const place = makePlace(1, 4, { status: 'PENDING', createdById: 7 });
    const deps = buildDeps({ findByIdResult: place });
    const service = new PlacesService(deps);
    const result = await service.getPlace({ id: 1, requesterId: 7, requesterRole: 'USER' });
    expect(result.id).toBe(1);
  });
});

describe('PlacesService.updatePlace / deletePlace', () => {
  it('admin olmayan güncelleyemez', async () => {
    const place = makePlace(1, 4);
    const service = new PlacesService(buildDeps({ findByIdResult: place }));
    await expect(
      service.updatePlace({ id: 1, requesterRole: 'USER', changes: { name: 'x' } })
    ).rejects.toThrow(ForbiddenError);
  });

  it('admin olmayan silemez', async () => {
    const place = makePlace(1, 4);
    const service = new PlacesService(buildDeps({ findByIdResult: place }));
    await expect(service.deletePlace({ id: 1, requesterRole: 'USER' })).rejects.toThrow(ForbiddenError);
  });

  it('admin günceller', async () => {
    const place = makePlace(1, 4);
    const service = new PlacesService(buildDeps({ findByIdResult: place }));
    const result = await service.updatePlace({ id: 1, requesterRole: 'ADMIN', changes: { name: 'Yeni Ad' } });
    expect(result.name).toBe('Yeni Ad');
  });
});
