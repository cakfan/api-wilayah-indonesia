# PRD — API Wilayah Indonesia (Kode Pos + Lat/Lng)

## 1. Ringkasan

API publik read-only (GET only) yang menyediakan data wilayah administratif Indonesia 4 level (Provinsi → Kabupaten/Kota → Kecamatan → Kelurahan/Desa), dilengkapi kode pos dan koordinat lat/lng pada level kelurahan/desa. Dibangun dengan Hono.js di atas Bun runtime, data diserve dari SQLite (hasil generate dari dataset JSON mentah).

## 2. Latar Belakang & Tujuan

- Tidak ada API wilayah Indonesia open-source yang stabil, gratis, dan lengkap dengan kode pos + lat/lng dalam satu sumber — kebanyakan API publik yang ada cuma sampai level kecamatan atau tanpa geocoding.
- Developer Indonesia sering harus mengumpulkan dan menggabungkan sendiri dataset wilayah, kode pos, dan koordinat dari berbagai sumber terpisah, yang memakan waktu dan rawan inkonsistensi.
- Tujuan: menyediakan API wilayah Indonesia yang gratis, terbuka (open source), lengkap 4 level, dengan kode pos dan lat/lng dalam satu sumber yang konsisten — supaya developer lain tidak perlu mengulang proses pengumpulan data dari nol.

## 3. Target Pengguna

1. **Developer/tim yang membangun aplikasi dengan kebutuhan data wilayah Indonesia** — dropdown alamat (provinsi/kota/kecamatan/desa), validasi alamat, form checkout/pengiriman, dsb.
2. **Developer yang butuh reverse lookup kode pos → wilayah**, atau sebaliknya.
3. **Peneliti/analis data** yang butuh dataset wilayah administratif terstruktur beserta koordinatnya untuk keperluan pemetaan atau analisis.
4. **Kontributor open source** yang ingin membantu memperbaiki/melengkapi akurasi dataset (kode pos, koordinat) dari waktu ke waktu.

## 4. Scope

### 4.1 In Scope (V1)
- Data 4 level wilayah administratif sesuai kode Kemendagri (10 digit).
- Kode pos per kelurahan/desa (dengan catatan: satu kelurahan bisa punya lebih dari satu kode pos, ditangani sebagai array).
- Latitude/longitude per kelurahan/desa (titik pusat administratif, bukan alamat presisi).
- Endpoint CRUD **read-only** (GET saja) untuk semua level + search + reverse lookup kode pos.
- Pagination, caching HTTP, rate limiting, response envelope konsisten.
- Dokumentasi API (OpenAPI/Swagger).

### 4.2 Out of Scope (V1)
- Write/update data via API (data hanya diupdate lewat proses build/seed internal).
- Autentikasi/API key (V1 publik tanpa auth, rate-limit by IP saja). API key & tier akan masuk scope kalau API dibuka ke eksternal (V2).
- Query spasial radius (`nearby`) — dicatat sebagai fitur masa depan, tidak wajib di V1.
- Data historis (perubahan wilayah dari waktu ke waktu, pemekaran daerah lama).

## 5. Functional Requirements

| ID | Requirement | Prioritas |
|---|---|---|
| FR-1 | User bisa list semua provinsi | Must |
| FR-2 | User bisa get detail 1 provinsi by code | Must |
| FR-3 | User bisa list kabupaten/kota dalam 1 provinsi (paginated) | Must |
| FR-4 | User bisa get detail 1 kabupaten/kota by code | Must |
| FR-5 | User bisa list kecamatan dalam 1 kabupaten/kota (paginated) | Must |
| FR-6 | User bisa get detail 1 kecamatan by code | Must |
| FR-7 | User bisa list kelurahan/desa dalam 1 kecamatan (paginated) | Must |
| FR-8 | User bisa get detail 1 kelurahan/desa by code (termasuk kode pos & lat/lng) | Must |
| FR-9 | User bisa search wilayah by nama (lintas level, atau filter by type) | Must |
| FR-10 | User bisa reverse lookup: kode pos → daftar wilayah yang match | Must |
| FR-11 | Endpoint health check | Must |
| FR-12 | Dokumentasi API interaktif (Swagger UI) | Should |
| FR-13 | Query nearby (radius search by lat/lng) | Could (fase 2) |
| FR-14 | Bulk export per provinsi (download semua desa dalam 1 provinsi sekaligus) | Could |

