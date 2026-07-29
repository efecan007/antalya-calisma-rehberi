const StripePaymentProvider = require('./StripePaymentProvider');
const ManualPaymentProvider = require('./ManualPaymentProvider');

/**
 * Aktif ödeme sağlayıcısını ortam değişkenine göre seçer. Varsayılan Stripe'tır;
 * "manual" yalnızca geliştirme/test içindir (gerçek Stripe olmadan yaşam döngüsünü
 * çalıştırmak için). iyzico / PayTR / Shopier eklemek için ilgili PaymentProvider
 * implementasyonunu yazıp buraya yeni bir case eklemek yeterlidir — üst katman değişmez.
 */
function createPaymentProvider() {
  const driver = process.env.PAYMENT_PROVIDER || 'stripe';

  switch (driver) {
    case 'manual':
      return new ManualPaymentProvider();
    // case 'iyzico': return new IyzicoPaymentProvider({ ... });
    // case 'paytr':  return new PayTRPaymentProvider({ ... });
    // case 'shopier': return new ShopierPaymentProvider({ ... });
    case 'stripe':
    default:
      return new StripePaymentProvider({
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        priceId: process.env.STRIPE_PRICE_ID,
      });
  }
}

module.exports = { paymentProvider: createPaymentProvider(), createPaymentProvider };
