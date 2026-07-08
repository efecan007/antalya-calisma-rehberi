/**
 * E2E test: tüm Express app'i gerçek DB/Redis'e karşı HTTP üzerinden test eder.
 * Önkoşul: `docker compose up -d db redis` (veya tüm stack) ayakta olmalı.
 */
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { createApp } = require('../../src/app');

const prisma = new PrismaClient();
const app = createApp();
const testEmail = `e2e-auth-${Date.now()}@example.com`;

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
});

describe('Auth flow (e2e)', () => {
  let token;

  it('kayıt olur ve token döner', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: 'Sifre123!', name: 'E2E Kullanici' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
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
});
