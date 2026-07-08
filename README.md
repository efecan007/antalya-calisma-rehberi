# Work From Hotel / Cafe — Antalya

Antalya'da uzaktan çalışmaya uygun otel lobisi, kafe ve kütüphaneleri harita üzerinde listeleyen, internet hızı, priz sayısı, sessizlik, kahve kalitesi, çalışma ortamı, fiyat seviyesi ve genel puana göre değerlendirme yapılabilen bir rehber sitesi.

## Stack
- Backend: Node.js + Express + Prisma ORM
- Frontend: React + Vite + Tailwind CSS + Leaflet (OpenStreetMap)
- Veritabanı: PostgreSQL
- Cache: Redis
- Auth: JWT
- Docker + Docker Compose

## Mimari

Backend, **tek bir deploy edilebilir birim** (monolith) olarak kalırken içeride **modüllere** ayrılmış bir **Modular Monolith**'tir. Her modül (`users`, `places`, `reviews`) kendi içinde **Clean/Hexagonal Architecture** katmanlarına sahiptir:

```
backend/src/
├── modules/
│   ├── users/
│   │   ├── domain/           saf iş kuralları: User entity, UserRepository "port"u
│   │   ├── application/      use-case'ler (registerUser, loginUser, getCurrentUser)
│   │   └── infrastructure/   Express route/controller + PrismaUserRepository "adapter"ı
│   ├── places/                (Place, PlaceType, Region + CRUD use-case'leri + cache-aside)
│   └── reviews/                (Rating value object, RatingAggregator, review use-case'leri)
└── shared/
    ├── domain/errors.js       tipli hata sınıfları (NotFoundError, ValidationError, ...)
    └── infrastructure/        Prisma client, Redis client + cache helper, JWT/bcrypt, Express app
```

- **Domain katmanı** hiçbir framework'e (Express, Prisma) bağımlı değildir; yalnızca entity'ler, value object'ler (ör. `Rating` 1-5 aralığını kendi kendine doğrular) ve **Repository Pattern** ile tanımlanmış port'lar (arayüzler) içerir.
- **Application katmanı** use-case sınıflarından oluşur; iş kurallarını (ör. "bir kullanıcı bir mekana yalnızca bir kez yorum yapabilir", "bir mekanı yalnızca sahibi veya admin silebilir") burada uygular ve yalnızca repository *port*'larına bağımlıdır — bu sayede DB olmadan, sahte (in-memory) repository'lerle unit test edilebilir.
- **Infrastructure katmanı** Prisma repository implementasyonlarını (port'ları gerçekleştiren "adapter"lar), Express controller/route'larını ve Redis/JWT/bcrypt gibi dış dünya bağlantılarını barındırır.
- **DDD** mantığı: her modülün kendi domain dili vardır (`Place`, `Review`, `Rating`, `PlaceType`, `Region`); ortalama puan hesaplama gibi iş kuralları `RatingAggregator` domain servisinde tek yerde yaşar (DRY).
- **Redis cache**: `GET /api/places` ve `GET /api/places/:id` sonuçları cache-aside deseniyle (`shared/infrastructure/cache/cache.js`) 60 saniye cache'lenir; bir mekan/yorum oluşturulduğunda, güncellendiğinde veya silindiğinde ilgili cache anahtarları invalide edilir. Redis'e erişilemezse sistem cache'siz (doğrudan DB'den) çalışmaya devam eder — cache bir "nice-to-have"dir, kritik yol değildir.

## Testler (Test Pyramid)

`backend/tests/` üç katmana ayrılmıştır:

| Katman | Konum | Kapsam | Gereksinim |
|---|---|---|---|
| **Unit** (taban, en çok test) | `tests/unit/` | Domain value object'leri (`Rating`), domain servisleri (`RatingAggregator`), use-case'ler sahte in-memory repository'lerle | Yok — her ortamda çalışır |
| **Integration** (orta) | `tests/integration/` | Prisma repository'lerinin gerçek PostgreSQL'e karşı çalışması, cache helper'ının gerçek Redis'e karşı çalışması | `docker compose up -d db redis` |
| **E2E** (tepe, en az test) | `tests/e2e/` | Tüm Express uygulamasının `supertest` ile HTTP üzerinden uçtan uca test edilmesi (register→login→me, mekan oluştur→listele→review ekle→ortalama güncellenir→yetkisiz silme reddi) | `docker compose up -d db redis` |

```bash
cd backend
npm run test:unit          # DB/Redis gerekmez
npm run test:integration   # docker compose up -d db redis çalışırken
npm run test:e2e           # docker compose up -d db redis çalışırken
npm test                   # üçünü birden çalıştırır
```

## Çalıştırma (Docker Compose)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:4000/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379

İlk açılışta backend, `prisma db push` ile şemayı oluşturur ve örnek Antalya mekanlarıyla (`prisma/seed.js`) veritabanını doldurur. Demo kullanıcı: `demo@workfromhotel.com` / `Password123!`. Demo admin: `admin@workfromhotel.com` / `Password123!`.

