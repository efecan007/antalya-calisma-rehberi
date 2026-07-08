/**
 * Integration test: gerçek PostgreSQL'e karşı çalışır.
 * Önkoşul: `docker compose up -d db` (veya tüm stack) ayakta olmalı ve
 * DATABASE_URL ortam değişkeni o veritabanını göstermeli.
 */
const { PrismaClient } = require('@prisma/client');
const PlacesRepository = require('../../../src/modules/places/infrastructure/places.repository');

const prisma = new PrismaClient();
const repository = new PlacesRepository(prisma);

let createdPlaceId;

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  if (createdPlaceId) {
    await prisma.place.deleteMany({ where: { id: createdPlaceId } });
  }
  await prisma.$disconnect();
});

describe('PlacesRepository (integration)', () => {
  it('bir mekan oluşturur, id ile bulur, günceller ve siler', async () => {
    const place = await repository.create({
      name: 'Test Entegrasyon Kafesi',
      type: 'CAFE',
      region: 'MURATPASA',
      address: 'Test Adres',
      lat: 36.9,
      lng: 30.7,
      description: 'Integration test için geçici kayıt',
      priceLevel: 2,
    });
    createdPlaceId = place.id;

    expect(place.id).toBeDefined();
    expect(place.name).toBe('Test Entegrasyon Kafesi');

    const found = await repository.findById(place.id);
    expect(found).not.toBeNull();
    expect(found.reviews).toEqual([]);

    const updated = await repository.update(place.id, { name: 'Güncellenmiş İsim' });
    expect(updated.name).toBe('Güncellenmiş İsim');

    await repository.delete(place.id);
    const afterDelete = await repository.findById(place.id);
    expect(afterDelete).toBeNull();
    createdPlaceId = null;
  });
});
