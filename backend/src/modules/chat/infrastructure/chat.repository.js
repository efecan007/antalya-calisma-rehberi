const MessageRepository = require('../domain/MessageRepository');

const USER_SELECT = { id: true, name: true };

class PrismaMessageRepository extends MessageRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create({ placeId, userId, content }) {
    return this.prisma.placeMessage.create({
      data: { placeId, userId, content },
      include: { user: { select: USER_SELECT } },
    });
  }

  // afterId verilmişse (polling): o id'den sonraki tüm yeni mesajlar, eskiden
  // yeniye doğru. Verilmemişse (ilk yükleme): en güncel `limit` mesaj, yine
  // eskiden yeniye sıralı döner ki sohbet ekranında doğrudan render edilebilsin.
  async findByPlace(placeId, { afterId, limit }) {
    if (afterId) {
      return this.prisma.placeMessage.findMany({
        where: { placeId, id: { gt: afterId } },
        include: { user: { select: USER_SELECT } },
        orderBy: { id: 'asc' },
        take: 200,
      });
    }

    const records = await this.prisma.placeMessage.findMany({
      where: { placeId },
      include: { user: { select: USER_SELECT } },
      orderBy: { id: 'desc' },
      take: limit,
    });
    return records.reverse();
  }

  async findById(id) {
    return this.prisma.placeMessage.findUnique({ where: { id } });
  }

  // Moderasyon ekranı için: tüm mekanlardaki mesajlar, en yeniden eskiye.
  async findAll() {
    return this.prisma.placeMessage.findMany({
      include: {
        user: { select: USER_SELECT },
        place: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id) {
    await this.prisma.placeMessage.delete({ where: { id } });
  }
}

module.exports = PrismaMessageRepository;
