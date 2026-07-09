/**
 * DEMO VERİ UYARISI: Buradaki mekanlar Antalya'nın gerçek bölgelerine (Lara,
 * Konyaaltı, Kaleiçi, Muratpaşa, Kepez, Belek, ...) yerleştirilmiş, gerçekçi
 * koordinatlara sahip ÖRNEK/DEMO kayıtlardır. İsimler, açıklamalar, review
 * puanları ve fiyat seviyeleri kurgusaldır; belirli bir gerçek işletmeyi
 * (ör. bir otel zincirini) temsil etmez ve doğrulanmış gerçek veri değildir.
 * Üretim ortamında gerçek mekan verisiyle değiştirilmelidir.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PLACES = [
  {
    name: 'Kaleiçi Konak Otel Lobisi',
    type: 'HOTEL',
    region: 'KALEICI',
    address: 'Kaleiçi, Hesapçı Sokak, Muratpaşa',
    lat: 36.8841,
    lng: 30.7056,
    description: 'Tarihi Kaleiçi içinde sakin, hızlı wifi\'ye sahip butik otel lobisi.',
    priceLevel: 3,
  },
  {
    name: 'Liman Cafe',
    type: 'CAFE',
    region: 'KALEICI',
    address: 'Yat Limanı Caddesi, Kaleiçi',
    lat: 36.8822,
    lng: 30.7061,
    description: 'Deniz manzaralı, priz sayısı bol, öğleden sonraları kalabalık olabiliyor.',
    priceLevel: 2,
  },
  {
    name: 'Muratpaşa Belediyesi Halk Kütüphanesi',
    type: 'LIBRARY',
    region: 'MURATPASA',
    address: 'Şirinyalı Mahallesi, Muratpaşa',
    lat: 36.8969,
    lng: 30.7133,
    description: 'Sessiz çalışma odaları ve ücretsiz internet sunan halk kütüphanesi.',
    priceLevel: 1,
  },
  {
    name: 'Konyaaltı Sahil Cafe & Coworking',
    type: 'CAFE',
    region: 'KONYAALTI',
    address: 'Konyaaltı Sahili, Liman Mahallesi',
    lat: 36.8608,
    lng: 30.6389,
    description: 'Coworking alanına sahip, güçlü fiber internet, geniş masalar.',
    priceLevel: 3,
  },
  {
    name: 'Akdeniz Otel Business Lounge',
    type: 'HOTEL',
    region: 'KONYAALTI',
    address: 'Akdeniz Bulvarı, Konyaaltı',
    lat: 36.8651,
    lng: 30.6455,
    description: 'İş insanlarına yönelik sessiz lobi alanı, sınırsız kahve.',
    priceLevel: 4,
  },
  {
    name: 'Lara Plaj Kahvesi',
    type: 'CAFE',
    region: 'LARA',
    address: 'Lara Caddesi, Muratpaşa',
    lat: 36.8493,
    lng: 30.7963,
    description: 'Turistik bölgede, deniz manzaralı ama zaman zaman gürültülü.',
    priceLevel: 3,
  },
  {
    name: 'Lara Sahil Resort Lobisi',
    type: 'HOTEL',
    region: 'LARA',
    address: 'Lara Turizm Merkezi',
    lat: 36.8475,
    lng: 30.8102,
    description: 'Geniş lobi, hızlı internet, çok sayıda priz noktası.',
    priceLevel: 4,
  },
  {
    name: 'Kepez Kent Kütüphanesi',
    type: 'LIBRARY',
    region: 'KEPEZ',
    address: 'Kepez Belediyesi Kültür Merkezi',
    lat: 36.9381,
    lng: 30.7241,
    description: 'Yeni açılan modern kütüphane, çalışma masaları ve sessiz katlar.',
    priceLevel: 1,
  },
  {
    name: 'Döşemealtı Orman Kahvesi',
    type: 'CAFE',
    region: 'DOSEMEALTI',
    address: 'Yeniköy Mahallesi, Döşemealtı',
    lat: 37.0167,
    lng: 30.5667,
    description: 'Şehir dışında sakin bir ortam, doğa manzaralı çalışma alanı.',
    priceLevel: 2,
  },
  {
    name: 'Aksu Havalimanı Business Cafe',
    type: 'CAFE',
    region: 'AKSU',
    address: 'Aksu, Havalimanı Yolu',
    lat: 36.9036,
    lng: 30.8006,
    description: 'Uçuş öncesi/sonrası çalışmak için pratik, sınırlı priz sayısı.',
    priceLevel: 3,
  },
  {
    name: 'Belek Golf Resort Lobisi',
    type: 'HOTEL',
    region: 'BELEK',
    address: 'Belek Turizm Merkezi, Serik',
    lat: 36.8625,
    lng: 31.0556,
    description: 'Golf sahasına bakan sakin lobi, iş toplantıları için ayrılmış köşeler.',
    priceLevel: 4,
  },
  {
    name: 'Belek Merkez Kütüphanesi',
    type: 'LIBRARY',
    region: 'BELEK',
    address: 'Kadriye Mahallesi, Belek',
    lat: 36.8558,
    lng: 31.0503,
    description: 'Sezon dışında sakin, klimalı okuma salonlarına sahip küçük bir kütüphane.',
    priceLevel: 1,
  },
  {
    name: 'Konyaaltı Ortak Çalışma Alanı',
    type: 'COWORKING',
    region: 'KONYAALTI',
    address: 'Akdeniz Mahallesi, Konyaaltı',
    lat: 36.876,
    lng: 30.66,
    description: 'Günlük/aylık masa kiralama, sabit fiber internet ve toplantı odaları olan coworking alanı.',
    priceLevel: 3,
  },
  {
    name: 'Muratpaşa Coworking Hub',
    type: 'COWORKING',
    region: 'MURATPASA',
    address: 'Fener Mahallesi, Muratpaşa',
    lat: 36.8802,
    lng: 30.7339,
    description: 'Açık ofis masaları, telefon kabinleri ve sınırsız kahve sunan şehir merkezi coworking alanı.',
    priceLevel: 3,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@workfromhotel.com' },
    update: {},
    create: {
      email: 'demo@workfromhotel.com',
      passwordHash,
      name: 'Demo Kullanıcı',
      role: 'USER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@workfromhotel.com' },
    update: {},
    create: {
      email: 'admin@workfromhotel.com',
      passwordHash,
      name: 'Demo Admin',
      role: 'ADMIN',
    },
  });

  for (const placeData of PLACES) {
    const existing = await prisma.place.findFirst({ where: { name: placeData.name } });
    if (existing) continue;

    const place = await prisma.place.create({
      data: { ...placeData, createdById: demoUser.id },
    });

    await prisma.review.create({
      data: {
        placeId: place.id,
        userId: demoUser.id,
        internetSpeed: 4,
        outletCount: 3,
        noiseLevel: 4,
        coffeeQuality: 4,
        workEnvironment: 4,
        priceLevel: placeData.priceLevel,
        overallRating: 4,
        comment: 'Başlangıç için eklenen örnek değerlendirme.',
      },
    });
  }

  console.log('Seed verisi başarıyla yüklendi.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
