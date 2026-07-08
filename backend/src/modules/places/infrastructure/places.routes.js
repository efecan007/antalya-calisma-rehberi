const { Router } = require('express');
const {
  listPlaces,
  getPlace,
  createPlace,
  updatePlace,
  deletePlace,
  createReview,
  listPendingPlaces,
  approvePlace,
  rejectPlace,
  addFavorite,
  removeFavorite,
} = require('./places.controller');
const { requireAuth, requireAdmin, optionalAuth } = require('../../../shared/infrastructure/http/authMiddleware');

const router = Router();

router.get('/pending', requireAuth, requireAdmin, listPendingPlaces);
router.get('/', listPlaces);
router.get('/:id', optionalAuth, getPlace);
router.post('/', requireAuth, createPlace);
router.put('/:id', requireAuth, requireAdmin, updatePlace);
router.delete('/:id', requireAuth, requireAdmin, deletePlace);
router.post('/:id/approve', requireAuth, requireAdmin, approvePlace);
router.post('/:id/reject', requireAuth, requireAdmin, rejectPlace);
router.post('/:id/reviews', requireAuth, createReview);
router.post('/:id/favorite', requireAuth, addFavorite);
router.delete('/:id/favorite', requireAuth, removeFavorite);

module.exports = router;
