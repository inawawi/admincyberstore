# Panduan Lengkap Deployment Server — Cyber Store

Panduan ini berisi instruksi langkah-demi-langkah untuk mendeploy proyek **Cyber Store** (Next.js 16 Admin/API + Nuxt 4 Storefront + MySQL 8) ke server VPS Linux (disarankan **Ubuntu 22.04 LTS** atau **Ubuntu 24.04 LTS**).

---

## 1. Arsitektur Proyek & Topologi Server

- **Repository**: Monorepo (`npm workspaces`)
- **Backend & Panel Admin (`apps/admin`)**:
  - Framework: **Next.js 16** (App Router, React 19)
  - Runtime: Node.js (Standalone Server)
  - Port Internal: `3000`
  - URL Route: `/admin` (Dashboard), `/api/v1` (REST API), `/storage` (Media Server)
- **Storefront Pelanggan (`apps/storefront`)**:
  - Framework: **Nuxt 4** (Vue 3, Nitro SSR engine)
  - Port Internal: `3100`
  - URL Route: `/` (Katalog, Keranjang, Checkout, dll.)
- **Database**: **MySQL 8.x** (Nama database default: `cyber_store_v1`)
- **Penyimpanan Gambar/Upload**: Filesystem lokal yang diarahkan oleh `MEDIA_ROOT`
- **Reverse Proxy & SSL**: **Nginx** + **Let's Encrypt (Certbot)**
- **Process Manager**: **PM2**

---

## 2. Kebutuhan Spesifikasi Server

| Komponen | Spesifikasi Minimum | Rekomendasi Production |
| :--- | :--- | :--- |
| **OS** | Ubuntu 22.04 / 24.04 LTS (64-bit) | Ubuntu 24.04 LTS |
| **CPU** | 1 vCPU | 2 vCPU |
| **RAM** | 2 GB RAM + **Swap 4 GB (Wajib)** | 4 GB RAM |
| **Disk** | 20 GB SSD | 40 GB NVMe SSD |

> ⚠️ **PENTING TENTANG SWAP MEMORY**:  
> Proses kompilasi `npm run build` untuk Next.js 16 dan Nuxt 4 membutuhkan lonjakan memori (RAM spike) hingga 2–3 GB. Jika VPS Anda memiliki RAM 1 GB atau 2 GB tanpa Swap, proses build akan **gagal karena terkena OOM (Out Of Memory) Killer**.

---

## 3. Langkah 1: Persiapan Server Awal (OS & Keamanan)

Login ke VPS Anda via SSH:
```bash
ssh root@IP_SERVER_ANDA
```

### A. Update Sistem & Timezone
```bash
sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone Asia/Jakarta
```

### B. Konfigurasi Swap File (4 GB)
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Jadikan swap permanen saat server reboot
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimasi swappiness
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### C. Konfigurasi Firewall (UFW)
Hanya buka port SSH, HTTP, dan HTTPS. **Jangan buka port 3000, 3100, atau 3306 ke publik!**
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 4. Langkah 2: Instalasi Runtime & Software Stack

### A. Install Node.js 22 LTS (Active LTS)
```bash
# Tambahkan repository NodeSource Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential git

# Verifikasi instalasi
node -v   # Harusnya v22.x.x
npm -v    # Harusnya v10.x.x
```

### B. Install PM2 (Process Manager Global)
```bash
sudo npm install -g pm2
```

### C. Install MySQL Server 8.0
```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
```

Jalankan pengamanan MySQL:
```bash
sudo mysql_secure_installation
```
*(Ikuti petunjuk di layar: set password root yang kuat, hapus anonymous user, larang remote root login, dan hapus test database).*

### D. Install Nginx & Certbot (SSL)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

---

## 5. Langkah 3: Konfigurasi Database & Akun Admin Awal

### A. Buat Database & User MySQL
Masuk ke MySQL shell:
```bash
sudo mysql -u root -p
```

