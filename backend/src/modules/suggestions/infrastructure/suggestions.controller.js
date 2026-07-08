const { suggestionsService } = require('./suggestions.container');

async function listPendingPlaces(_req, res, next) {
  try {
    const places = await suggestionsService.listPending();
    res.json(places);
  } catch (err) {
    next(err);
  }
}

async function approvePlace(req, res, next) {
  try {
    const place = await suggestionsService.approve({ id: Number(req.params.id) });
    res.json(place);
  } catch (err) {
    next(err);
  }
}

async function rejectPlace(req, res, next) {
  try {
    const place = await suggestionsService.reject({ id: Number(req.params.id) });
    res.json(place);
  } catch (err) {
    next(err);
  }
}

module.exports = { listPendingPlaces, approvePlace, rejectPlace };
