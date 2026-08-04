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
  // --- Beach Park / Konyaaltı çevresi (koordinat/adres Google Places'ten) ---
  {
    name: 'Beach Park Antalya',
    type: 'CAFE',
    region: 'KONYAALTI',
    address: 'Meltem, Beach Park, Muratpaşa',
    lat: 36.879845,
    lng: 30.6673929,
    description: 'Sahilde, deniz manzaralı kafe ve restoranların bulunduğu geniş sahil kompleksi.',
    priceLevel: 2,
  },
  {
    name: 'Big Chefs - Konyaaltı',
    type: 'CAFE',
    region: 'KONYAALTI',
    address: 'Kuşkavağı, Akdeniz Blv. No:110, Konyaaltı',
    lat: 36.8700225,
    lng: 30.649982,
    description: 'Geniş oturma alanı ve gün boyu servisiyle laptopla çalışmaya uygun kafe-restoran.',
    priceLevel: 3,
  },
  {
    name: 'Kahve Dünyası - Konyaaltı Liman',
    type: 'CAFE',
    region: 'KONYAALTI',
    address: 'Liman, Boğaçay Cd. No:22/1, Konyaaltı',
    lat: 36.851554,
    lng: 30.6170378,
    description: 'Konyaaltı Liman bölgesinde, kahve eşliğinde çalışılabilecek zincir kafe.',
    priceLevel: 2,
  },
  {
    name: 'Starbucks - Konyaaltı Kent Meydanı',
    type: 'CAFE',
    region: 'KONYAALTI',
    address: 'Arapsuyu, Akdeniz Blv. Kent Meydanı No:176, Konyaaltı',
    lat: 36.8620041,
    lng: 30.637598,
    description: 'Kent Meydanı yakınında, priz ve internet imkânıyla çalışmaya uygun kafe.',
    priceLevel: 3,
  },
  // --- Lara / Feneryolu çevresi ---
  {
    name: 'Big Chefs - Lara',
    type: 'CAFE',
    region: 'LARA',
    address: 'Fener, Lara Cd. No:307/2, Muratpaşa',
    lat: 36.8483082,
    lng: 30.7553971,
    description: 'Lara Fener bölgesinde, geniş masalarıyla çalışmaya uygun kafe-restoran.',
    priceLevel: 3,
  },
  {
    name: 'Starbucks - Lara',
    type: 'CAFE',
    region: 'LARA',
    address: 'Fener, Lara Cd. No:24, Muratpaşa',
    lat: 36.8477704,
    lng: 30.7613358,
    description: 'Lara Caddesi üzerinde, internet ve priz imkânıyla çalışmaya uygun kafe.',
    priceLevel: 3,
  },
  {
    name: 'MADO - Düdenpark Lara',
    type: 'CAFE',
    region: 'LARA',
    address: 'Fener, Tekelioğlu Cd., Muratpaşa',
    lat: 36.8512858,
    lng: 30.7808503,
    description: 'Düden Parkı yakınında, açık alanı da olan geniş bir kafe.',
    priceLevel: 2,
  },
  // --- Muratpaşa merkez ---
  {
    name: 'Kahve Dünyası - Şirinyalı',
    type: 'CAFE',
    region: 'MURATPASA',
    address: 'Şirinyalı, İsmet Gökşen Cd., Muratpaşa',
    lat: 36.8638016,
    lng: 30.7287288,
    description: 'Şirinyalı kafe sokağında, kahve eşliğinde çalışılabilecek zincir kafe.',
    priceLevel: 2,
  },
  {
    name: 'Starbucks - MarkAntalya',
    type: 'CAFE',
    region: 'MURATPASA',
    address: 'MarkAntalya AVM, Tahılpazarı, Kazım Özalp Cd. No:88, Muratpaşa',
    lat: 36.8927775,
    lng: 30.703333,
    description: 'MarkAntalya AVM içinde, şehir merkezinde çalışmaya uygun kafe.',
    priceLevel: 3,
  },
  {
    name: 'Kahve Dünyası - MarkAntalya',
    type: 'CAFE',
    region: 'MURATPASA',
    address: 'MarkAntalya AVM, Tahılpazarı, Şarampol Cd. No:84, Muratpaşa',
    lat: 36.893047,
    lng: 30.7041048,
    description: 'MarkAntalya AVM içinde, merkezi konumda zincir kafe.',
    priceLevel: 2,
  },
  // --- Coworking / paylaşımlı ofis (koordinat/adres Google Places'ten) ---
  {
    name: 'Inowork Coworking',
    type: 'COWORKING',
    region: 'MURATPASA',
    address: 'Yenigün, Mevlana Cd. Midtown Plaza B Blok, Muratpaşa',
    lat: 36.893395,
    lng: 30.7158679,
    description: 'Coworking, hazır ofis, sanal ofis ve paylaşımlı ofis hizmetleri sunan çalışma alanı.',
    priceLevel: 3,
  },
  {
    name: 'Work C Paylaşımlı Ofis',
    type: 'COWORKING',
    region: 'MURATPASA',
    address: 'Yenigün, Kızılırmak Cd. Safa Plaza Kat:3, Muratpaşa',
    lat: 36.9021857,
    lng: 30.7167935,
    description: 'Paylaşımlı ofis, hazır ofis ve sanal ofis seçenekleri sunan çalışma merkezi.',
    priceLevel: 3,
  },
  // --- Çalışmaya uygun bağımsız kafeler (koordinat/adres Google Places'ten) ---
  {
    name: 'jiraf coffee & book',
    type: 'CAFE',
    region: 'KONYAALTI',
    address: 'Gürsu, 312. Sk., Konyaaltı',
    lat: 36.8636949,
    lng: 30.6329675,
    description: 'Kitap kafe konseptinde, sessiz ortamıyla kahve eşliğinde çalışmaya uygun mekan.',
    priceLevel: 2,
  },
  {
    name: 'MEF Space Café',
    type: 'CAFE',
    region: 'LARA',
    address: 'Fener, 1996. Sk. No:5A, Muratpaşa',
    lat: 36.8484802,
    lng: 30.7589575,
    description: 'Lara Fener bölgesinde, kahve ve fırın ürünleri sunan çalışmaya uygun kafe.',
    priceLevel: 2,
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
