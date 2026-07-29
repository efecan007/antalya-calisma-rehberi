const { SubscriptionStatus, hasPremiumAccess, daysUntil } = require('./subscription-status');

/**
 * Kullanıcının abonelik durumunu temsil eden domain entity'si. Bir kullanıcının
 * hiç abonelik kaydı yoksa `free()` fabrikası ile varsayılan FREE durumu üretilir
 * (tüm kullanıcılar için satır açmaya gerek kalmaz).
 */
class Subscription {
  constructor({
    userId,
    status,
    planName,
    priceAmount,
    currency,
    startedAt,
    trialEndsAt,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    canceledAt,
    trialUsed,
    lastPaymentAt,
  }) {
    this.userId = userId;
    this.status = status ?? SubscriptionStatus.FREE;
    this.planName = planName ?? null;
    this.priceAmount = priceAmount ?? null;
    this.currency = currency ?? null;
    this.startedAt = startedAt ?? null;
    this.trialEndsAt = trialEndsAt ?? null;
    this.currentPeriodStart = currentPeriodStart ?? null;
    this.currentPeriodEnd = currentPeriodEnd ?? null;
    this.cancelAtPeriodEnd = cancelAtPeriodEnd ?? false;
    this.canceledAt = canceledAt ?? null;
    this.trialUsed = trialUsed ?? false;
    this.lastPaymentAt = lastPaymentAt ?? null;
  }

  static free(userId, { trialUsed = false } = {}) {
    return new Subscription({ userId, status: SubscriptionStatus.FREE, trialUsed });
  }

  get isPremium() {
    return hasPremiumAccess(this);
  }

  get trialDaysLeft() {
    return this.status === SubscriptionStatus.TRIAL ? daysUntil(this.trialEndsAt) : null;
  }

  toJSON() {
    return {
      status: this.status,
      planName: this.planName,
      priceAmount: this.priceAmount,
      currency: this.currency,
      isPremium: this.isPremium,
      startedAt: this.startedAt,
      trialEndsAt: this.trialEndsAt,
      trialDaysLeft: this.trialDaysLeft,
      trialUsed: this.trialUsed,
      currentPeriodStart: this.currentPeriodStart,
      currentPeriodEnd: this.currentPeriodEnd,
      cancelAtPeriodEnd: this.cancelAtPeriodEnd,
      canceledAt: this.canceledAt,
      lastPaymentAt: this.lastPaymentAt,
    };
  }
}

module.exports = Subscription;
