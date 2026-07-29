/**
 * Billing modülünün veri erişim sözleşmesi. Uygulama (service) katmanı yalnızca
 * bu arayüze bağımlıdır; Prisma detayları infrastructure/billing.repository.js'te kalır.
 * Bu adımda yalnızca okuma metotları kullanılır; ödeme/abonelik oluşturma metotları
 * (ileride ödeme entegrasyonuyla) bu porta eklenecektir.
 */
class BillingRepository {
  async findSubscriptionByUserId(_userId) {
    throw new Error('Not implemented');
  }

  async findTrialUsageByUserId(_userId) {
    throw new Error('Not implemented');
  }

  async findHistoryByUserId(_userId) {
    throw new Error('Not implemented');
  }

  async findLastPaymentAt(_userId) {
    throw new Error('Not implemented');
  }

  async findInvoicesByUserId(_userId) {
    throw new Error('Not implemented');
  }

  async startTrial(_data) {
    throw new Error('Not implemented');
  }

  async upsertSubscription(_userId, _createData, _updateData) {
    throw new Error('Not implemented');
  }

  async updateSubscription(_userId, _data) {
    throw new Error('Not implemented');
  }

  async addHistory(_data) {
    throw new Error('Not implemented');
  }

  async setDefaultPaymentMethod(_userId, _data) {
    throw new Error('Not implemented');
  }

  async findDefaultPaymentMethod(_userId) {
    throw new Error('Not implemented');
  }

  async createInvoice(_data) {
    throw new Error('Not implemented');
  }

  async createPayment(_data) {
    throw new Error('Not implemented');
  }

  async findDueSubscriptions(_now) {
    throw new Error('Not implemented');
  }

  // --- Admin ---
  async countByStatus(_status) {
    throw new Error('Not implemented');
  }

  async countActivePremium(_now) {
    throw new Error('Not implemented');
  }

  async countTrialUsages() {
    throw new Error('Not implemented');
  }

  async sumActiveMrr() {
    throw new Error('Not implemented');
  }

  async countUpcomingRenewals(_from, _to) {
    throw new Error('Not implemented');
  }

  async findPremiumUsers() {
    throw new Error('Not implemented');
  }
}

module.exports = BillingRepository;
