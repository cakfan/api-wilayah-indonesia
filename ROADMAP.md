# ROADMAP — API Wilayah Indonesia (Kode Pos + Lat/Lng)

> Berdasarkan PRD.md dan ARCHITECTURE.md. Setiap task dilengkapi referensi section terkait.

---

## Phase 1 — V1 (MVP)

Target: semua endpoint FR-1 s.d. FR-12 berfungsi, data tervalidasi, API publik gratis tanpa auth.

### 1.1 Project Setup

- [x] Init project: `bun init`, install dependencies (hono, zod, @hono/zod-validator, @hono/zod-openapi, pino)
- [x] Setup folder structure sesuai ARCHITECTURE.md section 5
- [x] Setup TypeScript config (`tsconfig.json`)
- [x] Setup Biome/ESLint untuk linting
- [x] Setup `package.json` scripts (dev, build, build-data, validate-data, test, lint)
- [x] Setup `.gitignore` (node_modules, `data/db/regions.sqlite`, dist)
- [x] Setup `.env.example` (PORT, ALLOWED_ORIGINS, LOG_LEVEL)
- [x] Setup `bun.lock` (commit ke git)

### 1.2 Database Schema & Build Pipeline

- [x] Buat `scripts/build-data.ts` — parse `data/raw/*.json`, normalisasi, tulis ke SQLite (ARCHITECTURE.md section 3)
- [x] Buat schema SQL: provinces, regencies, districts, villages + indexes + FTS5 (ARCHITECTURE.md section 4)
- [x] Buat `scripts/validate-data.ts` — cek parent-child relation, no duplicate, lat/lng range Indonesia, kode pos 5 digit (ARCHITECTURE.md section 3)
- [x] Buat `scripts/seed-check.ts` — sanity check jumlah row per level
- [x] Siapkan dataset `data/raw/` dari sumber (Kemendagri, kodepos, OSM) — minimal sample data dulu untuk development
- [x] Jalankan build pipeline: pasti `regions.sqlite` ter-generate dengan benar

### 1.3 Core Application

- [x] Setup entry point `src/index.ts` — Hono app + middleware global (ARCHITECTURE.md section 7)
- [x] Buat `src/db/connection.ts` — koneksi `bun:sqlite` read-only mode (ARCHITECTURE.md section 2: prinsip stateless)
- [x] Buat `src/schemas/region.schema.ts` — Zod schemas untuk semua request params, query params, dan response body
- [x] Buat `src/types/region.types.ts` — tipe TypeScript dari Zod schemas
- [x] Buat `src/lib/pagination.ts` — helper hitung page/totalPages, clamp limit
- [x] Buat `src/lib/response.ts` — helper format response envelope (data+meta / error)

### 1.4 Repository Layer

- [x] Buat `src/repositories/region.repository.ts` — semua raw SQL query:
  - [x] `findAllProvinces()` — FR-1
  - [x] `findProvinceByCode(code)` — FR-2
  - [x] `findRegenciesByProvince(provinceCode, page, limit)` — FR-3
  - [x] `findRegencyByCode(code)` — FR-4
  - [x] `findDistrictsByRegency(regencyCode, page, limit)` — FR-5
  - [x] `findDistrictByCode(code)` — FR-6
  - [x] `findVillagesByDistrict(districtCode, page, limit)` — FR-7
  - [x] `findVillageByCode(code)` — FR-8 (include kode pos & lat/lng)
  - [x] `searchRegions(q, type, page, limit)` — FR-9 (FTS5 query)
  - [x] `findVillagesByPostalCode(postalCode, page, limit)` — FR-10

### 1.5 Service Layer

- [x] Buat `src/services/region.service.ts` — panggil repository, validasi bisnis (kalau ada), format output

### 1.6 Routes (Endpoint)

- [x] Buat `src/routes/health.route.ts` — FR-11, return status DB + versi data
- [x] Buat `src/routes/provinces.route.ts` — FR-1, FR-2, FR-3
- [x] Buat `src/routes/regencies.route.ts` — FR-4, FR-5
- [x] Buat `src/routes/districts.route.ts` — FR-6, FR-7
- [x] Buat `src/routes/villages.route.ts` — FR-8
- [x] Buat `src/routes/search.route.ts` — FR-9
- [x] Buat `src/routes/postal-codes.route.ts` — FR-10
- [x] Daftarkan semua route di `src/index.ts`
- [x] Pastikan response envelope konsisten (ARCHITECTURE.md section 6.1)

### 1.7 Middleware

- [x] Buat `src/middleware/error-handler.ts` — global onError, tangkap semua exception → format error konsisten
- [x] Buat `src/middleware/rate-limit.ts` — per IP, 100 req/menit (ARCHITECTURE.md section 7, NFR: rate limiting wajib)
- [x] Buat `src/middleware/cache-control.ts` — Cache-Control + ETag headers (ARCHITECTURE.md section 6.3)
- [x] Setup CORS (explicit origin config)
- [x] Setup compression (gzip/brotli)
- [x] Setup secure headers (`hono/secure-headers`)
- [x] Setup logger (pino, structured JSON)

### 1.8 API Documentation

- [x] Setup `@hono/zod-openapi` di semua route — FR-12
- [x] Setup Swagger UI endpoint di `/docs`
- [x] Setup `/openapi.json` endpoint
- [ ] Dokumentasikan coverage gap kode pos & lat/lng di docs (PRD section 7)

