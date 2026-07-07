# Work From Hotel / Cafe — Antalya

Antalya'da uzaktan çalışmaya uygun otel lobisi, kafe ve kütüphaneleri harita üzerinde listeleyen, internet hızı, priz sayısı, sessizlik, kahve kalitesi, çalışma ortamı, fiyat seviyesi ve genel puana göre değerlendirme yapılabilen bir rehber sitesi.

## Stack
- Backend: Node.js + Express + Prisma ORM
- Frontend: React + Vite + Tailwind CSS + Leaflet (OpenStreetMap)
- Veritabanı: PostgreSQL
- Auth: JWT
- Docker + Docker Compose

## Çalıştırma (Docker Compose)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:4000/api
- PostgreSQL: localhost:5432

İlk açılışta backend, `prisma db push` ile şemayı oluşturur ve örnek Antalya mekanlarıyla (`prisma/seed.js`) veritabanını doldurur. Demo kullanıcı: `demo@workfromhotel.com` / `Password123!`.

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
- `GET /api/places` (query: `region`, `type`, `maxPrice`, `minRating`, `search`)
- `GET /api/places/:id`
- `POST /api/places`, `PUT /api/places/:id`, `DELETE /api/places/:id` (JWT gerekli)
- `POST /api/places/:id/reviews` (JWT gerekli)
- `PUT /api/reviews/:id`, `DELETE /api/reviews/:id` (JWT gerekli, sadece sahibi)
