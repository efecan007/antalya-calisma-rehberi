const { occupancyService } = require('./occupancy.container');

async function checkIn(req, res, next) {
  try {
    const summary = await occupancyService.checkIn({
      userId: req.user.id,
      placeId: Number(req.params.placeId),
      level: req.body.level,
    });
    res.status(201).json(summary);
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const summary = await occupancyService.getSummary({ placeId: Number(req.params.placeId) });
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

async function getForecast(req, res, next) {
  try {
    const forecast = await occupancyService.getForecast({ placeId: Number(req.params.placeId) });
    res.json(forecast);
  } catch (err) {
    next(err);
  }
}

module.exports = { checkIn, getSummary, getForecast };
