const { ConflictError, ValidationError } = require('../../../common/errors');
const logger = require('../../../common/logging/logger');
const Subscription = require('../domain/Subscription');
const {
  SubscriptionStatus,
  PLAN_NAME,
  MONTHLY_PRICE_AMOUNT,
  CURRENCY,
  TRIAL_DAYS,
  hasPremiumAccess,
} = require('../domain/subscription-status');

const DAY_MS = 24 * 60 * 60 * 1000;
// Ödeme başarısız olduğunda (PAST_DUE) aboneliğin tamamen sona ermeden (EXPIRED)
// önce yeniden denenmeye devam edeceği ek süre.
const PAST_DUE_GRACE_DAYS = 3;

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Premium/Billing iş kuralları: durum okuma, ücretsiz deneme, gerçek abonelik
 * yaşam döngüsü (abone ol, iptal, tekrar başlat, kart güncelle) ve otomatik
 * aylık yenileme. Ödeme işlemleri sağlayıcı-bağımsız PaymentProvider arayüzü
 * üzerinden yapılır; bu servis hiçbir ödeme SDK'sına doğrudan bağlı değildir.
 */
class BillingService {
  constructor({ billingRepository, paymentProvider }) {
    this.billingRepository = billingRepository;
    this.paymentProvider = paymentProvider;
  }

  /**
   * Kullanıcının abonelik durumunu döner. Hiç kaydı yoksa varsayılan FREE
   * durumu üretilir (tüm kullanıcılar için satır açmaya gerek kalmaz). Denemenin
   * daha önce kullanılıp kullanılmadığı TrialUsage tablosundan okunur.
   */
  async getStatus({ userId }) {
    const [record, trialUsage, lastPaymentAt] = await Promise.all([
      this.billingRepository.findSubscriptionByUserId(userId),
      this.billingRepository.findTrialUsageByUserId(userId),
      this.billingRepository.findLastPaymentAt(userId),
    ]);

    const trialUsed = Boolean(trialUsage);

    if (!record) {
      const free = Subscription.free(userId, { trialUsed });
      free.lastPaymentAt = lastPaymentAt ?? null;
      return free.toJSON();
    }

    return new Subscription({
      userId: record.userId,
      status: record.status,
      planName: record.planName,
      priceAmount: record.priceAmount,
      currency: record.currency,
      startedAt: record.startedAt,
      trialEndsAt: record.trialEndsAt,
      currentPeriodStart: record.currentPeriodStart,
      currentPeriodEnd: record.currentPeriodEnd,
      cancelAtPeriodEnd: record.cancelAtPeriodEnd,
      canceledAt: record.canceledAt,
      trialUsed,
      lastPaymentAt,
    }).toJSON();
  }

  async getHistory({ userId }) {
    return this.billingRepository.findHistoryByUserId(userId);
  }

  async getInvoices({ userId }) {
    return this.billingRepository.findInvoicesByUserId(userId);
  }

  /**
   * Kullanıcının şu an aktif premium erişimi var mı (TRIAL/ACTIVE veya dönem
   * sonuna kadar CANCELED). requirePremium middleware'i tarafından kullanılır.
   */
  async hasPremiumAccess({ userId }) {
    const sub = await this.billingRepository.findSubscriptionByUserId(userId);
    return hasPremiumAccess(sub);
  }

  /**
   * 15 günlük ücretsiz denemeyi başlatır. Her kullanıcı yalnızca bir kez deneme
   * başlatabilir (TrialUsage ile garanti). Bu adımda ödeme/kart alınmaz — sadece
   * TRIAL durumu ve deneme tarihleri kaydedilir.
   */
  async startTrial({ userId }) {
    const [existingTrial, existingSub] = await Promise.all([
      this.billingRepository.findTrialUsageByUserId(userId),
      this.billingRepository.findSubscriptionByUserId(userId),
    ]);

    if (existingTrial) {
      throw new ConflictError('Ücretsiz deneme hakkınızı zaten kullandınız');
    }
    if (existingSub && hasPremiumAccess(existingSub)) {
      throw new ConflictError('Zaten aktif bir üyeliğiniz var');
    }

    const startedAt = new Date();
    const trialEndsAt = new Date(startedAt.getTime() + TRIAL_DAYS * DAY_MS);

    await this.billingRepository.startTrial({
      userId,
      planName: PLAN_NAME,
      priceAmount: MONTHLY_PRICE_AMOUNT,
      currency: CURRENCY,
      startedAt,
      trialEndsAt,
      fromStatus: existingSub?.status ?? SubscriptionStatus.FREE,
    });

    return this.getStatus({ userId });
  }

