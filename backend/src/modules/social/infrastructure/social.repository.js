const SocialRepository = require('../domain/SocialRepository');
const SocialPost = require('../domain/SocialPost');
const PostComment = require('../domain/PostComment');
const SocialNotification = require('../domain/SocialNotification');

// Gönderi/yorum/bildirimlerde her zaman aynı herkese açık kullanıcı alanları döner.
const USER_SELECT = { id: true, name: true, avatarUrl: true };

const POST_INCLUDE = {
  user: { select: USER_SELECT },
  images: { orderBy: { position: 'asc' } },
  _count: { select: { likes: true, comments: true } },
};

function toPostEntity(record) {
  if (!record) return null;
  return new SocialPost({
    id: record.id,
    userId: record.userId,
    caption: record.caption,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    user: record.user,
    images: record.images?.map((img) => ({ id: img.id, url: img.url, position: img.position })) ?? [],
    likeCount: record._count?.likes ?? 0,
    commentCount: record._count?.comments ?? 0,
    isLikedByViewer: false,
  });
}

function toCommentEntity(record) {
  if (!record) return null;
  return new PostComment({
    id: record.id,
    postId: record.postId,
    userId: record.userId,
    content: record.content,
    createdAt: record.createdAt,
    user: record.user,
  });
}

function toNotificationEntity(record) {
  if (!record) return null;
  return new SocialNotification({
    id: record.id,
    userId: record.userId,
    actorId: record.actorId,
    type: record.type,
    postId: record.postId,
    isRead: record.isRead,
    createdAt: record.createdAt,
    actor: record.actor,
  });
}

class SocialPrismaRepository extends SocialRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  // --- Posts ---
  async createPost({ userId, caption, imageUrls }) {
    const record = await this.prisma.socialPost.create({
      data: {
        userId,
        caption: caption ?? null,
        images: {
          create: (imageUrls ?? []).map((url, index) => ({ url, position: index })),
        },
      },
      include: POST_INCLUDE,
    });
    return toPostEntity(record);
  }

  async findPostById(id) {
    const record = await this.prisma.socialPost.findUnique({
      where: { id },
      include: POST_INCLUDE,
    });
    return toPostEntity(record);
  }

  async updatePost(id, { caption }) {
    const record = await this.prisma.socialPost.update({
      where: { id },
      data: { caption: caption ?? null },
      include: POST_INCLUDE,
    });
    return toPostEntity(record);
  }

  async deletePost(id) {
    await this.prisma.socialPost.delete({ where: { id } });
  }

  async findFeed({ authorIds, page, pageSize }) {
    // authorIds null ise tüm kullanıcıların akışı; dizi ise (takip filtresi)
    // yalnızca o kullanıcıların gönderileri. Boş dizi -> boş sonuç.
    const where = authorIds ? { userId: { in: authorIds } } : {};
    const records = await this.prisma.socialPost.findMany({
      where,
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return records.map(toPostEntity);
  }

  async findPostsByUser(userId) {
    const records = await this.prisma.socialPost.findMany({
      where: { userId },
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toPostEntity);
  }

  async findLikedPostIds(viewerId, postIds) {
    if (!viewerId || !postIds.length) return [];
    const likes = await this.prisma.postLike.findMany({
      where: { userId: viewerId, postId: { in: postIds } },
      select: { postId: true },
    });
    return likes.map((like) => like.postId);
  }

  // --- Likes ---
  async findLike(postId, userId) {
    return this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
  }

  async addLike(postId, userId) {
    // Aynı kullanıcı aynı gönderiyi yalnızca bir kez beğenebilir (@@unique);
    // eşzamanlı çift istek yarışında da hata fırlatmamak için upsert kullanılır.
    await this.prisma.postLike.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId },
      update: {},
    });
  }

  async removeLike(postId, userId) {
    await this.prisma.postLike.deleteMany({ where: { postId, userId } });
  }

  // --- Comments ---
  async createComment({ postId, userId, content }) {
    const record = await this.prisma.postComment.create({
      data: { postId, userId, content },
      include: { user: { select: USER_SELECT } },
    });
    return toCommentEntity(record);
  }

  async findCommentById(id) {
    const record = await this.prisma.postComment.findUnique({
      where: { id },
      include: { user: { select: USER_SELECT } },
    });
    return toCommentEntity(record);
  }

  async findCommentsByPost(postId) {
    const records = await this.prisma.postComment.findMany({
      where: { postId },
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toCommentEntity);
  }

  async deleteComment(id) {
    await this.prisma.postComment.delete({ where: { id } });
  }

  // --- Follow ---
  async findFollow(followerId, followingId) {
    return this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
  }

  async addFollow(followerId, followingId) {
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
  }

  async removeFollow(followerId, followingId) {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
  }

  async findFollowingIds(userId) {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    return rows.map((row) => row.followingId);
  }

  // --- Profile ---
  async findUserById(userId) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...USER_SELECT, socialProfile: true },
    });
  }

  async findProfileByUserId(userId) {
    return this.prisma.socialProfile.findUnique({ where: { userId } });
  }

  async upsertProfile(userId, { bio }) {
    return this.prisma.socialProfile.upsert({
      where: { userId },
      create: { userId, bio: bio ?? null },
      update: { bio: bio ?? null },
    });
  }

  async getProfileStats(userId) {
    const [postCount, followerCount, followingCount, totalLikes] = await Promise.all([
      this.prisma.socialPost.count({ where: { userId } }),
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
      this.prisma.postLike.count({ where: { post: { userId } } }),
    ]);
    return { postCount, followerCount, followingCount, totalLikes };
  }

  async setBlocked(userId, isBlocked) {
    return this.prisma.socialProfile.upsert({
      where: { userId },
      create: { userId, isBlocked },
      update: { isBlocked },
    });
  }

  // --- Notifications ---
  async createNotification({ userId, actorId, type, postId }) {
    const record = await this.prisma.socialNotification.create({
      data: { userId, actorId, type, postId: postId ?? null },
    });
    return toNotificationEntity(record);
  }

  async findNotificationsByUser(userId) {
    const records = await this.prisma.socialNotification.findMany({
      where: { userId },
      include: { actor: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return records.map(toNotificationEntity);
  }

  async findNotificationById(id) {
    const record = await this.prisma.socialNotification.findUnique({ where: { id } });
    return toNotificationEntity(record);
  }

  async markNotificationRead(id) {
    const record = await this.prisma.socialNotification.update({
      where: { id },
      data: { isRead: true },
      include: { actor: { select: USER_SELECT } },
    });
    return toNotificationEntity(record);
  }

  async countUnreadNotifications(userId) {
    return this.prisma.socialNotification.count({ where: { userId, isRead: false } });
  }
}

module.exports = SocialPrismaRepository;
