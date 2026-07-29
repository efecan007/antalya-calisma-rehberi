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
const { requireAuth, optionalAuth } = require('../../../common/guards/auth.guard');
const { postImagesUpload } = require('./social-upload.middleware');

const router = Router();

// --- Bildirimler --- (parametrik /posts/:id ile çakışmaması için üstte)
router.get('/notifications', requireAuth, listNotifications);
router.get('/notifications/unread-count', requireAuth, unreadNotificationCount);
router.patch('/notifications/:id/read', requireAuth, markNotificationRead);

// --- Profil ve takip ---
router.patch('/profile', requireAuth, updateMyProfile);
router.get('/profile/:userId', optionalAuth, getProfile);
router.post('/follow/:userId', requireAuth, followUser);
router.delete('/follow/:userId', requireAuth, unfollowUser);

// --- Akış ---
router.get('/feed', optionalAuth, getFeed);

// --- Yorumlar ---
router.get('/posts/:id/comments', listComments);
router.post('/posts/:id/comments', requireAuth, addComment);
router.delete('/comments/:id', requireAuth, deleteComment);

// --- Beğeni ---
router.post('/posts/:id/like', requireAuth, likePost);
router.delete('/posts/:id/like', requireAuth, unlikePost);

// --- Gönderiler ---
router.post('/posts', requireAuth, postImagesUpload, createPost);
router.get('/posts/:id', optionalAuth, getPost);
router.patch('/posts/:id', requireAuth, updatePost);
router.delete('/posts/:id', requireAuth, deletePost);

module.exports = router;
