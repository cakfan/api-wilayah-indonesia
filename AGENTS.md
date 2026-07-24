# AGENTS.md — API Wilayah Indonesia

Petunjuk untuk AI coding agent yang bekerja di project ini.

## Project Overview

API publik read-only (GET only) yang menyediakan data wilayah administratif Indonesia 4 level (Provinsi → Kabupaten/Kota → Kecamatan → Kelurahan/Desa) dengan kode pos dan koordinat lat/lng. Dibangun dengan Hono.js di atas Bun runtime, data diserve dari SQLite.

## Tech Stack

| Layer           | Pilihan                          |
| --------------- | -------------------------------- |
| Runtime         | Bun                              |
| Framework       | Hono.js                          |
| Database        | SQLite (`bun:sqlite`)            |
| Validasi        | Zod + `@hono/zod-validator`      |
| API Docs        | `@hono/zod-openapi` + Swagger UI |
| Logging         | Pino                             |
| Testing         | Bun test runner                  |
| Package manager | Bun (`bun.lock`)                 |

## Development Setup

```bash
# Install dependencies
bun install

# Jalankan build pipeline (generate regions.sqlite dari data/raw)
bun run build-data

# Jalankan validasi data
bun run validate-data

# Development server
bun run dev

# Jalankan tests
bun test

# Lint
bun run lint
```

## Project Structure

```
src/
  index.ts                    # Entry point, setup Hono app + middleware global
  routes/                     # Route handlers (GET only)
    provinces.route.ts
    regencies.route.ts
    districts.route.ts
    villages.route.ts
    search.route.ts
    postal-codes.route.ts
    health.route.ts
  services/
    region.service.ts         # Business logic, panggil repository
  repositories/
    region.repository.ts      # Semua raw SQL query, satu-satunya layer yang sentuh DB
  db/
    connection.ts             # Koneksi bun:sqlite, read-only mode
  middleware/
    error-handler.ts          # Global onError handler
    rate-limit.ts
    cache-control.ts
  schemas/
    region.schema.ts          # Zod schemas untuk request & response
  types/
    region.types.ts
  lib/
    pagination.ts             # Helper pagination konsisten
    response.ts               # Helper format response envelope

scripts/
  build-data.ts               # Generate regions.sqlite dari data/raw/*.json
  validate-data.ts            # Validasi data integrity (orphan record, dll)
  seed-check.ts               # Sanity check setelah build

data/
  raw/                        # Dataset mentah (di-commit ke git)
  db/
    regions.sqlite            # Generated artifact (DI-GITIGNORE, jangan commit)

tests/
  routes/
  repositories/
```

## Architecture Principles

1. **Read-only by design** — Tidak ada route POST/PUT/DELETE/PATCH. Hanya GET.
2. **Separation data mentah, build process, dan data serving** — API tidak pernah baca `data/raw/*.json` langsung.
3. **Database sebagai artifact** — `regions.sqlite` di-generate saat CI/deploy, bukan di-commit ke git.
4. **Stateless application layer** — Tidak ada state di memori selain koneksi SQLite read-only.
5. **Fail-safe data integrity** — Validasi parent-child dilakukan di build time, bukan runtime.

## Coding Conventions

### TypeScript
- Gunakan TypeScript strict mode.
- Semua return type dari repository harus pakai Zod schemas untuk type safety.
- Hindari `any`. Gunakan tipe yang tepat.

### Query
- Semua raw SQL query ada di `src/repositories/region.repository.ts`.
- Jangan query database langsung di route atau service layer.
- Gunakan parameterized query, jangan string interpolation untuk SQL.

### Routes
- Semua route harus pakai `@hono/zod-openapi` untuk auto-generate OpenAPI spec.
- Response harus遵循 response envelope format (data+meta / error).
- Semua list endpoint harus support `?page=&limit=` (default limit=50, max=200).

### Error Handling
- 404 untuk resource tidak ditemukan, format: `{ error: { code: "NOT_FOUND", message: "..." } }`.
- Global error handler di `src/middleware/error-handler.ts` menangkap semua exception.

### Validation
- Validasi request params & query params pakai Zod + `@hono/zod-validator`.
- Jangan bypass validation.

## Data Pipeline

```
data/raw/*.json → scripts/build-data.ts → data/db/regions.sqlite
```

- `data/raw/*.json` di-commit ke git sebagai source of truth.
- `regions.sqlite` jangan di-commit ke git (di-generate saat CI/deploy).
- `scripts/validate-data.ts` jalan otomatis sebagai bagian dari build, fail kalau ada orphan record.

## Testing

```bash
# Jalankan semua tests
bun test

# Jalankan tests tertentu
bun test tests/routes/provinces.test.ts
```

- Unit test untuk repository layer (query logic terhadap test DB).
- Unit test untuk helper functions (`lib/pagination.ts`, `lib/response.ts`).
- Integration test untuk semua route (request/response format, status code, error case).
- Test database pakai SQLite dengan subset data kecil.

## API Design

### Response Envelope

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

### Endpoint List

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

## Middleware Stack (urutan eksekusi)

1. Logger (pino, log method+path+status+duration)
2. Secure headers (hono/secure-headers)
3. CORS (konfigurasi origin eksplisit)
4. Compression (gzip/brotli)
5. Rate limiter (per IP, 100 req/menit)
6. Route handler
7. Global error handler (onError)

## CI/CD

```yaml
# GitHub Actions workflow
on: push/PR
  1. bun install
  2. bun run lint
  3. bun run build-data
  4. bun run validate-data
  5. bun test
  6. (on main branch) deploy ke Railway/Render
```

## Deployment

- **Platform**: Railway atau Render (free/hobby tier)
- `regions.sqlite` di-mount sebagai file lokal di server
- Build step dijalankan di CI/CD, bukan saat deploy

## Common Tasks

### Menambah endpoint baru
1. Buat Zod schema di `src/schemas/region.schema.ts`.
2. Tambah query di `src/repositories/region.repository.ts`.
3. Tambah logic di `src/services/region.service.ts`.
4. Buat route di `src/routes/` dengan `@hono/zod-openapi`.
5. Daftarkan route di `src/index.ts`.
6. Tulis test di `tests/routes/`.
7. Update `ARCHITECTURE.md` section 6.2.

### Memperbaiki data
1. Edit `data/raw/*.json` yang terkait.
2. Jalankan `bun run build-data` untuk regenerate SQLite.
3. Jalankan `bun run validate-data` untuk pastikan tidak ada orphan record.
4. Jalankan `bun test` untuk pastikan tidak ada regression.
5. Commit perubahan ke git.

### Update dependencies
- Gunakan `bun add <package>` atau `bun remove <package>`.
- Pastikan `bun.lock` di-commit.
- Jalankan `bun test` untuk pastikan tidak ada breaking change.

## Important Notes

- Project ini open source dengan lisensi MIT. Jangan commit secrets atau API keys.
- Dataset dari OpenStreetMap tunduk lisensi ODbL — wajib cantumkan atribusi.
- Data source: Kemendagri (kode wilayah), kodepos (kode pos), OSM (lat/lng).
- Lihat `ARCHITECTURE.md` untuk detail arsitektur dan `PRD.md` untuk detail requirements.