Jalankan perintah SQL berikut (ganti `PASSWORD_MYSQL_ANDA` dengan password yang aman):
```sql
CREATE DATABASE cyber_store_v1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cyber_user'@'127.0.0.1' IDENTIFIED BY 'PASSWORD_MYSQL_ANDA';
GRANT ALL PRIVILEGES ON cyber_store_v1.* TO 'cyber_user'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

---

## 6. Langkah 4: Setup Aplikasi dari Repository

### A. Clone Repository ke Direktori Web
```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone <URL_REPOSITORY_GIT_ANDA> cyberstore
sudo chown -R $USER:$USER /var/www/cyberstore
cd /var/www/cyberstore
```

### B. Buat Direktori Media Storage & Set Permission
```bash
# Buat direktori penyimpanan upload terpisah
mkdir -p /var/www/cyberstore/storage_uploads
chmod -R 775 /var/www/cyberstore/storage_uploads
```

### C. Install Seluruh Dependensi Monorepo
```bash
npm ci
```

### D. Inisialisasi Skema Database
> ⚠️ **CATATAN PENTING**: `npm run db:setup` hanya memverifikasi tabel. Anda **wajib mengimpor file `schema.sql` terlebih dahulu**.

```bash
# Import skema 23 tabel bawaan sistem
mysql -u cyber_user -p -h 127.0.0.1 cyber_store_v1 < apps/admin/database/schema.sql
```

---

## 7. Langkah 5: Konfigurasi File Environment (`.env`)

### A. Konfigurasi Backend & Admin (`apps/admin/.env`)
Salin atau buat file `apps/admin/.env`:
```bash
nano apps/admin/.env
```

Isi dengan konfigurasi berikut (sesuaikan domain dan kredensial):
```env
# Mode Aplikasi & Port
NODE_ENV=production
PORT=3000

# URL Publik Admin/API (tanpa trailing slash)
NEXT_PUBLIC_APP_URL=https://api.yourdomain.com

# Wajib: Buat string acak minimal 32 karakter (bisa generate pakai: openssl rand -base64 32)
AUTH_SECRET=ganti-dengan-string-acak-minimal-32-karakter-sangat-rahasia!

# Koneksi Database MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cyber_store_v1
DB_USERNAME=cyber_user
DB_PASSWORD=PASSWORD_MYSQL_ANDA
DB_CONNECTION_LIMIT=10

# Lokasi Penyimpanan Media Upload Persisten
MEDIA_ROOT=/var/www/cyberstore/storage_uploads

# Integrasi Email / SMTP (Wajib agar OTP registrasi & reset password terkirim via email)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=email_anda@gmail.com
MAIL_PASSWORD=app_password_gmail_anda
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="Cyber Store"

# Integrasi Payment Gateway Midtrans (Ganti dengan Production Key Anda saat live)
MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=true

# Integrasi Ongkir RajaOngkir (Opsional, fallback ke tarif flat jika kosong)
RAJAONGKIR_API_KEY=
RAJAONGKIR_BASE_URL=https://api.rajaongkir.com/starter

# Integrasi Google Login (Opsional)
GOOGLE_CLIENT_ID=
```

### B. Konfigurasi Frontend Storefront (`apps/storefront/.env`)
Salin atau buat file `apps/storefront/.env`:
```bash
nano apps/storefront/.env
```

Isi dengan konfigurasi berikut:
```env
# Mode Aplikasi & Port
NODE_ENV=production
PORT=3100

# Base URL API & Storage Backend
NUXT_PUBLIC_API_BASE=https://api.yourdomain.com/api/v1
NUXT_PUBLIC_STORAGE_BASE=https://api.yourdomain.com/storage

# Midtrans Frontend
# Production: https://app.midtrans.com/snap/snap.js | Sandbox: https://app.sandbox.midtrans.com/snap/snap.js
NUXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.midtrans.com/snap/snap.js
NUXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxx

# Google OAuth Frontend (Opsional)
NUXT_PUBLIC_GOOGLE_CLIENT_ID=
NUXT_PUBLIC_GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

---

## 8. Langkah 6: Verifikasi Database & Buat User Admin Pertama

### A. Verifikasi Skema
Jalankan verifikasi untuk memastikan seluruh 23 tabel terhubung:
```bash
npm run db:setup
```
*Output harus menyatakan: `Database existing cyber_store_v1 terdeteksi dan siap digunakan.`*

### B. Buat Akun Superadmin Pertama
Gunakan helper script bawaan untuk membuat atau mereset password akun admin awal:
```bash
# Format: npm run seed:admin <email> <password> "<Nama Lengkap>"
npm run seed:admin admin@yourdomain.com PasswordKuat123! "Super Administrator"
```

---

## 9. Langkah 7: Build Aplikasi (Kompilasi Production)

Jalankan proses build untuk Next.js dan Nuxt dari root folder:
```bash
npm run build
```
*(Perintah ini akan menjalankan `build:admin` dan `build:frontend`).*

---

## 10. Langkah 8: Menjalankan Aplikasi dengan PM2

