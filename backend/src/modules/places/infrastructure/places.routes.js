const { Router } = require('express');
const {
  listPlaces,
  popularPlaces,
  topRatedPlaces,
  recommendations,
  getPlace,
  createPlace,
  updatePlace,
  deletePlace,
} = require('./places.controller');
const { requireAuth, requireAdmin, optionalAuth } = require('../../../common/guards/auth.guard');
const { createReview, listReviews } = require('../../reviews/infrastructure/reviews.controller');

const router = Router();

// Sabit path'ler (/popular, /top-rated, /recommendations) `/:id` route'undan
// önce tanımlanmalı, aksi halde Express bunları :id parametresi sanır.
router.get('/popular', popularPlaces);
router.get('/top-rated', topRatedPlaces);
router.get('/recommendations', recommendations);

router.get('/', listPlaces);
router.get('/:id', optionalAuth, getPlace);
router.post('/', requireAuth, requireAdmin, createPlace);
router.patch('/:id', requireAuth, requireAdmin, updatePlace);
router.delete('/:id', requireAuth, requireAdmin, deletePlace);
router.post('/:id/reviews', requireAuth, createReview);
router.get('/:id/reviews', listReviews);

module.exports = router;
