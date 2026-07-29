const PaymentProvider = require('./PaymentProvider');

/**
 * Geliştirme/test amaçlı ödeme sağlayıcısı. Gerçek bir ödeme servisine bağlanmaz;
 * çağrıları bellek içinde simüle eder. Gerçek Stripe anahtarları olmadan abonelik
 * yaşam döngüsünün (subscribe → yenileme → iptal → tekrar başlat → past_due →
 * expired) uçtan uca çalıştırılıp doğrulanabilmesini sağlar.
 *
 * ÜRETİMDE KULLANILMAMALIDIR. Yalnızca PAYMENT_PROVIDER=manual ile açıkça
 * seçildiğinde devreye girer; varsayılan sağlayıcı Stripe'tır.
 *
 * Test kolaylığı: tokenize edilmiş kart "0002" ile bitiyorsa (Stripe'ın red test
 * kartı kuralına benzer) tahsilat BAŞARISIZ döner — böylece PAST_DUE akışı test edilebilir.
 */
class ManualPaymentProvider extends PaymentProvider {
  get name() {
    return 'manual';
  }

  isConfigured() {
    return true;
  }

  async createCustomer({ userId }) {
    return { customerId: `manual_cus_${userId}_${Date.now()}` };
  }

  async createSetupIntent({ customerId }) {
    return { clientSecret: `manual_seti_${customerId}_secret` };
  }

  // token biçimi: "tok_<brand>_<last4>" (istemci tarafı simüle tokenizasyon).
  _parseToken(token) {
    const parts = String(token || '').split('_');
    return {
      brand: parts[1] || 'visa',
      last4: parts[2] || '4242',
    };
  }

  async attachPaymentMethod({ token }) {
    const { brand, last4 } = this._parseToken(token);
    return {
      providerPaymentMethodId: `manual_pm_${last4}_${Date.now()}`,
      brand,
      last4,
      expMonth: 12,
      expYear: new Date().getFullYear() + 3,
    };
  }

  async getPaymentMethod({ paymentMethodId }) {
    const last4 = String(paymentMethodId || '').split('_')[2] || '4242';
    return {
      provider: this.name,
      providerPaymentMethodId: paymentMethodId,
      brand: 'visa',
      last4,
      expMonth: 12,
      expYear: new Date().getFullYear() + 3,
    };
  }

  async charge({ paymentMethodId }) {
    // Kart "0002" ile bitiyorsa reddi simüle et.
    const declined = String(paymentMethodId || '').includes('_0002_');
    return {
      status: declined ? 'failed' : 'succeeded',
      providerPaymentId: `manual_pi_${Date.now()}`,
      paidAt: declined ? null : new Date(),
    };
  }

  async cancelSubscription({ subscriptionId, cancelAtPeriodEnd = true }) {
    return { subscriptionId, status: 'canceled', cancelAtPeriodEnd };
  }

  async resumeSubscription({ subscriptionId }) {
    return { subscriptionId, status: 'active', cancelAtPeriodEnd: false };
  }

  async verifyWebhook({ payload }) {
    // Manuel modda imza yoktur; gövde JSON ise doğrudan olay olarak kabul edilir.
    const event = typeof payload === 'string' ? JSON.parse(payload) : payload;
    return { id: event?.id ?? `manual_evt_${Date.now()}`, type: event?.type ?? 'unknown', data: event?.data ?? null };
  }
}

module.exports = ManualPaymentProvider;