  // ===================== Yardımcılar =====================

  // Aboneliğin sağlayıcı müşteri kaydını garanti eder; yoksa oluşturur.
  async _ensureCustomer(sub, userId) {
    if (sub?.providerCustomerId) return sub.providerCustomerId;
    const { customerId } = await this.paymentProvider.createCustomer({ userId });
    return customerId;
  }

  // Kartı sağlayıcıya bağlar ve kullanıcının varsayılan ödeme yöntemi olarak kaydeder.
  // (subscribe ve updatePaymentMethod ortak kullanır.)
  async _attachCard(userId, sub, token) {
    const customerId = await this._ensureCustomer(sub, userId);
    const card = await this.paymentProvider.attachPaymentMethod({ customerId, token });
    await this.billingRepository.setDefaultPaymentMethod(userId, {
      subscriptionId: sub?.id ?? null,
      provider: this.paymentProvider.name,
      providerPaymentMethodId: card.providerPaymentMethodId,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.expMonth,
      expYear: card.expYear,
    });
    return { customerId, card };
  }

  async _recordTransition(sub, toStatus, reason) {
    await this.billingRepository.addHistory({
      userId: sub.userId,
      subscriptionId: sub.id,
      fromStatus: sub.status,
      toStatus,
      reason,
    });
  }

  // Aboneliği iptal eder (kullanıcı ve admin ortak kullanır). Sağlayıcıdaki iptal
  // best-effort'tur; asıl kaynak yerel durumdur. Dönem sonuna kadar premium sürer.
  async _cancelSubscription(sub, reason) {
    if (sub.providerSubscriptionId) {
      try {
        await this.paymentProvider.cancelSubscription({
          subscriptionId: sub.providerSubscriptionId,
          cancelAtPeriodEnd: true,
        });
      } catch (err) {
        logger.warn('Sağlayıcıda abonelik iptali başarısız', err.message);
      }
    }
    await this.billingRepository.updateSubscription(sub.userId, {
      status: SubscriptionStatus.CANCELED,
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
    });
    await this._recordTransition(sub, SubscriptionStatus.CANCELED, reason);
  }

  // ===================== Abonelik yaşam döngüsü =====================

