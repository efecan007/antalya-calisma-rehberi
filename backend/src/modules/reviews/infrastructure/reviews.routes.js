const { Router } = require('express');
const { updateReview, deleteReview } = require('./reviews.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');
const adminReviewsRoutes = require('../../admin/infrastructure/admin.routes');

const router = Router();

router.use('/', adminReviewsRoutes);

router.put('/:id', requireAuth, updateReview);
router.delete('/:id', requireAuth, deleteReview);

module.exports = router;
