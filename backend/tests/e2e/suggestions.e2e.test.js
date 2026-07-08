/**
 * E2E test: mekan önerisi gönderme + admin onay/red akışı.
 * Önkoşul: `docker compose up -d db redis` (veya tüm stack) ayakta olmalı.
 */
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { createApp } = require('../../src/app');
const { invalidate } = require('../../src/modules/cache/cache.service');
const { getRedisClient } = require('../../src/modules/cache/redis.client');

const prisma = new PrismaClient();
const app = createApp();
const userEmail = `e2e-suggestions-${Date.now()}@example.com`;
const adminEmail = `e2e-suggestions-admin-${Date.now()}@example.com`;

let userToken;
let userId;
let adminToken;
let adminId;
let placeId;
let rejectedPlaceId;

beforeAll(async () => {
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ email: userEmail, password: 'Sifre123!', name: 'E2E Suggestions Kullanici' });
  userToken = userRes.body.token;
  userId = userRes.body.user.id;

  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({ email: adminEmail, password: 'Sifre123!', name: 'E2E Suggestions Admin' });
  adminId = adminRes.body.user.id;
  await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: adminEmail, password: 'Sifre123!' });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  const ids = [placeId, rejectedPlaceId].filter(Boolean);
  if (ids.length) await prisma.place.deleteMany({ where: { id: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, adminId] } } });
  await invalidate('places:list:*');
  await prisma.$disconnect();
  await getRedisClient().quit();
});

describe('Suggestions flow (e2e)', () => {
  it('giriş yapmadan öneri gönderme 401 döner', async () => {
    const res = await request(app).post('/api/suggestions').send({ name: 'x' });
    expect(res.status).toBe(401);
  });

  it('kayıtlı kullanıcı öneri gönderdiğinde PENDING olarak oluşur', async () => {
    const res = await request(app)
      .post('/api/suggestions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'E2E Öneri Kafesi',
        type: 'CAFE',
        region: 'MURATPASA',
        address: 'Test Sokak No:2',
        lat: 36.9,
        lng: 30.7,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    placeId = res.body.id;
  });

  it('admin gönderse bile öneri PENDING olur (asla otomatik yayınlanmaz)', async () => {
    const res = await request(app)
      .post('/api/suggestions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Admin Önerisi',
        type: 'CAFE',
        region: 'LARA',
        address: 'Test Sokak No:3',
        lat: 36.8,
        lng: 30.8,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    rejectedPlaceId = res.body.id;
  });

  it('onaylanmamış öneri herkese açık listede görünmez', async () => {
    const res = await request(app).get('/api/places').query({ region: 'MURATPASA' });
    expect(res.body.some((p) => p.id === placeId)).toBe(false);
  });

  it('token olmadan /admin/suggestions 401 döner', async () => {
    const res = await request(app).get('/api/admin/suggestions');
    expect(res.status).toBe(401);
  });

  it('admin olmayan kullanıcı /admin/suggestions göremez, onaylayamaz, reddedemez', async () => {
    const listRes = await request(app)
      .get('/api/admin/suggestions')
      .set('Authorization', `Bearer ${userToken}`);
    expect(listRes.status).toBe(403);

    const approveRes = await request(app)
      .patch(`/api/admin/suggestions/${placeId}/approve`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(approveRes.status).toBe(403);
  });

  it('admin bekleyen önerileri listeler', async () => {
    const res = await request(app)
      .get('/api/admin/suggestions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((p) => p.id === placeId)).toBe(true);
    expect(res.body.some((p) => p.id === rejectedPlaceId)).toBe(true);
  });

  it('admin onaylayınca herkese açık listede görünür', async () => {
    const approveRes = await request(app)
      .patch(`/api/admin/suggestions/${placeId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe('APPROVED');

    const listRes = await request(app).get('/api/places').query({ region: 'MURATPASA' });
    expect(listRes.body.some((p) => p.id === placeId)).toBe(true);
  });

  it('admin reddedince liste dışında kalır', async () => {
    const rejectRes = await request(app)
      .patch(`/api/admin/suggestions/${rejectedPlaceId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.status).toBe('REJECTED');

    const listRes = await request(app).get('/api/places').query({ region: 'LARA' });
    expect(listRes.body.some((p) => p.id === rejectedPlaceId)).toBe(false);
  });
});
