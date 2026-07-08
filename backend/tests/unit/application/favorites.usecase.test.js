const AddFavoriteUseCase = require('../../../src/modules/favorites/application/addFavorite.usecase');
const RemoveFavoriteUseCase = require('../../../src/modules/favorites/application/removeFavorite.usecase');
const ListFavoritesUseCase = require('../../../src/modules/favorites/application/listFavorites.usecase');
const Place = require('../../../src/modules/places/domain/Place');
const { NotFoundError } = require('../../../src/shared/domain/errors');

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

describe('AddFavoriteUseCase', () => {
  it('mekan yoksa NotFoundError fırlatır', async () => {
    const useCase = new AddFavoriteUseCase({
      favoriteRepository: { add: jest.fn() },
      placeRepository: { async findById() { return null; } },
    });
    await expect(useCase.execute({ userId: 1, placeId: 1 })).rejects.toThrow(NotFoundError);
  });

  it('onaylanmamış mekan favorilenemez', async () => {
    const useCase = new AddFavoriteUseCase({
      favoriteRepository: { add: jest.fn() },
      placeRepository: { async findById() { return makePlace(1, 'PENDING'); } },
    });
    await expect(useCase.execute({ userId: 1, placeId: 1 })).rejects.toThrow(NotFoundError);
  });

  it('onaylı mekan favorilere eklenir', async () => {
    const add = jest.fn();
    const useCase = new AddFavoriteUseCase({
      favoriteRepository: { add },
      placeRepository: { async findById() { return makePlace(1); } },
    });
    await useCase.execute({ userId: 1, placeId: 1 });
    expect(add).toHaveBeenCalledWith(1, 1);
  });
});

describe('RemoveFavoriteUseCase', () => {
  it('favoriden çıkarır', async () => {
    const remove = jest.fn();
    const useCase = new RemoveFavoriteUseCase({ favoriteRepository: { remove } });
    await useCase.execute({ userId: 1, placeId: 1 });
    expect(remove).toHaveBeenCalledWith(1, 1);
  });
});

describe('ListFavoritesUseCase', () => {
  it('kullanıcının favori mekanlarını serialize edip döner', async () => {
    const useCase = new ListFavoritesUseCase({
      favoriteRepository: {
        async listPlacesByUser() {
          return [makePlace(1), makePlace(2)];
        },
      },
    });
    const result = await useCase.execute({ userId: 1 });
    expect(result.map((p) => p.id)).toEqual([1, 2]);
  });
});
