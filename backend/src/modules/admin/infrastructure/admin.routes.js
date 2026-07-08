/**
 * Admin'e özel yorum moderasyonu; `GET /api/reviews` altında yaşadığı için
 * reviews.routes.js tarafından mount edilir.
 */
const { Router } = require('express');
const { listAllReviews } = require('./admin.controller');
const { requireAuth, requireAdmin } = require('../../../common/guards/auth.guard');

const router = Router();

router.get('/', requireAuth, requireAdmin, listAllReviews);

module.exports = router;
