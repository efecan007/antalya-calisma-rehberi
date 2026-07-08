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

Backend, **tek bir deploy edilebilir birim** (monolith) olarak kalırken içeride **modüllere** ayrılmış bir **Modular Monolith**'tir. Her modül kendi **controller / service / repository / entity** yapısına sahiptir (Clean Architecture'daki `infrastructure` / `application` / `domain` klasörleriyle karşılık gelir):

```
backend/src/
├── app.js                    Express composition root: tüm modül router'larını mount eder
├── server.js                 process entry point (app.listen)
├── common/
│   ├── errors.js             tipli hata sınıfları (NotFoundError, ValidationError, ...)
│   ├── guards/                requireAuth / requireAdmin / optionalAuth (JWT middleware)
│   ├── filters/                notFoundHandler / errorMiddleware (merkezi hata yakalama)
│   └── security/               jwt.js, password.js
├── database/
│   └── prisma.client.js       paylaşılan PrismaClient instance'ı
└── modules/
    ├── auth/                   register / login / me (JWT üretimi) — auth.service.js
    ├── users/                  User entity + repository (auth ve diğer modüller tüketir)
    ├── places/                 Place entity + temel CRUD — places.service.js
    ├── suggestions/            mekan önerisi onay/red akışı — suggestions.service.js
    ├── reviews/                yorum + puan — reviews.service.js
    ├── favorites/              favori ekle/çıkar/listele — favorites.service.js
    ├── admin/                  yorum moderasyonu (tüm yorumları listeleme) — admin.service.js
    └── cache/                  Redis client + cache-aside helper — cache.service.js
```

Her modülün `infrastructure/` klasöründe bir `*.controller.js` (HTTP handler'ları) ve `*.routes.js` (Express router) bulunur; `application/` klasöründeki `*.service.js` dosyası o modülün tüm iş kurallarını tek yerde toplar (ör. `places.service.js` → createPlace/getPlace/listPlaces/updatePlace/deletePlace).

- **Domain katmanı** (`domain/` alt klasörleri) hiçbir framework'e (Express, Prisma) bağımlı değildir; yalnızca entity'ler, value object'ler (ör. `Rating` 1-5 aralığını kendi kendine doğrular) ve **Repository Pattern** ile tanımlanmış port'lar (arayüzler) içerir.
- **Service katmanı** yalnızca repository *port*'larına bağımlıdır — bu sayede DB olmadan, sahte (in-memory) repository'lerle unit test edilebilir.
- **Modüller arası bağımlılık**: bazı endpoint'ler birden fazla modülün sorumluluğunu birleştirir (ör. `POST /api/places/:id/reviews` places altında yaşar ama reviews modülünün controller'ını kullanır; `GET /api/places/pending` ve `/:id/approve|reject` suggestions modülünden `places.routes.js`'e mount edilir; `GET /api/reviews` admin modülünden `reviews.routes.js`'e mount edilir). Bu, dış API sözleşmesini (URL yapısını) değiştirmeden modülleri ayırmayı sağlar.
- **Redis cache** (`modules/cache/`): `GET /api/places` ve `GET /api/places/:id` sonuçları cache-aside deseniyle 60 saniye cache'lenir; bir mekan/yorum oluşturulduğunda, güncellendiğinde veya silindiğinde ilgili cache anahtarları invalide edilir. Redis'e erişilemezse sistem cache'siz (doğrudan DB'den) çalışmaya devam eder — cache bir "nice-to-have"dir, kritik yol değildir.

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

## Mekan Bilgileri

Her mekanın kendi (mekanı ekleyen kişinin girdiği) sabit özellikleri ile kullanıcı review'larından **hesaplanan ortalamalar** ayrı tutulur:

