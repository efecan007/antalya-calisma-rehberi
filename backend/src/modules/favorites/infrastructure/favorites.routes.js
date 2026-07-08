const { Router } = require('express');
const { listFavorites } = require('./favorites.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');

const router = Router();

router.get('/', requireAuth, listFavorites);

module.exports = router;