  /**
   * Kart ekleyerek ücretli aboneliği başlatır/sürdürür.
   * - Halihazırda premium erişim varsa (TRIAL/ACTIVE/dönem içi CANCELED): kart
   *   kaydedilir, tahsilat yapılmaz. CANCELED ise iptal geri alınır.
   * - Aksi halde (FREE/EXPIRED/PAST_DUE): kart hemen 25 TL ile tahsil edilip ACTIVE olunur.
   */
  async subscribe({ userId, paymentToken }) {
    if (!paymentToken) {
      throw new ValidationError('Ödeme yöntemi (kart) zorunludur');
    }

    const sub = await this.billingRepository.findSubscriptionByUserId(userId);
    const { customerId, card } = await this._attachCard(userId, sub, paymentToken);
    const now = new Date();

    // Zaten premium erişimi varsa çift tahsilat yapma; yalnızca kartı kaydet ve
    // (gerekiyorsa) iptali geri al. CANCELED -> deneme sürüyorsa TRIAL, değilse ACTIVE.
    if (hasPremiumAccess(sub, now)) {
      const restore =
        sub.status === SubscriptionStatus.CANCELED
          ? sub.trialEndsAt && new Date(sub.trialEndsAt) > now
            ? SubscriptionStatus.TRIAL
            : SubscriptionStatus.ACTIVE
          : sub.status;
      await this.billingRepository.updateSubscription(userId, {
        status: restore,
        planName: PLAN_NAME,
        priceAmount: MONTHLY_PRICE_AMOUNT,
        currency: CURRENCY,
        providerCustomerId: customerId,
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });
      if (restore !== sub.status) {
        await this._recordTransition(sub, restore, 'Abonelik yeniden etkinleştirildi');
      }
      return this.getStatus({ userId });
    }

    // Premium değil: kartı hemen tahsil et ve ACTIVE yap.
    const charge = await this.paymentProvider.charge({
      customerId,
      paymentMethodId: card.providerPaymentMethodId,
      amount: MONTHLY_PRICE_AMOUNT,
      currency: CURRENCY,
      description: `${PLAN_NAME} aylık abonelik`,
    });

    if (charge.status !== 'succeeded') {
      await this._recordFailedCharge({ userId, subscriptionId: sub?.id ?? null });
      throw new ValidationError('Ödeme alınamadı, lütfen kartınızı kontrol edin');
    }

    const currentPeriodStart = now;
    const currentPeriodEnd = addMonths(now, 1);
    const fields = {
      status: SubscriptionStatus.ACTIVE,
      planName: PLAN_NAME,
      priceAmount: MONTHLY_PRICE_AMOUNT,
      currency: CURRENCY,
      startedAt: sub?.startedAt ?? now,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      providerCustomerId: customerId,
    };
    const updated = await this.billingRepository.upsertSubscription(userId, fields, fields);

    await this._recordSuccessfulCharge({
      subscription: updated,
      periodStart: currentPeriodStart,
      periodEnd: currentPeriodEnd,
      providerPaymentId: charge.providerPaymentId,
      paidAt: charge.paidAt,
    });
    await this._recordTransition(
      { userId, id: updated.id, status: sub?.status ?? SubscriptionStatus.FREE },
      SubscriptionStatus.ACTIVE,
      'Abonelik başlatıldı'
    );

    return this.getStatus({ userId });
  }

  /**
   * Aboneliği iptal eder. Mevcut ödeme dönemi sonuna kadar premium devam eder;
   * dönem sonunda otomatik olarak EXPIRED'a düşer (yenileme işi tarafından).
   */
  async cancel({ userId }) {
    const sub = await this.billingRepository.findSubscriptionByUserId(userId);
    if (!sub || !hasPremiumAccess(sub)) {
      throw new ConflictError('İptal edilecek aktif bir aboneliğiniz yok');
    }
    await this._cancelSubscription(sub, 'Kullanıcı aboneliği iptal etti');
    return this.getStatus({ userId });
  }

  /**
   * İptal edilmiş ama henüz dönem sonu gelmemiş bir aboneliği tekrar başlatır.
   * Deneme süresi hâlâ sürüyorsa TRIAL'a, aksi halde ACTIVE'e döner.
   */
  async resume({ userId }) {
    const sub = await this.billingRepository.findSubscriptionByUserId(userId);
    if (!sub || sub.status !== SubscriptionStatus.CANCELED) {
      throw new ConflictError('İptal edilmiş bir aboneliğiniz yok');
    }
    const now = new Date();
    if (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) <= now) {
      throw new ConflictError('Abonelik dönemi sona ermiş, tekrar başlatılamaz');
    }

    const target =
      sub.trialEndsAt && new Date(sub.trialEndsAt) > now
        ? SubscriptionStatus.TRIAL
        : SubscriptionStatus.ACTIVE;

    if (sub.providerSubscriptionId) {
      try {
        await this.paymentProvider.resumeSubscription({ subscriptionId: sub.providerSubscriptionId });
      } catch (err) {
        logger.warn('Sağlayıcıda abonelik tekrar başlatma başarısız', err.message);
      }
    }

    await this.billingRepository.updateSubscription(userId, {
      status: target,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    });
    await this._recordTransition(sub, target, 'Kullanıcı aboneliği tekrar başlattı');

