const { Router } = require('express');
const { addFavorite, removeFavorite, listFavorites } = require('./favorites.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');

const router = Router();

router.use(requireAuth);

router.get('/', listFavorites);
router.post('/:placeId', addFavorite);
router.delete('/:placeId', removeFavorite);

module.exports = router;
