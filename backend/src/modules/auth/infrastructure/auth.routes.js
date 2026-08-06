const { Router } = require('express');
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  me,
  updateAvatar,
  removeAvatar,
  logout,
  firebaseLogin,
  linkedinRedirect,
  linkedinCallback,
} = require('./auth.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');
const { authLimiter } = require('../../../common/guards/rate-limit.guard');
const { avatarUpload } = require('./avatar-upload.middleware');

const router = Router();

router.post('/register', authLimiter, register);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);
router.post('/login', authLimiter, login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.patch('/me/avatar', requireAuth, avatarUpload, updateAvatar);
router.delete('/me/avatar', requireAuth, removeAvatar);
// Google (istemci tarafı Firebase popup) ve LinkedIn (custom token köprüsü) girişleri
// istemcide Firebase'e giriş yaptıktan sonra bu ortak uçta kimlik jetonunu doğrular.
router.post('/firebase', authLimiter, firebaseLogin);
router.get('/linkedin', authLimiter, linkedinRedirect);
router.get('/linkedin/callback', authLimiter, linkedinCallback);

module.exports = router;
