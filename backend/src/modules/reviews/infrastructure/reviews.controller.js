const { reviewsService } = require('./reviews.container');
const { extractRatings } = require('./extractRatings');

async function createReview(req, res, next) {
  try {
    const review = await reviewsService.createReview({
      placeId: Number(req.params.id),
      userId: req.user.id,
      ratings: extractRatings(req.body),
      comment: req.body.comment,
    });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

async function listReviews(req, res, next) {
  try {
    const reviews = await reviewsService.listByPlace({ placeId: Number(req.params.id) });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

async function updateReview(req, res, next) {
  try {
    const updated = await reviewsService.updateReview({
      reviewId: Number(req.params.id),
      userId: req.user.id,
      ratings: extractRatings(req.body),
      comment: req.body.comment,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteReview(req, res, next) {
  try {
    await reviewsService.deleteReview({
      reviewId: Number(req.params.id),
      userId: req.user.id,
      requesterRole: req.user.role,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, listReviews, updateReview, deleteReview };
