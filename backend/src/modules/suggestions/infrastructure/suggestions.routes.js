/**
 * Mekan önerisi gönderme; `/api/suggestions` altında mount edilir.
 * Onay/red/listeleme (admin) suggestions.admin.routes.js'te ayrı yaşar.
 */
const { Router } = require('express');
const { submitSuggestion } = require('./suggestions.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');

const router = Router();

router.post('/', requireAuth, submitSuggestion);

module.exports = router;
