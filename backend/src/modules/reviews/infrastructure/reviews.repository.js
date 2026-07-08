const ReviewRepository = require('../domain/ReviewRepository');
const Review = require('../domain/Review');

function toEntity(record) {
  return record ? new Review(record) : null;
}

class ReviewsRepository extends ReviewRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findMany() {
    const records = await this.prisma.review.findMany({
      include: {
        user: { select: { id: true, name: true } },
        place: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => ({
      id: record.id,
      placeId: record.placeId,
      place: record.place,
      user: record.user,
      overallRating: record.overallRating,
      comment: record.comment,
      createdAt: record.createdAt,
    }));
  }

  async findByPlaceAndUser(placeId, userId) {
    const record = await this.prisma.review.findUnique({
      where: { placeId_userId: { placeId, userId } },
    });
    return toEntity(record);
  }

  async findById(id) {
    const record = await this.prisma.review.findUnique({ where: { id } });
    return toEntity(record);
  }

  async create(data) {
    const record = await this.prisma.review.create({
      data,
      include: { user: { select: { id: true, name: true } } },
    });
    return toEntity(record);
  }

  async update(id, data) {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
    const record = await this.prisma.review.update({
      where: { id },
      data: cleanData,
      include: { user: { select: { id: true, name: true } } },
    });
    return toEntity(record);
  }

  async delete(id) {
    await this.prisma.review.delete({ where: { id } });
  }
}

module.exports = ReviewsRepository;
