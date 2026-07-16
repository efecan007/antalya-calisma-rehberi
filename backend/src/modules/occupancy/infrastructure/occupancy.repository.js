const OccupancyRepository = require('../domain/OccupancyRepository');

class PrismaOccupancyRepository extends OccupancyRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create({ userId, placeId, level }) {
    return this.prisma.occupancyCheckIn.create({ data: { userId, placeId, level } });
  }

  async findLatestByUserAndPlace(userId, placeId) {
    return this.prisma.occupancyCheckIn.findFirst({
      where: { userId, placeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRecentByPlaceIds(placeIds, since) {
    return this.prisma.occupancyCheckIn.findMany({
      where: { placeId: { in: placeIds }, createdAt: { gte: since } },
      select: { placeId: true, level: true, createdAt: true },
    });
  }

  async findSinceByPlaceId(placeId, since) {
    return this.prisma.occupancyCheckIn.findMany({
      where: { placeId, createdAt: { gte: since } },
      select: { level: true, createdAt: true },
    });
  }
}

module.exports = PrismaOccupancyRepository;
