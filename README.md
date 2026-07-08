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
- `GET /api/places/popular` (query: `limit`, varsayılan 10) — favori sayısına göre en popüler mekanlar
- `GET /api/places/top-rated` (query: `limit`, varsayılan 10) — ortalama puana göre en yüksek puanlı mekanlar
- `GET /api/places/recommendations` (query: `limit`, varsayılan 6) — ana sayfa önerileri
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

## Redis Cache Stratejisi

Tüm cache-aside mantığı `modules/cache/cache.service.js`'teki `getOrSet`/`invalidate`/`del` yardımcıları üzerinden yürür; Redis'e erişilemezse sistem hatasız şekilde doğrudan DB'ye düşer (cache bir "nice-to-have"dir, kritik yol değildir).

| Anahtar deseni | Ne için | TTL | Doldurulduğu yer |
|---|---|---|---|
| `places:list:{filters}` | Bölgeye/türe/fiyata/puana göre filtrelenmiş mekan listeleri (bölgeye göre listeleme dahil — `region` filtresi de bu anahtarın parçasıdır) | 60 sn | `PlacesService.listPlaces` |
| `places:detail:{id}` | Tek bir mekanın detayı | 60 sn | `PlacesService.getPlace` |
| `places:popular:{limit}` | Favori sayısına göre en popüler mekanlar | 120 sn | `PlacesService.getPopularPlaces` |
| `places:top-rated:{limit}` | Ortalama puana göre en yüksek puanlı mekanlar | 120 sn | `PlacesService.getTopRatedPlaces` |
| `places:recommendations:{limit}` | Ana sayfa önerileri (yorumlanmış + en yüksek puanlı, yetersizse en yeni mekanlarla tamamlanır) | 120 sn | `PlacesService.getRecommendations` |

**Cache temizleme (invalidation):** Anahtar desenleri tek doğruluk kaynağı olarak `modules/cache/place-cache-keys.js`'te toplanır (`invalidatePlaceListCaches`, `invalidatePlaceDetailCache`, `invalidatePopularCache`) — böylece yeni bir mutasyon noktası eklendiğinde hangi cache'lerin temizleneceği tek yerden yönetilir:

- **Bir mekan oluşturulduğunda/güncellendiğinde/silindiğinde** (`PlacesService`, admin onay/red akışı `SuggestionsService`): `places:list:*`, `places:popular:*`, `places:top-rated:*`, `places:recommendations:*` invalide edilir; güncelleme/silmede ayrıca o mekanın `places:detail:{id}` anahtarı da silinir.
- **Bir review oluşturulduğunda/güncellendiğinde/silindiğinde** (`ReviewsService`): puan ortalaması değiştiği için aynı liste/detay/top-rated/recommendations anahtarları invalide edilir.
- **Bir favori eklendiğinde/çıkarıldığında** (`FavoritesService`): yalnızca popülerlik sıralaması etkilendiği için sadece `places:popular:*` invalide edilir — diğer cache'lere dokunulmaz.

## Güvenlik