- **Mekan özellikleri** (Place tablosunda saklanır): ad, tür (`HOTEL`/`CAFE`/`LIBRARY`/`COWORKING`), bölge (Lara, Konyaaltı, Kaleiçi, Muratpaşa, Kepez, Döşemealtı, Aksu, Belek), açık adres, lat/lng, fiyat seviyesi, çalışma saatleri, fotoğraf URL'leri (`photoUrls[]`), priz sayısı seviyesi (az/orta/çok), sessizlik seviyesi (düşük/orta/yüksek), çalışma masası uygunluğu, Wi-Fi/klima/toplantı-uygunluğu/uzun-süre-laptop-uygunluğu (evet/hayır).
- **Review ortalamaları** (`ratings` alanı altında, kullanıcı yorumlarından hesaplanır): internet hızı, priz sayısı puanı, sessizlik puanı, kahve kalitesi, çalışma ortamı, fiyat seviyesi, genel puan.

## Veritabanı Şeması

Prisma modelleri (ve JS/API tarafındaki alan adları) camelCase kalır, ama fiziksel PostgreSQL kolon/tablo adları `@map`/`@@map` ile snake_case'e eşlenir — `\d places`, `\d users` vb. ile doğrulanabilir:

| Tablo | Kolonlar (öne çıkanlar) |
|---|---|
| `users` | `id`, `full_name`, `email`, `password_hash`, `role`, `created_at`, `updated_at` |
| `places` | `id`, `name`, `type`, `district`, `address`, `latitude`, `longitude`, `price_level`, `working_hours`, `description`, `has_wifi`, `has_air_conditioning`, `is_meeting_friendly`, `is_laptop_friendly`, `socket_level`, `quietness_level`, `photo_urls`, `is_desk_friendly`, `status`, `created_at`, `updated_at` |
| `reviews` | `id`, `user_id`, `place_id`, `rating`, `comment`, `internet_rating`, `quietness_rating`, `coffee_rating`, `socket_rating`, `work_environment`, `price_level`, `created_at` |
| `favorites` | `id`, `user_id`, `place_id`, `created_at` |

Ortalama internet hızı ve kahve kalitesi bilinçli olarak `places` tablosunda **yok** — bunlar `reviews`'dan hesaplanan ortalamalardır (bkz. yukarıdaki "Mekan Bilgileri"), mekanı ekleyen kişinin girdiği sabit bir değer değildir.

## Frontend Sayfaları

