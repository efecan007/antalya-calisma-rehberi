class PostComment {
  constructor({ id, postId, userId, content, createdAt, user }) {
    this.id = id;
    this.postId = postId;
    this.userId = userId;
    this.content = content;
    this.createdAt = createdAt;
    this.user = user ?? null;
  }
}

module.exports = PostComment;
