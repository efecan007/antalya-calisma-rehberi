const { Router } = require('express');
const { register, login, me, logout } = require('./auth.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

module.exports = router;