- **Şifre hashleme**: Kullanıcı şifreleri hiçbir zaman düz metin olarak saklanmaz; `bcryptjs` ile 10 salt round kullanılarak hashlenir (`common/security/password.js`). Girişte hash karşılaştırması (`comparePassword`) yapılır, düz metin şifre asla veritabanına yazılmaz.
- **JWT access token**: Kimlik doğrulama tamamen stateless JWT ile yapılır (`common/security/jwt.js`). Token, `JWT_SECRET` ile imzalanır ve `JWT_EXPIRES_IN` süresi sonunda geçersiz olur. Korumalı her istek `Authorization: Bearer <token>` header'ı ile gelir ve `common/guards/auth.guard.js`'teki `requireAuth` middleware'i tarafından her seferinde yeniden doğrulanır — token bir kez doğrulanıp önbelleğe alınmaz.
- **Role-based authorization**: Admin'e özel her endpoint (`/api/admin/*`, mekan ekleme/güncelleme/silme, öneri onay/red, yorum moderasyonu) `requireAdmin` guard'ı ile korunur; bu guard `requireAuth`'tan sonra çalışır ve `req.user.role !== 'ADMIN'` olduğunda `403 Forbidden` döner. Yetki kontrolü yalnızca route seviyesinde değil, ilgili servis metodunda da (ör. `PlacesService.updatePlace`, `AdminService.deleteUser`) tekrar doğrulanır.
- **`.env` içinde `JWT_SECRET`**: Gizli anahtar asla koda gömülmez; `backend/.env.example` şablonunda yer alır, gerçek değer yalnızca `.env` (git'e dahil değil) veya Docker Compose ortam değişkenlerinden okunur.
- **Input validation**: Her katmanda girdi doğrulanır — `AuthService.register` e-posta formatını (regex) ve minimum şifre uzunluğunu (8 karakter) kontrol eder, e-postayı normalize eder (trim + lowercase); `PlacesService` koordinatları (`lat` -90/90, `lng` -180/180 aralığında), `priceLevel`'ı (1-4 arası tam sayı) ve enum alanları (`PlaceType`, `Region`, `LevelRating`) doğrular; `Rating` value object'i her review puanının 1-5 arası tam sayı olduğunu garanti eder. Geçersiz girdi her zaman `400 ValidationError` ile reddedilir, veritabanına asla ulaşmaz.
- **Rate limiting**: `express-rate-limit` ile iki katman uygulanır (`common/guards/rate-limit.guard.js`) — tüm `/api` trafiği için gevşek bir taban limit (15 dakikada 300 istek) ve brute-force şifre denemelerine karşı `/api/auth/register` + `/api/auth/login` için daha sıkı bir limit (15 dakikada 10 istek). Test ortamında (`NODE_ENV=test`) devre dışı bırakılır, aksi halde e2e testlerinin tek process'te art arda yaptığı çok sayıda register/login çağrısı testleri kırar.

### Zero Trust

Bu sistemde **"Her istek doğrulanmadan güvenilir kabul edilmez."** ilkesi uygulanır: bir isteğin daha önce doğrulanmış olması, aynı oturum içinde gelmesi veya güvenilir bir ağdan/istemciden gelmesi onu otomatik olarak yetkili kılmaz — her istek, üzerinde taşıdığı kimlik bilgisiyle (JWT) tek başına yeniden değerlendirilir. Pratikte bu şu şekillerde karşılığını bulur:

- JWT her istekte `requireAuth`/`optionalAuth` tarafından yeniden doğrulanır (imza + süre kontrolü); geçerli bir önceki istek, sonraki isteği otomatik güvenilir kılmaz.
- Rol kontrolü (`requireAdmin`) route seviyesinde *ve* servis metodunda tekrar yapılır; bir kullanıcının admin olup olmadığı her admin işleminde yeniden sorgulanır, tek bir yerde "zaten admin" varsayımıyla geçilmez.
- Mekan görünürlüğü (`PlacesService.getPlace`) Redis cache'ten dönen sonuç için bile her çağrıda yeniden değerlendirilir — önbellekte `PENDING`/`REJECTED` bir mekan bulunsa dahi, isteği yapanın sahibi veya admin olduğu her seferinde yeniden kontrol edilir; cache hit'i yetki kontrolünü asla atlamaz.
- Sahiplik/yetki kontrolleri (yorum silme, favori işlemleri) her zaman sunucu tarafında, istemciden gelen `userId` yerine JWT'den çözülen kimliğe göre yapılır — istemcinin "ben buyum" demesi yeterli değildir.

## Future Improvements

Bu proje bilinçli olarak **Modular Monolith** olarak tasarlandı çünkü tek ekip/öğrenci projesi için yönetilebilirlik, basit deploy ve düşük operasyonel yük daha değerli. Aşağıdaki konular şu an **kapsam dışı** bırakıldı ama mevcut modüler yapı (her modülün kendi domain/application/infrastructure katmanları ve repository port'ları olması) bunlara ileride evrilmeyi kolaylaştırıyor:

- **Microservices**: `users`, `places`, `reviews` modülleri zaten net sınırlarla ayrıldığı için, trafik/ölçek gerektiğinde her biri kendi veritabanı ve deploy birimiyle ayrı bir servise çıkarılabilir. Modüller arası tek bağımlılık noktası (ör. reviews'in places'e bağımlılığı) bir HTTP/RPC çağrısına dönüştürülebilir.
- **Kafka / Event-Driven Architecture**: Şu an cache invalidation ve modüller arası iletişim doğrudan fonksiyon çağrısıyla senkron yapılıyor (ör. review oluşturulunca place cache'i doğrudan invalide ediliyor). İleride bu, `ReviewCreated`, `PlaceUpdated` gibi domain event'lerinin bir mesaj kuyruğuna (Kafka/RabbitMQ) yayınlanıp ilgili modüllerin bunlara asenkron abone olmasıyla değiştirilebilir.
- **gRPC**: Modüller ayrı servislere bölündüğünde, aralarındaki iletişim için REST yerine daha düşük gecikmeli/tip-güvenli gRPC kullanılabilir.
- **Event Sourcing**: Review/Place geçmişinin (kim ne zaman ne değiştirdi) tam denetim izi gerektiği bir senaryoda, mevcut CRUD tabanlı Prisma modelleri yerine event-sourced bir yazma modeline geçilebilir.
- **CQRS**: Okuma (mekan listeleme/filtreleme, ki zaten Redis ile cache'leniyor) ve yazma (review/place oluşturma) yükleri birbirinden çok farklılaştığında, okuma tarafı için ayrı, denormalize edilmiş bir modele (ör. Elasticsearch) geçilip komut/sorgu sorumlulukları ayrılabilir.

Mevcut Repository Pattern ve use-case katmanı, bu değişikliklerin *application* katmanını neredeyse hiç etkilemeden yalnızca *infrastructure* katmanında yapılabilmesini sağlıyor.
