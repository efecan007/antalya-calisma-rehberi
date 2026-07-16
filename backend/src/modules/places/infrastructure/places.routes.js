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
const { sendMessage, listMessages } = require('../../chat/infrastructure/chat.controller');
const { createComment, listComments } = require('../../comments/infrastructure/comments.controller');
const { commentPhotoUpload } = require('../../comments/infrastructure/upload.middleware');

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
router.post('/:id/messages', requireAuth, sendMessage);
router.get('/:id/messages', requireAuth, listMessages);
router.post('/:id/comments', requireAuth, commentPhotoUpload, createComment);
router.get('/:id/comments', optionalAuth, listComments);

module.exports = router;
