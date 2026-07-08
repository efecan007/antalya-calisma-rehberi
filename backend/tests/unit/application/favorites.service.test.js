const FavoritesService = require('../../../src/modules/favorites/application/favorites.service');
const Place = require('../../../src/modules/places/domain/Place');
const { NotFoundError } = require('../../../src/common/errors');

function makePlace(id, status = 'APPROVED') {
  return new Place({
    id,
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

describe('FavoritesService.addFavorite', () => {
  it('mekan yoksa NotFoundError fırlatır', async () => {
    const service = new FavoritesService({
      favoriteRepository: { add: jest.fn() },
      placeRepository: { async findById() { return null; } },
    });
    await expect(service.addFavorite({ userId: 1, placeId: 1 })).rejects.toThrow(NotFoundError);
  });

  it('onaylanmamış mekan favorilenemez', async () => {
    const service = new FavoritesService({
      favoriteRepository: { add: jest.fn() },
      placeRepository: { async findById() { return makePlace(1, 'PENDING'); } },
    });
    await expect(service.addFavorite({ userId: 1, placeId: 1 })).rejects.toThrow(NotFoundError);
  });

  it('onaylı mekan favorilere eklenir ve popüler cache invalidate edilir', async () => {
    const add = jest.fn();
    const cache = { invalidate: jest.fn() };
    const service = new FavoritesService({
      favoriteRepository: { add },
      placeRepository: { async findById() { return makePlace(1); } },
      cache,
    });
    await service.addFavorite({ userId: 1, placeId: 1 });
    expect(add).toHaveBeenCalledWith(1, 1);
    expect(cache.invalidate).toHaveBeenCalledWith('places:popular:*');
  });
});

describe('FavoritesService.removeFavorite', () => {
  it('favoriden çıkarır ve popüler cache invalidate edilir', async () => {
    const remove = jest.fn();
    const cache = { invalidate: jest.fn() };
    const service = new FavoritesService({ favoriteRepository: { remove }, cache });
    await service.removeFavorite({ userId: 1, placeId: 1 });
    expect(remove).toHaveBeenCalledWith(1, 1);
    expect(cache.invalidate).toHaveBeenCalledWith('places:popular:*');
  });
});

describe('FavoritesService.listFavorites', () => {
  it('kullanıcının favori mekanlarını serialize edip döner', async () => {
    const service = new FavoritesService({
      favoriteRepository: {
        async listPlacesByUser() {
          return [makePlace(1), makePlace(2)];
        },
      },
    });
    const result = await service.listFavorites({ userId: 1 });
    expect(result.map((p) => p.id)).toEqual([1, 2]);
  });
});
