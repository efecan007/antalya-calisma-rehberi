/**
 * Belirli bir mekana favori ekleme/çıkarma, mekan kaynağının altında yaşadığı için
 * (`POST/DELETE /api/places/:id/favorite`) places.routes.js tarafından mount edilir.
 */
const { Router } = require('express');
const { addFavorite, removeFavorite } = require('./favorites.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');

const router = Router();

router.post('/:id/favorite', requireAuth, addFavorite);
router.delete('/:id/favorite', requireAuth, removeFavorite);

module.exports = router;
