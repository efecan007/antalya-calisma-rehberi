const { Router } = require('express');
const { listPendingPlaces, approvePlace, rejectPlace } = require('./suggestions.controller');
const { requireAuth, requireAdmin } = require('../../../common/guards/auth.guard');

const router = Router();

router.get('/pending', requireAuth, requireAdmin, listPendingPlaces);
router.post('/:id/approve', requireAuth, requireAdmin, approvePlace);
router.post('/:id/reject', requireAuth, requireAdmin, rejectPlace);

module.exports = router;
