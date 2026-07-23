const rateLimit = require('express-rate-limit');

// Test ortamında (Jest NODE_ENV=test'i otomatik ayarlar) limiti devre dışı bırak;
// e2e testleri aynı process içinde --runInBand ile onlarca register/login çağrısı yapar
// ve gerçek istemcilerden ayırt edilemeyen bu trafiğin testleri kırmasını istemeyiz.
const skipInTest = () => process.env.NODE_ENV === 'test';

// Genel API trafiği için gevşek bir taban limit (kaba kuvvet/DoS'a karşı savunma katmanı).
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin' },
});

// Brute-force şifre denemelerine karşı register/login için daha sıkı limit.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { message: 'Çok fazla giriş denemesi, lütfen daha sonra tekrar deneyin' },
});

module.exports = { generalLimiter, authLimiter };
