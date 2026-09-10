# Cyber Store Next.js

Proyek **baru dan terpisah** yang mereplikasi kapabilitas backend Cyber Store dengan Next.js 16 App Router, MySQL, REST API, dan panel admin bergaya Windows 11. Proyek ini tidak mengubah source Laravel, tetapi memakai schema dan data database Laravel yang sudah ada (`cyber_store_v1`).

## Yang tersedia

- REST API `/api/v1` untuk autentikasi pelanggan, katalog, alamat, keranjang, checkout, pesanan, pembayaran, ulasan, chat, dan notifikasi.
- Autentikasi Bearer token kompatibel pola Sanctum (`id|plain-token`) dan sesi admin HttpOnly.
- Panel admin Windows 11/Fluent di `/admin`: Mica/Acrylic, Segoe UI, ikon Lucide, light/dark mode, command bar, tabel responsif, dialog, dan kontrol membulat.
- CRUD admin untuk pengguna, kategori, produk, banner, ekspedisi, pesanan, pembayaran, stok, chat, ulasan, pengumuman, dan pengaturan. Pengguna dinonaktifkan secara soft-delete agar histori order tetap utuh.
- Integrasi opsional Midtrans, RajaOngkir, Google Identity, SMTP, serta enkripsi payload AES-256-GCM.
- Verifikasi schema existing melalui `npm run db:setup`; tidak ada CREATE DATABASE, migration, atau seed pengganti.

## Persyaratan

- Node.js `20.19+`, `22.13+`, atau `24+`
- MySQL 8.x
- npm

## Menjalankan di Windows

```powershell
Copy-Item .env.example .env.local
npm install
npm run db:setup
npm run dev
```

Buka `http://localhost:3000/admin`. Gunakan akun admin yang sudah ada di database Laravel (contoh akun seeder proyek lama: `superadmin@bsi.ac.id` atau `admin@bsi.ac.id`, password awal `bs10k3` bila belum diubah).

Ganti password akun melalui panel Laravel/Next.js sesuai kebijakan Anda dan isi `AUTH_SECRET` sendiri sebelum dipakai di lingkungan nyata. `npm run db:setup` aman dijalankan ulang karena hanya memeriksa tabel dan menampilkan jumlah data.

## Perintah penting

```bash
npm run dev        # development server
npm run ngrok      # tunnel HTTP localhost:3100 ke URL publik ngrok
npm run build      # production build
npm run start      # production standalone server
npm run db:setup   # periksa schema database existing
npm run lint       # ESLint
npm run typecheck  # pemeriksaan TypeScript
npm test           # unit test
```

Health check tersedia di `GET /api/health`. Ringkasan kontrak API ada di [docs/API.md](../../docs/API.md).

## Menjalankan dengan Docker

Jalankan Docker dari root repository; lihat [panduan workspace](../../README.md).

```powershell
$env:AUTH_SECRET = "buat-random-secret-minimal-32-karakter"
docker compose up --build
```

Compose hanya menjalankan Next.js dan terhubung ke MySQL Laravel melalui `host.docker.internal`; Compose tidak membuat database baru. Set `LARAVEL_STORAGE_PATH` bila path storage Laravel berbeda.

Script `npm run start` memuat `.env.local` bila tersedia untuk pemakaian lokal; pada production/container, environment variable yang sudah diekspor tetap menjadi sumber utama.

## Konfigurasi integrasi

Salin `.env.example` dan isi hanya integrasi yang dipakai:

- `MIDTRANS_*` untuk Snap dan callback pembayaran.
- `RAJAONGKIR_*` untuk ongkos kirim; tanpa key, sistem memakai biaya dasar ekspedisi.
- `GOOGLE_*` untuk login token Google.
- `MAIL_*` untuk pengiriman OTP; pada development tanpa SMTP, OTP dicetak ke log server.
- `API_ENCRYPTION_KEY` untuk request/response dengan header `X-Encrypted: true`.
- `MEDIA_ROOT` untuk lokasi upload persisten.

## Catatan deployment

Aplikasi ini membutuhkan Node.js server dan MySQL; jangan gunakan static export. Untuk production, letakkan reverse proxy seperti nginx di depan `next start`, aktifkan TLS, pembatasan ukuran request/rate limit di proxy, gunakan storage objek untuk upload bila menjalankan banyak instance, dan simpan seluruh secret di secret manager.

File upload lokal dan rate limiter login in-memory ditujukan untuk satu instance self-hosted. Deployment multi-instance perlu shared storage serta rate limiter terdistribusi (misalnya Redis).

## Menggunakan ngrok

CLI ngrok harus sudah terpasang dan terautentikasi sekali:

```powershell
ngrok config add-authtoken <TOKEN_NGROK_ANDA>
```

Buka dua terminal Git Bash/PowerShell:

```powershell
# Terminal 1
npm.cmd run dev -- --port 3100

# Terminal 2
npm.cmd run ngrok
```

Ngrok akan menampilkan URL HTTPS publik, misalnya `https://abc123.ngrok-free.app`. Buka URL tersebut dengan akhiran `/login` atau `/admin`. Untuk URL gambar/API absolut dan callback Midtrans, isi URL itu pada `NEXT_PUBLIC_APP_URL` di `.env.local`, lalu restart Next.js:

```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

Callback Midtrans (bila dipakai) adalah `https://abc123.ngrok-free.app/api/v1/payments/midtrans-callback`. URL ngrok gratis biasanya berubah setiap kali tunnel dimulai; gunakan reserved domain bila membutuhkan URL tetap.

## Struktur singkat

```text
app/                  UI App Router dan Route Handlers
components/           Komponen panel admin Windows 11
database/schema.sql   Schema MySQL mandiri
docs/API.md           Referensi endpoint
lib/api/              Handler domain REST API
lib/                  Auth, database, integrasi, dan data access
scripts/setup-db.ts   Bootstrap schema dan seed
tests/                Unit test
```
