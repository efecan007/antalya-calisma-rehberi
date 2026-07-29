const { billingService } = require('./billing.container');

/**
 * requirePremium: kullanıcının aktif RemoteRehber Pro aboneliği olmasını zorunlu
 * kılar. requireAuth'tan SONRA çalışmalıdır (req.user gerekir). Premium değilse
 * 403 döner ve yanıtta `premiumRequired: true` bayrağı ile istemciye Premium
 * sayfasına (/pro) yönlendirmesi gerektiğini bildirir. Mevcut JWT sistemi aynen kullanılır.
 */
async function requirePremium(req, res, next) {
  try {
    const premium = await billingService.hasPremiumAccess({ userId: req.user.id });
    if (!premium) {
      return res.status(403).json({
        message: 'Bu özellik RemoteRehber Pro üyeliği gerektirir',
        premiumRequired: true,
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requirePremium };
