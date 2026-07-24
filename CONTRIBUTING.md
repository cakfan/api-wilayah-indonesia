# Contributing

Terima kasih sudah berkontribusi! Berikut panduan untuk berkontribusi di project ini.

## Cara Berkontribusi

### 1. Laporkan Data yang Salah

Jika kamu menemukan kode pos yang salah, koordinat yang tidak akurat, atau nama wilayah yang perlu diperbaiki:

1. Buka [GitHub Issues](../../issues)
2. Pilih template **Data Correction**
3. Isi informasi yang diminta (kode wilayah, data yang benar, sumber)

### 2. Laporkan Bug

Jika kamu menemukan bug pada API:

1. Buka [GitHub Issues](../../issues)
2. Pilih template **Bug Report**
3. Isi informasi yang diminta

### 3. Submit Pull Request

Jika kamu ingin memperbaiki kode atau menambah fitur:

1. Fork repository ini
2. Buat branch baru: `git checkout -b feat/nama-fitur`
3. Buat perubahan yang dibutuhkan
4. Jalankan tests: `bun test`
5. Jalankan lint: `bun run lint`
6. Commit perubahan: `git commit -m "feat: deskripsi singkat"`
7. Push ke branch: `git push origin feat/nama-fitur`
8. Buka Pull Request

## Development Setup

```bash
# Clone repository
git clone https://github.com/username/wilayah-indonesia.git
cd wilayah-indonesia

# Install dependencies
bun install

# Build database
bun run build-data

# Jalankan tests
bun test

# Jalankan dev server
bun run dev
```

## Code Style

- TypeScript strict mode
- Semua query SQL ada di `src/repositories/region.repository.ts`
- Route pakai `@hono/zod-openapi` untuk auto-generate OpenAPI spec
- Response harus遵循 response envelope format (data+meta / error)
- Jangan commit `regions.sqlite` (di-generate saat CI)

## Update Data

Jika kamu ingin memperbarui data wilayah:

1. Edit file di `data/raw/` yang terkait
2. Jalankan `bun run build-data` untuk regenerate SQLite
3. Jalankan `bun run validate-data` untuk pastikan tidak ada orphan record
4. Jalankan `bun test` untuk pastikan tidak ada regression
5. Commit perubahan ke git
