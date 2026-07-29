const { Router } = require('express');
const {
  getStatus,
  getHistory,
  getInvoices,
  startTrial,
  subscribe,
  cancel,
  resume,
  updatePaymentMethod,
  handleWebhook,
} = require('./billing.controller');
const { requireAuth } = require('../../../common/guards/auth.guard');

const router = Router();

// --- Okuma ---
router.get('/status', requireAuth, getStatus);
router.get('/history', requireAuth, getHistory);
router.get('/invoices', requireAuth, getInvoices);

// --- Yaşam döngüsü ---
// 15 günlük ücretsiz deneme (ödeme alınmadan). Tek kullanımlık.
router.post('/start-trial', requireAuth, startTrial);
// Gerçek abonelik (25 TL/ay). Kart yalnızca token olarak gelir; PAN backend'e gelmez.
// /subscribe ve /create-subscription aynı işlemi yapar (istemci uyumluluğu için ikisi de sunulur).
router.post('/subscribe', requireAuth, subscribe);
router.post('/create-subscription', requireAuth, subscribe);
router.post('/cancel', requireAuth, cancel);
router.post('/resume', requireAuth, resume);
router.patch('/payment-method', requireAuth, updatePaymentMethod);

// --- Webhook ---
// Ödeme sağlayıcısı webhook'u — JWT değil, imza ile doğrulanır (ham gövde app.js'te ayarlanır).
router.post('/webhook', handleWebhook);

module.exports = router;
