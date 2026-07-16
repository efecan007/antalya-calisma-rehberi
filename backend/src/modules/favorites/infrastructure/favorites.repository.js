const FavoriteRepository = require('../domain/FavoriteRepository');
const Place = require('../../places/domain/Place');

class FavoritesRepository extends FavoriteRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async add(userId, placeId) {
    await this.prisma.favorite.upsert({
      where: { userId_placeId: { userId, placeId } },
      create: { userId, placeId },
      update: {},
    });
  }

  async remove(userId, placeId) {
    await this.prisma.favorite.deleteMany({ where: { userId, placeId } });
  }

  async listPlacesByUser(userId) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: { place: { include: { reviews: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return favorites.map((f) => new Place(f.place));
  }

  async findUserIdsByPlace(placeId) {
    const favorites = await this.prisma.favorite.findMany({
      where: { placeId },
      select: { userId: true },
    });
    return favorites.map((f) => f.userId);
  }
}

module.exports = FavoritesRepository;
