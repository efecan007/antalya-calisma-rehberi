/**
 * Admin'e özel sosyal medya moderasyonu; `/api/admin/social` altında
 * admin.routes.js tarafından mount edilir (üst router zaten requireAuth +
 * requireAdmin uygular; burada da savunma amaçlı tekrar edilir).
 */
const { Router } = require('express');
const { adminDeletePost, adminDeleteComment, blockUser, unblockUser } = require('./social.controller');
const { requireAuth, requireAdmin } = require('../../../common/guards/auth.guard');

const router = Router();

router.delete('/posts/:id', requireAuth, requireAdmin, adminDeletePost);
router.delete('/comments/:id', requireAuth, requireAdmin, adminDeleteComment);
router.patch('/users/:userId/block', requireAuth, requireAdmin, blockUser);
router.patch('/users/:userId/unblock', requireAuth, requireAdmin, unblockUser);

module.exports = router;
