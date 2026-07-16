/**
 * Composition root (dependency wiring) for the notifications module.
 * Diğer modüller (places, comments, chat, suggestions, jobs) kullanıcıya
 * bildirim göndermek istediğinde bu container üzerinden erişir; hiçbir
 * modüle bağımlı olmadığı için döngüsel import riski yaratmaz.
 */
const prisma = require('../../../database/prisma.client');
const NotificationsRepository = require('./notifications.repository');
const NotificationsService = require('../application/notifications.service');

const notificationRepository = new NotificationsRepository(prisma);
const notificationsService = new NotificationsService({ notificationRepository });

module.exports = { notificationRepository, notificationsService };
