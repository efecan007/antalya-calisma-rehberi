/**
 * Admin'e özel yorum moderasyonu (şüpheli olarak raporlanan yorumlar);
 * `/api/admin/comments` altında admin.routes.js tarafından mount edilir.
 */
const { Router } = require('express');
const { listReportedComments, dismissReports } = require('./comments.controller');
const { requireAuth, requireAdmin } = require('../../../common/guards/auth.guard');

const router = Router();

router.get('/reports', requireAuth, requireAdmin, listReportedComments);
router.patch('/:id/dismiss-reports', requireAuth, requireAdmin, dismissReports);

module.exports = router;
