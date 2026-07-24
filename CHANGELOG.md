# Changelog

Semua perubahan penting pada project ini akan didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- CI/CD pipeline dengan GitHub Actions
- OpenAPI documentation dengan Swagger UI di `/docs`
- API public read-only untuk data wilayah Indonesia 4 level
- Database SQLite dengan build pipeline dari JSON
- Search endpoint dengan SQLite FTS5
- Kode pos dan koordinat lat/lng untuk setiap wilayah
- Pagination untuk semua list endpoint
- Rate limiting (100 req/menit per IP)
- Cache control headers
- CORS configuration
- Compression (gzip/brotli)
- Global error handling
- Data validation pipeline

### Data Sources
- Kode wilayah: Kemendagri (via wilayah.id API) — 38 provinsi, 514 kab/kota, 7.285 kecamatan, 83.762 desa/kelurahan
- Kode pos + Lat/Lng: open-admin-data (CC-BY-4.0) — 85.4% coverage (71.569 dari 83.762 desa)
