const { Router } = require('express');
const { register, login, me } = require('./auth.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);

module.exports = router;
