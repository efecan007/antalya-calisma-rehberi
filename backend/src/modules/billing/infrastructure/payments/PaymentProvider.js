/**
 * Ödeme sağlayıcısı soyutlaması. Billing modülünün iş mantığı (service) hiçbir
 * ödeme servisine (Stripe/iyzico/PayTR/Shopier) doğrudan bağlı değildir; yalnızca
 * bu sağlayıcı-bağımsız (provider-agnostic) arayüze bağımlıdır. Yeni bir sağlayıcı
 * eklemek için bu sınıftan türeyen yeni bir implementasyon yazıp payments/index.js
 * fabrikasında seçmek yeterlidir — service/controller katmanı değişmez.
 *
 * GÜVENLİK: Tam kart numarası (PAN) / CVV backend'e HİÇBİR ZAMAN gelmez. Kart,
 * istemci tarafında sağlayıcının SDK'sıyla tokenize edilir; backend yalnızca
 * sağlayıcının döndürdüğü token/referansları ve gösterim için güvenli meta
 * veriyi (brand, last4, expiry) kullanır.
 *
 * Tüm metotlar sağlayıcıdan bağımsız normalize edilmiş şekiller döner, böylece
 * üst katman Stripe'a özgü alan isimlerine bağımlı olmaz.
 */
class PaymentProvider {
  /** Sağlayıcı adı (ör. "stripe"). */
  get name() {
    return 'base';
  }

  /** Sağlayıcı çalışacak şekilde yapılandırılmış mı (gizli anahtar mevcut mu). */
  isConfigured() {
    return false;
  }

  /** Sağlayıcıda bir müşteri kaydı oluşturur. -> { customerId } */
  async createCustomer(_params) {
    throw new Error('Not implemented');
  }

  /**
   * İstemcide tokenize edilmiş bir kartı müşteriye bağlar (PAN backend'e gelmez).
   * -> { providerPaymentMethodId, brand, last4, expMonth, expYear }
   */
  async attachPaymentMethod(_params) {
    throw new Error('Not implemented');
  }

  /**
   * Kayıtlı bir kartı (paymentMethodId) belirtilen tutarla (kuruş) tahsil eder.
   * -> { status: 'succeeded' | 'failed', providerPaymentId, paidAt }
   */
  async charge(_params) {
    throw new Error('Not implemented');
  }

  /**
   * Kart eklemek/doğrulamak için istemci tarafı bir oturum (ör. Stripe SetupIntent)
   * oluşturur. Kart bilgileri backend'e gelmeden istemcide tokenize edilir.
   * -> { clientSecret }
   */
  async createSetupIntent(_params) {
    throw new Error('Not implemented');
  }

  /**
   * Bir ödeme yönteminin yalnızca GÖSTERİLEBİLİR güvenli meta verisini döner
   * (PAN/CVV asla). -> { provider, providerPaymentMethodId, brand, last4, expMonth, expYear }
   */
  async getPaymentMethod(_params) {
    throw new Error('Not implemented');
  }

  /**
   * Abonelik oluşturur (opsiyonel deneme süresiyle).
   * -> { subscriptionId, status, currentPeriodStart, currentPeriodEnd, trialEnd }
   */
  async createSubscription(_params) {
    throw new Error('Not implemented');
  }

  /** Aboneliği (dönem sonunda veya hemen) iptal eder. */
  async cancelSubscription(_params) {
    throw new Error('Not implemented');
  }

  /** İptal talebini geri alır (dönem sonu iptalini kaldırır). */
  async resumeSubscription(_params) {
    throw new Error('Not implemented');
  }

  /**
   * Webhook isteğinin imzasını doğrular ve normalize edilmiş olay döner.
   * Ham gövde (raw body) ve imza başlığı ile çağrılır. -> { id, type, data }
   */
  async verifyWebhook(_params) {
    throw new Error('Not implemented');
  }
}

module.exports = PaymentProvider;
