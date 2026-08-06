const nodemailer = require('nodemailer');
const logger = require('../logging/logger');

// E-posta gönderici. İki sürücü destekler ve otomatik seçer:
//   1. Brevo (HTTP API, port 443) — BREVO_API_KEY tanımlıysa. Render gibi giden
//      SMTP portlarını (25/465/587) engelleyen platformlarda tek çalışan yol budur.
//   2. SMTP (nodemailer) — SMTP_HOST/USER/PASS tanımlıysa (yerel geliştirme, Gmail).
// İkisi de yoksa gönderim sessizce atlanır ve (production dışında) link log'a düşer,
// böylece e-posta sağlayıcısı olmadan da akış test edilebilir.

// MAIL_FROM "Ad <email>" veya "email" biçiminde olabilir; ad ve e-postayı ayırır.
function parseFrom() {
  const raw = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@localhost';
  const match = raw.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (match) {
    return { name: match[1] || undefined, email: match[2] };
  }
  return { name: undefined, email: raw.trim() };
}

// --- Brevo (HTTP API) ---
function isBrevoConfigured() {
  return Boolean(process.env.BREVO_API_KEY);
}

async function sendViaBrevo({ to, subject, html, text }) {
  const from = parseFrom();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: from.email, ...(from.name ? { name: from.name } : {}) },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Brevo API ${res.status}: ${body}`);
    }
    return { skipped: false, driver: 'brevo' };
  } finally {
    clearTimeout(timeout);
  }
}

// --- SMTP (nodemailer) ---
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

  // Zaman aşımları: SMTP erişilemezse (ör. platform giden bağlantıyı engelliyorsa)
  // sonsuza kadar askıda kalmak yerine hızlıca hata ver.
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
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

async function sendViaSmtp({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@localhost';
  await getTransport().sendMail({ from, to, subject, html, text });
  return { skipped: false, driver: 'smtp' };
}

function isConfigured() {
  return isBrevoConfigured() || getTransport() !== null;
}

async function sendMail({ to, subject, html, text }) {
  // Brevo öncelikli: production'da (Render) tek çalışan yol.
  if (isBrevoConfigured()) {
    return sendViaBrevo({ to, subject, html, text });
  }
  if (getTransport()) {
    return sendViaSmtp({ to, subject, html, text });
  }

  logger.warn(
    `E-posta sağlayıcısı yapılandırılmadığı için gönderilemedi (to=${to}, subject="${subject}"). ` +
      'BREVO_API_KEY veya SMTP_HOST/SMTP_USER/SMTP_PASS tanımlayın.'
  );
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV] E-posta içeriği (gönderilmedi):\n${text || html}`);
  }
  return { skipped: true };
}

module.exports = { sendMail, isConfigured };
