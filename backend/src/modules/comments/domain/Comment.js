class Comment {
  constructor({
    id,
    placeId,
    userId,
    content,
    photoUrl,
    isPinned,
    pinnedAt,
    createdAt,
    updatedAt,
    user,
    helpfulCount,
    isHelpfulByViewer,
  }) {
    this.id = id;
    this.placeId = placeId;
    this.userId = userId;
    this.content = content;
    this.photoUrl = photoUrl ?? null;
    this.isPinned = isPinned ?? false;
    this.pinnedAt = pinnedAt ?? null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.user = user;
    this.helpfulCount = helpfulCount ?? 0;
    this.isHelpfulByViewer = isHelpfulByViewer ?? false;
  }
}

module.exports = Comment;
