/**
 * E2E test: mekan oluşturma, listeleme, review ekleme ve yetkisiz erişim reddi.
 * Önkoşul: `docker compose up -d db redis` (veya tüm stack) ayakta olmalı.
 */
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { createApp } = require('../../src/shared/infrastructure/http/expressApp');
const { invalidate } = require('../../src/shared/infrastructure/cache/cache');
const { getRedisClient } = require('../../src/shared/infrastructure/cache/redisClient');

const prisma = new PrismaClient();
const app = createApp();
const testEmail = `e2e-places-${Date.now()}@example.com`;

let token;
let userId;
let placeId;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: testEmail, password: 'Sifre123!', name: 'E2E Places Kullanici' });
  token = res.body.token;
  userId = res.body.user.id;
});

afterAll(async () => {
  if (placeId) await prisma.place.deleteMany({ where: { id: placeId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await invalidate('places:list:*');
  await prisma.$disconnect();
  await getRedisClient().quit();
});

describe('Places + Reviews flow (e2e)', () => {
  it('giriş yapmadan mekan oluşturma 401 döner', async () => {
    const res = await request(app).post('/api/places').send({ name: 'x' });
    expect(res.status).toBe(401);
  });

  it('giriş yapmış kullanıcı mekan oluşturabilir', async () => {
    const res = await request(app)
      .post('/api/places')
      .set('Authorization', `Bearer ${token}`)
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
    expect(res.body.ratings.reviewCount).toBe(0);
    placeId = res.body.id;
  });

  it('oluşturulan mekan listede görünür', async () => {
    const res = await request(app).get('/api/places').query({ region: 'MURATPASA' });
    expect(res.status).toBe(200);
    expect(res.body.some((p) => p.id === placeId)).toBe(true);
  });

  it('review eklenince ortalama puan güncellenir', async () => {
    const res = await request(app)
      .post(`/api/places/${placeId}/reviews`)
      .set('Authorization', `Bearer ${token}`)
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

  it('mekanı oluşturmayan başka bir kullanıcı silemez', async () => {
    const otherEmail = `e2e-places-other-${Date.now()}@example.com`;
    const otherRes = await request(app)
      .post('/api/auth/register')
      .send({ email: otherEmail, password: 'Sifre123!', name: 'Başka Kullanıcı' });

    const deleteRes = await request(app)
      .delete(`/api/places/${placeId}`)
      .set('Authorization', `Bearer ${otherRes.body.token}`);

    expect(deleteRes.status).toBe(403);

    await prisma.user.deleteMany({ where: { id: otherRes.body.user.id } });
  });
});
