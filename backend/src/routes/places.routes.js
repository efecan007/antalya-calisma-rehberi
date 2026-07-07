const { Router } = require('express');
const {
  listPlaces,
  getPlace,
  createPlace,
  updatePlace,
  deletePlace,
} = require('../controllers/places.controller');
const { createReview } = require('../controllers/reviews.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/', listPlaces);
router.get('/:id', getPlace);
router.post('/', requireAuth, createPlace);
router.put('/:id', requireAuth, updatePlace);
router.delete('/:id', requireAuth, deletePlace);
router.post('/:id/reviews', requireAuth, createReview);

module.exports = router;
