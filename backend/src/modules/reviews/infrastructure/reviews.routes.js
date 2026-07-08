const { Router } = require('express');
const { requireAuth } = require('../../../shared/infrastructure/http/authMiddleware');
const { updateReviewUseCase, deleteReviewUseCase } = require('./reviewsContainer');
const { extractRatings } = require('./extractRatings');

const router = Router();

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const updated = await updateReviewUseCase.execute({
      reviewId: Number(req.params.id),
      userId: req.user.id,
      ratings: extractRatings(req.body),
      comment: req.body.comment,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await deleteReviewUseCase.execute({ reviewId: Number(req.params.id), userId: req.user.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
