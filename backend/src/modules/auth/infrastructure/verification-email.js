const crypto = require('crypto');
const { sendMail } = require('../../../common/mail/mailer');
const logger = require('../../../common/logging/logger');

const APP_NAME = 'Antalya Çalışma Rehberi';

// Kriptografik olarak güvenli, URL-safe bir doğrulama token’ı üretir.
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Ham token yalnızca e-posta linkinde bulunur; DB'de yalnızca sha256 özeti tutulur.
function hashVerificationToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Doğrulama linkini oluştururken frontend URL'ini CORS_ORIGIN'in ilk değerinden alır
// (production'da Vercel adresi, yerelde localhost). APP_URL ile açıkça override edilebilir.
function getFrontendUrl() {
  const explicit = process.env.APP_URL && process.env.APP_URL.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const origins = process.env.CORS_ORIGIN || 'http://localhost:5173';
  return origins.split(',')[0].trim().replace(/\/$/, '');
}

function buildVerificationLink(token) {
  return `${getFrontendUrl()}/e-posta-dogrula?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendVerificationEmail({ email, name, token }) {
  const link = buildVerificationLink(token);
  const safeName = escapeHtml(name || '');
  const subject = `${APP_NAME} — Hesabınızı doğrulayın`;

  const text = [
    `Merhaba ${name || ''}`.trim(),
    '',
    `${APP_NAME} hesabınızı oluşturmak için e-posta adresinizi doğrulamanız gerekiyor.`,
    'Aşağıdaki bağlantıya tıklayarak kaydınızı onaylayın:',
    '',
    link,
    '',
    'Bu bağlantı 24 saat geçerlidir. Bu kaydı siz yapmadıysanız bu e-postayı yok sayabilirsiniz.',
  ].join('\n');

  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="margin: 0 0 16px; font-size: 20px;">${APP_NAME}</h2>
    <p style="margin: 0 0 12px;">Merhaba ${safeName},</p>
    <p style="margin: 0 0 16px;">Hesabınızı oluşturmak için e-posta adresinizi doğrulamanız gerekiyor. Aşağıdaki butona tıklayarak kaydınızı onaylayın:</p>
    <p style="margin: 0 0 24px;">
      <a href="${link}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-weight: 600;">Kaydı Onayla</a>
    </p>
    <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">Buton çalışmazsa şu bağlantıyı tarayıcınıza yapıştırın:</p>
    <p style="margin: 0 0 24px; font-size: 13px; word-break: break-all;"><a href="${link}" style="color: #2563eb;">${link}</a></p>
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">Bu bağlantı 24 saat geçerlidir. Bu kaydı siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
  </div>`;

  // Hata durumunda fırlatmaz: kayıt akışı e-postayı arka planda gönderdiği için
  // gönderim başarısız olsa bile kaydı bozmamalı; hata loglanır, kullanıcı
  // "tekrar gönder" ile yeniden deneyebilir.
  try {
    return await sendMail({ to: email, subject, html, text });
  } catch (err) {
    logger.error(`Doğrulama e-postası gönderilemedi (${email})`, err);
    return { error: true };
  }
}

module.exports = {
  generateVerificationToken,
  hashVerificationToken,
  sendVerificationEmail,
  buildVerificationLink,
};
