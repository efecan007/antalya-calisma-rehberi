/**
 * Composition root (dependency wiring) for the social module.
 * Prisma/cache/storage detayları burada bağlanır; controller yalnızca
 * decore edilmiş servisi kullanır (metot süreleri loglanır).
 */
const prisma = require('../../../database/prisma.client');
const cache = require('../../cache/cache.service');
const { decorateService } = require('../../../common/logging/withLogging');
const { storage } = require('../../../common/storage');
const SocialPrismaRepository = require('./social.repository');
const SocialService = require('../application/social.service');

const socialRepository = new SocialPrismaRepository(prisma);
const socialService = decorateService(
  new SocialService({ socialRepository, cache }),
  'SocialService'
);

module.exports = { socialRepository, socialService, storage };
