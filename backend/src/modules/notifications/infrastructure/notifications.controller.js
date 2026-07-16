const { notificationsService } = require('./notifications.container');

async function listNotifications(req, res, next) {
  try {
    const notifications = await notificationsService.listForUser({ userId: req.user.id });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

async function unreadCount(req, res, next) {
  try {
    const result = await notificationsService.unreadCount({ userId: req.user.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await notificationsService.markRead({
      id: Number(req.params.id),
      userId: req.user.id,
    });
    res.json(notification);
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await notificationsService.markAllRead({ userId: req.user.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, unreadCount, markRead, markAllRead };
