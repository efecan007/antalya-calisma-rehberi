/**
 * Bir kullanıcının sosyal profili: temel kullanıcı bilgisi + biyografi +
 * türetilmiş istatistikler (gönderi sayısı, toplam beğeni, takipçi/takip sayısı).
 * İstatistikler ayrı sütunlarda saklanmaz; okuma anında sayımlarla hesaplanır,
 * böylece beğeni/takip değiştiğinde senkron tutulacak sayaç alanı olmaz.
 */
class SocialProfile {
  constructor({
    userId,
    name,
    avatarUrl,
    bio,
    isBlocked,
    postCount,
    totalLikes,
    followerCount,
    followingCount,
    isFollowedByViewer,
    isSelf,
  }) {
    this.userId = userId;
    this.name = name;
    this.avatarUrl = avatarUrl ?? null;
    this.bio = bio ?? null;
    this.isBlocked = isBlocked ?? false;
    this.postCount = postCount ?? 0;
    this.totalLikes = totalLikes ?? 0;
    this.followerCount = followerCount ?? 0;
    this.followingCount = followingCount ?? 0;
    this.isFollowedByViewer = isFollowedByViewer ?? false;
    this.isSelf = isSelf ?? false;
  }
}

module.exports = SocialProfile;
