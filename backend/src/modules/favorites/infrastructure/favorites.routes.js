const { Router } = require('express');
const { requireAuth } = require('../../../shared/infrastructure/http/authMiddleware');
const { addFavoriteUseCase, removeFavoriteUseCase, listFavoritesUseCase } = require('./favoritesContainer');

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const places = await listFavoritesUseCase.execute({ userId: req.user.id });
    res.json(places);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
