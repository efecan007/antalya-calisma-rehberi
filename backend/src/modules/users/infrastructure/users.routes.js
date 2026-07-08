const { Router } = require('express');
const { register, login, me } = require('./users.controller');
const { requireAuth } = require('../../../shared/infrastructure/http/authMiddleware');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);

module.exports = router;
