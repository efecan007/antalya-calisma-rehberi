const nodemailer = require('nodemailer');
const logger = require('../logging/logger');

// Basit SMTP tabanlı e-posta gönderici. Gmail dahil herhangi bir SMTP sağlayıcısıyla
// çalışır (Gmail için 2FA + "uygulama şifresi" gerekir). SMTP yapılandırılmamışsa
// gönderim sessizce atlanır ve (production dışında) link log'a düşer — böylece
// yerel geliştirme e-posta sunucusu olmadan da test edilebilir (Google Places
// entegrasyonunun eksik key ile sessizce devre dışı kalması gibi).
function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  // 465 -> implicit TLS (secure), diğerleri -> STARTTLS. SMTP_SECURE ile override edilebilir.
  const secure =
    typeof process.env.SMTP_SECURE === 'string'
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

let cachedTransport;
let transportResolved = false;

function getTransport() {
  if (!transportResolved) {
    cachedTransport = buildTransport();
    transportResolved = true;
  }
  return cachedTransport;
}

function isConfigured() {
  return getTransport() !== null;
}

function getFrom() {
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@localhost';
}

async function sendMail({ to, subject, html, text }) {
  const transport = getTransport();
  if (!transport) {
    logger.warn(
      `SMTP yapılandırılmadığı için e-posta gönderilemedi (to=${to}, subject="${subject}"). ` +
        'SMTP_HOST/SMTP_USER/SMTP_PASS tanımlayın.'
    );
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[DEV] E-posta içeriği (gönderilmedi):\n${text || html}`);
    }
    return { skipped: true };
  }

  await transport.sendMail({ from: getFrom(), to, subject, html, text });
  return { skipped: false };
}

module.exports = { sendMail, isConfigured };