- `/` — Ana Sayfa: proje tanıtımı ve "Mekanları Keşfet" / "Haritada Gör" yönlendirmeleri.
- `/mekanlar` — Mekan Listesi: kart görünümü + bölge/tür/fiyat/puan/internet hızı/sessizlik/priz filtreleri, sıralama, yan tarafta senkronize küçük harita.
- `/harita` — Harita Sayfası: tüm onaylı mekanlar pin olarak, pine tıklayınca kısa bilgi + detay linki içeren popup.
- `/mekan/:id` — Mekan Detay: tüm mekan bilgileri, fotoğraf galerisi, özellik rozetleri, yorumlar ve puanlar.
- `/giris`, `/kayit` — JWT tabanlı giriş/kayıt (çıkış Navbar'dan).
- `/favorilerim` — Kayıtlı kullanıcının favori mekanları.
- `/mekan-ekle` — Kayıtlı kullanıcı için mekan önerisi, admin için doğrudan mekan ekleme.
- `/admin`, `/admin/mekanlar/:id/duzenle` — Admin paneli: bekleyen önerileri onaylar/reddeder, tüm mekanları düzenler/siler, yorumları moderasyon amacıyla siler.

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

**Auth**
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/auth/logout` (JWT gerekli) — JWT stateless olduğu için sunucuda iptal edilecek bir oturum yok; istemcinin token'ı bıraktığını doğrulayan `204` döner.

**Places**
- `GET /api/places` (query: `region`, `type`, `maxPrice`, `minRating`, `minInternetSpeed`, `outletLevel`, `noiseLevel`, `search`, `sortBy`, `sortOrder`) — yalnızca onaylı mekanları döner
- `GET /api/places/:id` — onaylı mekan herkese açık; `PENDING`/`REJECTED` mekan yalnızca sahibi veya admin tarafından görülebilir
- `POST /api/places`, `PATCH /api/places/:id`, `DELETE /api/places/:id` (yalnızca admin) — admin'in doğrudan eklediği mekan `APPROVED` olur
- `GET /api/regions`

**Reviews**
- `POST /api/places/:id/reviews` (JWT gerekli), `GET /api/places/:id/reviews`
- `PUT /api/reviews/:id` (JWT gerekli, sadece sahibi), `DELETE /api/reviews/:id` (sahibi veya admin)

**Favorites**
- `POST /api/favorites/:placeId`, `DELETE /api/favorites/:placeId` (JWT gerekli)
- `GET /api/favorites` (JWT gerekli)

**Suggestions**
- `POST /api/suggestions` (JWT gerekli) — kim gönderirse göndersin her zaman `PENDING` oluşturur
- `GET /api/admin/suggestions`, `PATCH /api/admin/suggestions/:id/approve`, `PATCH /api/admin/suggestions/:id/reject` (yalnızca admin)

**Admin**
- `GET /api/admin/dashboard` — kullanıcı/mekan/bekleyen öneri/yorum/favori sayıları
- `GET /api/admin/users`, `DELETE /api/admin/users/:id` (kendi hesabını silemez)
- `GET /api/reviews` (yalnızca admin, moderasyon için tüm yorumlar)

## Future Improvements

Bu proje bilinçli olarak **Modular Monolith** olarak tasarlandı çünkü tek ekip/öğrenci projesi için yönetilebilirlik, basit deploy ve düşük operasyonel yük daha değerli. Aşağıdaki konular şu an **kapsam dışı** bırakıldı ama mevcut modüler yapı (her modülün kendi domain/application/infrastructure katmanları ve repository port'ları olması) bunlara ileride evrilmeyi kolaylaştırıyor:

- **Microservices**: `users`, `places`, `reviews` modülleri zaten net sınırlarla ayrıldığı için, trafik/ölçek gerektiğinde her biri kendi veritabanı ve deploy birimiyle ayrı bir servise çıkarılabilir. Modüller arası tek bağımlılık noktası (ör. reviews'in places'e bağımlılığı) bir HTTP/RPC çağrısına dönüştürülebilir.
- **Kafka / Event-Driven Architecture**: Şu an cache invalidation ve modüller arası iletişim doğrudan fonksiyon çağrısıyla senkron yapılıyor (ör. review oluşturulunca place cache'i doğrudan invalide ediliyor). İleride bu, `ReviewCreated`, `PlaceUpdated` gibi domain event'lerinin bir mesaj kuyruğuna (Kafka/RabbitMQ) yayınlanıp ilgili modüllerin bunlara asenkron abone olmasıyla değiştirilebilir.
- **gRPC**: Modüller ayrı servislere bölündüğünde, aralarındaki iletişim için REST yerine daha düşük gecikmeli/tip-güvenli gRPC kullanılabilir.
- **Event Sourcing**: Review/Place geçmişinin (kim ne zaman ne değiştirdi) tam denetim izi gerektiği bir senaryoda, mevcut CRUD tabanlı Prisma modelleri yerine event-sourced bir yazma modeline geçilebilir.
- **CQRS**: Okuma (mekan listeleme/filtreleme, ki zaten Redis ile cache'leniyor) ve yazma (review/place oluşturma) yükleri birbirinden çok farklılaştığında, okuma tarafı için ayrı, denormalize edilmiş bir modele (ör. Elasticsearch) geçilip komut/sorgu sorumlulukları ayrılabilir.

Mevcut Repository Pattern ve use-case katmanı, bu değişikliklerin *application* katmanını neredeyse hiç etkilemeden yalnızca *infrastructure* katmanında yapılabilmesini sağlıyor.
