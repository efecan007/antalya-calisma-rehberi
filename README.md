# Remote Rehber — Antalya

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
    ├── admin/                  dashboard istatistikleri, kullanıcı yönetimi, yorum moderasyonu — admin.service.js
    └── cache/                  Redis client + cache-aside helper — cache.service.js
```

Her modülün `infrastructure/` klasöründe bir `*.controller.js` (HTTP handler'ları) ve `*.routes.js` (Express router) bulunur; `application/` klasöründeki `*.service.js` dosyası o modülün tüm iş kurallarını tek yerde toplar (ör. `places.service.js` → createPlace/getPlace/listPlaces/updatePlace/deletePlace).

- **Domain katmanı** (`domain/` alt klasörleri) hiçbir framework'e (Express, Prisma) bağımlı değildir; yalnızca entity'ler, value object'ler (ör. `Rating` 1-5 aralığını kendi kendine doğrular) ve **Repository Pattern** ile tanımlanmış port'lar (arayüzler) içerir.
- **Service katmanı** yalnızca repository *port*'larına bağımlıdır — bu sayede DB olmadan, sahte (in-memory) repository'lerle unit test edilebilir.
- **Modüller arası bağımlılık**: bazı endpoint'ler birden fazla modülün sorumluluğunu birleştirir (ör. `POST /api/places/:id/reviews` places altında yaşar ama reviews modülünün controller'ını kullanır; `POST /api/favorites/:placeId` favorites modülünden `places.container.js`'teki paylaşılan repository'yi kullanır; `GET /api/reviews` admin modülünden `reviews.routes.js`'e mount edilir; `GET/PATCH /api/admin/suggestions/...` suggestions modülünden `admin.routes.js`'e mount edilir). Suggestions modülü, öneri gönderme (`POST /api/suggestions`) ile admin onay/red akışını (`/api/admin/suggestions/...`) ayrı route dosyalarında tutar ama aynı `suggestions.service.js`'i paylaşır. Bu ayrım, dış API sözleşmesini modüllerin kendi sorumluluğuna göre net tutar.
- **Redis cache** (`modules/cache/`): `GET /api/places` ve `GET /api/places/:id` sonuçları cache-aside deseniyle 60 saniye cache'lenir; bir mekan/yorum oluşturulduğunda, güncellendiğinde veya silindiğinde ilgili cache anahtarları invalide edilir. Redis'e erişilemezse sistem cache'siz (doğrudan DB'den) çalışmaya devam eder — cache bir "nice-to-have"dir, kritik yol değildir.

### Neden Microservices Seçilmedi?

Bu proje bilinçli olarak **Modular Monolith** olarak tasarlandı, ayrı servislere bölünmedi. Gerekçeler:

- **Takım/ölçek büyüklüğü**: Tek geliştirici/küçük ekip senaryosunda microservices'in getirdiği koordinasyon yükü (her serviste ayrı deploy pipeline, ayrı repo/versiyon yönetimi, servisler arası kontrat testleri) fayda sağlamadan önce maliyet olarak başlar.
- **Operasyonel karmaşıklık**: Bu projede tek bir Postgres + tek bir Redis + tek bir Node process yeterliyken, microservices her modül için ayrı veritabanı, service discovery, dağıtık izleme (distributed tracing) ve network güvenliği gerektirirdi — trafik/veri hacmi bunu haklı çıkaracak boyutta değil.
- **Dağıtık sistem karmaşıklığı erken gelmiyor**: Modüller arası çağrılar şu an aynı process içinde senkron fonksiyon çağrısı (ör. `suggestions.service.js`'in `places.service.js`'i doğrudan çağırması); bunlar ağ üzerinden HTTP/RPC çağrısı olsaydı, kısmi hata (partial failure), retry/timeout, dağıtık transaction gibi problemler baştan çözülmesi gereken karmaşıklık ekleyecekti.
- **Erken optimizasyon riski**: Modül sınırları (auth/users/places/reviews/favorites/suggestions/admin/cache) net olduğu için "gerektiğinde ayrıştırma" mümkün, ama bunu bugünden yapmak, henüz var olmayan bir ölçek problemi için karmaşıklık satın almak anlamına gelirdi.
- **Geriye dönüş kapısı açık**: Her modülün kendi `domain`/`application`/`infrastructure` katmanları ve repository *port*'ları olduğu için, ileride gerçek bir ölçek ihtiyacı doğduğunda (bkz. `Future Improvements` → API Gateway ile microservices mimarisine geçiş) bu modüller *infrastructure* katmanı değiştirilerek ayrı servislere çıkarılabilir — mimari bunu bugünden imkansız kılmıyor, sadece bugün gerekli görmüyor.

## Testler (Test Pyramid)

`backend/tests/` üç katmana ayrılmıştır:

| Katman | Konum | Kapsam | Gereksinim |
|---|---|---|---|
| **Unit** (taban, en çok test — 95 test) | `tests/unit/` | Domain value object'leri (`Rating`), domain servisleri (`RatingAggregator`), tüm `*.service.js` use-case'leri sahte in-memory repository'lerle, JWT guard'ları (`requireAuth`/`requireAdmin`/`optionalAuth`), `jwt.js` (sign/verify, tampered/expired token reddi), `password.js` (bcrypt hash/compare) | Yok — her ortamda çalışır |
| **Integration** (orta — 3 test) | `tests/integration/` | Prisma repository'lerinin gerçek PostgreSQL'e karşı çalışması, cache helper'ının gerçek Redis'e karşı çalışması | `docker compose up -d db redis` |
| **E2E / API endpoint** (tepe, en az test — 33 test) | `tests/e2e/` | Tüm Express uygulamasının `supertest` ile gerçek HTTP istekleriyle uçtan uca test edilmesi | `docker compose up -d db redis` |

E2E dosyaları isim bazında modül sınırlarını takip eder ve aşağıdaki alanları kapsar:

- `auth.e2e.test.js` — **register/login**, yanlış şifre, `/me`, **logout**, token olmadan `/me`+`logout` 401
- `places.e2e.test.js` — **place create/list/detail** (admin-only create, 403 for non-admin, `GET /:id` detay + 404), PATCH/DELETE yetkilendirmesi, **review create** (`POST /:id/reviews`) + `GET /:id/reviews`
- `suggestions.e2e.test.js` — öneri gönderme, admin onay/red, **admin authorization** (token'sız 401 + yanlış rol 403)
- `favorites.e2e.test.js` — **favorite add/remove** + listeleme döngüsü
- `admin.e2e.test.js` — dashboard/kullanıcı listesi, **admin authorization** (token'sız 401 + yanlış rol 403), kullanıcı silme (kendi hesabını silme koruması dahil)

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

> **Not:** `prisma/seed.js`'teki mekanlar (Lara, Konyaaltı, Kaleiçi, Muratpaşa, Kepez, Belek bölgelerinde; cafe/otel lobisi/kütüphane/coworking türlerinde) gerçekçi konumlara yerleştirilmiş **demo/örnek veridir** — isimler, açıklamalar ve puanlar kurgusaldır, doğrulanmış gerçek işletme verisi değildir.

## Environment Variables

Üç ayrı `.env.example` şablonu vardır — kök dizin (Docker Compose için), `backend/`, `frontend/`. Gerçek `.env` dosyaları asla commit edilmez (`.gitignore`'da).

**Kök `.env.example`** (Docker Compose değişken enjeksiyonu için):

| Değişken | Açıklama |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Postgres container'ının kullanıcı/şifre/veritabanı adı; backend'in `DATABASE_URL`'i bunlardan derlenir |
| `JWT_SECRET` | JWT imzalama anahtarı — production'da mutlaka uzun, rastgele bir değerle değiştirilmeli |
| `JWT_EXPIRES_IN` | Access token'ın geçerlilik süresi (ör. `7d`) |
| `CORS_ORIGIN` | Backend'in kabul ettiği frontend origin'i |
| `REDIS_URL` | Backend'in bağlanacağı Redis adresi (Compose içinde `redis://redis:6379`) |

