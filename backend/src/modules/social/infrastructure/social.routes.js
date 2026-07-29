const { Router } = require('express');
const {
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  listComments,
  addComment,
  deleteComment,
  followUser,
  unfollowUser,
  getProfile,
  updateMyProfile,
  listNotifications,
  unreadNotificationCount,
  markNotificationRead,
} = require('./social.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');
const { requirePremium } = require('../../billing/infrastructure/premium.guard');
const { postImagesUpload } = require('./social-upload.middleware');

const router = Router();

// Sosyal medya bölümünün tamamı yalnızca aktif RemoteRehber Pro üyeleri içindir:
// feed, paylaşım, beğeni, yorum, takip ve bildirimler premium olmayanlara kapalıdır.
// Bu router'a gelen HER istek önce requireAuth + requirePremium'dan geçer; bu yüzden
// aşağıdaki route'larda ayrıca auth guard tekrarlanmaz. Premium değilse istemci /pro
// sayfasına yönlendirilir (premiumRequired: true). (Admin sosyal moderasyon route'ları
// /api/admin/social altında ayrıdır ve bu gating'den etkilenmez.)
router.use(requireAuth, requirePremium);

// --- Bildirimler --- (parametrik /posts/:id ile çakışmaması için üstte)
router.get('/notifications', listNotifications);
router.get('/notifications/unread-count', unreadNotificationCount);
router.patch('/notifications/:id/read', markNotificationRead);

// --- Profil ve takip ---
router.patch('/profile', updateMyProfile);
router.get('/profile/:userId', getProfile);
router.post('/follow/:userId', followUser);
router.delete('/follow/:userId', unfollowUser);

// --- Akış ---
router.get('/feed', getFeed);

// --- Yorumlar ---
router.get('/posts/:id/comments', listComments);
router.post('/posts/:id/comments', addComment);
router.delete('/comments/:id', deleteComment);

// --- Beğeni ---
router.post('/posts/:id/like', likePost);
router.delete('/posts/:id/like', unlikePost);

// --- Gönderiler ---
router.post('/posts', postImagesUpload, createPost);
router.get('/posts/:id', getPost);
router.patch('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

module.exports = router;
