const { Router } = require('express');
const {
  register,
  login,
  me,
  logout,
  linkedinRedirect,
  linkedinCallback,
  googleRedirect,
  googleCallback,
} = require('./auth.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');
const { authLimiter } = require('../../../common/guards/rate-limit.guard');

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.get('/linkedin', authLimiter, linkedinRedirect);
router.get('/linkedin/callback', authLimiter, linkedinCallback);
router.get('/google', authLimiter, googleRedirect);
router.get('/google/callback', authLimiter, googleCallback);

module.exports = router;
