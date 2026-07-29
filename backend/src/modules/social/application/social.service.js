const { ValidationError, NotFoundError, ForbiddenError } = require('../../../common/errors');
const logger = require('../../../common/logging/logger');
const SocialProfile = require('../domain/SocialProfile');
const {
  FEED_TTL_SECONDS,
  allFeedKey,
  followingFeedKey,
  invalidateFeedCaches,
} = require('../infrastructure/social-cache-keys');

const MAX_CAPTION_LENGTH = 2200;
const MAX_COMMENT_LENGTH = 1000;
const MAX_BIO_LENGTH = 300;
const FEED_PAGE_SIZE = 20;

class SocialService {
  constructor({ socialRepository, cache }) {
    this.socialRepository = socialRepository;
    this.cache = cache;
  }

  // ===================== Yardımcılar =====================

  async _assertNotBlocked(userId) {
    const profile = await this.socialRepository.findProfileByUserId(userId);
    if (profile?.isBlocked) {
      throw new ForbiddenError('Sosyal medya özelliklerini kullanmanız engellendi');
    }
  }

  // Kendini bildirmeyiz; bildirim oluşturmadaki bir hata asıl işlemi (beğeni,
  // yorum, takip) bozmamalı — bu yüzden hatayı yutup logluyoruz.
  async _notify({ recipientId, actorId, type, postId = null }) {
    if (recipientId == null || recipientId === actorId) return;
    try {
      await this.socialRepository.createNotification({ userId: recipientId, actorId, type, postId });
    } catch (err) {
      logger.warn('Sosyal bildirim oluşturulamadı', err.message);
    }
  }

  async _overlayLikeState(posts, viewerId) {
    if (!viewerId || !posts.length) return posts;
    const likedIds = new Set(
      await this.socialRepository.findLikedPostIds(viewerId, posts.map((post) => post.id))
    );
    posts.forEach((post) => {
      post.isLikedByViewer = likedIds.has(post.id);
    });
    return posts;
  }

  _normalizePage(page) {
    const parsed = Number(page);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  }

  // ===================== Gönderiler =====================

  async createPost({ userId, caption, imageUrls }) {
    await this._assertNotBlocked(userId);

    if (!imageUrls?.length) {
      throw new ValidationError('En az bir fotoğraf yüklemelisiniz');
    }
    const trimmedCaption = caption?.trim() || null;
    if (trimmedCaption && trimmedCaption.length > MAX_CAPTION_LENGTH) {
      throw new ValidationError(`Açıklama en fazla ${MAX_CAPTION_LENGTH} karakter olabilir`);
    }

    const post = await this.socialRepository.createPost({ userId, caption: trimmedCaption, imageUrls });
    await invalidateFeedCaches(this.cache);
    return post;
  }

