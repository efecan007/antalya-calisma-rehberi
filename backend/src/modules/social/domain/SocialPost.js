class SocialPost {
  constructor({
    id,
    userId,
    caption,
    createdAt,
    updatedAt,
    user,
    images,
    likeCount,
    commentCount,
    isLikedByViewer,
  }) {
    this.id = id;
    this.userId = userId;
    this.caption = caption ?? null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.user = user ?? null;
    this.images = images ?? [];
    this.likeCount = likeCount ?? 0;
    this.commentCount = commentCount ?? 0;
    this.isLikedByViewer = isLikedByViewer ?? false;
  }
}

module.exports = SocialPost;