**`backend/.env.example`** (Docker olmadan lokal geliştirme için):

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | Prisma'nın kullandığı Postgres bağlantı string'i |
| `REDIS_URL` | Redis bağlantı adresi |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Yukarıdakiyle aynı |
| `PORT` | Backend'in dinleyeceği port (varsayılan `4000`) |
| `CORS_ORIGIN` | İzin verilen frontend origin'i (lokalde `http://localhost:5173`) |

**`frontend/.env.example`**:

| Değişken | Açıklama |
|---|---|
| `VITE_API_URL` | Frontend'in API isteklerini yönlendirdiği taban URL (`/api`, Vite dev proxy veya nginx tarafından backend'e yönlendirilir) |

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

## GitHub'a Yükleme

Bu proje zaten Git ile versiyonlanmıştır ve bir GitHub deposuna bağlıdır. Sıfırdan bir kopyasını kendi GitHub hesabınıza yüklemek isterseniz:

```bash
# 1) Depo zaten klonlanmışsa bu adımı atlayın; değilse:
git init
git add .
git commit -m "chore(github): initialize repository structure"

# 2) GitHub'da boş bir repo oluşturun (README/.gitignore/license EKLEMEDEN,
#    github.com/new üzerinden), sonra o repoyu remote olarak ekleyin:
git remote add origin https://github.com/<kullanici-adi>/<repo-adi>.git

# 3) İlk push (varsayılan branch main değilse önce `git branch -M main`):
git push -u origin main
```

