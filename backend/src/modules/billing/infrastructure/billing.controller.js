const { billingService } = require('./billing.container');
const { paymentProvider } = require('./payments');
const logger = require('../../../common/logging/logger');

async function getStatus(req, res, next) {
  try {
    const status = await billingService.getStatus({ userId: req.user.id });
    res.json(status);
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const history = await billingService.getHistory({ userId: req.user.id });
    res.json(history);
  } catch (err) {
    next(err);
  }
}

async function getInvoices(req, res, next) {
  try {
    const invoices = await billingService.getInvoices({ userId: req.user.id });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
}

async function startTrial(req, res, next) {
  try {
    const status = await billingService.startTrial({ userId: req.user.id });
    res.status(201).json(status);
  } catch (err) {
    next(err);
  }
}

async function subscribe(req, res, next) {
  try {
    const status = await billingService.subscribe({
      userId: req.user.id,
      paymentToken: req.body.paymentToken,
    });
    res.status(201).json(status);
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const status = await billingService.cancel({ userId: req.user.id });
    res.json(status);
  } catch (err) {
    next(err);
  }
}

async function resume(req, res, next) {
  try {
    const status = await billingService.resume({ userId: req.user.id });
    res.json(status);
  } catch (err) {
    next(err);
  }
}

async function updatePaymentMethod(req, res, next) {
  try {
    const card = await billingService.updatePaymentMethod({
      userId: req.user.id,
      paymentToken: req.body.paymentToken,
    });
    res.json(card);
  } catch (err) {
    next(err);
  }
}

/**
 * Ödeme sağlayıcısı webhook'u. İmza doğrulaması ham gövde (raw body) ile yapılır
 * (app.js'te bu yola özel express.raw uygulanır). Sağlayıcı henüz yapılandırılmamışsa
 * altyapı hazır ama pasiftir; sağlayıcının tekrar denememesi için 200 ile onaylanır.
 * Olayların iş mantığına yansıtılması (abonelik durum güncellemesi) sonraki adımda eklenecektir.
 */
async function handleWebhook(req, res) {
  const signature = req.headers['stripe-signature'];

  if (!paymentProvider.isConfigured() || !paymentProvider.webhookSecret) {
    logger.warn('Billing webhook alındı ama ödeme sağlayıcısı yapılandırılmamış');
    return res.status(200).json({ received: true, configured: false });
  }

  let event;
  try {
    event = await paymentProvider.verifyWebhook({ payload: req.body, signature });
  } catch (err) {
    logger.warn('Billing webhook imza doğrulaması başarısız', err.message);
    return res.status(400).json({ message: 'Geçersiz webhook imzası' });
  }

  // Olay işleme (invoice.paid -> ACTIVE, invoice.payment_failed -> PAST_DUE, ...)
  // sonraki adımda eklenecektir.
  logger.info(`Billing webhook alındı: ${event.type}`);
  res.status(200).json({ received: true });
}

// ===================== Admin =====================

async function adminStats(_req, res, next) {
  try {
    const stats = await billingService.getAdminStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

async function adminListPremiumUsers(_req, res, next) {
  try {
    const users = await billingService.listPremiumUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function adminCancel(req, res, next) {
  try {
    const status = await billingService.adminCancel({ userId: Number(req.params.userId) });
    res.json(status);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStatus,
  getHistory,
  getInvoices,
  startTrial,
  subscribe,
  cancel,
  resume,
  updatePaymentMethod,
  handleWebhook,
  adminStats,
  adminListPremiumUsers,
  adminCancel,
};
