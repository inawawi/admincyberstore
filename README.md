# Cyber Store

Satu repository untuk panel admin/API Next.js dan storefront Nuxt, menggunakan npm workspaces.

```text
apps/
  admin/       # Next.js, API, database scripts, dan media lokal
  storefront/  # Nuxt, halaman pelanggan
docs/          # Dokumentasi API
package.json   # Perintah bersama
```

## Persiapan

Gunakan Node.js 22.13+ (atau versi yang sesuai `engines`) dan MySQL. Dari folder utama:

```powershell
npm.cmd install
```

Simpan konfigurasi admin di `apps/admin/.env.local` (atau `.env`) dan konfigurasi frontend di `apps/storefront/.env`. Untuk instalasi baru, salin `.env.example` masing-masing aplikasi. File environment dan media lokal yang sudah ada ikut dipindah saat migrasi.

Untuk frontend lokal, gunakan:

```env
NUXT_PUBLIC_API_BASE=http://localhost:3000/api/v1
NUXT_PUBLIC_STORAGE_BASE=http://localhost:3000/storage
```

Database, `AUTH_SECRET`, dan secret integrasi hanya disimpan di environment admin. Gambar lokal berada di `apps/admin/public/storage`, kecuali `MEDIA_ROOT` diarahkan ke penyimpanan lain.

## Development

```powershell
npm.cmd run dev           # Jalankan kedua aplikasi
npm.cmd run dev:admin     # Hanya admin/API
npm.cmd run dev:frontend  # Hanya storefront
```

- Admin: http://localhost:3000/admin
- API: http://localhost:3000/api/v1
- Storefront: http://localhost:3100

Jalankan `dev` atau perintah aplikasi terpisah, bukan keduanya sekaligus pada port yang sama. Hentikan dengan Ctrl+C. MySQL harus berjalan untuk fitur yang memakai database.

Untuk HP pada Wi-Fi yang sama, buka IP komputer pada port 3100 dan ubah API/storage di environment storefront ke IP komputer pada port 3000, lalu restart dev. URL OAuth juga perlu sesuai origin yang digunakan. `npm run ngrok` meneruskan port 3100 saja; API perlu akses jaringan/tunnel tersendiri.

## Build dan pemeriksaan

```powershell
npm.cmd run build
npm.cmd run build:admin
npm.cmd run build:frontend
npm.cmd run start:admin
npm.cmd run start:frontend
npm.cmd run typecheck
npm.cmd test
npm.cmd run db:setup
```

`typecheck`, `lint`, `test`, dan `db:setup` di root diteruskan ke admin. `db:setup` memeriksa schema database existing; tidak membuat database atau seed. Production storefront memakai port 3100 secara default; `PORT` dapat diubah melalui environment hosting. Next.js memakai standalone build dengan tracing dari root workspace.

## Docker admin/API

Dockerfile di root membangun admin/API. Jalankan dari root menggunakan file environment admin:

```powershell
docker compose --env-file apps/admin/.env up --build
```

Jika memakai `.env.local`, ganti path pada perintah tersebut. Compose tetap memakai MySQL di host serta mount media melalui `LARAVEL_STORAGE_PATH`; gunakan absolute path untuk lokasi media jika diperlukan. Storefront dapat dibangun dan dijalankan terpisah.

Kontrak endpoint: [docs/API.md](docs/API.md).
