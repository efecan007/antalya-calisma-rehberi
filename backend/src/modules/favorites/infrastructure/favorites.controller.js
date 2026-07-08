const { favoritesService } = require('./favorites.container');

async function addFavorite(req, res, next) {
  try {
    await favoritesService.addFavorite({ userId: req.user.id, placeId: Number(req.params.id) });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function removeFavorite(req, res, next) {
  try {
    await favoritesService.removeFavorite({ userId: req.user.id, placeId: Number(req.params.id) });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function listFavorites(req, res, next) {
  try {
    const places = await favoritesService.listFavorites({ userId: req.user.id });
    res.json(places);
  } catch (err) {
    next(err);
  }
}

module.exports = { addFavorite, removeFavorite, listFavorites };
