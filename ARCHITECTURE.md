# ARCHITECTURE — API Wilayah Indonesia (Kode Pos + Lat/Lng)

## 1. Tech Stack

| Layer           | Pilihan                          | Alasan                                                                                              |
| --------------- | -------------------------------- | --------------------------------------------------------------------------------------------------- |
| Runtime         | Bun                              | Performa tinggi, startup cepat, native SQLite driver tanpa dependency tambahan                      |
| Framework       | Hono.js                          | Ringan, cepat, native Bun support, portable ke edge (Cloudflare Workers dll) kalau nanti dibutuhkan |
| Database        | SQLite (`bun:sqlite`)            | Read-heavy workload, embedded, tanpa server DB terpisah, index & FTS native                         |
| Validasi        | Zod + `@hono/zod-validator`      | Type-safe validation untuk semua request                                                            |
| API Docs        | `@hono/zod-openapi` + Swagger UI | Spec-first, otomatis sinkron dengan schema Zod, penting untuk API publik agar mudah diadopsi        |
| Logging         | Pino                             | Structured logging, ringan                                                                          |
| Testing         | Bun test runner                  | Native, tanpa dependency tambahan                                                                   |
| Package manager | Bun (`bun.lock`)                 | Lockfile tunggal, instalasi cepat                                                                   |

## 2. Prinsip Arsitektur

1. **Read-only by design** — tidak ada route yang didaftarkan selain GET. Ini bukan cuma konvensi, tapi constraint arsitektural: layer routing hanya mengekspos method GET secara eksplisit, tidak ada handler untuk POST/PUT/DELETE/PATCH sama sekali.
2. **Separation antara data mentah, build process, dan data serving** — dataset sumber (JSON) tidak pernah dibaca langsung oleh API. API hanya membaca `regions.sqlite` hasil build.
3. **Database sebagai artifact, bukan service** — `regions.sqlite` adalah file yang di-generate lewat build step dan di-deploy bersama aplikasi (atau di-mount sebagai volume), bukan database server yang perlu dikelola terpisah.
4. **Stateless application layer** — tidak ada state di memori aplikasi selain koneksi SQLite read-only. Memudahkan horizontal scaling kalau nanti perlu multiple instance.
5. **Fail-safe data integrity** — validasi relasi parent-child dilakukan di build time (bukan runtime), supaya API tidak pernah menyajikan data yang inconsistent.

