/**
 * Mesaj gönderme/listeleme /api/places/:id/messages altında yaşar
 * (places.routes.js). Burası sadece tekil mesaj işlemleri içindir: silme
 * (yazar ya da admin) ve admin moderasyon listesi — reviews.routes.js'teki
 * aynı ayrımın (create places altında, update/delete/admin-list burada) eşi.
 */
const { Router } = require('express');
const { deleteMessage, listAllMessages } = require('./chat.controller');
const { requireAuth, requireAdmin } = require('../../../common/guards/auth.guard');

const router = Router();

router.get('/', requireAuth, requireAdmin, listAllMessages);
router.delete('/:id', requireAuth, deleteMessage);

module.exports = router;
