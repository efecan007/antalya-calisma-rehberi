const { Router } = require('express');
const { listNotifications, unreadCount, markRead, markAllRead } = require('./notifications.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');

const router = Router();

router.use(requireAuth);

router.get('/', listNotifications);
router.get('/unread-count', unreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
