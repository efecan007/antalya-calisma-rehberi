const { Router } = require('express');
const {
  listPlaces,
  getPlace,
  createPlace,
  updatePlace,
  deletePlace,
} = require('./places.controller');
const { requireAuth, requireAdmin, optionalAuth } = require('../../../common/guards/auth.guard');
const suggestionsRoutes = require('../../suggestions/infrastructure/suggestions.routes');
const favoritesPlaceActionsRoutes = require('../../favorites/infrastructure/favorites.place-actions.routes');
const { createReview } = require('../../reviews/infrastructure/reviews.controller');

const router = Router();

// Suggestion (bekleyen mekan) yönetimi /pending, /:id/approve, /:id/reject altında
// suggestions modülüne ait; :id genel route'undan önce mount edilmeli.
router.use('/', suggestionsRoutes);
router.use('/', favoritesPlaceActionsRoutes);

router.get('/', listPlaces);
router.get('/:id', optionalAuth, getPlace);
router.post('/', requireAuth, createPlace);
router.put('/:id', requireAuth, requireAdmin, updatePlace);
router.delete('/:id', requireAuth, requireAdmin, deletePlace);
router.post('/:id/reviews', requireAuth, createReview);

module.exports = router;
