/**
 * E2E test: admin dashboard/kullanıcı yönetimi.
 * Önkoşul: `docker compose up -d db redis` (veya tüm stack) ayakta olmalı.
 */
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { createApp } = require('../../src/app');

const prisma = new PrismaClient();
const app = createApp();
const userEmail = `e2e-admin-user-${Date.now()}@example.com`;
const adminEmail = `e2e-admin-admin-${Date.now()}@example.com`;

let userToken;
let userId;
let adminToken;
let adminId;

beforeAll(async () => {
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ email: userEmail, password: 'Sifre123!', name: 'E2E Admin Test Kullanici' });
  userToken = userRes.body.token;
  userId = userRes.body.user.id;

  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({ email: adminEmail, password: 'Sifre123!', name: 'E2E Admin Test Admin' });
  adminId = adminRes.body.user.id;
  await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: adminEmail, password: 'Sifre123!' });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  const ids = [userId, adminId].filter(Boolean);
  if (ids.length) await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

describe('Admin dashboard/users (e2e)', () => {
  it('token olmadan dashboard/users 401 döner', async () => {
    const dashboardRes = await request(app).get('/api/admin/dashboard');
    expect(dashboardRes.status).toBe(401);

    const usersRes = await request(app).get('/api/admin/users');
    expect(usersRes.status).toBe(401);
  });

  it('admin olmayan kullanıcı dashboard/users göremez', async () => {
    const dashboardRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(dashboardRes.status).toBe(403);

    const usersRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(usersRes.status).toBe(403);
  });

  it('admin dashboard istatistiklerini görür', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        totalUsers: expect.any(Number),
        totalPlaces: expect.any(Number),
        pendingSuggestions: expect.any(Number),
        totalReviews: expect.any(Number),
        totalFavorites: expect.any(Number),
      })
    );
  });

  it('admin kullanıcı listesini görür (parolasız)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const found = res.body.find((u) => u.id === userId);
    expect(found).toBeDefined();
    expect(found.passwordHash).toBeUndefined();
  });

  it('admin kendi hesabını silemez (403)', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('admin başka bir kullanıcıyı siler', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
    userId = null;
  });
});
