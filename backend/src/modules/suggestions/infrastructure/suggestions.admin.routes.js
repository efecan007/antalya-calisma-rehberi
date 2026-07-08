/**
 * Admin'e özel öneri incelemesi; `/api/admin/suggestions` altında admin.routes.js
 * tarafından mount edilir.
 */
const { Router } = require('express');
const { listPendingPlaces, approvePlace, rejectPlace } = require('./suggestions.controller');
const { requireAuth, requireAdmin } = require('../../../common/guards/auth.guard');

const router = Router();

router.get('/', requireAuth, requireAdmin, listPendingPlaces);
router.patch('/:id/approve', requireAuth, requireAdmin, approvePlace);
router.patch('/:id/reject', requireAuth, requireAdmin, rejectPlace);

module.exports = router;
