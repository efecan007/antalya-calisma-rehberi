/**
 * E2E test: mekan önerisi/onay akışı, listeleme, review ekleme ve yetkisiz erişim reddi.
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

describe('Places + Reviews flow (e2e)', () => {
  it('giriş yapmadan mekan oluşturma 401 döner', async () => {
    const res = await request(app).post('/api/places').send({ name: 'x' });
    expect(res.status).toBe(401);
  });

  it('kayıtlı kullanıcı mekan önerdiğinde PENDING olarak oluşur', async () => {
    const res = await request(app)
      .post('/api/places')
      .set('Authorization', `Bearer ${userToken}`)
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
    expect(res.body.status).toBe('PENDING');
    placeId = res.body.id;
  });

  it('onaylanmamış mekan herkese açık listede görünmez', async () => {
    const res = await request(app).get('/api/places').query({ region: 'MURATPASA' });
    expect(res.status).toBe(200);
    expect(res.body.some((p) => p.id === placeId)).toBe(false);
  });

  it('onaylanmamış mekanı öneren kullanıcı kendi detayını görebilir, başkası göremez', async () => {
    const ownerRes = await request(app)
      .get(`/api/places/${placeId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(ownerRes.status).toBe(200);

    const anonRes = await request(app).get(`/api/places/${placeId}`);
    expect(anonRes.status).toBe(404);
  });

  it('admin olmayan kullanıcı mekanı onaylayamaz', async () => {
    const res = await request(app)
      .post(`/api/places/${placeId}/approve`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('admin mekanı onaylayınca herkese açık listede görünür', async () => {
    const approveRes = await request(app)
      .post(`/api/places/${placeId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe('APPROVED');

    const listRes = await request(app).get('/api/places').query({ region: 'MURATPASA' });
    expect(listRes.body.some((p) => p.id === placeId)).toBe(true);
  });

  it('review eklenince ortalama puan güncellenir', async () => {
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
  });

  it('admin olmayan kullanıcı mekanı silemez', async () => {
    const deleteRes = await request(app)
      .delete(`/api/places/${placeId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(deleteRes.status).toBe(403);
  });

  it('favori ekleme/çıkarma döngüsü çalışır', async () => {
    const addRes = await request(app)
      .post(`/api/places/${placeId}/favorite`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(addRes.status).toBe(204);

    const listRes = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.some((p) => p.id === placeId)).toBe(true);

    const removeRes = await request(app)
      .delete(`/api/places/${placeId}/favorite`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(removeRes.status).toBe(204);

    const listAfterRes = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${userToken}`);
    expect(listAfterRes.body.some((p) => p.id === placeId)).toBe(false);
  });

  it('admin mekanı siler', async () => {
    const deleteRes = await request(app)
      .delete(`/api/places/${placeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(204);
    placeId = null;
  });
});
