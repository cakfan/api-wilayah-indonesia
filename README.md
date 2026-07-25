# API Wilayah Indonesia

API publik read-only untuk data wilayah administratif Indonesia 4 level (Provinsi → Kabupaten/Kota → Kecamatan → Kelurahan/Desa) dengan kode pos dan koordinat lat/lng.

## Quick Start

```bash
# Install dependencies
bun install

# Build database dari data raw
bun run build-data

# Jalankan development server
bun run dev
```

Server berjalan di `http://localhost:3000`. Buka `http://localhost:3000/docs` untuk Swagger UI.

## Tech Stack

- **Runtime:** Bun
- **Framework:** Hono.js
- **Database:** SQLite (`bun:sqlite`)
- **Validation:** Zod + `@hono/zod-openapi`
- **Logging:** Pino

## Endpoint

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/provinces` | List semua provinsi |
| GET | `/api/v1/provinces/:code` | Detail provinsi |
| GET | `/api/v1/provinces/:code/regencies` | List kab/kota dalam provinsi |
| GET | `/api/v1/regencies/:code` | Detail kab/kota |
| GET | `/api/v1/regencies/:code/districts` | List kecamatan dalam kab/kota |
| GET | `/api/v1/districts/:code` | Detail kecamatan |
| GET | `/api/v1/districts/:code/villages` | List desa/kelurahan dalam kecamatan |
| GET | `/api/v1/villages/:code` | Detail desa/kelurahan (kode pos + lat/lng) |
| GET | `/api/v1/search?q=&type=` | Search wilayah by nama |
| GET | `/api/v1/postal-codes/:code` | Reverse lookup kode pos |
| GET | `/docs` | Swagger UI |
| GET | `/openapi.json` | OpenAPI spec |

Semua list endpoint mendukung `?page=&limit=` (default limit=50, max=200).

## Development

```bash
# Jalankan tests
bun test

# Lint
bun run lint

# Build & validate data
bun run build-data
bun run validate-data
```

## Data Sources

- **Kode wilayah:** Kemendagri (38 provinsi, 514 kab/kota, 7.285 kecamatan, 83.762 desa/kelurahan)
- **Kode pos:** Dataset open-source kode pos Indonesia
- **Lat/Lng:** OpenStreetMap Nominatim (titik administratif, bukan alamat presisi)

> **Catatan:** Koordinat yang ditampilkan adalah titik pusat administratif wilayah, bukan lokasi alamat presisi. Jangan gunakan untuk navigasi presisi.

## Data Coverage

| Field | Coverage | Sumber |
|-------|----------|--------|
| Kode wilayah (4 level) | 100% (83.762 desa/kelurahan) | Kemendagri via wilayah.id |
| Kode pos | 85.4% (71.569 dari 83.762) | open-admin-data |
| Lat/Lng | 85.4% (71.555 dari 83.762) | open-admin-data |

Field `postal_code`, `latitude`, dan `longitude` akan bernilai `null` untuk ~14.5% desa yang belum tercakup (terutama di Papua).

Kontributor dipersilakan membantu melengkapi data kode pos dan koordinat melalui [GitHub Issues](../../issues) atau pull request. Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan.

## Attribution

Dataset yang bersumber dari [OpenStreetMap](https://www.openstreetmap.org/) tunduk pada lisensi [ODbL](https://opendatacommons.org/licenses/odbl/). Atribusi kepada OpenStreetMap contributors wajib dicantumkan sesuai ketentuan ODbL.

## License

[MIT](LICENSE)
