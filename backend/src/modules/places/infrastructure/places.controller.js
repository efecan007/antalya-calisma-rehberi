const Region = require('../domain/Region');
const { placesService } = require('./places.container');

function parseLimit(value, fallback) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) return fallback;
  return Math.min(num, 50);
}

async function listPlaces(req, res, next) {
  try {
    const places = await placesService.listPlaces(req.query);
    res.json(places);
  } catch (err) {
    next(err);
  }
}

async function popularPlaces(req, res, next) {
  try {
    const places = await placesService.getPopularPlaces({ limit: parseLimit(req.query.limit, 10) });
    res.json(places);
  } catch (err) {
    next(err);
  }
}

async function topRatedPlaces(req, res, next) {
  try {
    const places = await placesService.getTopRatedPlaces({ limit: parseLimit(req.query.limit, 10) });
    res.json(places);
  } catch (err) {
    next(err);
  }
}

async function recommendations(req, res, next) {
  try {
    const places = await placesService.getRecommendations({ limit: parseLimit(req.query.limit, 6) });
    res.json(places);
  } catch (err) {
    next(err);
  }
}

async function getPlace(req, res, next) {
  try {
    const place = await placesService.getPlace({
      id: Number(req.params.id),
      requesterId: req.user?.id,
      requesterRole: req.user?.role,
    });
    res.json(place);
  } catch (err) {
    next(err);
  }
}

async function createPlace(req, res, next) {
  try {
    const place = await placesService.createPlace({
      ...req.body,
      createdById: req.user.id,
      requesterRole: req.user.role,
    });
    res.status(201).json(place);
  } catch (err) {
    next(err);
  }
}

async function updatePlace(req, res, next) {
  try {
    const place = await placesService.updatePlace({
      id: Number(req.params.id),
      requesterRole: req.user.role,
      changes: req.body,
    });
    res.json(place);
  } catch (err) {
    next(err);
  }
}

async function deletePlace(req, res, next) {
  try {
    await placesService.deletePlace({
      id: Number(req.params.id),
      requesterRole: req.user.role,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

function listRegions(_req, res) {
  res.json(Region.VALUES);
}

module.exports = {
  listPlaces,
  popularPlaces,
  topRatedPlaces,
  recommendations,
  getPlace,
  createPlace,
  updatePlace,
  deletePlace,
  listRegions,
};
