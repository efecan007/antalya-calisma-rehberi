const { Router } = require('express');
const { updateReview, deleteReview } = require('../controllers/reviews.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.put('/:id', requireAuth, updateReview);
router.delete('/:id', requireAuth, deleteReview);

module.exports = router;
