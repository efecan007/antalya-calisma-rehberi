const { Router } = require('express');
const { checkIn, getSummary, getForecast } = require('./occupancy.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');

const router = Router();

router.get('/:placeId/forecast', getForecast);
router.get('/:placeId', getSummary);
router.post('/:placeId', requireAuth, checkIn);

module.exports = router;
