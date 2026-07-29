/**
 * Abonelik durumu sabitleri ve premium erişim kuralları. Framework'ten (Express,
 * Prisma) bağımsız saf domain mantığıdır; ileride requirePremium middleware'i ve
 * ödeme akışı bu kuralları tek yerden tüketir.
 */
const SubscriptionStatus = Object.freeze({
  FREE: 'FREE',
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED',
});

const PLAN_NAME = 'RemoteRehber Pro';
// Aylık ücret (kuruş). 2500 = 25,00 TL.
const MONTHLY_PRICE_AMOUNT = 2500;
const CURRENCY = 'TRY';
const TRIAL_DAYS = 15;

/**
 * Bir aboneliğin şu an premium erişim sağlayıp sağlamadığını belirler:
 * - TRIAL: deneme bitiş tarihi henüz geçmediyse aktif.
 * - ACTIVE: her zaman aktif.
 * - CANCELED: dönem sonuna kadar (currentPeriodEnd) premium sürer.
 * - FREE / PAST_DUE / EXPIRED: premium yok.
 */
function hasPremiumAccess(subscription, now = new Date()) {
  if (!subscription) return false;
  const { status, trialEndsAt, currentPeriodEnd } = subscription;

  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return true;
    case SubscriptionStatus.TRIAL:
      return Boolean(trialEndsAt) && new Date(trialEndsAt) > now;
    case SubscriptionStatus.CANCELED:
      return Boolean(currentPeriodEnd) && new Date(currentPeriodEnd) > now;
    default:
      return false;
  }
}

/**
 * Deneme veya mevcut ödeme döneminin bitmesine kaç tam gün kaldığını döner.
 * İlgili tarih yoksa null döner.
 */
function daysUntil(dateValue, now = new Date()) {
  if (!dateValue) return null;
  const diffMs = new Date(dateValue).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

module.exports = {
  SubscriptionStatus,
  PLAN_NAME,
  MONTHLY_PRICE_AMOUNT,
  CURRENCY,
  TRIAL_DAYS,
  hasPremiumAccess,
  daysUntil,
};
