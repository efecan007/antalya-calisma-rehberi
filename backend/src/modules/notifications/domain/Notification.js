class Notification {
  constructor({ id, userId, type, message, placeId, place, isRead, createdAt }) {
    this.id = id;
    this.userId = userId;
    this.type = type;
    this.message = message;
    this.placeId = placeId ?? null;
    this.place = place ?? null;
    this.isRead = isRead ?? false;
    this.createdAt = createdAt;
  }
}

module.exports = Notification;