    return this.getStatus({ userId });
  }

  /** Ödeme yöntemini (kartı) günceller. Abonelik durumunu değiştirmez. */
  async updatePaymentMethod({ userId, paymentToken }) {
    if (!paymentToken) {
      throw new ValidationError('Ödeme yöntemi (kart) zorunludur');
    }
    const sub = await this.billingRepository.findSubscriptionByUserId(userId);
    const { customerId, card } = await this._attachCard(userId, sub, paymentToken);

    // Abonelik satırı yoksa müşteri referansını saklamak için FREE bir satır açılır.
    if (!sub) {
      await this.billingRepository.upsertSubscription(
        userId,
        { status: SubscriptionStatus.FREE, providerCustomerId: customerId },
        { providerCustomerId: customerId }
      );
    } else if (!sub.providerCustomerId) {
      await this.billingRepository.updateSubscription(userId, { providerCustomerId: customerId });
    }

    return {
      provider: this.paymentProvider.name,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.expMonth,
      expYear: card.expYear,
    };
  }

  // ===================== Fatura/ödeme kayıtları =====================

  async _recordSuccessfulCharge({ subscription, periodStart, periodEnd, providerPaymentId, paidAt }) {
    const invoice = await this.billingRepository.createInvoice({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      amount: MONTHLY_PRICE_AMOUNT,
      currency: CURRENCY,
      status: 'paid',
      periodStart,
      periodEnd,
      paidAt: paidAt ?? new Date(),
      provider: this.paymentProvider.name,
    });
    await this.billingRepository.createPayment({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
      amount: MONTHLY_PRICE_AMOUNT,
      currency: CURRENCY,
      status: 'succeeded',
      provider: this.paymentProvider.name,
      providerPaymentId,
      paidAt: paidAt ?? new Date(),
    });
  }

  async _recordFailedCharge({ userId, subscriptionId }) {
    await this.billingRepository.createPayment({
      userId,
      subscriptionId,
      amount: MONTHLY_PRICE_AMOUNT,
      currency: CURRENCY,
      status: 'failed',
      provider: this.paymentProvider.name,
      providerPaymentId: null,
    });
  }

  // ===================== Otomatik yenileme (durum makinesi) =====================

  /**
   * Ödeme dönemi/deneme süresi geçmiş abonelikleri işler. Periyodik bir iş
   * (jobs/subscriptionRenewer.js) tarafından çağrılır.
   * Durum geçişleri:
   *   TRIAL bitti + kart var    -> tahsil et -> ACTIVE (yeni dönem)  | başarısızsa PAST_DUE
   *   TRIAL bitti + kart yok/iptal -> EXPIRED
   *   ACTIVE dönemi bitti        -> tahsil et -> ACTIVE (yenile)      | başarısızsa PAST_DUE
   *   CANCELED dönemi bitti      -> EXPIRED
   *   PAST_DUE                   -> tekrar dene -> ACTIVE | grace sonrası EXPIRED
   */
  async processRenewals({ now = new Date() } = {}) {
    const due = await this.billingRepository.findDueSubscriptions(now);
    let processed = 0;
    for (const sub of due) {
      try {
        await this._processOne(sub, now);
        processed += 1;
      } catch (err) {
        logger.error(`Abonelik yenileme başarısız (userId=${sub.userId})`, err);
      }
    }
    return { processed };
  }

  async _processOne(sub, now) {
    if (sub.status === SubscriptionStatus.CANCELED) {
      return this._expire(sub, 'İptal edildi, ödeme dönemi sona erdi');
    }
    if (sub.status === SubscriptionStatus.TRIAL) {
      const card = await this.billingRepository.findDefaultPaymentMethod(sub.userId);
      if (sub.cancelAtPeriodEnd || !card) {
        return this._expire(sub, card ? 'Deneme iptal edildi' : 'Deneme bitti, ödeme yöntemi yok');
      }
      return this._chargeAndAdvance(sub, card, now, 'Deneme bitti, abonelik başladı');
    }
    if (sub.status === SubscriptionStatus.ACTIVE) {
      if (sub.cancelAtPeriodEnd) {
        return this._expire(sub, 'İptal edildi, ödeme dönemi sona erdi');
      }
      const card = await this.billingRepository.findDefaultPaymentMethod(sub.userId);
      if (!card) {
        return this._markPastDue(sub, 'Yenileme için kayıtlı kart yok');
      }
      return this._chargeAndAdvance(sub, card, now, 'Abonelik yenilendi');
    }
    if (sub.status === SubscriptionStatus.PAST_DUE) {
      const graceDeadline = new Date(new Date(sub.currentPeriodEnd).getTime() + PAST_DUE_GRACE_DAYS * DAY_MS);
      if (now > graceDeadline) {
        return this._expire(sub, 'Ödeme alınamadı, ek süre doldu');
      }
      const card = await this.billingRepository.findDefaultPaymentMethod(sub.userId);
      if (!card) return; // kart yok, bir sonraki denemede grace kontrol edilir
      return this._chargeAndAdvance(sub, card, now, 'Ödeme yeniden alındı, abonelik aktif');
    }
    return undefined;
  }

  async _chargeAndAdvance(sub, card, now, reason) {
    const charge = await this.paymentProvider.charge({
      customerId: sub.providerCustomerId,
      paymentMethodId: card.providerPaymentMethodId,
      amount: MONTHLY_PRICE_AMOUNT,
      currency: CURRENCY,
      description: `${PLAN_NAME} aylık abonelik`,
    });

    if (charge.status !== 'succeeded') {
      return this._markPastDue(sub, 'Otomatik ödeme başarısız');
    }

    const periodStart = now;
    const periodEnd = addMonths(now, 1);
    await this.billingRepository.updateSubscription(sub.userId, {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    });
    await this._recordSuccessfulCharge({
      subscription: sub,
      periodStart,
      periodEnd,
      providerPaymentId: charge.providerPaymentId,
      paidAt: charge.paidAt,
    });
    await this._recordTransition(sub, SubscriptionStatus.ACTIVE, reason);
  }

  async _markPastDue(sub, reason) {
    await this.billingRepository.updateSubscription(sub.userId, { status: SubscriptionStatus.PAST_DUE });
    await this._recordFailedCharge({ userId: sub.userId, subscriptionId: sub.id });
    await this._recordTransition(sub, SubscriptionStatus.PAST_DUE, reason);
  }

  async _expire(sub, reason) {
    await this.billingRepository.updateSubscription(sub.userId, {
      status: SubscriptionStatus.EXPIRED,
      cancelAtPeriodEnd: false,
    });
    await this._recordTransition(sub, SubscriptionStatus.EXPIRED, reason);
  }

  // ===================== Admin =====================

  /** Admin paneli için premium/abonelik istatistikleri. */
  async getAdminStats() {
    const now = new Date();
    const upcomingUntil = new Date(now.getTime() + 7 * DAY_MS);
    const [premiumCount, activeCount, trialUsersCount, canceledCount, mrrAmount, upcomingRenewals] =
      await Promise.all([
        this.billingRepository.countActivePremium(now),
        this.billingRepository.countByStatus(SubscriptionStatus.ACTIVE),
        this.billingRepository.countTrialUsages(),
        this.billingRepository.countByStatus(SubscriptionStatus.CANCELED),
        this.billingRepository.sumActiveMrr(),
        this.billingRepository.countUpcomingRenewals(now, upcomingUntil),
      ]);

    return {
      premiumCount,
      activeCount,
      trialUsersCount,
      canceledCount,
      monthlyRevenue: { amount: mrrAmount, currency: CURRENCY },
      upcomingRenewals,
    };
  }

  /** Premium/abonelik ilişkisi olan kullanıcıların listesi (admin). */
  async listPremiumUsers() {
    const rows = await this.billingRepository.findPremiumUsers();
    return rows.map((row) => ({
      userId: row.userId,
      name: row.user?.name ?? null,
      email: row.user?.email ?? null,
      status: row.status,
      planName: row.planName,
      isPremium: hasPremiumAccess(row),
      trialEndsAt: row.trialEndsAt,
      currentPeriodEnd: row.currentPeriodEnd,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    }));
  }

  /** Admin bir kullanıcının aboneliğini manuel iptal eder (dönem sonuna kadar premium sürer). */
  async adminCancel({ userId }) {
    const sub = await this.billingRepository.findSubscriptionByUserId(userId);
    if (!sub || !hasPremiumAccess(sub)) {
      throw new ConflictError('Bu kullanıcının iptal edilecek aktif aboneliği yok');
    }
    await this._cancelSubscription(sub, 'Admin tarafından iptal edildi');
    return this.getStatus({ userId });
  }
}

module.exports = BillingService;
