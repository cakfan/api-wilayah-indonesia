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
- Kode wilayah: Kemendagri
- Kode pos: Dataset open-source kode pos Indonesia
- Lat/Lng: OpenStreetMap Nominatim
