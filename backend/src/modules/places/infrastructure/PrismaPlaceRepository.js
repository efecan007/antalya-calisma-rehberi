const PlaceRepository = require('../domain/PlaceRepository');
const Place = require('../domain/Place');

function toEntity(record) {
  return record ? new Place(record) : null;
}

class PrismaPlaceRepository extends PlaceRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findMany({ region, type, maxPrice, search } = {}) {
    const where = {};
    if (region) where.region = region;
    if (type) where.type = type;
    if (maxPrice) where.priceLevel = { lte: Number(maxPrice) };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const records = await this.prisma.place.findMany({
      where,
      include: { reviews: true },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(toEntity);
  }

  async findById(id) {
    const record = await this.prisma.place.findUnique({
      where: { id },
      include: {
        reviews: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    return toEntity(record);
  }

  async create(data) {
    const record = await this.prisma.place.create({ data, include: { reviews: true } });
    return toEntity(record);
  }

  async update(id, data) {
    const record = await this.prisma.place.update({
      where: { id },
      data,
      include: { reviews: true },
    });
    return toEntity(record);
  }

  async delete(id) {
    await this.prisma.place.delete({ where: { id } });
  }
}

module.exports = PrismaPlaceRepository;
