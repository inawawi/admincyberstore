# Storefront Cyber Store (Nuxt)

Aplikasi pelanggan dalam workspace `apps/storefront`. Jalankan `npm run dev:frontend` dari root repository untuk membuka http://localhost:3100. Untuk menjalankan admin dan storefront sekaligus, gunakan `npm run dev`. Lihat [panduan workspace](../../README.md) untuk konfigurasi environment dan instalasi.

# Cyber Store - Nuxt 3 Storefront Frontend

Frontend modern berbasis **Nuxt 3** dan **Vue 3** untuk katalog e-commerce pembeli (*Storefront*), terintegrasi penuh dengan REST API Laravel (`cyber_store_api`).

---

## Fitur Utama

- **Design System Cyberpunk / Modern Tech:** Dark theme, neon cyan & electric violet accents, glassmorphism card, glowing buttons, responsive typography.
- **Beranda (`/`):** Promo Banner Slider dinamis, Chips Kategori, Produk Rekomendasi (*Cyber Picks*), Produk Terbaru (*Latest Tech Drops*), dan Trust Bar.
- **Katalog Produk (`/products`):** Live search dengan sinkronisasi URL, filter radio kategori, filter hanya rekomendasi, sorting (harga termurah/termahal, terbaru), dan pagination.
- **Detail Produk (`/products/[id]`):** SEO dynamic SSR metadata (title & OpenGraph), multi-image gallery dengan thumbnail switcher, pemilih varian ukuran/warna, live stock badge, ulasan pelanggan & balasan toko, deskripsi & panduan ukuran.
- **Keranjang Belanja (`/cart` & Quick Slide-over Drawer):** Manajemen keranjang dengan Pinia & `localStorage`, stepper kuantitas, hitung berat (gram/kg), kode voucher diskon, dan kalkulasi subtotal otomatis.

---

## Cara Menjalankan Frontend

### 1. Masuk ke Folder Frontend
```bash
cd frontend
```

### 2. Jalankan Development Server
```bash
npm run dev
```
Buka browser di: **`http://localhost:3000`**

### 3. Build untuk Production
```bash
npm run build
npm run preview
```

---

## Konfigurasi Environment (`.env`)

Ubah URL backend API di file `.env` jika diperlukan:
```env
NUXT_PUBLIC_API_BASE=http://127.0.0.1:8000/api/v1
NUXT_PUBLIC_STORAGE_BASE=http://127.0.0.1:8000/storage
```
*(Atau jika menggunakan virtual host Laragon: `http://cyber_store_api.test/api/v1`)*
