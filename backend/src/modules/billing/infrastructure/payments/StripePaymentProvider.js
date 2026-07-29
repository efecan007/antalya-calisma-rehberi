const PaymentProvider = require('./PaymentProvider');

// Stripe unix saniye (epoch) döner; Date'e çevirir.
function toDate(epochSeconds) {
  return epochSeconds ? new Date(epochSeconds * 1000) : null;
}

/**
 * Stripe ödeme sağlayıcısı implementasyonu.
 *
 * `stripe` SDK'sı ve gizli anahtarlar yalnızca gerçekten çağrıldığında (lazy)
 * yüklenir; böylece anahtar tanımlı değilken uygulama sorunsuz çalışmaya devam
 * eder (ödeme altyapısı hazır ama pasif). Aktifleştirmek için:
 *   1) `npm install stripe`
 *   2) STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID ortam değişkenleri
 */
class StripePaymentProvider extends PaymentProvider {
  constructor({ secretKey, webhookSecret, priceId } = {}) {
    super();
    this.secretKey = secretKey || null;
    this.webhookSecret = webhookSecret || null;
    this.priceId = priceId || null;
    this._client = null;
  }

  get name() {
    return 'stripe';
  }

  isConfigured() {
    return Boolean(this.secretKey);
  }

  _getClient() {
    if (!this.isConfigured()) {
      throw new Error('Stripe yapılandırılmamış (STRIPE_SECRET_KEY eksik)');
    }
    if (!this._client) {
      let Stripe;
      try {
        // eslint-disable-next-line global-require
        Stripe = require('stripe');
      } catch {
        throw new Error('Stripe SDK yüklü değil. Aktifleştirmek için: npm install stripe');
      }
      this._client = new Stripe(this.secretKey);
    }
    return this._client;
  }

  async createCustomer({ email, name, userId }) {
    const customer = await this._getClient().customers.create({
      email,
      name,
      metadata: { userId: String(userId) },
    });
    return { customerId: customer.id };
  }

  async createSetupIntent({ customerId }) {
    const setupIntent = await this._getClient().setupIntents.create({ customer: customerId });
    return { clientSecret: setupIntent.client_secret };
  }

  async attachPaymentMethod({ customerId, token }) {
    const client = this._getClient();
    // İstemcide tokenize edilmiş kart (pm_...) müşteriye bağlanır ve varsayılan yapılır.
    const pm = await client.paymentMethods.attach(token, { customer: customerId });
    await client.customers.update(customerId, {
      invoice_settings: { default_payment_method: pm.id },
    });
    const card = pm.card || {};
    return {
      providerPaymentMethodId: pm.id,
      brand: card.brand ?? null,
      last4: card.last4 ?? null,
      expMonth: card.exp_month ?? null,
      expYear: card.exp_year ?? null,
    };
  }

  async charge({ customerId, paymentMethodId, amount, currency, description }) {
    const intent = await this._getClient().paymentIntents.create({
      customer: customerId,
      payment_method: paymentMethodId,
      amount,
      currency: (currency || 'TRY').toLowerCase(),
      description,
      confirm: true,
      off_session: true,
    });
    const succeeded = intent.status === 'succeeded';
    return {
      status: succeeded ? 'succeeded' : 'failed',
      providerPaymentId: intent.id,
      paidAt: succeeded ? new Date() : null,
    };
  }

  async getPaymentMethod({ paymentMethodId }) {
    const pm = await this._getClient().paymentMethods.retrieve(paymentMethodId);
    const card = pm.card || {};
    return {
      provider: this.name,
      providerPaymentMethodId: pm.id,
      brand: card.brand ?? null,
      last4: card.last4 ?? null,
      expMonth: card.exp_month ?? null,
      expYear: card.exp_year ?? null,
    };
  }

  async createSubscription({ customerId, paymentMethodId, trialPeriodDays }) {
    const subscription = await this._getClient().subscriptions.create({
      customer: customerId,
      items: [{ price: this.priceId }],
      default_payment_method: paymentMethodId,
      trial_period_days: trialPeriodDays || undefined,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: toDate(subscription.current_period_start),
      currentPeriodEnd: toDate(subscription.current_period_end),
      trialEnd: toDate(subscription.trial_end),
    };
  }

  async cancelSubscription({ subscriptionId, cancelAtPeriodEnd = true }) {
    const subscription = await this._getClient().subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }

  async resumeSubscription({ subscriptionId }) {
    const subscription = await this._getClient().subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }

  async verifyWebhook({ payload, signature }) {
    if (!this.webhookSecret) {
      throw new Error('Stripe webhook secret yapılandırılmamış (STRIPE_WEBHOOK_SECRET eksik)');
    }
    // constructEvent, imza ham gövdeyle eşleşmezse hata fırlatır -> sahte istekler reddedilir.
    const event = this._getClient().webhooks.constructEvent(payload, signature, this.webhookSecret);
    return { id: event.id, type: event.type, data: event.data?.object ?? null };
  }
}

module.exports = StripePaymentProvider;
