/**
 * Composition root (dependency wiring) for the billing module.
 * Prisma detayları burada bağlanır; controller yalnızca decore edilmiş servisi
 * kullanır (metot süreleri loglanır).
 */
const prisma = require('../../../database/prisma.client');
const { decorateService } = require('../../../common/logging/withLogging');
const BillingPrismaRepository = require('./billing.repository');
const BillingService = require('../application/billing.service');
const { paymentProvider } = require('./payments');

const billingRepository = new BillingPrismaRepository(prisma);
const billingService = decorateService(
  new BillingService({ billingRepository, paymentProvider }),
  'BillingService'
);

module.exports = { billingRepository, billingService, paymentProvider };
