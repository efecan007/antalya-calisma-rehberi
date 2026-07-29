/**
 * Ödeme dönemi/deneme süresi dolmuş abonelikleri periyodik olarak işleyen iş.
 * Deneme bitince ücretli aboneliğe geçirir, aylık yenilemeleri tahsil eder,
 * iptal edilenleri dönem sonunda düşürür ve başarısız ödemeleri (PAST_DUE)
 * yeniden dener. Tüm durum makinesi billing.service.processRenewals içindedir.
 */
const { billingService } = require('../modules/billing/infrastructure/billing.container');
const logger = require('../common/logging/logger');

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // saatte bir

async function runRenewals() {
  try {
    const { processed } = await billingService.processRenewals({ now: new Date() });
    if (processed > 0) {
      logger.info(`Abonelik yenileme: ${processed} kayıt işlendi`);
    }
  } catch (err) {
    logger.error('Abonelik yenileme işi başarısız', err);
  }
}

function startSubscriptionRenewer() {
  runRenewals();
  return setInterval(runRenewals, CHECK_INTERVAL_MS);
}

module.exports = { startSubscriptionRenewer, runRenewals };