## Kullanıcı Rolleri

- **Ziyaretçi** (giriş yapmamış): mekanları görüntüler, haritada inceler, bölge/tür/fiyat/puana göre filtreler, internet hızı/sessizlik/priz/kahve kalitesi/puana göre sıralar, mekan detayını görür.
- **Kayıtlı kullanıcı**: JWT ile giriş yapar, mekanlara yorum + puan bırakır, mekanları favorilerine ekler (`/favorilerim`), yeni mekan **önerisi** gönderir (admin onayına kadar `PENDING` durumda, herkese açık listede görünmez).
- **Admin**: `/admin` panelinden bekleyen mekan önerilerini onaylar/reddeder, doğrudan mekan ekler/düzenler/siler, tüm kullanıcıların yorumlarını moderasyon amacıyla silebilir.

## Yerel Geliştirme (Docker olmadan)

### Backend
```bash
cd backend
cp .env.example .env   # DATABASE_URL'i lokal PostgreSQL'inize göre düzenleyin
npm install
npx prisma db push
npm run seed
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend http://localhost:5173 adresinde çalışır ve `/api` isteklerini Vite proxy üzerinden backend'e (http://localhost:4000) yönlendirir.

## API Uç Noktaları
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/regions`
- `GET /api/places` (query: `region`, `type`, `maxPrice`, `minRating`, `search`, `sortBy`, `sortOrder`) — yalnızca onaylı mekanları döner
- `GET /api/places/:id` — onaylı mekan herkese açık; `PENDING`/`REJECTED` mekan yalnızca sahibi veya admin tarafından görülebilir
- `POST /api/places` (JWT gerekli) — admin doğrudan yayınlar (`APPROVED`), normal kullanıcı öneri gönderir (`PENDING`)
- `PUT /api/places/:id`, `DELETE /api/places/:id` (yalnızca admin)
- `GET /api/places/pending`, `POST /api/places/:id/approve`, `POST /api/places/:id/reject` (yalnızca admin)
- `POST /api/places/:id/reviews` (JWT gerekli)
- `PUT /api/reviews/:id` (JWT gerekli, sadece sahibi), `DELETE /api/reviews/:id` (sahibi veya admin)
- `GET /api/reviews` (yalnızca admin, moderasyon için tüm yorumlar)
- `POST /api/places/:id/favorite`, `DELETE /api/places/:id/favorite`, `GET /api/favorites` (JWT gerekli)

## Future Improvements

Bu proje bilinçli olarak **Modular Monolith** olarak tasarlandı çünkü tek ekip/öğrenci projesi için yönetilebilirlik, basit deploy ve düşük operasyonel yük daha değerli. Aşağıdaki konular şu an **kapsam dışı** bırakıldı ama mevcut modüler yapı (her modülün kendi domain/application/infrastructure katmanları ve repository port'ları olması) bunlara ileride evrilmeyi kolaylaştırıyor:

- **Microservices**: `users`, `places`, `reviews` modülleri zaten net sınırlarla ayrıldığı için, trafik/ölçek gerektiğinde her biri kendi veritabanı ve deploy birimiyle ayrı bir servise çıkarılabilir. Modüller arası tek bağımlılık noktası (ör. reviews'in places'e bağımlılığı) bir HTTP/RPC çağrısına dönüştürülebilir.
- **Kafka / Event-Driven Architecture**: Şu an cache invalidation ve modüller arası iletişim doğrudan fonksiyon çağrısıyla senkron yapılıyor (ör. review oluşturulunca place cache'i doğrudan invalide ediliyor). İleride bu, `ReviewCreated`, `PlaceUpdated` gibi domain event'lerinin bir mesaj kuyruğuna (Kafka/RabbitMQ) yayınlanıp ilgili modüllerin bunlara asenkron abone olmasıyla değiştirilebilir.
- **gRPC**: Modüller ayrı servislere bölündüğünde, aralarındaki iletişim için REST yerine daha düşük gecikmeli/tip-güvenli gRPC kullanılabilir.
- **Event Sourcing**: Review/Place geçmişinin (kim ne zaman ne değiştirdi) tam denetim izi gerektiği bir senaryoda, mevcut CRUD tabanlı Prisma modelleri yerine event-sourced bir yazma modeline geçilebilir.
- **CQRS**: Okuma (mekan listeleme/filtreleme, ki zaten Redis ile cache'leniyor) ve yazma (review/place oluşturma) yükleri birbirinden çok farklılaştığında, okuma tarafı için ayrı, denormalize edilmiş bir modele (ör. Elasticsearch) geçilip komut/sorgu sorumlulukları ayrılabilir.

Mevcut Repository Pattern ve use-case katmanı, bu değişikliklerin *application* katmanını neredeyse hiç etkilemeden yalnızca *infrastructure* katmanında yapılabilmesini sağlıyor.