## 6. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| **Performance** | p95 response time < 100ms untuk single lookup, < 300ms untuk search/list dengan pagination |
| **Availability** | Target uptime 99.5% (self-hosted VPS di fase awal, acceptable untuk internal use) |
| **Skalabilitas** | Harus tahan traffic dari banyak konsumen publik sekaligus tanpa perlu re-arsitektur besar |
| **Konsistensi data** | Setiap kode child harus punya parent yang valid (no orphan record) — divalidasi di build time |
| **Read-only safety** | Tidak ada endpoint yang bisa memodifikasi data — dijamin di level routing (tidak ada method selain GET yang didaftarkan) |
| **Caching** | Data statis → harus cacheable agresif di HTTP layer (CDN/browser) |
| **Observability** | Minimal logging request + response time, error tracking |
| **Portability** | Database file (SQLite) harus bisa dipindah/deploy tanpa setup server DB terpisah |

## 7. Sumber Data & Batasan yang Harus Didokumentasikan ke User API

- Kode wilayah: dataset Kemendagri.
- Kode pos: dataset open-source kode pos (perlu cross-check, ada kemungkinan tidak 100% akurat/update).
- Lat/Lng: OpenStreetMap Nominatim atau BIG — **titik administratif, bukan titik alamat presisi**. Harus dinyatakan eksplisit di dokumentasi API supaya user API tidak salah ekspektasi (misal dipakai untuk navigasi presisi rumah).
- Update data: manual, tidak real-time. Perlu proses re-seed berkala (misal setiap ada perubahan wilayah administratif dari Kemendagri).

## 8. Success Metrics (V1)

- Semua endpoint FR-1 s.d. FR-11 berfungsi dan lulus test integrasi.
- Data tervalidasi 100% tanpa orphan record (parent-child relation valid).
- Coverage kode pos dan lat/lng terdokumentasi dengan jelas (persentase desa yang punya data lengkap vs partial).
- p95 latency memenuhi target NFR performance di atas saat load test sederhana (misal 50 concurrent request).
- Dokumentasi API cukup jelas sehingga developer eksternal bisa mulai pakai tanpa perlu bertanya ke maintainer.

## 9. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Dataset kode pos tidak akurat/tidak lengkap untuk semua 83rb+ desa | Dokumentasikan coverage gap, sediakan field nullable, jangan klaim 100% akurat |
| Ukuran database besar mempengaruhi startup/deploy | SQLite dengan index yang tepat, file size dipantau, split kalau perlu (per region) di fase lanjut |
| Perubahan wilayah administratif (pemekaran/penggabungan daerah) | Proses re-seed manual terjadwal, versioning pada file build data |
| Traffic tinggi tanpa auth (V1) menyebabkan abuse | Rate limiting per IP dari awal, bukan opsional |

## 10. Fase Roadmap Singkat

- **V1 (MVP)**: FR-1 s.d. FR-12, dirilis publik gratis tanpa auth (rate-limited).
- **V2**: Nearby/radius search (FR-13), bulk export (FR-14), evaluasi API key + tier (gratis dengan limit lebih ketat vs berbayar untuk limit lebih tinggi) jika traffic sudah signifikan.
- **V3 (opsional)**: SpatiaLite atau ekstensi spasial lain kalau ada kebutuhan geospasial lanjutan dari komunitas pengguna.

## 11. Open Source & Lisensi

- Kode sumber API dirilis open source (rekomendasi lisensi: **MIT**, permisif dan umum dipakai untuk project developer tool semacam ini).
- Dataset yang bersumber dari OpenStreetMap tunduk pada lisensi **ODbL** — wajib dicantumkan atribusi ke OpenStreetMap contributors di dokumentasi/README, sesuai ketentuan ODbL (share-alike untuk data turunan).
- Dataset kode wilayah dari Kemendagri dan kode pos dari sumber terbuka lain — cantumkan sumber masing-masing secara eksplisit di README dan dokumentasi API, termasuk tanggal/versi data terakhir di-update.
- Sediakan `CONTRIBUTING.md` untuk memandu kontributor yang ingin memperbaiki data (misal: laporan kode pos salah, koordinat tidak akurat) atau menambah fitur.
- Sediakan `CHANGELOG.md` untuk mencatat perubahan versi API dan update dataset.