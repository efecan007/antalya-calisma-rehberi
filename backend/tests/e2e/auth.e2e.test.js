/**
 * E2E test: tüm Express app'i gerçek DB/Redis'e karşı HTTP üzerinden test eder.
 * Önkoşul: `docker compose up -d db redis` (veya tüm stack) ayakta olmalı.
 */
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

// Gerçek SMTP göndermeden doğrulama e-postasını yakalarız; ham token e-posta
// metnindeki linkin içindedir (DB'de yalnızca hash'i tutulur).
const mockSentEmails = [];
jest.mock('../../src/common/mail/mailer', () => ({
  sendMail: jest.fn(async (payload) => {
    mockSentEmails.push(payload);
    return { skipped: false };
  }),
  isConfigured: () => true,
}));

const { createApp } = require('../../src/app');

const prisma = new PrismaClient();
const app = createApp();
const testEmail = `e2e-auth-${Date.now()}@example.com`;

function extractToken(email) {
  const match = (email.text || email.html || '').match(/token=([a-f0-9]+)/i);
  return match ? match[1] : null;
}

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.pendingRegistration.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
});

describe('Auth flow (e2e)', () => {
  let token;

  it('kayıt 202 döner ve doğrulama e-postası gönderir (oturum açılmaz)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: 'Sifre123!', name: 'E2E Kullanici' });

    expect(res.status).toBe(202);
    expect(res.body.pendingVerification).toBe(true);
    expect(res.body.token).toBeUndefined();
    expect(mockSentEmails).toHaveLength(1);
    expect(mockSentEmails[0].to).toBe(testEmail);
  });

  it('doğrulanmamış hesapla giriş 401 döner', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'Sifre123!' });

    expect(res.status).toBe(401);
  });

  it('e-postadaki token ile doğrulama hesabı oluşturur ve token döner', async () => {
    const rawToken = extractToken(mockSentEmails[0]);
    expect(rawToken).toBeTruthy();

    const res = await request(app).post('/api/auth/verify-email').send({ token: rawToken });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    token = res.body.token;
  });

  it('doğrulama sonrası doğru şifre ile giriş yapılabilir', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'Sifre123!' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('yanlış şifre ile giriş 401 döner', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'yanlis-sifre' });

    expect(res.status).toBe(401);
  });

  it('geçerli token ile /me kullanıcı bilgisini döner', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testEmail);
  });

  it('token olmadan /me 401 döner', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('geçerli token ile logout 204 döner', async () => {
    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('token olmadan logout 401 döner', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});
