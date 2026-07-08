/**
 * E2E test: favori ekleme/çıkarma/listeleme (/api/favorites/:placeId).
 * Önkoşul: `docker compose up -d db redis` (veya tüm stack) ayakta olmalı.
 */
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { createApp } = require('../../src/app');
const { invalidate } = require('../../src/modules/cache/cache.service');
const { getRedisClient } = require('../../src/modules/cache/redis.client');

const prisma = new PrismaClient();
const app = createApp();
const userEmail = `e2e-favorites-${Date.now()}@example.com`;
const adminEmail = `e2e-favorites-admin-${Date.now()}@example.com`;

let userToken;
let userId;
let adminToken;
let adminId;
let placeId;

beforeAll(async () => {
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ email: userEmail, password: 'Sifre123!', name: 'E2E Favorites Kullanici' });
  userToken = userRes.body.token;
  userId = userRes.body.user.id;

  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({ email: adminEmail, password: 'Sifre123!', name: 'E2E Favorites Admin' });
  adminId = adminRes.body.user.id;
  await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: adminEmail, password: 'Sifre123!' });
  adminToken = adminLogin.body.token;

  const placeRes = await request(app)
    .post('/api/places')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'E2E Favori Kafesi', type: 'CAFE', region: 'KEPEZ', address: 'a', lat: 1, lng: 1 });
  placeId = placeRes.body.id;
});

afterAll(async () => {
  if (placeId) await prisma.place.deleteMany({ where: { id: placeId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, adminId] } } });
  await invalidate('places:list:*');
  await prisma.$disconnect();
  await getRedisClient().quit();
});

describe('Favorites flow (e2e)', () => {
  it('giriş yapmadan favoriye ekleme 401 döner', async () => {
    const res = await request(app).post(`/api/favorites/${placeId}`);
    expect(res.status).toBe(401);
  });

  it('favori ekleme/listeleme/çıkarma döngüsü çalışır', async () => {
    const addRes = await request(app)
      .post(`/api/favorites/${placeId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(addRes.status).toBe(204);

    const listRes = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.some((p) => p.id === placeId)).toBe(true);

    const removeRes = await request(app)
      .delete(`/api/favorites/${placeId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(removeRes.status).toBe(204);

    const listAfterRes = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`);
    expect(listAfterRes.body.some((p) => p.id === placeId)).toBe(false);
  });
});