Sonraki her değişiklik için normal akış: `git add <dosyalar>` → yukarıdaki [Conventional Commit formatına](#git-ve-commit-kuralları) uygun bir mesajla `git commit` (kök dizinde `npm install` çalıştırıldıysa `commit-msg` hook'u formatı otomatik doğrular) → `git push origin main`.

## Git ve Commit Kuralları

Commit mesajları [Conventional Commits](https://www.conventionalcommits.org/) formatındadır ve **scope zorunludur**:

```
type(scope): message
```

Kullanılabilecek `type` değerleri (kapalı liste, `commitlint.config.js` tarafından zorlanır): `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`.

Sık kullanılan `scope` örnekleri: `auth`, `users`, `places`, `reviews`, `favorites`, `suggestions`, `admin`, `database`, `docker`, `frontend`, `backend`, `map`, `cache`, `tests`, `readme`.

Örnekler:

```
feat(auth): add jwt login and register endpoints
feat(places): create place listing and filtering api
feat(map): integrate leaflet map with place markers
fix(auth): handle invalid jwt token error
fix(places): correct district filter query
refactor(database): apply repository pattern to place queries
test(auth): add unit tests for login service
docs(readme): add docker setup instructions
build(docker): add docker compose configuration
```

Bu kural yalnızca dokümantasyon değildir — repo kökünde `husky` + `commitlint` ile `commit-msg` git hook'u olarak zorlanır. `npm install` (kök dizinde) hook'u kurar; scope'suz veya listede olmayan bir `type` ile yapılan commit'ler reddedilir:

```bash
npm install        # kökte, bir kez — husky commit-msg hook'unu kurar
git commit -m "feat(places): add sorting by rating"   # ✅ geçer
git commit -m "add sorting"                            # ❌ reddedilir (scope yok, type yok)
```

## Future Improvements

Bu proje bilinçli olarak **Modular Monolith** olarak tasarlandı çünkü tek ekip/öğrenci projesi için yönetilebilirlik, basit deploy ve düşük operasyonel yük daha değerli (bkz. yukarıdaki "Neden Microservices Seçilmedi?"). Aşağıdaki konular şu an **kapsam dışı** bırakıldı ama mevcut modüler yapı (her modülün kendi domain/application/infrastructure katmanları ve repository port'ları olması) bunlara ileride evrilmeyi kolaylaştırıyor:

- **Elasticsearch ile gelişmiş arama**: Şu an `GET /api/places?search=` Postgres `ILIKE` ile ad/adres üzerinde basit bir metin araması yapıyor. Elasticsearch'e geçilerek yazım hatalarına dayanıklı (fuzzy) arama, alan bazlı ağırlıklandırma (ör. mekan adı > açıklama) ve facet'li filtreleme (bölge/tür/özellik sayımlarıyla birlikte) eklenebilir.
- **Kafka ile event-driven bildirim sistemi**: Şu an modüller arası iletişim ve cache invalidation doğrudan senkron fonksiyon çağrısıyla yapılıyor (ör. review oluşturulunca `invalidatePlaceListCaches` doğrudan çağrılıyor). İleride `ReviewCreated`, `PlaceApproved`, `PlaceRejected` gibi domain event'leri Kafka'ya yayınlanıp; bir öneri onaylandığında/reddedildiğinde öneriyi gönderen kullanıcıya, bir mekana yorum geldiğinde mekanı favorileyen kullanıcılara bildirim gönderen ayrı bir bildirim servisi bu event'lere asenkron abone olabilir.
- **CQRS yapısına geçiş**: Okuma (mekan listeleme/filtreleme/sıralama — zaten Redis ile cache'leniyor) ve yazma (review/place oluşturma) yükleri birbirinden çok farklılaştığında, okuma tarafı için ayrı, denormalize edilmiş bir modele geçilip komut/sorgu sorumlulukları ayrılabilir.
- **Mobil uygulama**: Backend zaten JWT tabanlı stateless bir REST API olduğu için (frontend'e özel hiçbir oturum durumu sunucuda tutulmuyor), React Native/Flutter ile bir mobil istemci aynı `/api` sözleşmesini doğrudan tüketebilir; ek olarak bkz. aşağıdaki BFF maddesi.
- **Prometheus ile monitoring**: Şu an gözlemlenebilirlik yalnızca `console.log`/`console.warn` (ör. Redis bağlantı hataları) ile sınırlı. Prometheus ile istek sayısı/gecikme/hata oranı (ör. `/api/places` p95 latency), cache hit/miss oranı ve rate-limit tetiklenme sayısı gibi metrikler `/metrics` endpoint'inden export edilip Grafana ile görselleştirilebilir.
- **RAG sistemi ile "bana sessiz ve hızlı internetli yer öner" yapay zeka asistanı**: Mekanların zaten yapılandırılmış özellikleri (`noiseLevel`, `outletLevel`, review ortalamaları, açıklama metni) bir LLM'e retrieval-augmented generation ile beslenerek doğal dilde mekan önerisi yapan bir asistan uç noktası (`POST /api/assistant/recommend`) eklenebilir — kullanıcı "sessiz ve hızlı internetli bir yer" dediğinde, ilgili filtreler + review yorumları context olarak LLM'e verilip gerekçeli bir öneri üretilir.
- **ChromaDB veya Pinecone ile vektör arama**: Yukarıdaki RAG asistanının temel bileşeni — mekan açıklamaları ve yorum metinleri embedding'e çevrilip bir vektör veritabanında saklanarak, anlam bazlı ("çalışmak için sakin bir kafe" gibi) benzerlik araması yapılabilir; bu, Elasticsearch'ün anahtar kelime aramasını semantik aramayla tamamlar.
- **API Gateway ile microservices mimarisine geçiş**: Modüller (`users`, `places`, `reviews`, ...) net sınırlarla ayrıldığı için, trafik/ölçek gerektiğinde her biri kendi veritabanı ve deploy birimiyle ayrı bir servise çıkarılabilir; bir API Gateway (ör. Kong, veya Express tabanlı basit bir gateway) tek giriş noktası olarak auth/rate-limiting/routing'i merkezi yönetir, modüller arası senkron çağrılar (ör. suggestions'ın places'i çağırması) HTTP/gRPC'ye dönüşür.
- **BFF (Backend-for-Frontend) yapısı**: Mobil uygulama eklendiğinde, web ve mobil istemcilerin ihtiyaçları (ör. mobilde daha küçük payload, farklı sayfalama) ayrışabilir; her istemci için mevcut modüler backend'in üzerine ince bir BFF katmanı (ör. `bff-web`, `bff-mobile`) eklenerek, çekirdek modüller değişmeden istemciye özel response şekillendirmesi yapılabilir.

Mevcut Repository Pattern ve use-case katmanı, bu değişikliklerin *application* katmanını neredeyse hiç etkilemeden yalnızca *infrastructure* katmanında yapılabilmesini sağlıyor.