  async getPost({ postId, viewerId }) {
    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new NotFoundError('Gönderi bulunamadı');
    }
    await this._overlayLikeState([post], viewerId);
    return post;
  }

  async updatePost({ postId, userId, caption }) {
    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new NotFoundError('Gönderi bulunamadı');
    }
    if (post.userId !== userId) {
      throw new ForbiddenError('Yalnızca kendi gönderinizi düzenleyebilirsiniz');
    }
    await this._assertNotBlocked(userId);

    const trimmedCaption = caption?.trim() || null;
    if (trimmedCaption && trimmedCaption.length > MAX_CAPTION_LENGTH) {
      throw new ValidationError(`Açıklama en fazla ${MAX_CAPTION_LENGTH} karakter olabilir`);
    }

    const updated = await this.socialRepository.updatePost(postId, { caption: trimmedCaption });
    await invalidateFeedCaches(this.cache);
    await this._overlayLikeState([updated], userId);
    return updated;
  }

  async deletePost({ postId, userId, requesterRole }) {
    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new NotFoundError('Gönderi bulunamadı');
    }
    if (post.userId !== userId && requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Yalnızca kendi gönderinizi silebilirsiniz');
    }
    await this.socialRepository.deletePost(postId);
    await invalidateFeedCaches(this.cache);
  }

  // ===================== Akış (Feed) =====================

  async getFeed({ viewerId, onlyFollowing, page }) {
    const currentPage = this._normalizePage(page);

    let authorIds = null;
    let cacheKey = allFeedKey(currentPage);

    if (onlyFollowing) {
      if (!viewerId) return [];
      authorIds = await this.socialRepository.findFollowingIds(viewerId);
      cacheKey = followingFeedKey(viewerId, currentPage);
    }

    // Cache'lenen gönderiler izleyiciye özel "beğendim mi" bilgisini içermez;
    // o bilgi aşağıda her istekte taze hesaplanır.
    const posts = await this.cache.getOrSet(cacheKey, FEED_TTL_SECONDS, () =>
      this.socialRepository.findFeed({ authorIds, page: currentPage, pageSize: FEED_PAGE_SIZE })
    );

    await this._overlayLikeState(posts, viewerId);
    return posts;
  }

  // ===================== Beğeniler =====================

  async likePost({ postId, userId }) {
    await this._assertNotBlocked(userId);

    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new NotFoundError('Gönderi bulunamadı');
    }

    const existing = await this.socialRepository.findLike(postId, userId);
    await this.socialRepository.addLike(postId, userId);

    if (!existing) {
      await this._notify({ recipientId: post.userId, actorId: userId, type: 'POST_LIKE', postId });
    }
    await invalidateFeedCaches(this.cache);

    const fresh = await this.socialRepository.findPostById(postId);
    return { postId, liked: true, likeCount: fresh.likeCount };
  }

  async unlikePost({ postId, userId }) {
    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new NotFoundError('Gönderi bulunamadı');
    }
    await this.socialRepository.removeLike(postId, userId);
    await invalidateFeedCaches(this.cache);

    const fresh = await this.socialRepository.findPostById(postId);
    return { postId, liked: false, likeCount: fresh.likeCount };
  }

  // ===================== Yorumlar =====================

  async addComment({ postId, userId, content }) {
    await this._assertNotBlocked(userId);

    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new NotFoundError('Gönderi bulunamadı');
    }

    const trimmed = content?.trim();
    if (!trimmed) {
      throw new ValidationError('Yorum boş olamaz');
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      throw new ValidationError(`Yorum en fazla ${MAX_COMMENT_LENGTH} karakter olabilir`);
    }

    const comment = await this.socialRepository.createComment({ postId, userId, content: trimmed });
    await this._notify({ recipientId: post.userId, actorId: userId, type: 'POST_COMMENT', postId });
    await invalidateFeedCaches(this.cache);
    return comment;
  }

  async listComments({ postId }) {
    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new NotFoundError('Gönderi bulunamadı');
    }
    return this.socialRepository.findCommentsByPost(postId);
  }

  async deleteComment({ commentId, userId, requesterRole }) {
    const comment = await this.socialRepository.findCommentById(commentId);
    if (!comment) {
      throw new NotFoundError('Yorum bulunamadı');
    }
    if (comment.userId !== userId && requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Yalnızca kendi yorumunuzu silebilirsiniz');
    }
    await this.socialRepository.deleteComment(commentId);
    await invalidateFeedCaches(this.cache);
  }

  // ===================== Takip =====================

  async followUser({ followerId, targetUserId }) {
    await this._assertNotBlocked(followerId);

    if (followerId === targetUserId) {
      throw new ValidationError('Kendinizi takip edemezsiniz');
    }
    const target = await this.socialRepository.findUserById(targetUserId);
    if (!target) {
      throw new NotFoundError('Kullanıcı bulunamadı');
    }

    const existing = await this.socialRepository.findFollow(followerId, targetUserId);
    await this.socialRepository.addFollow(followerId, targetUserId);

    if (!existing) {
      await this._notify({ recipientId: targetUserId, actorId: followerId, type: 'NEW_FOLLOWER' });
    }
    // Takip eden kişinin "takip edilenler" akışı değişti.
    await this.cache.invalidate(`social:feed:following:${followerId}:*`);
    return { targetUserId, following: true };
  }

  async unfollowUser({ followerId, targetUserId }) {
    await this.socialRepository.removeFollow(followerId, targetUserId);
    await this.cache.invalidate(`social:feed:following:${followerId}:*`);
    return { targetUserId, following: false };
  }

  // ===================== Profil =====================

  async getProfile({ targetUserId, viewerId }) {
    const user = await this.socialRepository.findUserById(targetUserId);
    if (!user) {
      throw new NotFoundError('Kullanıcı bulunamadı');
    }

    const [stats, followRecord, posts] = await Promise.all([
      this.socialRepository.getProfileStats(targetUserId),
      viewerId ? this.socialRepository.findFollow(viewerId, targetUserId) : null,
      this.socialRepository.findPostsByUser(targetUserId),
    ]);
    await this._overlayLikeState(posts, viewerId);

    const profile = new SocialProfile({
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.socialProfile?.bio,
      isBlocked: user.socialProfile?.isBlocked,
      postCount: stats.postCount,
      totalLikes: stats.totalLikes,
      followerCount: stats.followerCount,
      followingCount: stats.followingCount,
      isFollowedByViewer: Boolean(followRecord),
      isSelf: viewerId === targetUserId,
    });

    return { profile, posts };
  }

  async updateMyProfile({ userId, bio }) {
    const trimmed = bio?.trim() || null;
    if (trimmed && trimmed.length > MAX_BIO_LENGTH) {
      throw new ValidationError(`Biyografi en fazla ${MAX_BIO_LENGTH} karakter olabilir`);
    }
    await this.socialRepository.upsertProfile(userId, { bio: trimmed });
    return this.getProfile({ targetUserId: userId, viewerId: userId });
  }

  // ===================== Bildirimler =====================

  async listNotifications({ userId }) {
    return this.socialRepository.findNotificationsByUser(userId);
  }

  async unreadNotificationCount({ userId }) {
    const count = await this.socialRepository.countUnreadNotifications(userId);
    return { count };
  }

  async markNotificationRead({ id, userId }) {
    const notification = await this.socialRepository.findNotificationById(id);
    if (!notification) {
      throw new NotFoundError('Bildirim bulunamadı');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenError('Bu bildirime erişiminiz yok');
    }
    return this.socialRepository.markNotificationRead(id);
  }

  // ===================== Admin =====================

  async adminDeletePost({ postId }) {
    const post = await this.socialRepository.findPostById(postId);
    if (!post) {
      throw new NotFoundError('Gönderi bulunamadı');
    }
    await this.socialRepository.deletePost(postId);
    await invalidateFeedCaches(this.cache);
  }

  async adminDeleteComment({ commentId }) {
    const comment = await this.socialRepository.findCommentById(commentId);
    if (!comment) {
      throw new NotFoundError('Yorum bulunamadı');
    }
    await this.socialRepository.deleteComment(commentId);
    await invalidateFeedCaches(this.cache);
  }

  async setUserBlocked({ userId, isBlocked }) {
    const user = await this.socialRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('Kullanıcı bulunamadı');
    }
    await this.socialRepository.setBlocked(userId, isBlocked);
    return { userId, isBlocked };
  }
}

module.exports = SocialService;