## 3. Alur Data (Data Pipeline)

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌─────────────┐
│ Sumber Eksternal │ --> │ data/raw/*.json  │ --> │ scripts/build-data │ --> │ regions.sqlite│
│ (Kemendagri,     │     │ (dataset mentah, │     │ + validate-data.ts│     │ (production   │
│  kodepos, OSM)   │     │  human-readable) │     │                    │     │  artifact)   │
└─────────────────┘     └──────────────────┘     └───────────────────┘     └──────┬──────┘
                                                                                     │
                                                                                     v
                                                                        ┌────────────────────┐
                                                                        │ Hono API (Bun)     │
                                                                        │ read-only queries   │
                                                                        └────────────────────┘
```

- `data/raw/*.json` — dataset mentah apa adanya, disimpan di git, mudah diaudit/diedit manual.
- `scripts/build-data.ts` — parse, normalisasi format, gabungkan sumber (kode wilayah + kode pos + lat/lng), lalu tulis ke SQLite.
- `scripts/validate-data.ts` — jalan sebagai bagian dari build, cek: setiap child punya parent valid, tidak ada kode duplikat, lat/lng dalam rentang wajar untuk Indonesia (lat -11 s.d. 6, lng 95 s.d. 141), kode pos format 5 digit.
- Build process ini dijalankan **manual/terjadwal** (bukan on-demand tiap request), hasilnya di-commit atau di-generate ulang saat deploy.

## 4. Skema Database

```sql
CREATE TABLE provinces (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE regencies (
  code TEXT PRIMARY KEY,
  province_code TEXT NOT NULL REFERENCES provinces(code),
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('kabupaten', 'kota'))
);

CREATE TABLE districts (
  code TEXT PRIMARY KEY,
  regency_code TEXT NOT NULL REFERENCES regencies(code),
  name TEXT NOT NULL
);

CREATE TABLE villages (
  code TEXT PRIMARY KEY,
  district_code TEXT NOT NULL REFERENCES districts(code),
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('kelurahan', 'desa')),
  postal_code TEXT,
  latitude REAL,
  longitude REAL
);

-- Indexes untuk lookup by parent
CREATE INDEX idx_regencies_province ON regencies(province_code);
CREATE INDEX idx_districts_regency ON districts(regency_code);
CREATE INDEX idx_villages_district ON villages(district_code);

-- Index untuk reverse lookup kode pos
CREATE INDEX idx_villages_postal ON villages(postal_code);

-- Full-text search untuk pencarian nama wilayah
CREATE VIRTUAL TABLE villages_fts USING fts5(
  name,
  content='villages',
  content_rowid='rowid'
);
CREATE VIRTUAL TABLE regencies_fts USING fts5(
  name,
  content='regencies',
  content_rowid='rowid'
);
```

Catatan desain:

- Semua `code` pakai format string (bukan integer) karena kode wilayah Kemendagri punya leading zero yang signifikan (misal `11.01` untuk provinsi Aceh).
- `postal_code` nullable — beberapa desa di dataset open-source mungkin belum punya data kode pos yang valid.
- FTS5 dipakai untuk search by nama (jauh lebih cepat dari `LIKE '%...%'` di dataset besar).

## 5. Struktur Project

```
src/
  index.ts                    # entry point, setup Hono app + middleware global
  routes/
    provinces.route.ts
    regencies.route.ts
    districts.route.ts
    villages.route.ts
    search.route.ts
    postal-codes.route.ts
    health.route.ts
  services/
    region.service.ts         # business logic, panggil repository
  repositories/
    region.repository.ts      # semua raw SQL query ada di sini, satu-satunya layer yang sentuh DB
  db/
    connection.ts             # koneksi bun:sqlite, read-only mode
  middleware/
    error-handler.ts          # global onError handler
    rate-limit.ts
    cache-control.ts
  schemas/
    region.schema.ts          # Zod schemas untuk request & response
  types/
    region.types.ts
  lib/
    pagination.ts             # helper pagination konsisten
    response.ts                # helper format response envelope

scripts/
  build-data.ts
  validate-data.ts
  seed-check.ts                # sanity check setelah build (jumlah row per level, dsb)

data/
  raw/
    provinces.json
    regencies.json
    districts.json
    villages-postal-latlng.json
  db/
    regions.sqlite              # generated artifact, di-gitignore (di-generate saat CI/deploy dari data/raw/*.json)

tests/
  routes/
  repositories/

```

**Keputusan: Raw SQL di repository layer.** Semua query ada di `region.repository.ts`, type safety dijamin lewat return type Zod schemas. Drizzle ORM tidak dipakai — keuntungan utama Drizzle (schema-as-code yang sering berubah) tidak relevan untuk database artifact yang jarang berubah. Zero dependency tambahan di runtime.

## 6. API Design

### 6.1 Response Envelope

Sukses:

```json
{
  "data": { ... } | [ ... ],
  "meta": { "total": 514, "page": 1, "limit": 50, "totalPages": 11 }
}
```

Error:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Province with code '99' not found"
  }
}
```

### 6.2 Endpoint List

```
GET /health

GET /api/v1/provinces
GET /api/v1/provinces/:code
GET /api/v1/provinces/:code/regencies

GET /api/v1/regencies/:code
GET /api/v1/regencies/:code/districts

GET /api/v1/districts/:code
GET /api/v1/districts/:code/villages

GET /api/v1/villages/:code

GET /api/v1/search?q=&type=&limit=&page=
GET /api/v1/postal-codes/:code

GET /docs          (Swagger UI)
GET /openapi.json
```

### 6.3 Standar Perilaku Endpoint

- Semua list endpoint mendukung `?page=&limit=` (default `limit=50`, max `limit=200`).
- Semua endpoint `:code` yang tidak ditemukan → `404` dengan format error konsisten.
- Semua endpoint list mendukung `?sort=name|code&order=asc|desc` (opsional, nice-to-have).
- Response header cache: `Cache-Control: public, max-age=86400, stale-while-revalidate=3600` + `ETag`.

## 7. Middleware Stack (urutan eksekusi)

```
1. Logger (pino, log method+path+status+duration)
2. Secure headers (hono/secure-headers)
3. CORS (konfigurasi origin eksplisit)
4. Compression (gzip/brotli)
5. Rate limiter (per IP, misal 100 req/menit)
6. Route handler
7. Global error handler (onError, tangkap semua exception → format error konsisten)
```

## 8. Deployment Architecture

### V1 — Platform hosting (direkomendasikan untuk mulai)

```
Internet → Railway/Render (TLS, hosting) → Bun process (Hono app) → regions.sqlite (local disk)
```

- **Platform pilihan: Railway atau Render (free/hobby tier).** Cukup untuk API read-only berskala kecil-menengah, zero maintenance infra, auto-deploy dari GitHub push. Scaling ke paid tier mudah kalau traffic naik.
- VPS sendiri lebih murah jangka panjang tapi maintenance cost lebih tinggi — tidak direkomendasikan untuk project open source tanpa revenue di awal.
- `regions.sqlite` di-mount sebagai file lokal di server yang sama dengan aplikasi.
- Build step (`bun run build-data`) dijalankan di CI/CD, bukan saat deploy — `regions.sqlite` tidak di-commit ke git, di-generate dari `data/raw/*.json` saat pipeline berjalan.

### V2 — Edge (opsional, kalau traffic/latency jadi concern)

```
User → Cloudflare Workers/Pages (Hono) → SQLite via D1 atau read dari R2/KV
```

- Karena data read-only & jarang berubah, sangat cocok untuk edge distribution — request dari mana saja di Indonesia tetap cepat tanpa perlu banyak region server.
- Cloudflare punya free tier yang cukup generous, relevan untuk project open source yang ingin diakses gratis oleh banyak developer.
- Migrasi ini tidak mengubah struktur route/service, hanya layer koneksi DB (`db/connection.ts`) yang perlu diadaptasi.

## 9. Testing Strategy

| Level           | Cakupan                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Unit            | `repositories/` — query logic terhadap SQLite test database (subset data)                         |
| Unit            | `lib/pagination.ts`, `lib/response.ts` — helper functions                                         |
| Integration     | Semua route — request/response format, status code, error case (404, invalid param)               |
| Data validation | `scripts/validate-data.ts` dijalankan sebagai bagian dari CI, gagal build kalau ada orphan record |

## 10. CI/CD Pipeline (GitHub Actions)

```
on: push/PR
  1. bun install
  2. bun run lint
  3. bun run build-data (generate regions.sqlite dari data/raw)
  4. bun run validate-data (fail kalau data invalid)
  5. bun test
  6. (on main branch) deploy ke Railway/Render
```

Catatan: `regions.sqlite` tidak di-commit ke git. Build step (3-4) dijalankan di CI pipeline, artifact di-deploy bersama aplikasi ke platform hosting.

## 11. Observability Minimal (V1)

- Log setiap request: method, path, status, response time (pino, structured JSON).
- Endpoint `/health` return status DB connection + versi data (misal timestamp build terakhir).
- Error tracking sederhana: log ke file/stdout, bisa diintegrasikan ke layanan eksternal (Sentry dsb) di fase lanjut kalau dibutuhkan.

## 12. Keputusan yang Sudah Diputuskan

| # | Pilihan | Keputusan | Alasan |
| --- | --- | --- | --- |
| 1 | ORM | **Raw SQL di repository layer** | Database artifact jarang berubah, zero dependency tambahan, query sederhana tidak butuh query builder. Type safety dijamin lewat return type Zod schemas di repository. |
| 2 | Strategi commit `regions.sqlite` | **Di-generate saat CI/deploy, tidak di-commit ke git** | `data/raw/*.json` di-commit sebagai source of truth. `regions.sqlite` adalah build artifact (~puluhan MB), menghindari repo besar yang bikin clone lambat untuk kontributor. |
| 3 | Auth untuk V2 | **Tanpa auth dengan rate-limit lebih ketat + tier gratis/berbayar opsional** | Data publik, frictionless adoption penting untuk open source. Rate limit per-IP (100 req/menit V1) sudah cukup. API key opsional untuk heavy users nanti. |
| 4 | Nearby/radius search | **V2 saja** | V1 fokus hierarchical lookup + search + kode pos. Nearby butuh Haversine/spatial index, lebih kompleks. Bisa di-add tanpa breaking change. |
| 5 | Platform hosting V1 | **Railway atau Render (free/hobby tier)** | Zero maintenance infra, auto-deploy dari GitHub, free tier cukup untuk API read-only. VPS sendiri lebih mahal jangka panjang untuk project open source tanpa revenue. |
| 6 | Model kontribusi data | **GitHub Issues/PR biasa** | Developer sudah familiar, low friction, transparan. Jika nanti ada banyak laporan dari non-developer, bisa ditambahkan form sederhana yang submit ke GitHub Issues via API. |

### Auth & Rate Limiting (V2 detail)

- V1: rate limit per-IP, 100 req/menit, tanpa auth.
- V2: API key opsional (gratis) untuk rate limit lebih tinggi. Heavy users daftar untuk mendapatkan key. Tier berbayar dipertimbangkan nanti jika diperlukan untuk sustain infra.
