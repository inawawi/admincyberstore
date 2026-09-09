# REST API Cyber Store

Base URL: `/api/v1`. Semua body memakai JSON kecuali endpoint upload yang menerima `multipart/form-data`.

Endpoint privat memakai header:

```http
Authorization: Bearer <token-dari-login>
```

## Publik dan autentikasi

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/register` | Daftar pelanggan dan kirim OTP |
| POST | `/verify-otp` | Aktivasi akun |
| POST | `/resend-otp` | Kirim ulang OTP |
| POST | `/login` | Login email/nomor telepon |
| POST | `/auth/google` | Login dengan Google ID token |
| POST | `/forgot-password` | Minta OTP reset |
| POST | `/verify-reset-otp` | Verifikasi OTP reset |
| POST | `/reset-password` | Simpan password baru |
| GET | `/categories` | Kategori aktif |
| GET | `/products` | Produk dengan filter/paginasi |
| GET | `/products/{id-or-slug}` | Detail produk |
| GET | `/products/{id-or-slug}/reviews` | Ulasan produk |
| GET | `/expeditions` | Pilihan dan estimasi ekspedisi |
| GET | `/banners` | Banner aktif |
| GET | `/about`, `/help`, `/store-info` | Konten toko |
| POST | `/payments/midtrans-callback` | Callback server Midtrans |

## Pelanggan (Bearer token)

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/me` | Profil sesi |
| POST | `/logout` | Hapus token aktif |
| POST | `/profile` | Perbarui profil/foto |
| GET, POST | `/addresses` | Daftar/tambah alamat |
| PUT, DELETE | `/addresses/{id}` | Ubah/hapus alamat milik pengguna |
| GET | `/cart` | Isi keranjang |
| POST | `/cart/add` | Tambah produk |
| PATCH, DELETE | `/cart/items/{id}` | Ubah jumlah/hapus item |
| DELETE | `/cart` | Kosongkan keranjang |
| POST | `/cart/items/delete-bulk` | Hapus beberapa item |
| POST | `/checkout` | Buat order dari item keranjang |
| GET | `/orders` | Riwayat order |
| GET | `/orders/{id}` | Detail order |
| POST | `/orders/{id}/complete` | Tandai selesai |
| POST | `/orders/{id}/cancel` | Ajukan pembatalan |
| GET | `/orders/{id}/track` | Riwayat pelacakan |
| GET | `/payments/{id}/check-status` | Sinkronkan status pembayaran |
| POST | `/products/{id}/reviews` | Buat ulasan |
| GET | `/my-reviews` | Ulasan milik pengguna |
| POST | `/reviews/{id}/reply` | Balas ulasan |
| DELETE | `/reviews/{id}/replies` | Hapus balasan sendiri |
| GET, POST | `/chats` | Daftar/buat sesi chat |
| GET, POST | `/chats/{id}/messages` | Baca/kirim pesan |
| GET | `/notifications` | Daftar notifikasi |
| PATCH | `/notifications/{id}/read` | Tandai dibaca |
| POST | `/notifications/read-all` | Tandai semua dibaca |
| POST | `/users/fcm-token` | Simpan token perangkat |

## Format enkripsi opsional

Bila `API_ENCRYPTION_KEY` dikonfigurasi, klien dapat mengirim header `X-Encrypted: true` dengan body:

```json
{ "payload": "base64url-payload" }
```

Respons akan memakai bentuk yang sama. Endpoint callback Midtrans selalu menerima payload aslinya agar kompatibel dengan server Midtrans.

## Admin

UI admin memakai cookie sesi HttpOnly dan endpoint internal `/api/admin`. Login dilakukan melalui `POST /api/admin/login`; resource CRUD berada di `/api/admin/resources/{resource}`. Endpoint admin bukan bagian kontrak aplikasi mobile dan dapat berubah mengikuti UI.
