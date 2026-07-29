const BillingRepository = require('../domain/BillingRepository');

class BillingPrismaRepository extends BillingRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findSubscriptionByUserId(userId) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  async findTrialUsageByUserId(userId) {
    return this.prisma.trialUsage.findUnique({ where: { userId } });
  }

  async findHistoryByUserId(userId) {
    return this.prisma.subscriptionHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findLastPaymentAt(userId) {
    const payment = await this.prisma.payment.findFirst({
      where: { userId, status: 'succeeded' },
      orderBy: { paidAt: 'desc' },
      select: { paidAt: true },
    });
    return payment?.paidAt ?? null;
  }

  async findInvoicesByUserId(userId) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Denemeyi tek bir transaction içinde başlatır: aboneliği TRIAL'a çeker,
   * TrialUsage kaydını oluşturur (userId @unique -> tek kullanımlık) ve durum
   * geçişini history'ye yazar. TrialUsage zaten varsa unique ihlaliyle transaction
   * geri sarılır (service ayrıca önceden kontrol eder; bu yarış durumuna karşı ek güvence).
   */
  async startTrial({ userId, planName, priceAmount, currency, startedAt, trialEndsAt, fromStatus }) {
    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.upsert({
        where: { userId },
        create: {
          userId,
          status: 'TRIAL',
          planName,
          priceAmount,
          currency,
          startedAt,
          trialEndsAt,
          currentPeriodStart: startedAt,
          currentPeriodEnd: trialEndsAt,
        },
        update: {
          status: 'TRIAL',
          planName,
          priceAmount,
          currency,
          startedAt,
          trialEndsAt,
          currentPeriodStart: startedAt,
          currentPeriodEnd: trialEndsAt,
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
      });

      await tx.trialUsage.create({ data: { userId, startedAt, endsAt: trialEndsAt } });

      await tx.subscriptionHistory.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          fromStatus: fromStatus ?? null,
          toStatus: 'TRIAL',
          reason: 'Ücretsiz deneme başlatıldı',
        },
      });

      return subscription;
    });
  }

  async upsertSubscription(userId, createData, updateData) {
    return this.prisma.subscription.upsert({
      where: { userId },
      create: { userId, ...createData },
      update: updateData,
    });
  }

  async updateSubscription(userId, data) {
    return this.prisma.subscription.update({ where: { userId }, data });
  }

  async addHistory({ userId, subscriptionId, fromStatus, toStatus, reason }) {
    return this.prisma.subscriptionHistory.create({
      data: {
        userId,
        subscriptionId: subscriptionId ?? null,
        fromStatus: fromStatus ?? null,
        toStatus,
        reason: reason ?? null,
      },
    });
  }

  /**
   * Kullanıcı başına tek varsayılan kart tutulur: mevcut kart varsa güncellenir,
   * yoksa oluşturulur. Böylece "kartı güncelle" işlemi eski kaydı değiştirir.
   */
  async setDefaultPaymentMethod(userId, data) {
    const existing = await this.prisma.paymentMethod.findFirst({ where: { userId } });
    if (existing) {
      return this.prisma.paymentMethod.update({
        where: { id: existing.id },
        data: { ...data, isDefault: true },
      });
    }
    return this.prisma.paymentMethod.create({ data: { userId, ...data, isDefault: true } });
  }

  async findDefaultPaymentMethod(userId) {
    return this.prisma.paymentMethod.findFirst({
      where: { userId, isDefault: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInvoice(data) {
    return this.prisma.invoice.create({ data });
  }

  async createPayment(data) {
    return this.prisma.payment.create({ data });
  }

  /**
   * Ödeme dönemi/deneme süresi geçmiş ve işlenmesi gereken abonelikler
   * (yenileme, deneme dönüşümü, iptal sonrası düşme, past_due tekrar deneme).
   */
  async findDueSubscriptions(now) {
    return this.prisma.subscription.findMany({
      where: {
        status: { in: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED'] },
        currentPeriodEnd: { lte: now },
      },
      orderBy: { currentPeriodEnd: 'asc' },
      take: 200,
    });
  }

  // --- Admin istatistikleri ---

  async countByStatus(status) {
    return this.prisma.subscription.count({ where: { status } });
  }

  // Şu an premium erişimi olanlar: ACTIVE, süresi dolmamış TRIAL veya dönem
  // sonu gelmemiş CANCELED (domain hasPremiumAccess kuralıyla aynı).
  async countActivePremium(now) {
    return this.prisma.subscription.count({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'TRIAL', trialEndsAt: { gt: now } },
          { status: 'CANCELED', currentPeriodEnd: { gt: now } },
        ],
      },
    });
  }

  async countTrialUsages() {
    return this.prisma.trialUsage.count();
  }

  // Aylık yinelenen gelir (MRR): tahsil edilmeye devam edecek ACTIVE aboneliklerin
  // fiyat toplamı (kuruş).
  async sumActiveMrr() {
    const result = await this.prisma.subscription.aggregate({
      _sum: { priceAmount: true },
      where: { status: 'ACTIVE' },
    });
    return result._sum.priceAmount ?? 0;
  }

  async countUpcomingRenewals(from, to) {
    return this.prisma.subscription.count({
      where: { status: 'ACTIVE', currentPeriodEnd: { gte: from, lte: to } },
    });
  }

  async findPremiumUsers() {
    return this.prisma.subscription.findMany({
      where: { status: { in: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED'] } },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    });
  }
}

module.exports = BillingPrismaRepository;