### 1.9 Testing

- [ ] Setup test database (SQLite dengan subset data kecil)
- [ ] Unit test `src/lib/pagination.ts`
- [ ] Unit test `src/lib/response.ts`
- [ ] Unit test `src/repositories/region.repository.ts` — test semua query terhadap test DB
- [ ] Integration test semua route — request/response format, status code, error case (404, invalid param)
- [ ] Jalankan `validate-data.ts` sebagai test — fail kalau ada orphan record
- [ ] Pastikan p95 latency < 100ms single lookup, < 300ms search/list (NFR)

### 1.10 CI/CD Pipeline

- [ ] Buat GitHub Actions workflow (ARCHITECTURE.md section 10):
  - [ ] `bun install`
  - [ ] `bun run lint`
  - [ ] `bun run build-data`
  - [ ] `bun run validate-data`
  - [ ] `bun test`
  - [ ] Deploy ke Railway/Render (on main branch)
- [ ] Setup Railway/Render project, connect ke GitHub repo
- [ ] Pastikan `regions.sqlite` di-generate saat CI, tidak di-commit (ARCHITECTURE.md section 12: keputusan #2)

### 1.11 Open Source Preparation

- [ ] Buat `README.md` — deskripsi project, quick start, endpoint list, attribution (Kemendagri, OSM/ODbL, kodepos)
- [ ] Buat `CONTRIBUTING.md` — panduan kontributor (report data via GitHub Issues/PR)
- [ ] Buat `CHANGELOG.md` — catat versi pertama
- [ ] Pilih lisensi: MIT (PRD section 11)
- [ ] Setup issue templates di GitHub (bug report, data correction report)
- [ ] Setup branch protection di GitHub

### 1.12 Observability

- [ ] Log setiap request: method, path, status, response time (ARCHITECTURE.md section 11)
- [ ] Endpoint `/health` return DB connection status + build timestamp

---

## Phase 2 — V2

Target: nearby search, bulk export, evaluasi auth/tier, siap untuk traffic lebih tinggi.

### 2.1 Nearby/Radius Search — FR-13

- [ ] Implementasi Haversine formula di repository layer
- [ ] Buat `GET /api/v1/nearby?lat=&lng=&radius=&limit=&page=`
- [ ] Evaluasi apakah perlu spatial index atau cukup brute-force (83rb desa masih manageable)
- [ ] Unit test + integration test

### 2.2 Bulk Export — FR-14

- [ ] Buat `GET /api/v1/provinces/:code/export` — download semua desa dalam 1 provinsi
- [ ] Format output: JSON array (atau CSV kalau banyak user butuh)
- [ ] Pertimbangkan streaming response untuk file besar
- [ ] Test

### 2.3 Auth & Rate Limiting V2

- [ ] Evaluasi traffic setelah beberapa bulan V1
- [ ] Buat tabel API keys di SQLite (kalau pakai SQLite-based) atau pilih layanan auth sederhana
- [ ] Implementasi API key validation middleware
- [ ] Setup tier: gratis (default rate limit) vs registered (rate limit lebih tinggi)
- [ ] Update rate limiter: per-IP → per-API-key (kalau ada key), fallback per-IP
- [ ] Dokumentasikan cara daftar API key di README

### 2.4 Performance Tuning

- [ ] Load test: 50 concurrent request, pastikan p95 sesuai NFR
- [ ] Evaluasi SQLite file size, monitor startup time
- [ ] Pertimbangkan connection pooling kalau perlu (bun:sqlite biasanya tidak perlu)

### 2.5 Data Refresh Pipeline

- [ ] Dokumentasikan proses re-seed manual (ketika ada pemekaran daerah dari Kemendagri)
- [ ] Pertimbangkan script `scripts/refresh-data.ts` — pull data terbaru, rebuild, validate

---

## Phase 3 — V3 (Opsional)

Target: fitur lanjutan berdasarkan kebutuhan komunitas.

### 3.1 SpatiaLite / Spatial Extensions

- [ ] Evaluasi kebutuhan geospasial lanjutan dari komunitas pengguna
- [ ] Jika diperlukan: integrasi SpatiaLite atau ekstensi spasial lain
- [ ] Advanced spatial queries (bounding box, polygon containment, dll)

### 3.2 Edge Deployment (Evaluasi)

- [ ] Evaluasi apakah traffic/latency menuntut edge distribution
- [ ] Jika ya: migrasi ke Cloudflare Workers + D1/R2 (ARCHITECTURE.md section 8: V2 Edge)
- [ ] Adaptasi `src/db/connection.ts` untuk D1 driver

### 3.3 Enhanced Data Sources

- [ ] Integrasi sumber data tambahan (kalau tersedia)
- [ ] Pertimbangkan data historis (perubahan wilayah dari waktu ke waktu)
- [ ] Evaluasi akurasi data dari waktu ke waktu, dokumentasikan perubahan

---

## Monitoring & Maintenance (Ongoing)

- [ ] Pantau coverage data: persentase desa dengan kode pos lengkap + lat/lng
- [ ] Pantau error rate dan latency dari production logs
- [ ] Update dataset berkala (ketika ada perubahan wilayah administratif)
- [ ] Review dan merge PR kontributor secara berkala
- [ ] Update CHANGELOG.md setiap rilis
