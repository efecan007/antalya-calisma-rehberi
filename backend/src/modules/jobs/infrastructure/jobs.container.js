/**
 * Composition root (dependency wiring) for the jobs module.
 * Prisma detayları burada bağlanır; controller yalnızca decore edilmiş servisi
 * kullanır (metot süreleri loglanır).
 */
const prisma = require('../../../database/prisma.client');
const { decorateService } = require('../../../common/logging/withLogging');
const JobsPrismaRepository = require('./jobs.repository');
const JobsService = require('../application/jobs.service');

const jobsRepository = new JobsPrismaRepository(prisma);
const jobsService = decorateService(new JobsService({ jobsRepository }), 'JobsService');

module.exports = { jobsRepository, jobsService };
