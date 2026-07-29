class SocialNotification {
  constructor({ id, userId, actorId, type, postId, isRead, createdAt, actor }) {
    this.id = id;
    this.userId = userId;
    this.actorId = actorId;
    this.type = type;
    this.postId = postId ?? null;
    this.isRead = isRead ?? false;
    this.createdAt = createdAt;
    this.actor = actor ?? null;
  }
}

module.exports = SocialNotification;