Proyek ini telah dilengkapi file konfigurasi PM2 bawaan: `ecosystem.config.cjs`.

### A. Start Aplikasi dengan PM2
```bash
pm2 start ecosystem.config.cjs
```

### B. Simpan Status PM2 agar Otomatis Berjalan saat Server Reboot
```bash
pm2 save
pm2 startup
```
*(Jalankan perintah tambahan yang dicetak oleh `pm2 startup` di terminal Anda jika diminta).*

### C. Perintah Cek Status & Log PM2
```bash
pm2 status                  # Melihat status aplikasi
pm2 logs                    # Melihat log realtime semua aplikasi
pm2 logs cyberstore-admin   # Melihat log Next.js
pm2 logs cyberstore-storefront # Melihat log Nuxt
```

---

## 11. Langkah 9: Konfigurasi Nginx & Sertifikat SSL

Tersedia dua opsi konfigurasi domain:
- **Opsi Rekomendasi (Subdomain)**:
  - `yourdomain.com` (dan `www.yourdomain.com`) -> Storefront Pelanggan (Port 3100)
  - `api.yourdomain.com` -> Backend & Admin Panel (Port 3000)

### Buat Konfigurasi Virtual Host Nginx
```bash
sudo nano /etc/nginx/sites-available/cyberstore.conf
```

Tempel konfigurasi berikut (ganti `yourdomain.com` dengan domain asli Anda):

```nginx
# 1. FRONTEND STOREFRONT (yourdomain.com)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 2. BACKEND API & ADMIN PANEL (api.yourdomain.com)
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Aktifkan Konfigurasi & Restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/cyberstore.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Pasang Sertifikat SSL Gratis (Let's Encrypt HTTPS)
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```
Certbot akan otomatis memperbarui file konfigurasi Nginx dengan sertifikat HTTPS dan perpanjangan otomatis (auto-renew).

---

## 12. Langkah 10: Pengaturan Webhook & Layanan Pihak Ketiga

1. **Midtrans Payment Gateway**:
   - Masuk ke Dashboard Midtrans (Production/Sandbox).
   - Masuk ke menu **Settings > Configuration**.
   - Isi **Payment Notification URL**:  
     `https://api.yourdomain.com/api/v1/payments/midtrans-callback`
2. **Google Cloud Console (OAuth 2.0)**:
   - Masuk ke Google Cloud Console > Credentials.
   - Pada OAuth 2.0 Client ID Web Client, tambahkan:
     - **Authorized JavaScript origins**: `https://yourdomain.com`
     - **Authorized redirect URIs**: `https://yourdomain.com/auth/google/callback`

---

## 13. Prosedur Update Kode di Masa Depan (Redeploy)

Ketika Anda melakukan perubahan kode di GitHub dan ingin memperbarui server:

```bash
cd /var/www/cyberstore

# 1. Tarik kode terbaru
git pull origin main

# 2. Perbarui dependensi jika ada perubahan package.json
npm ci

# 3. Rebuild kedua aplikasi
npm run build

# 4. Reload PM2 tanpa downtime
pm2 reload ecosystem.config.cjs

echo "Deployment berhasil diperbarui!"
```

---

## 14. Troubleshooting Masalah Umum

| Masalah | Penyebab Umum | Solusi |
| :--- | :--- | :--- |
| **Build crash (`JavaScript heap out of memory`)** | RAM server habis saat kompilasi Next.js/Nuxt. | Buat dan aktifkan file Swap 4 GB (lihat Langkah 1B). |
| **Error 502 Bad Gateway** | Node.js aplikasi mati atau port salah. | Cek status PM2: `pm2 status`. Cek log error: `pm2 logs`. |
| **Foto Produk Tidak Muncul / Gagal Upload** | Permission folder media atau salah path `MEDIA_ROOT`. | Pastikan folder yang ditentukan di `MEDIA_ROOT` dapat ditulis oleh proses Node.js (`chmod -R 775 <folder>`). |
| **Midtrans Notifikasi Tidak Update Status Order** | URL Webhook belum HTTPS atau salah path. | Pastikan URL webhook dapat diakses publik via HTTPS dan sesuai dengan path `/api/v1/payments/midtrans-callback`. |
| **Email OTP Tidak Terkirim** | Kredensial SMTP belum diisi di `apps/admin/.env`. | Isi konfigurasi `MAIL_*` dengan App Password Gmail atau provider SMTP seperti Brevo/SendGrid. |
