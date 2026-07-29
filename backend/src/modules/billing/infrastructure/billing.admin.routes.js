/**
 * Admin'e özel premium/abonelik yönetimi; `/api/admin/billing` altında
 * admin.routes.js tarafından mount edilir (üst router zaten requireAuth +
 * requireAdmin uygular; burada da savunma amaçlı tekrar edilir).
 */
const { Router } = require('express');
const { adminStats, adminListPremiumUsers, adminCancel } = require('./billing.controller');
const { requireAuth, requireAdmin } = require('../../../common/guards/auth.guard');

const router = Router();

router.get('/stats', requireAuth, requireAdmin, adminStats);
router.get('/users', requireAuth, requireAdmin, adminListPremiumUsers);
router.post('/users/:userId/cancel', requireAuth, requireAdmin, adminCancel);

module.exports = router;
