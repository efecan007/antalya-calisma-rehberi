/**
 * Composition root (dependency wiring) for the comments module.
 * Diğer modüller (places, admin) comments'in repository/service'ine
 * ihtiyaç duyduğunda bu container üzerinden erişir; Prisma/cache detaylarını bilmesi gerekmez.
 */
const prisma = require('../../../database/prisma.client');
const cache = require('../../cache/cache.service');
const { placeRepository } = require('../../places/infrastructure/places.container');
const CommentsRepository = require('./comments.repository');
const CommentsService = require('../application/comments.service');

const commentRepository = new CommentsRepository(prisma);
const commentsService = new CommentsService({ commentRepository, placeRepository, cache });

module.exports = { commentRepository, commentsService };
