class NotificationRepository {
  async create(_data) {
    throw new Error('Not implemented');
  }

  async createMany(_dataList) {
    throw new Error('Not implemented');
  }

  async findByUser(_userId) {
    throw new Error('Not implemented');
  }

  async findById(_id) {
    throw new Error('Not implemented');
  }

  async countUnread(_userId) {
    throw new Error('Not implemented');
  }

  async markRead(_id) {
    throw new Error('Not implemented');
  }

  async markAllRead(_userId) {
    throw new Error('Not implemented');
  }

  async existsRecent(_params) {
    throw new Error('Not implemented');
  }
}

module.exports = NotificationRepository;
