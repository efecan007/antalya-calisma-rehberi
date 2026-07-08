/**
 * E2E test: admin-only mekan CRUD, review alt-kaynağı, yetkisiz erişim reddi.
 * Önkoşul: `docker compose up -d db redis` (veya tüm stack) ayakta olmalı.
 */
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { createApp } = require('../../src/app');
const { invalidate } = require('../../src/modules/cache/cache.service');
const { getRedisClient } = require('../../src/modules/cache/redis.client');

const prisma = new PrismaClient();
const app = createApp();
const userEmail = `e2e-places-${Date.now()}@example.com`;
const adminEmail = `e2e-places-admin-${Date.now()}@example.com`;

let userToken;
let userId;
let adminToken;
let adminId;
let placeId;

beforeAll(async () => {
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ email: userEmail, password: 'Sifre123!', name: 'E2E Places Kullanici' });
  userToken = userRes.body.token;
  userId = userRes.body.user.id;

  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({ email: adminEmail, password: 'Sifre123!', name: 'E2E Places Admin' });
  adminId = adminRes.body.user.id;
  await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: adminEmail, password: 'Sifre123!' });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  if (placeId) await prisma.place.deleteMany({ where: { id: placeId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, adminId] } } });
  await invalidate('places:list:*');
  await prisma.$disconnect();
  await getRedisClient().quit();
});

describe('Places CRUD (e2e)', () => {
  it('giriş yapmadan mekan oluşturma 401 döner', async () => {
    const res = await request(app).post('/api/places').send({ name: 'x' });
    expect(res.status).toBe(401);
  });

  it('admin olmayan kullanıcı mekan oluşturamaz (403)', async () => {
    const res = await request(app)
      .post('/api/places')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'x', type: 'CAFE', region: 'MURATPASA', address: 'a', lat: 1, lng: 1 });
    expect(res.status).toBe(403);
  });

  it('admin mekan oluşturunca doğrudan APPROVED olur', async () => {
    const res = await request(app)
      .post('/api/places')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Test Kafesi',
        type: 'CAFE',
        region: 'MURATPASA',
        address: 'Test Sokak No:1',
        lat: 36.9,
        lng: 30.7,
        priceLevel: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('APPROVED');
    placeId = res.body.id;

    const listRes = await request(app).get('/api/places').query({ region: 'MURATPASA' });
    expect(listRes.body.some((p) => p.id === placeId)).toBe(true);
  });

  it('GET /api/places/:id mekan detayını döner', async () => {
    const res = await request(app).get(`/api/places/${placeId}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: placeId,
        name: 'E2E Test Kafesi',
        region: 'MURATPASA',
        status: 'APPROVED',
      })
    );
  });

  it('var olmayan mekan detayı 404 döner', async () => {
    const res = await request(app).get('/api/places/999999999');
    expect(res.status).toBe(404);
  });

  it('admin olmayan kullanıcı mekanı güncelleyemez (403)', async () => {
    const res = await request(app)
      .patch(`/api/places/${placeId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'hack' });
    expect(res.status).toBe(403);
  });

  it('admin PATCH ile mekanı günceller', async () => {
    const res = await request(app)
      .patch(`/api/places/${placeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Güncellenmiş İsim' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Güncellenmiş İsim');
  });

  it('review eklenince ortalama puan güncellenir ve GET .../reviews ile listelenir', async () => {
    const res = await request(app)
      .post(`/api/places/${placeId}/reviews`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        internetSpeed: 5,
        outletCount: 5,
        noiseLevel: 5,
        coffeeQuality: 5,
        workEnvironment: 5,
        priceLevel: 2,
        overallRating: 5,
        comment: 'E2E test yorumu',
      });
    expect(res.status).toBe(201);

    const detail = await request(app).get(`/api/places/${placeId}`);
    expect(detail.body.ratings.overallRating).toBe(5);
    expect(detail.body.ratings.reviewCount).toBe(1);

    const reviewsRes = await request(app).get(`/api/places/${placeId}/reviews`);
    expect(reviewsRes.status).toBe(200);
    expect(reviewsRes.body).toHaveLength(1);
    expect(reviewsRes.body[0].comment).toBe('E2E test yorumu');
  });

  it('admin olmayan kullanıcı mekanı silemez (403)', async () => {
    const deleteRes = await request(app)
      .delete(`/api/places/${placeId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(deleteRes.status).toBe(403);
  });

  it('admin mekanı siler', async () => {
    const deleteRes = await request(app)
      .delete(`/api/places/${placeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(204);
    placeId = null;
  });
});
