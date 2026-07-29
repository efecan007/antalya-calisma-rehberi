/**
 * Social Feed modülünün veri erişim sözleşmesi. Uygulama (service) katmanı yalnızca
 * bu arayüze bağımlıdır; Prisma detayları infrastructure/social.repository.js içinde kalır.
 */
class SocialRepository {
  // --- Posts ---
  async createPost(_data) {
    throw new Error('Not implemented');
  }

  async findPostById(_id, _viewerId) {
    throw new Error('Not implemented');
  }

  async updatePost(_id, _data) {
    throw new Error('Not implemented');
  }

  async deletePost(_id) {
    throw new Error('Not implemented');
  }

  async findFeed(_options) {
    throw new Error('Not implemented');
  }

  async findPostsByUser(_userId, _viewerId) {
    throw new Error('Not implemented');
  }

  async findLikedPostIds(_viewerId, _postIds) {
    throw new Error('Not implemented');
  }

  // --- Likes ---
  async findLike(_postId, _userId) {
    throw new Error('Not implemented');
  }

  async addLike(_postId, _userId) {
    throw new Error('Not implemented');
  }

  async removeLike(_postId, _userId) {
    throw new Error('Not implemented');
  }

  // --- Comments ---
  async createComment(_data) {
    throw new Error('Not implemented');
  }

  async findCommentById(_id) {
    throw new Error('Not implemented');
  }

  async findCommentsByPost(_postId) {
    throw new Error('Not implemented');
  }

  async deleteComment(_id) {
    throw new Error('Not implemented');
  }

  // --- Follow ---
  async findFollow(_followerId, _followingId) {
    throw new Error('Not implemented');
  }

  async addFollow(_followerId, _followingId) {
    throw new Error('Not implemented');
  }

  async removeFollow(_followerId, _followingId) {
    throw new Error('Not implemented');
  }

  async findFollowingIds(_userId) {
    throw new Error('Not implemented');
  }

  // --- Profile ---
  async findUserById(_userId) {
    throw new Error('Not implemented');
  }

  async findProfileByUserId(_userId) {
    throw new Error('Not implemented');
  }

  async upsertProfile(_userId, _data) {
    throw new Error('Not implemented');
  }

  async getProfileStats(_userId) {
    throw new Error('Not implemented');
  }

  async setBlocked(_userId, _isBlocked) {
    throw new Error('Not implemented');
  }

  // --- Notifications ---
  async createNotification(_data) {
    throw new Error('Not implemented');
  }

  async findNotificationsByUser(_userId) {
    throw new Error('Not implemented');
  }

  async findNotificationById(_id) {
    throw new Error('Not implemented');
  }

  async markNotificationRead(_id) {
    throw new Error('Not implemented');
  }

  async countUnreadNotifications(_userId) {
    throw new Error('Not implemented');
  }
}

module.exports = SocialRepository;
