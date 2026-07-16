const { NotFoundError, ForbiddenError } = require('../../../common/errors');

class NotificationsService {
  constructor({ notificationRepository }) {
    this.notificationRepository = notificationRepository;
  }

  async notify({ userId, type, message, placeId }) {
    if (userId == null) return null;
    return this.notificationRepository.create({ userId, type, message, placeId: placeId ?? null });
  }

  async notifyMany({ userIds, type, message, placeId }) {
    const uniqueIds = [...new Set(userIds)].filter((id) => id != null);
    if (!uniqueIds.length) return;
    await this.notificationRepository.createMany(
      uniqueIds.map((userId) => ({ userId, type, message, placeId: placeId ?? null }))
    );
  }

  async listForUser({ userId }) {
    return this.notificationRepository.findByUser(userId);
  }

  async unreadCount({ userId }) {
    const count = await this.notificationRepository.countUnread(userId);
    return { count };
  }

  async markRead({ id, userId }) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundError('Bildirim bulunamadı');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenError('Bu bildirime erişiminiz yok');
    }
    return this.notificationRepository.markRead(id);
  }

  async markAllRead({ userId }) {
    await this.notificationRepository.markAllRead(userId);
  }

  async hasRecentNotification({ userId, type, placeId, sinceMinutes }) {
    const since = new Date(Date.now() - sinceMinutes * 60000);
    return this.notificationRepository.existsRecent({ userId, type, placeId: placeId ?? null, since });
  }
}

module.exports = NotificationsService;
