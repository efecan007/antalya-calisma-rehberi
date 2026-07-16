const NotificationRepository = require('../domain/NotificationRepository');
const Notification = require('../domain/Notification');

const PLACE_SELECT = { id: true, name: true };

function toEntity(record) {
  return record ? new Notification(record) : null;
}

class NotificationsRepository extends NotificationRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(data) {
    const record = await this.prisma.notification.create({
      data,
      include: { place: { select: PLACE_SELECT } },
    });
    return toEntity(record);
  }

  async createMany(dataList) {
    if (!dataList.length) return;
    await this.prisma.notification.createMany({ data: dataList });
  }

  async findByUser(userId) {
    const records = await this.prisma.notification.findMany({
      where: { userId },
      include: { place: { select: PLACE_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return records.map(toEntity);
  }

  async findById(id) {
    const record = await this.prisma.notification.findUnique({ where: { id } });
    return toEntity(record);
  }

  async countUnread(userId) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(id) {
    const record = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: { place: { select: PLACE_SELECT } },
    });
    return toEntity(record);
  }

  async markAllRead(userId) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async existsRecent({ userId, type, placeId, since }) {
    const count = await this.prisma.notification.count({
      where: { userId, type, placeId, createdAt: { gte: since } },
    });
    return count > 0;
  }
}

module.exports = NotificationsRepository;
