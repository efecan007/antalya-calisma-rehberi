/**
 * DEMO VERİ NOTU: Aşağıdaki mekanların İSİMLERİ ve KOORDİNATLARI, Antalya'da
 * gerçekten var olan (Google Maps'te kayıtlı) işletme/kurumlara aittir; bu sayede
 * Google Places zenginleştirmesi doğru mekanla eşleşir. Ancak açıklamalar, review
 * puanları ve fiyat seviyeleri hâlâ ÖRNEK/İLLÜSTRATİF değerlerdir — bu işletmeler
 * hakkında doğrulanmış gerçek görüş/fiyat verisi DEĞİLDİR ve onları resmî olarak
 * temsil etmez. Üretim ortamında gerçek kullanıcı verisiyle beslenmelidir.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Tür bazlı varsayılan çalışma saatleri (demo veri için); gerçek mekan
// verisiyle değiştirildiğinde her mekan kendi saatlerini alacaktır.
const DEFAULT_HOURS_BY_TYPE = {
  HOTEL: { openTime: '00:00', closeTime: '23:59' },
  CAFE: { openTime: '08:00', closeTime: '22:00' },
  LIBRARY: { openTime: '09:00', closeTime: '18:00' },
  COWORKING: { openTime: '08:00', closeTime: '20:00' },
};

// "Tahmini yoğunluk" özelliğinin gösterecek bir şeyi olsun diye, tür bazlı
// gerçekçi haftalık örüntülerle geçmişe dönük demo check-in verisi üretilir.
const FORECAST_SEED_DAYS = 45;
const CHECKIN_HOUR_RANGE = { start: 8, end: 22 };
const WEEKDAYS_MON_FRI = [1, 2, 3, 4, 5];
const DAY_PATTERNS_BY_TYPE = {
  CAFE: { peakHours: [14, 15, 16], weekdays: WEEKDAYS_MON_FRI },
  COWORKING: { peakHours: [9, 10, 11, 14, 15, 16, 17], weekdays: WEEKDAYS_MON_FRI },
  LIBRARY: { peakHours: [15, 16, 17], weekdays: WEEKDAYS_MON_FRI },
  HOTEL: { peakHours: [18, 19, 20], weekdays: [0, 1, 2, 3, 4, 5, 6] },
};

async function seedOccupancyHistory(place, users) {
  const alreadySeeded = await prisma.occupancyCheckIn.count({ where: { placeId: place.id } });
  if (alreadySeeded > 0) return;

  const pattern = DAY_PATTERNS_BY_TYPE[place.type] || DAY_PATTERNS_BY_TYPE.CAFE;
  const rows = [];

  for (let daysAgo = 1; daysAgo <= FORECAST_SEED_DAYS; daysAgo += 1) {
    const day = new Date();
    day.setDate(day.getDate() - daysAgo);
    const isPatternDay = pattern.weekdays.includes(day.getDay());

    for (let hour = CHECKIN_HOUR_RANGE.start; hour <= CHECKIN_HOUR_RANGE.end; hour += 1) {
      const isPeak = isPatternDay && pattern.peakHours.includes(hour);
      const checkinCount = isPeak ? 2 + Math.floor(Math.random() * 3) : Math.random() < 0.35 ? 1 : 0;

      for (let i = 0; i < checkinCount; i += 1) {
        const level = isPeak
          ? Math.random() < 0.75 ? 'HIGH' : 'MEDIUM'
          : Math.random() < 0.7 ? 'LOW' : 'MEDIUM';
        const createdAt = new Date(day);
        createdAt.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
        const user = users[Math.floor(Math.random() * users.length)];
        rows.push({ placeId: place.id, userId: user.id, level, createdAt });
      }
    }
  }

  if (rows.length) {
    await prisma.occupancyCheckIn.createMany({ data: rows });
  }
}

const PLACES = [
  {
    name: 'Doğan Hotel',
    type: 'HOTEL',
    region: 'KALEICI',
    address: 'Kılınçarslan, Mermerli Banyo Sk. No:5, Kaleiçi, Muratpaşa',
    lat: 36.883819,
    lng: 30.7049123,
    description: 'Tarihi Kaleiçi içinde, sakin ortamıyla çalışmaya elverişli butik otel.',
    priceLevel: 3,
  },
  {
    name: 'The Beaver Coffee Shop Kaleiçi',
    type: 'CAFE',
    region: 'KALEICI',
    address: 'Tuzcular, Paşa Cami Sk. No:17, Kaleiçi, Muratpaşa',
    lat: 36.8849673,
    lng: 30.7062533,
    description: 'Kaleiçi\'nin merkezinde, kahve molası vererek çalışmak için uygun bir mekan.',
    priceLevel: 2,
  },
  {
    name: 'Antalya Büyükşehir Belediyesi Kitap ve Oyuncak Kütüphanesi',
    type: 'LIBRARY',
    region: 'MURATPASA',
    address: 'Etiler Mahallesi, 829. Sk. No:8, Muratpaşa',
    lat: 36.8976633,
    lng: 30.7088321,
    description: 'Sessiz çalışma ortamı ve ücretsiz internet sunan belediye kütüphanesi.',
    priceLevel: 1,
  },
  {
    name: 'Bonavias Konyaaltı Sahil',
    type: 'CAFE',
    region: 'KONYAALTI',
    address: 'Altınkum, Belediye Cd. No:130/A, Konyaaltı',
    lat: 36.8632282,
    lng: 30.6362961,
    description: 'Konyaaltı sahiline yakın, geniş oturma alanlı sahil cafe.',
    priceLevel: 3,
  },
  {
    name: 'Lemon Hotel',
    type: 'HOTEL',
    region: 'KONYAALTI',
    address: 'Arapsuyu, Belediye Cd. No:16, Konyaaltı',
    lat: 36.8755907,
    lng: 30.6542301,
    description: 'Konyaaltı bölgesinde, lobi ve ortak alanlarında çalışılabilen otel.',
    priceLevel: 3,
  },
  {
    name: 'Balkon Cafe Lara',
    type: 'CAFE',
    region: 'LARA',
    address: 'Fener, Lara Cd. No:223, Muratpaşa',
    lat: 36.8489152,
    lng: 30.7530942,
    description: 'Lara Caddesi üzerinde, gün boyu açık, çalışmaya uygun bir cafe.',
    priceLevel: 3,
  },
  {
    name: 'Club Hotel Sera',
    type: 'HOTEL',
    region: 'LARA',
    address: 'Güzeloba, Lara Cd. No:204, Muratpaşa',
    lat: 36.84927,
    lng: 30.8061455,
    description: 'Lara sahilinde geniş lobi ve ortak alanlara sahip resort otel.',
    priceLevel: 4,
  },
  {
    name: 'Cemil Meriç Kütüphanesi',
    type: 'LIBRARY',
    region: 'KEPEZ',
    address: 'Dokumapark içi, Fabrikalar, Namık Kemal Bulvarı, Kepez',
    lat: 36.9120686,
    lng: 30.6729896,
    description: 'Dokumapark içindeki modern kütüphane; çalışma masaları ve sessiz katlar.',
    priceLevel: 1,
  },
  {
    name: 'Understone Döşemealtı',
    type: 'CAFE',
    region: 'DOSEMEALTI',
    address: 'Altınkale, Şht. Mustafa Gürcan Cd. No:79A, Döşemealtı',
    lat: 37.0198941,
    lng: 30.6131131,
    description: 'Şehir dışında, sakin ortamıyla çalışmaya uygun bir cafe.',
    priceLevel: 2,
  },
  {
    name: 'Cafe Park',
    type: 'CAFE',
    region: 'AKSU',
    address: 'Güzelyurt, Lara Cd., Aksu',
    lat: 36.9292212,
    lng: 30.8158468,
    description: 'Aksu bölgesinde, açık alanı olan geniş bir cafe.',
    priceLevel: 3,
  },
  {
    name: 'Granada Luxury Belek',
    type: 'HOTEL',
    region: 'BELEK',
    address: 'Belek, Barış Cd. No:1/9, Serik',
    lat: 36.8589836,
    lng: 31.0716669,
    description: 'Belek turizm bölgesinde geniş lobi ve ortak alanlara sahip resort otel.',
    priceLevel: 4,
  },
  {
    name: 'Serik Halk Kütüphanesi',
    type: 'LIBRARY',
    region: 'BELEK',
    address: 'Orta, 1033. Sk. 9/1, Serik',
    lat: 36.9155028,
    lng: 31.0995719,
    description: 'Serik merkezinde, klimalı okuma salonlarına sahip halk kütüphanesi.',
    priceLevel: 1,
  },
  {
    name: 'Coworking Mozaik Antalya',
    type: 'COWORKING',
    region: 'KONYAALTI',
    address: 'Pınarbaşı, 739. Sk. No:17, Konyaaltı',
    lat: 36.88774,
    lng: 30.65352,
    description: 'Paylaşımlı ofis, hazır ofis ve toplantı salonları sunan coworking alanı.',
    priceLevel: 3,
  },
  {
    name: 'Coworking Antalya by Fikaye',
    type: 'COWORKING',
    region: 'MURATPASA',
    address: 'Sinan, 1251. Sk. No:24, Muratpaşa',
    lat: 36.8875481,
    lng: 30.7091177,
    description: 'Şehir merkezinde açık ofis masaları ve toplantı alanları olan coworking.',
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

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@workfromhotel.com' },
    update: {},
    create: {
      email: 'admin@workfromhotel.com',
      passwordHash,
      name: 'Demo Admin',
      role: 'ADMIN',
    },
  });
  const occupancySeedUsers = [demoUser, adminUser];

  for (const placeData of PLACES) {
    const hours = DEFAULT_HOURS_BY_TYPE[placeData.type] ?? {};
    const existing = await prisma.place.findFirst({ where: { name: placeData.name } });
    if (existing) {
      if (existing.openTime === null && existing.closeTime === null) {
        await prisma.place.update({ where: { id: existing.id }, data: hours });
      }
      await seedOccupancyHistory(existing, occupancySeedUsers);
      continue;
    }

    const place = await prisma.place.create({
      data: { ...placeData, ...hours, createdById: demoUser.id },
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

    await seedOccupancyHistory(place, occupancySeedUsers);
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
