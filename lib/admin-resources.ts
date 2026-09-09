import type { RowDataPacket } from "mysql2";
import type { ApiUser, ResourceMeta } from "@/types";
import { execute, row, rows, transaction } from "@/lib/db";
import { ApiError, assert } from "@/lib/http";
import { hashPassword } from "@/lib/auth";
import { saveImage } from "@/lib/media";
import { asBoolean, asNumber, cleanNullable, nowSql, parseJsonArray, publicUrl, slugify } from "@/lib/utils";

type AnyRow = RowDataPacket & Record<string, unknown>;

const orderStatuses = [
  ["Menunggu Pembayaran", "pending_payment"],
  ["Dibayar", "paid"],
  ["Dikemas", "packed"],
  ["Dikirim", "shipped"],
  ["Tiba", "arrived"],
  ["Selesai", "completed"],
  ["Dibatalkan", "cancelled"],
].map(([label, value]) => ({ label, value }));

import { mabaColorOptions } from "@/lib/constants";

export { mabaColorOptions };

const mabaColorNames = new Set(mabaColorOptions.map((option) => option.value));

export const resourceOrder = [
  "products", "categories", "orders", "payments", "users", "stock-movements",
  "expeditions", "chats", "reviews", "banners", "announcements", "settings",
];

const definitions: Record<string, ResourceMeta> = {
  products: {
    key: "products", label: "Produk", singular: "Produk", icon: "Package", primaryKey: "id",
    description: "Katalog, varian, panduan ukuran, aturan MABA, harga, stok, dan foto produk.", canCreate: true, canEdit: true, canDelete: true,
    columns: [
      { key: "name", label: "Produk" }, { key: "category_name", label: "Kategori" },
      { key: "price", label: "Harga", format: "currency" }, { key: "stock", label: "Stok", format: "number" },
      { key: "is_active", label: "Status", format: "boolean" },
    ],
    fields: [
      { key: "name", label: "Nama produk", kind: "text", required: true, placeholder: "Contoh: Jaket Almamater UBSI Hitam Premium" },
      { key: "slug", label: "Slug URL", kind: "text", placeholder: "Otomatis dibuat dari nama jika dikosongkan (contoh: jaket-almamater-ubsi)" },
      { key: "sku", label: "Kode SKU", kind: "text", placeholder: "Contoh: PRD-UBSI-001" },
      { key: "category_id", label: "Kategori", kind: "select", required: true, options: [], placeholder: "Pilih kategori produk dari daftar..." },
      { key: "description", label: "Deskripsi lengkap", kind: "textarea", placeholder: "Tuliskan deskripsi lengkap produk, bahan kain, ukuran, serta keunggulan di sini..." },
      { key: "price", label: "Harga jual (Rp)", kind: "currency", required: true, placeholder: "Contoh: 150000 (Harga jual utama dalam Rupiah)" },
      { key: "original_price", label: "Harga awal / coret (Rp)", kind: "currency", placeholder: "Contoh: 180000 (Harga sebelum diskon)" },
      { key: "stock", label: "Stok fisik awal", kind: "number", required: true, placeholder: "Contoh: 50 (Jumlah unit yang tersedia)" },
      { key: "weight", label: "Berat produk (gram)", kind: "number", required: true, placeholder: "Contoh: 300 (Berat per unit dalam satuan gram)" },
      { key: "rating", label: "Rating Produk (Bintang 0.0 - 5.0)", kind: "number", placeholder: "Isi rating kustom (misal 4.8). Kosongkan atau isi 0 untuk status Produk Baru." },
      { key: "has_sizes", label: "Produk memiliki varian ukuran", kind: "boolean", defaultValue: false, placeholder: "Aktifkan jika produk ini memiliki opsi varian ukuran (S, M, L, XL, etc.)" },
      { key: "sizes", label: "Daftar ukuran (pisahkan koma)", kind: "json", placeholder: "Contoh: S, M, L, XL, XXL (Ketik pilihan ukuran dipisah tanda koma)" },
      { key: "size_chart_file", label: "Foto panduan ukuran (Size Guide)", kind: "image", placeholder: "Pilih berkas foto panduan ukuran (JPG, PNG, atau WEBP, maks 2 MB)" },
      { key: "colors", label: "Daftar warna (pisahkan koma)", kind: "json", placeholder: "Contoh: Hitam, Navy, Putih (Ketik pilihan warna dipisah tanda koma)" },
      { key: "main_photo_file", label: "Foto utama produk", kind: "image", placeholder: "Pilih foto utama produk (JPG, PNG, atau WEBP, maks 5 MB)" },
      { key: "is_active", label: "Produk aktif", kind: "boolean", placeholder: "Aktifkan agar produk langsung tampil di katalog aplikasi toko" },
      { key: "is_recommended", label: "Rekomendasi / Unggulan", kind: "boolean", placeholder: "Tampilkan produk ini di seksi rekomendasi/populer halaman utama" },
      { key: "is_event_maba", label: "Produk event MABA (Seragam Mahasiswa Baru)", kind: "boolean", defaultValue: false, placeholder: "Aktifkan aturan penentuan warna seragam otomatis berdasarkan digit terakhir NIM MABA" },
      { key: "maba_color_ganjil", label: "Warna seragam untuk NIM ganjil (1, 3, 5, 7, 9)", kind: "select", options: mabaColorOptions, placeholder: "Pilih warna wajib untuk NIM ganjil..." },
      { key: "maba_color_genap", label: "Warna seragam untuk NIM genap (0, 2, 4, 6, 8)", kind: "select", options: mabaColorOptions, placeholder: "Pilih warna wajib untuk NIM genap..." },
    ],
  },
  categories: {
    key: "categories", label: "Kategori", singular: "Kategori", icon: "Shapes", primaryKey: "id",
    description: "Kelompok produk yang tampil di katalog.", canCreate: true, canEdit: true, canDelete: true,
    columns: [
      { key: "name", label: "Nama" }, { key: "slug", label: "Slug" },
      { key: "products_count", label: "Produk", format: "number" }, { key: "is_active", label: "Status", format: "boolean" },
    ],
    fields: [
      { key: "name", label: "Nama kategori", kind: "text", required: true, placeholder: "Contoh: Pakaian & Almamater" },
      { key: "description", label: "Deskripsi singkat", kind: "textarea", placeholder: "Tuliskan penjelasan singkat mengenai kelompok kategori produk ini..." },
      { key: "is_active", label: "Kategori aktif", kind: "boolean", placeholder: "Kategori akan muncul di menu filter katalog jika diaktifkan" },
    ],
  },
  orders: {
    key: "orders", label: "Pesanan", singular: "Pesanan", icon: "ShoppingBag", primaryKey: "id",
    description: "Pantau pembayaran, proses pesanan, dan nomor resi.", canCreate: false, canEdit: true, canDelete: false,
    columns: [
      { key: "invoice_number", label: "Invoice" }, { key: "customer_name", label: "Pelanggan" },
      { key: "grand_total", label: "Total", format: "currency" }, { key: "status", label: "Status", format: "status" },
      { key: "created_at", label: "Dibuat", format: "date" },
    ],
    fields: [
      { key: "invoice_number", label: "Nomor Invoice", kind: "text", readonly: true, placeholder: "Nomor invoice transaksi (Otomatis dibuat sistem)" },
      { key: "status", label: "Status pesanan", kind: "select", required: true, options: orderStatuses, placeholder: "Pilih status perkembangan pesanan saat ini..." },
      { key: "resi_number", label: "Nomor resi pengiriman", kind: "text", placeholder: "Contoh: JNE1234567890 (Masukkan saat status dikirim)" },
      { key: "note", label: "Catatan pesanan / internal", kind: "textarea", placeholder: "Tuliskan catatan internal atau petunjuk khusus pengiriman..." },
      { key: "cancel_request_status", label: "Status tanggapan pembatalan", kind: "select", options: [
        { label: "Belum ada pengajuan", value: "" }, { label: "Menunggu persetujuan", value: "pending" },
        { label: "Disetujui (Dibatalkan)", value: "approved" }, { label: "Ditolak (Lanjut kirim)", value: "rejected" },
      ], placeholder: "Pilih tanggapan atas pengajuan pembatalan pelanggan..." },
    ],
  },
  payments: {
    key: "payments", label: "Pembayaran", singular: "Pembayaran", icon: "CreditCard", primaryKey: "id",
    description: "Status transaksi dan referensi pembayaran Midtrans.", canCreate: false, canEdit: false, canDelete: false,
    columns: [
      { key: "invoice_number", label: "Invoice" }, { key: "customer_name", label: "Pelanggan" },
      { key: "amount", label: "Nominal", format: "currency" }, { key: "bank_code", label: "Metode" },
      { key: "status", label: "Status", format: "status" }, { key: "created_at", label: "Dibuat", format: "date" },
    ], fields: [],
  },
  users: {
    key: "users", label: "Pengguna", singular: "Pengguna", icon: "Users", primaryKey: "id",
    description: "Akun admin dan pelanggan beserta status aksesnya.", canCreate: true, canEdit: true, canDelete: true,
    deleteLabel: "Nonaktifkan",
    deleteDescription: "Akun akan dinonaktifkan dan token login dicabut. Histori pesanan tetap aman untuk audit.",
    columns: [
      { key: "name", label: "Nama" }, { key: "email", label: "Email" }, { key: "role", label: "Peran", format: "status" },
      { key: "is_active", label: "Status", format: "boolean" }, { key: "created_at", label: "Dibuat", format: "date" },
    ],
    fields: [
      { key: "name", label: "Nama lengkap", kind: "text", required: true, placeholder: "Contoh: Ahmad Rizki Pratama" },
      { key: "email", label: "Alamat Email", kind: "email", required: true, placeholder: "Contoh: ahmad@gmail.com" },
      { key: "password", label: "Password akun", kind: "password", placeholder: "Kosongkan jika tidak ingin mengubah password" },
      { key: "role", label: "Peran / Hak Akses", kind: "select", required: true, options: [
        { label: "Pelanggan", value: "customer" }, { label: "Admin", value: "admin" }, { label: "Superadmin", value: "superadmin" },
      ], placeholder: "Pilih tingkat hak akses pengguna..." },
      { key: "phone", label: "Nomor WhatsApp / HP", kind: "text", placeholder: "Contoh: 081234567890" },
      { key: "address", label: "Alamat domisili lengkap", kind: "textarea", placeholder: "Tuliskan alamat domisili / pengiriman lengkap..." },
      { key: "is_active", label: "Akun aktif", kind: "boolean", placeholder: "Pengguna dapat login dan bertransaksi jika akun diaktifkan" },
    ],
  },
  "stock-movements": {
    key: "stock-movements", label: "Mutasi Stok", singular: "Mutasi Stok", icon: "ChartNoAxesCombined", primaryKey: "id",
    description: "Riwayat stok masuk dan keluar serta pencatatan mutasi stok manual.", canCreate: true, canEdit: false, canDelete: false,
    columns: [
      { key: "id", label: "NO." },
      { key: "product_name", label: "PRODUK" },
      { key: "type", label: "TIPE" },
      { key: "quantity", label: "QTY" },
      { key: "reference", label: "REFERENSI" },
      { key: "note", label: "CATATAN" },
      { key: "user_name", label: "OLEH" },
      { key: "created_at", label: "TANGGAL", format: "date" },
    ],
    fields: [
      { key: "product_id", label: "Produk", kind: "select", required: true, options: [], placeholder: "— Pilih Produk —" },
      { key: "type", label: "Tipe Mutasi", kind: "select", required: true, options: [
        { label: "Stok Masuk (Tambah)", value: "in" }, { label: "Stok Keluar (Kurang)", value: "out" },
      ], placeholder: "— Pilih Tipe —" },
      { key: "quantity", label: "Jumlah", kind: "number", required: true, placeholder: "1" },
      { key: "reference", label: "Referensi", kind: "text", placeholder: "No. PO, Kode Retur, dll" },
      { key: "note", label: "Catatan", kind: "textarea", placeholder: "Keterangan tambahan..." },
    ],
  },
  expeditions: {
    key: "expeditions", label: "Ekspedisi", singular: "Ekspedisi", icon: "Truck", primaryKey: "id",
    description: "Kurir, layanan, ongkos dasar, dan estimasi pengiriman.", canCreate: true, canEdit: true, canDelete: true,
    columns: [
      { key: "name", label: "Nama" }, { key: "code", label: "Kode" }, { key: "service", label: "Layanan" },
      { key: "base_cost", label: "Ongkos dasar", format: "currency" }, { key: "is_active", label: "Status", format: "boolean" },
    ],
    fields: [
      { key: "name", label: "Nama Kurir / Ekspedisi", kind: "text", required: true, placeholder: "Contoh: JNE Express" },
      { key: "code", label: "Kode Kurir", kind: "text", required: true, placeholder: "Contoh: jne" },
      { key: "service", label: "Nama Layanan", kind: "text", required: true, placeholder: "Contoh: REG (Reguler)" },
      { key: "base_cost", label: "Ongkos Kirim Dasar (Rp)", kind: "currency", required: true, placeholder: "Contoh: 12000 (Ongkos kirim dasar dalam Rupiah)" },
      { key: "estimated_days", label: "Estimasi Pengiriman (Hari)", kind: "number", required: true, placeholder: "Contoh: 2 (Estimasi waktu sampai dalam hari)" },
      { key: "is_active", label: "Ekspedisi aktif", kind: "boolean", placeholder: "Ekspedisi dapat dipilih pelanggan saat checkout jika diaktifkan" },
    ],
  },
  chats: {
    key: "chats", label: "Support Chat", singular: "Support Chat", icon: "MessageSquare", primaryKey: "id",
    description: "Percakapan bantuan langsung dengan customer.", canCreate: false, canEdit: true, canDelete: true,
    columns: [
      { key: "customer_name", label: "Customer" }, { key: "subject", label: "Topik" },
      { key: "last_message", label: "Pesan Terakhir" }, { key: "status", label: "Status", format: "status" },
      { key: "last_message_at", label: "Aktivitas", format: "date" },
    ],
    fields: [
      { key: "status", label: "Status percakapan", kind: "select", options: [{ label: "Open (Dalam Penanganan)", value: "open" }, { label: "Closed (Selesai)", value: "closed" }], placeholder: "Pilih status tiket bantuan..." },
      { key: "message", label: "Pesan balasan admin", kind: "textarea", placeholder: "Tuliskan jawaban atau tanggapan resmi admin untuk customer di sini..." },
    ],
  },
  reviews: {
    key: "reviews", label: "Ulasan Produk", singular: "Ulasan", icon: "Star", primaryKey: "id",
    description: "Rating, komentar pelanggan, dan balasan admin.", canCreate: false, canEdit: true, canDelete: true,
    columns: [
      { key: "product_name", label: "Produk" }, { key: "customer_name", label: "Pelanggan" },
      { key: "rating", label: "Rating", format: "rating" }, { key: "comment", label: "Komentar" },
      { key: "is_read", label: "Dibaca", format: "boolean" },
    ],
    fields: [
      { key: "reply", label: "Balasan resmi admin", kind: "textarea", required: true, placeholder: "Tuliskan ucapan terima kasih atau tanggapan resmi admin atas ulasan ini..." },
      { key: "is_read", label: "Tandai telah dibaca", kind: "boolean", placeholder: "Tandai ulasan ini sudah dibaca dan ditinjau oleh tim admin" },
    ],
  },
  banners: {
    key: "banners", label: "Banner", singular: "Banner", icon: "GalleryHorizontalEnd", primaryKey: "id",
    description: "Banner promosi yang ditampilkan pada aplikasi pelanggan.", canCreate: true, canEdit: true, canDelete: true,
    columns: [
      { key: "title", label: "Judul" }, { key: "description", label: "Deskripsi" },
      { key: "order", label: "Urutan", format: "number" }, { key: "created_at", label: "Dibuat", format: "date" },
    ],
    fields: [
      { key: "title", label: "Judul Banner Promosi", kind: "text", placeholder: "Contoh: Promo Spesial Mahasiswa Baru UBSI 2026" },
      { key: "description", label: "Keterangan singkat", kind: "textarea", placeholder: "Tuliskan rincian promosi atau syarat ketentuan singkat..." },
      { key: "order", label: "Urutan Tampil", kind: "number", placeholder: "Contoh: 1 (Urutan tampil banner dari slide pertama)" },
      { key: "image_file", label: "Berkas Gambar Banner", kind: "image", placeholder: "Pilih berkas foto banner (JPG, PNG, atau WEBP, rekomendasi 1200x500 px)" },
    ],
  },
  announcements: {
    key: "announcements", label: "Pengumuman", singular: "Pengumuman", icon: "Megaphone", primaryKey: "id",
    description: "Pengumuman dan notifikasi untuk seluruh pelanggan.", canCreate: true, canEdit: true, canDelete: true,
    columns: [
      { key: "title", label: "Judul" }, { key: "type", label: "Tipe", format: "status" },
      { key: "recipients", label: "Penerima", format: "number" }, { key: "created_at", label: "Dibuat", format: "date" },
    ],
    fields: [
      { key: "title", label: "Judul Pengumuman", kind: "text", required: true, placeholder: "Contoh: Pengumuman Pengambilan Ukuran Jaket MABA 2026" },
      { key: "content", label: "Isi pengumuman lengkap", kind: "textarea", required: true, placeholder: "Tuliskan informasi atau pesan pengumuman lengkap di sini..." },
      { key: "type", label: "Kategori Tipe Pengumuman", kind: "select", options: [
        { label: "Informasi Umum", value: "info" }, { label: "Promo / Diskon", value: "promo" }, { label: "Status Pesanan", value: "order" }, { label: "Peringatan / Penting", value: "warning" },
      ], placeholder: "Pilih kategori tipe pengumuman..." },
      { key: "action_url", label: "Tautan / Link Aksi (Opsional)", kind: "text", placeholder: "Contoh: /products atau https://ubsi.ac.id" },
    ],
  },
  settings: {
    key: "settings", label: "Pengaturan", singular: "Pengaturan", icon: "Settings", primaryKey: "id",
    description: "Identitas toko, kontak, lokasi, dan konten informasi.", canCreate: true, canEdit: true, canDelete: true,
    columns: [
      { key: "key", label: "Kunci Pengaturan", format: "string" }, { key: "value", label: "Nilai Konfigurasi", format: "string" }, { key: "updated_at", label: "Diperbarui", format: "date" },
    ],
    fields: [
      { key: "key", label: "Kunci Pengaturan", kind: "text", required: true, placeholder: "Contoh: store_name, store_phone, store_address" },
      { key: "value", label: "Nilai / Isi Konfigurasi", kind: "textarea", placeholder: "Tuliskan nilai isi pengaturan toko di sini..." },
    ],
  },
};

export async function getResourceMeta(key: string) {
  const original = definitions[key];
  if (!original) throw new ApiError(404, "Modul admin tidak ditemukan.");
  const meta = structuredClone(original);
  if (key === "products") {
    const choices = await rows<AnyRow>("SELECT id, name FROM categories ORDER BY name");
    const field = meta.fields.find((entry) => entry.key === "category_id");
    if (field) field.options = choices.map((entry) => ({ label: String(entry.name), value: String(entry.id) }));
  }
  if (key === "stock-movements") {
    const choices = await rows<AnyRow>("SELECT id, name, stock FROM products ORDER BY name");
    const field = meta.fields.find((entry) => entry.key === "product_id");
    if (field) field.options = choices.map((entry) => ({ label: `${entry.name} (Stok: ${entry.stock})`, value: String(entry.id) }));
  }
  return meta;
}

function listQuery(key: string, search: string, status = "", productId = "", typeFilter = "", cancelStatus = "") {
  const like = `%${search}%`;
  const statusNum = status === "1" ? 1 : status === "0" ? 0 : status;

  const queries: Record<string, { select: string; count: string; values: unknown[] }> = {
    products: {
      select: `SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id = p.category_id
        WHERE (? = '' OR p.name LIKE ? OR p.sku LIKE ?) AND (? = '' OR p.is_active = ?) ORDER BY p.created_at DESC, p.id DESC`,
      count: "SELECT COUNT(*) AS total FROM products p WHERE (? = '' OR p.name LIKE ? OR p.sku LIKE ?) AND (? = '' OR p.is_active = ?)",
      values: [search, like, like, status, statusNum],
    },
    categories: {
      select: `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS products_count FROM categories c
        WHERE (? = '' OR c.name LIKE ?) AND (? = '' OR c.is_active = ?) ORDER BY c.name`,
      count: "SELECT COUNT(*) AS total FROM categories c WHERE (? = '' OR c.name LIKE ?) AND (? = '' OR c.is_active = ?)",
      values: [search, like, status, statusNum],
    },
    orders: {
      select: `SELECT o.*,
          u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
          e.name AS expedition_name, e.service AS expedition_service, e.code AS expedition_code,
          ca.address AS customer_address, ca.province, ca.city, ca.district, ca.village, ca.postal_code, ca.receiver_name, ca.phone AS address_phone
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        LEFT JOIN expeditions e ON e.id = o.expedition_id
        LEFT JOIN customer_addresses ca ON ca.id = o.customer_address_id
        WHERE (? = '' OR o.invoice_number LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR o.resi_number LIKE ?)
          AND (? = '' OR o.status = ?)
          AND (
            ? = ''
            OR (? = 'has_request' AND o.cancel_request_status IS NOT NULL AND o.cancel_request_status != '')
            OR (? = 'no_request' AND (o.cancel_request_status IS NULL OR o.cancel_request_status = ''))
            OR o.cancel_request_status = ?
          )
        ORDER BY o.created_at DESC, o.id DESC`,
      count: `SELECT COUNT(*) AS total
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        WHERE (? = '' OR o.invoice_number LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR o.resi_number LIKE ?)
          AND (? = '' OR o.status = ?)
          AND (
            ? = ''
            OR (? = 'has_request' AND o.cancel_request_status IS NOT NULL AND o.cancel_request_status != '')
            OR (? = 'no_request' AND (o.cancel_request_status IS NULL OR o.cancel_request_status = ''))
            OR o.cancel_request_status = ?
          )`,
      values: [
        search, like, like, like, like,
        status, status,
        cancelStatus, cancelStatus, cancelStatus, cancelStatus
      ],
    },
    payments: {
      select: `SELECT pay.*, o.invoice_number, u.name AS customer_name FROM payments pay LEFT JOIN orders o ON o.id = pay.order_id LEFT JOIN users u ON u.id = o.user_id
        WHERE (? = '' OR o.invoice_number LIKE ? OR u.name LIKE ?) AND (? = '' OR pay.status = ?) ORDER BY pay.created_at DESC`,
      count: "SELECT COUNT(*) AS total FROM payments pay LEFT JOIN orders o ON o.id = pay.order_id LEFT JOIN users u ON u.id = o.user_id WHERE (? = '' OR o.invoice_number LIKE ? OR u.name LIKE ?) AND (? = '' OR pay.status = ?)",
      values: [search, like, like, status, status],
    },
    users: {
      select: `SELECT * FROM users WHERE (? = '' OR name LIKE ? OR email LIKE ?) AND (? = '' OR is_active = ?) ORDER BY created_at DESC`,
      count: "SELECT COUNT(*) AS total FROM users WHERE (? = '' OR name LIKE ? OR email LIKE ?) AND (? = '' OR is_active = ?)",
      values: [search, like, like, status, statusNum],
    },
    "stock-movements": {
      select: `SELECT sm.*, p.name AS product_name, p.stock AS current_stock, COALESCE(u.name, 'Sistem') AS user_name
        FROM stock_movements sm
        JOIN products p ON p.id = sm.product_id
        LEFT JOIN users u ON u.id = sm.user_id
        WHERE (? = '' OR p.name LIKE ? OR sm.reference LIKE ? OR sm.note LIKE ?)
          AND (? = '' OR sm.product_id = ?)
          AND (? = '' OR sm.type = ?)
        ORDER BY sm.created_at DESC, sm.id DESC`,
      count: `SELECT COUNT(*) AS total
        FROM stock_movements sm
        JOIN products p ON p.id = sm.product_id
        WHERE (? = '' OR p.name LIKE ? OR sm.reference LIKE ? OR sm.note LIKE ?)
          AND (? = '' OR sm.product_id = ?)
          AND (? = '' OR sm.type = ?)`,
      values: [search, like, like, like, productId, productId, typeFilter, typeFilter],
    },
    expeditions: {
      select: `SELECT * FROM expeditions WHERE (? = '' OR name LIKE ? OR code LIKE ?) AND (? = '' OR is_active = ?) ORDER BY name`,
      count: "SELECT COUNT(*) AS total FROM expeditions WHERE (? = '' OR name LIKE ? OR code LIKE ?) AND (? = '' OR is_active = ?)",
      values: [search, like, like, status, statusNum],
    },
    chats: {
      select: `SELECT c.*,
          u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone, u.photo AS customer_photo,
          (SELECT message FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1) AS last_message,
          (SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id AND sender_type = 'customer' AND is_read = 0) AS unread_count,
          COALESCE(c.last_message_at, c.created_at) AS last_activity_time
        FROM chats c
        LEFT JOIN users u ON u.id = c.customer_id
        WHERE (? = '' OR u.name LIKE ? OR u.email LIKE ? OR c.subject LIKE ?)
          AND (? = '' OR c.status = ?)
        ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC`,
      count: `SELECT COUNT(*) AS total
        FROM chats c
        LEFT JOIN users u ON u.id = c.customer_id
        WHERE (? = '' OR u.name LIKE ? OR u.email LIKE ? OR c.subject LIKE ?)
          AND (? = '' OR c.status = ?)`,
      values: [search, like, like, like, status, status],
    },
    reviews: {
      select: `SELECT pr.*,
          p.name AS product_name, p.slug AS product_slug, p.main_photo AS product_photo, p.price AS product_price,
          u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone, u.photo AS customer_photo, u.created_at AS customer_registered_at
        FROM product_reviews pr
        JOIN products p ON p.id = pr.product_id
        LEFT JOIN users u ON u.id = pr.user_id
        WHERE (? = '' OR p.name LIKE ? OR u.name LIKE ? OR pr.comment LIKE ?)
          AND (
            ? = ''
            OR (? = 'unreplied' AND (pr.reply IS NULL OR pr.reply = ''))
            OR (? = 'replied' AND pr.reply IS NOT NULL AND pr.reply != '')
            OR pr.rating = ?
          )
        ORDER BY pr.created_at DESC, pr.id DESC`,
      count: `SELECT COUNT(*) AS total
        FROM product_reviews pr
        JOIN products p ON p.id = pr.product_id
        LEFT JOIN users u ON u.id = pr.user_id
        WHERE (? = '' OR p.name LIKE ? OR u.name LIKE ? OR pr.comment LIKE ?)
          AND (
            ? = ''
            OR (? = 'unreplied' AND (pr.reply IS NULL OR pr.reply = ''))
            OR (? = 'replied' AND pr.reply IS NOT NULL AND pr.reply != '')
            OR pr.rating = ?
          )`,
      values: [search, like, like, like, status, status, status, statusNum],
    },
    banners: {
      select: `SELECT * FROM banners WHERE (? = '' OR title LIKE ?) ORDER BY \`order\` ASC, created_at DESC`,
      count: "SELECT COUNT(*) AS total FROM banners WHERE (? = '' OR title LIKE ?)",
      values: [search, like],
    },
    announcements: {
      select: `SELECT * FROM announcements WHERE (? = '' OR title LIKE ?) ORDER BY created_at DESC`,
      count: "SELECT COUNT(*) AS total FROM announcements WHERE (? = '' OR title LIKE ?)",
      values: [search, like],
    },
    settings: {
      select: `SELECT * FROM settings WHERE (? = '' OR \`key\` LIKE ? OR \`value\` LIKE ?) ORDER BY \`key\``,
      count: "SELECT COUNT(*) AS total FROM settings WHERE (? = '' OR \`key\` LIKE ? OR \`value\` LIKE ?)",
      values: [search, like, like],
    },
  };
  const item = queries[key];
  if (!item) throw new ApiError(404, "Definisi query tidak ditemukan.");
  return item;
}

async function uploadMedia(fileOrString: unknown, folder: string): Promise<string | null> {
  if (typeof File !== "undefined" && fileOrString instanceof File && fileOrString.size > 0) {
    return await saveImage(fileOrString, folder);
  }
  if (typeof fileOrString === "string" && fileOrString.trim()) {
    return fileOrString.trim();
  }
  return null;
}

export async function listResource(
  key: string,
  paramsOrSearch?: { search?: string; status?: string; page?: number; perPage?: number; productId?: string; type?: string; cancelStatus?: string } | string,
  pageArg?: number,
  perPageArg?: number
) {
  let search = "";
  let status = "";
  let productId = "";
  let typeFilter = "";
  let cancelStatus = "";
  let page = 1;
  let perPage = 15;

  if (typeof paramsOrSearch === "object" && paramsOrSearch !== null) {
    search = paramsOrSearch.search || "";
    status = paramsOrSearch.status || "";
    productId = paramsOrSearch.productId || "";
    typeFilter = paramsOrSearch.type || "";
    cancelStatus = paramsOrSearch.cancelStatus || "";
    page = paramsOrSearch.page || 1;
    perPage = paramsOrSearch.perPage || 15;
  } else {
    search = typeof paramsOrSearch === "string" ? paramsOrSearch : "";
    page = pageArg || 1;
    perPage = perPageArg || 15;
  }

  const query = listQuery(key, search, status, productId, typeFilter, cancelStatus);
  const offset = Math.max(0, (page - 1) * perPage);
  const [totalRow] = await rows<AnyRow>(query.count, query.values);
  const total = Number(totalRow?.total || 0);
  const data = await rows<AnyRow>(`${query.select} LIMIT ? OFFSET ?`, [...query.values, perPage, offset]);
  return { data, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getOrderDetail(orderId: number) {
  const [order] = await rows<AnyRow>(
    `SELECT o.*,
        u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
        e.name AS expedition_name, e.service AS expedition_service, e.code AS expedition_code,
        ca.address AS customer_address, ca.province, ca.city, ca.district, ca.village, ca.postal_code, ca.receiver_name, ca.phone AS address_phone
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     LEFT JOIN expeditions e ON e.id = o.expedition_id
     LEFT JOIN customer_addresses ca ON ca.id = o.customer_address_id
     WHERE o.id = ? LIMIT 1`,
    [orderId]
  );
  if (!order) return null;

  const items = await rows<AnyRow>(
    `SELECT oi.*, p.main_photo, p.name AS catalog_name
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [orderId]
  );

  const [payment] = await rows<AnyRow>(
    `SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
    [orderId]
  );

  return { order, items, payment: payment || null };
}

export async function getChatDetail(chatId: number) {
  const chat = await row<AnyRow>(
    `SELECT c.*,
       u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone, u.photo AS customer_photo, u.address AS customer_address, u.created_at AS customer_registered_at,
       p.name AS linked_product_name, p.main_photo AS linked_product_photo, p.price AS linked_product_price
     FROM chats c
     LEFT JOIN users u ON u.id = c.customer_id
     LEFT JOIN products p ON p.id = c.product_id
     WHERE c.id = ?
     LIMIT 1`,
    [chatId]
  );

  if (!chat) return null;

  // Mark unread customer messages as read
  await execute(
    "UPDATE chat_messages SET is_read = 1 WHERE chat_id = ? AND sender_type = 'customer' AND is_read = 0",
    [chatId]
  );

  const messages = await rows<AnyRow>(
    `SELECT m.*, u.name AS sender_name, u.photo AS sender_photo
     FROM chat_messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.chat_id = ?
     ORDER BY m.created_at ASC, m.id ASC`,
    [chatId]
  );

  const customerOrders = chat.customer_id
    ? await rows<AnyRow>(
        `SELECT id, invoice_number, grand_total, status, created_at
         FROM orders
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 5`,
        [chat.customer_id]
      )
    : [];

  return {
    chat,
    messages,
    customerOrders,
  };
}

export async function getReviewDetail(reviewId: number) {
  const review = await row<AnyRow>(
    `SELECT pr.*,
       p.id AS product_id, p.name AS product_name, p.slug AS product_slug, p.main_photo AS product_photo, p.price AS product_price, p.stock AS product_stock, p.rating AS product_rating, p.reviews_count AS product_reviews_count,
       u.id AS customer_id, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone, u.photo AS customer_photo, u.address AS customer_address, u.created_at AS customer_registered_at,
       o.invoice_number, o.status AS order_status, o.grand_total AS order_grand_total, o.created_at AS order_created_at
     FROM product_reviews pr
     JOIN products p ON p.id = pr.product_id
     LEFT JOIN users u ON u.id = pr.user_id
     LEFT JOIN orders o ON o.id = pr.order_id
     WHERE pr.id = ?
     LIMIT 1`,
    [reviewId]
  );

  if (!review) return null;

  // Mark review as read when opened
  if (!review.is_read) {
    await execute("UPDATE product_reviews SET is_read = 1 WHERE id = ?", [reviewId]);
    review.is_read = 1;
  }

  // Customer's other reviews
  const otherReviews = review.user_id
    ? await rows<AnyRow>(
        `SELECT pr.id, pr.rating, pr.comment, pr.reply, pr.created_at, p.name AS product_name, p.main_photo AS product_photo
         FROM product_reviews pr
         JOIN products p ON p.id = pr.product_id
         WHERE pr.user_id = ? AND pr.id != ?
         ORDER BY pr.created_at DESC
         LIMIT 5`,
        [review.user_id, reviewId]
      )
    : [];

  // Customer's recent orders
  const customerOrders = review.user_id
    ? await rows<AnyRow>(
        `SELECT id, invoice_number, grand_total, status, created_at
         FROM orders
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 5`,
        [review.user_id]
      )
    : [];

  return {
    review,
    otherReviews,
    customerOrders,
  };
}

export async function createResource(key: string, data: Record<string, unknown>, _adminUser: ApiUser) {
  const meta = definitions[key];
  if (!meta || !meta.canCreate) throw new ApiError(403, `Modul ${key} tidak mendukung penambahan data.`);

  if (key === "products") {
    const name = String(data.name || "").trim();
    assert(name, "Nama produk wajib diisi.");
    const price = asNumber(data.price);
    assert(price > 0, "Harga produk tidak valid.");
    const categoryId = asNumber(data.category_id);
    assert(categoryId > 0, "Kategori produk wajib dipilih.");

    const slug = slugify(String(data.slug || "").trim() || name);
    const sku = String(data.sku || "").trim() || `PRD-${Date.now()}`;
    const desc = cleanNullable(data.description as string);
    const origPrice = data.original_price !== undefined && data.original_price !== "" ? asNumber(data.original_price) : null;
    const stock = asNumber(data.stock, 0);
    const weight = asNumber(data.weight, 100);
    const ratingVal = data.rating !== undefined && data.rating !== "" ? asNumber(data.rating, 0) : 0;
    const hasSizes = asBoolean(data.has_sizes);
    const sizesArr = hasSizes ? parseJsonArray(data.sizes) : null;
    const colorsArr = parseJsonArray(data.colors);
    const sizeChartFile = hasSizes ? await uploadMedia(data.size_chart_file, "products") : null;
    const mainPhotoFile = await uploadMedia(data.main_photo_file, "products");
    const isActive = data.is_active !== undefined ? asBoolean(data.is_active) : true;
    const isRecommended = asBoolean(data.is_recommended);

    const isEventMaba = asBoolean(data.is_event_maba);
    const mabaGanjil = cleanNullable(data.maba_color_ganjil as string);
    const mabaGenap = cleanNullable(data.maba_color_genap as string);
    if (isEventMaba) {
      if (mabaGanjil && !String(mabaGanjil).trim()) throw new ApiError(422, "Warna MABA NIM ganjil tidak valid.");
      if (mabaGenap && !String(mabaGenap).trim()) throw new ApiError(422, "Warna MABA NIM genap tidak valid.");
    }

    const insertedId = await transaction(async (tx) => {
      const res = await tx.execute(
        `INSERT INTO products (name, slug, sku, category_id, description, price, original_price, stock, weight, rating, sizes, size_chart, colors, main_photo, is_active, is_recommended, is_event_maba, maba_color_ganjil, maba_color_genap, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          name, slug, sku, categoryId, desc, price, origPrice, stock, weight, ratingVal,
          sizesArr ? JSON.stringify(sizesArr) : null, sizeChartFile,
          colorsArr ? JSON.stringify(colorsArr) : null, mainPhotoFile,
          isActive ? 1 : 0, isRecommended ? 1 : 0, isEventMaba ? 1 : 0,
          mabaGanjil, mabaGenap,
        ]
      );
      const newId = res.insertId;

      // Handle gallery slot uploads (gallery_slot_2 through gallery_slot_6)
      for (let slot = 2; slot <= 6; slot++) {
        const slotFile = data[`gallery_slot_${slot}`];
        if (slotFile) {
          const uploaded = await uploadMedia(slotFile, "products");
          if (uploaded) {
            await tx.execute(
              `INSERT INTO product_images (product_id, image, sort_order, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
              [newId, uploaded, slot - 1]
            );
          }
        }
      }

      // Handle multi images dropzone upload
      if (data.multi_images) {
        const files = Array.isArray(data.multi_images) ? data.multi_images : [data.multi_images];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (f) {
            const uploaded = await uploadMedia(f, "products");
            if (uploaded) {
              await tx.execute(
                `INSERT INTO product_images (product_id, image, sort_order, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
                [newId, uploaded, i + 1]
              );
            }
          }
        }
      }

      if (stock > 0) {
        await tx.execute(
          `INSERT INTO stock_movements (product_id, type, quantity, reference, note, created_at, updated_at)
           VALUES (?, 'in', ?, 'STOK-AWAL', 'Penambahan produk baru', NOW(), NOW())`,
          [newId, stock]
        );
      }
      return newId;
    });
    return insertedId;
  }

  if (key === "categories") {
    const name = String(data.name || "").trim();
    assert(name, "Nama kategori wajib diisi.");
    const slug = slugify(String(data.slug || "").trim() || name);
    const desc = cleanNullable(data.description as string);
    const isActive = data.is_active !== undefined ? asBoolean(data.is_active) : true;
    const res = await execute(
      "INSERT INTO categories (name, slug, description, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [name, slug, desc, isActive ? 1 : 0]
    );
    return res.insertId;
  }

  if (key === "users") {
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");
    const role = String(data.role || "customer");
    assert(name, "Nama pengguna wajib diisi.");
    assert(email, "Email wajib diisi.");
    assert(password.length >= 6, "Password minimal 6 karakter.");
    const existing = await row<AnyRow>("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) throw new ApiError(422, "Email sudah terdaftar.");
    const hash = await hashPassword(password);
    const phone = cleanNullable(data.phone as string);
    const address = cleanNullable(data.address as string);
    const isActive = data.is_active !== undefined ? asBoolean(data.is_active) : true;
    const res = await execute(
      `INSERT INTO users (name, email, password, role, phone, address, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, email, hash, role, phone, address, isActive ? 1 : 0]
    );
    return res.insertId;
  }

  if (key === "stock-movements") {
    const productId = asNumber(data.product_id);
    assert(productId > 0, "Pilihan produk wajib.");
    const type = String(data.type || "in");
    assert(["in", "out"].includes(type), "Jenis pergerakan stok tidak valid.");
    const qty = asNumber(data.quantity);
    assert(qty > 0, "Jumlah stok harus lebih dari 0.");
    const reference = String(data.reference || `ADJ-${Date.now()}`).trim();
    const note = cleanNullable(data.note as string);

    return await transaction(async (tx) => {
      const prod = await tx.rows<AnyRow>("SELECT stock FROM products WHERE id = ?", [productId]);
      if (!prod.length) throw new ApiError(404, "Produk tidak ditemukan.");
      const currentStock = Number(prod[0].stock || 0);
      const nextStock = type === "in" ? currentStock + qty : currentStock - qty;
      if (nextStock < 0) throw new ApiError(422, "Stok tidak mencukupi untuk pengurangan.");
      await tx.execute("UPDATE products SET stock = ?, updated_at = NOW() WHERE id = ?", [nextStock, productId]);
      const sm = await tx.execute(
        `INSERT INTO stock_movements (product_id, user_id, type, quantity, reference, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [productId, _adminUser?.id || null, type, qty, reference, note]
      );
      return sm.insertId;
    });
  }

  if (key === "expeditions") {
    const name = String(data.name || "").trim();
    const code = String(data.code || "").trim().toLowerCase();
    const service = String(data.service || "").trim();
    const baseCost = asNumber(data.base_cost);
    const estDays = asNumber(data.estimated_days, 2);
    assert(Boolean(name && code && service), "Nama, kode, dan layanan ekspedisi wajib diisi.");
    const isActive = data.is_active !== undefined ? asBoolean(data.is_active) : true;
    const res = await execute(
      `INSERT INTO expeditions (name, code, service, base_cost, estimated_days, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, code, service, baseCost, estDays, isActive ? 1 : 0]
    );
    return res.insertId;
  }

  if (key === "banners") {
    const title = cleanNullable(data.title as string);
    const desc = cleanNullable(data.description as string);
    const order = asNumber(data.order, 0);
    const imageFile = await uploadMedia(data.image_file, "banners");
    const res = await execute(
      "INSERT INTO banners (title, description, image, `order`, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [title, desc, imageFile, order]
    );
    return res.insertId;
  }

  if (key === "announcements") {
    const title = String(data.title || "").trim();
    const content = String(data.content || "").trim();
    assert(Boolean(title && content), "Judul dan isi pengumuman wajib diisi.");
    const type = String(data.type || "info");
    const actionUrl = cleanNullable(data.action_url as string);
    const res = await execute(
      "INSERT INTO announcements (title, content, type, action_url, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [title, content, type, actionUrl]
    );
    return res.insertId;
  }

  if (key === "settings") {
    const settingKey = String(data.key || "").trim();
    const settingVal = String(data.value || "").trim();
    assert(Boolean(settingKey), "Kunci pengaturan wajib diisi.");
    const res = await execute(
      "INSERT INTO settings (`key`, `value`, created_at, updated_at) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()",
      [settingKey, settingVal]
    );
    return res.insertId;
  }

  throw new ApiError(400, `Modul ${key} belum didukung.`);
}

export async function updateResource(key: string, id: number, data: Record<string, unknown>, adminUser: ApiUser) {
  const meta = definitions[key];
  if (!meta || !meta.canEdit) throw new ApiError(403, `Modul ${key} tidak mendukung pengubahan.`);

  if (key === "products") {
    const existing = await row<AnyRow>("SELECT * FROM products WHERE id = ?", [id]);
    if (!existing) throw new ApiError(404, "Produk tidak ditemukan.");

    const name = data.name !== undefined ? String(data.name).trim() : String(existing.name);
    assert(name, "Nama produk wajib diisi.");
    const price = data.price !== undefined ? asNumber(data.price) : Number(existing.price);
    assert(price > 0, "Harga produk tidak valid.");
    const categoryId = data.category_id !== undefined ? asNumber(data.category_id) : Number(existing.category_id);

    const slug = data.slug !== undefined ? slugify(String(data.slug).trim() || name) : String(existing.slug);
    const sku = data.sku !== undefined ? String(data.sku).trim() : String(existing.sku);
    const desc = data.description !== undefined ? cleanNullable(data.description as string) : (existing.description as string | null);
    const origPrice = data.original_price !== undefined ? (data.original_price !== "" ? asNumber(data.original_price) : null) : (existing.original_price as number | null);
    const stock = data.stock !== undefined ? asNumber(data.stock, 0) : Number(existing.stock);
    const weight = data.weight !== undefined ? asNumber(data.weight, 100) : Number(existing.weight);
    
    // Determine whether product has sizes
    const hasSizes = data.has_sizes !== undefined ? asBoolean(data.has_sizes) : Boolean(existing.sizes);
    let sizesArr = data.sizes !== undefined ? parseJsonArray(data.sizes) : parseJsonArray(existing.sizes);
    if (!hasSizes) {
      sizesArr = null;
    }
    const colorsArr = data.colors !== undefined ? parseJsonArray(data.colors) : parseJsonArray(existing.colors);

    // Size chart handling
    let sizeChart = (existing.size_chart || null) as string | null;
    if (data.remove_size_chart === "true" || data.remove_size_chart === true || !hasSizes) {
      sizeChart = null;
    } else if (data.size_chart_file) {
      const uploaded = await uploadMedia(data.size_chart_file, "products");
      if (uploaded) sizeChart = uploaded;
    }

    // Main photo handling
    let mainPhoto = (existing.main_photo || null) as string | null;
    if (data.main_photo_file) {
      const uploaded = await uploadMedia(data.main_photo_file, "products");
      if (uploaded) mainPhoto = uploaded;
    }

    const isActive = data.is_active !== undefined ? asBoolean(data.is_active) : Boolean(existing.is_active);
    const isRecommended = data.is_recommended !== undefined ? asBoolean(data.is_recommended) : Boolean(existing.is_recommended);
    const ratingVal = data.rating !== undefined && data.rating !== "" ? asNumber(data.rating, 0) : (existing.rating !== undefined ? Number(existing.rating) : 0);

    const isEventMaba = data.is_event_maba !== undefined ? asBoolean(data.is_event_maba) : Boolean(existing.is_event_maba);
    const mabaGanjil = data.maba_color_ganjil !== undefined ? cleanNullable(data.maba_color_ganjil as string) : (existing.maba_color_ganjil as string | null);
    const mabaGenap = data.maba_color_genap !== undefined ? cleanNullable(data.maba_color_genap as string) : (existing.maba_color_genap as string | null);

    if (isEventMaba) {
      if (mabaGanjil && !String(mabaGanjil).trim()) throw new ApiError(422, "Warna MABA NIM ganjil tidak valid.");
      if (mabaGenap && !String(mabaGenap).trim()) throw new ApiError(422, "Warna MABA NIM genap tidak valid.");
    }

    const prevStock = Number(existing.stock || 0);
    const stockDiff = stock - prevStock;

    await transaction(async (tx) => {
      await tx.execute(
        `UPDATE products SET name = ?, slug = ?, sku = ?, category_id = ?, description = ?, price = ?, original_price = ?, stock = ?, weight = ?, rating = ?, sizes = ?, size_chart = ?, colors = ?, main_photo = ?, is_active = ?, is_recommended = ?, is_event_maba = ?, maba_color_ganjil = ?, maba_color_genap = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          name, slug, sku, categoryId, desc, price, origPrice, stock, weight, ratingVal,
          sizesArr ? JSON.stringify(sizesArr) : null, sizeChart,
          colorsArr ? JSON.stringify(colorsArr) : null, mainPhoto,
          isActive ? 1 : 0, isRecommended ? 1 : 0, isEventMaba ? 1 : 0,
          mabaGanjil, mabaGenap, id,
        ]
      );

      // Handle deleted gallery images
      if (data.delete_gallery_image_ids) {
        const idsToDelete = String(data.delete_gallery_image_ids)
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n) && n > 0);
        if (idsToDelete.length > 0) {
          const placeholders = idsToDelete.map(() => "?").join(",");
          await tx.execute(
            `DELETE FROM product_images WHERE product_id = ? AND id IN (${placeholders})`,
            [id, ...idsToDelete]
          );
        }
      }

      // Handle gallery slot uploads (gallery_slot_2 through gallery_slot_6)
      for (let slot = 2; slot <= 6; slot++) {
        const slotFile = data[`gallery_slot_${slot}`];
        if (slotFile) {
          const uploaded = await uploadMedia(slotFile, "products");
          if (uploaded) {
            await tx.execute(
              `INSERT INTO product_images (product_id, image, sort_order, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
              [id, uploaded, slot - 1]
            );
          }
        }
      }

      // Handle multi images dropzone upload
      if (data.multi_images) {
        const files = Array.isArray(data.multi_images) ? data.multi_images : [data.multi_images];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (f) {
            const uploaded = await uploadMedia(f, "products");
            if (uploaded) {
              await tx.execute(
                `INSERT INTO product_images (product_id, image, sort_order, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
                [id, uploaded, i + 1]
              );
            }
          }
        }
      }

      if (stockDiff !== 0) {
        const type = stockDiff > 0 ? "in" : "out";
        await tx.execute(
          `INSERT INTO stock_movements (product_id, type, quantity, reference, note, created_at, updated_at)
           VALUES (?, ?, ?, 'EDIT-PRODUK', 'Penyesuaian stok dari edit produk', NOW(), NOW())`,
          [id, type, Math.abs(stockDiff)]
        );
      }
    });
    return;
  }

  if (key === "categories") {
    const existing = await row<AnyRow>("SELECT * FROM categories WHERE id = ?", [id]);
    if (!existing) throw new ApiError(404, "Kategori tidak ditemukan.");
    const name = data.name !== undefined ? String(data.name).trim() : String(existing.name);
    assert(name, "Nama kategori wajib diisi.");
    const slug = data.slug !== undefined ? slugify(String(data.slug).trim() || name) : String(existing.slug);
    const desc = data.description !== undefined ? cleanNullable(data.description as string) : (existing.description as string | null);
    const isActive = data.is_active !== undefined ? asBoolean(data.is_active) : Boolean(existing.is_active);
    await execute(
      "UPDATE categories SET name = ?, slug = ?, description = ?, is_active = ?, updated_at = NOW() WHERE id = ?",
      [name, slug, desc, isActive ? 1 : 0, id]
    );
    return;
  }

  if (key === "orders") {
    const existing = await row<AnyRow>("SELECT * FROM orders WHERE id = ?", [id]);
    if (!existing) throw new ApiError(404, "Pesanan tidak ditemukan.");

    const status = data.status !== undefined ? String(data.status) : String(existing.status);
    const resiNumber = data.resi_number !== undefined ? cleanNullable(data.resi_number as string) : (existing.resi_number as string | null);
    const note = data.note !== undefined ? cleanNullable(data.note as string) : (existing.note as string | null);
    const cancelStatus = data.cancel_request_status !== undefined ? cleanNullable(data.cancel_request_status as string) : (existing.cancel_request_status as string | null);

    let finalStatus = status;
    if (cancelStatus === "approved") {
      finalStatus = "cancelled";
    }

    await execute(
      `UPDATE orders SET status = ?, resi_number = ?, note = ?, cancel_request_status = ?, updated_at = NOW() WHERE id = ?`,
      [finalStatus, resiNumber, note, cancelStatus, id]
    );
    return;
  }

  if (key === "users") {
    const existing = await row<AnyRow>("SELECT * FROM users WHERE id = ?", [id]);
    if (!existing) throw new ApiError(404, "Pengguna tidak ditemukan.");

    const name = data.name !== undefined ? String(data.name).trim() : String(existing.name);
    const email = data.email !== undefined ? String(data.email).trim().toLowerCase() : String(existing.email);
    const role = data.role !== undefined ? String(data.role) : String(existing.role);
    assert(name, "Nama pengguna wajib diisi.");
    assert(email, "Email wajib diisi.");

    let hash = String(existing.password);
    if (data.password && String(data.password).length > 0) {
      assert(String(data.password).length >= 6, "Password minimal 6 karakter.");
      hash = await hashPassword(String(data.password));
    }
    const phone = data.phone !== undefined ? cleanNullable(data.phone as string) : (existing.phone as string | null);
    const address = data.address !== undefined ? cleanNullable(data.address as string) : (existing.address as string | null);
    const isActive = data.is_active !== undefined ? asBoolean(data.is_active) : Boolean(existing.is_active);

    await execute(
      `UPDATE users SET name = ?, email = ?, password = ?, role = ?, phone = ?, address = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
      [name, email, hash, role, phone, address, isActive ? 1 : 0, id]
    );
    return;
  }


  if (key === "expeditions") {
    const existing = await row<AnyRow>("SELECT * FROM expeditions WHERE id = ?", [id]);
    if (!existing) throw new ApiError(404, "Ekspedisi tidak ditemukan.");

    const name = data.name !== undefined ? String(data.name).trim() : String(existing.name);
    const code = data.code !== undefined ? String(data.code).trim().toLowerCase() : String(existing.code);
    const service = data.service !== undefined ? String(data.service).trim() : String(existing.service);
    const baseCost = data.base_cost !== undefined ? asNumber(data.base_cost as string | number) : Number(existing.base_cost);
    const estDays = data.estimated_days !== undefined ? asNumber(data.estimated_days as string | number, 2) : Number(existing.estimated_days);
    const isActive = data.is_active !== undefined ? asBoolean(data.is_active as string | boolean) : Boolean(existing.is_active);

    await execute(
      `UPDATE expeditions SET name = ?, code = ?, service = ?, base_cost = ?, estimated_days = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
      [name, code, service, baseCost, estDays, isActive ? 1 : 0, id]
    );
    return;
  }

  if (key === "chats") {
    const existing = await row<AnyRow>("SELECT * FROM chats WHERE id = ?", [id]);
    if (!existing) throw new ApiError(404, "Chat tidak ditemukan.");

    const status = data.status !== undefined ? String(data.status) : String(existing.status);
    const message = cleanNullable(data.message as string);

    await transaction(async (tx) => {
      await tx.execute("UPDATE chats SET status = ?, last_message_at = NOW(), updated_at = NOW() WHERE id = ?", [status, id]);
      if (message) {
        await tx.execute(
          "INSERT INTO chat_messages (chat_id, sender_type, sender_id, message, is_read, created_at, updated_at) VALUES (?, 'admin', ?, ?, 0, NOW(), NOW())",
          [id, adminUser.id, message]
        );
      }
      await tx.execute("UPDATE chat_messages SET is_read = 1 WHERE chat_id = ? AND sender_type = 'customer'", [id]);
    });
    return;
  }

  if (key === "reviews") {
    const existing = await row<AnyRow>("SELECT * FROM product_reviews WHERE id = ?", [id]);
    if (!existing) throw new ApiError(404, "Ulasan tidak ditemukan.");

    const reply = cleanNullable(data.reply as string);
    const isRead = data.is_read !== undefined ? asBoolean(data.is_read as string | boolean) : true;

    await execute(
      "UPDATE product_reviews SET reply = ?, is_read = ?, updated_at = NOW() WHERE id = ?",
      [reply, isRead ? 1 : 0, id]
    );
    return;
  }

  if (key === "banners") {
    const existing = await row<AnyRow>("SELECT * FROM banners WHERE id = ?", [id]);
    if (!existing) throw new ApiError(404, "Banner tidak ditemukan.");

    const title = data.title !== undefined ? cleanNullable(data.title as string) : (existing.title as string | null);
    const desc = data.description !== undefined ? cleanNullable(data.description as string) : (existing.description as string | null);
    const order = data.order !== undefined ? asNumber(data.order as string | number, 0) : Number(existing.order);
    const imageFile = data.image_file !== undefined ? await uploadMedia(data.image_file, "banners") : (existing.image as string | null);

    await execute(
      "UPDATE banners SET title = ?, description = ?, image = ?, `order` = ?, updated_at = NOW() WHERE id = ?",
      [title, desc, imageFile, order, id]
    );
    return;
  }

  if (key === "announcements") {
    const existing = await row<AnyRow>("SELECT * FROM announcements WHERE id = ?", [id]);
    if (!existing) throw new ApiError(404, "Pengumuman tidak ditemukan.");

    const title = data.title !== undefined ? String(data.title).trim() : String(existing.title);
    const content = data.content !== undefined ? String(data.content).trim() : String(existing.content);
    const type = data.type !== undefined ? String(data.type) : String(existing.type);
    const actionUrl = data.action_url !== undefined ? cleanNullable(data.action_url as string) : (existing.action_url as string | null);

    await execute(
      "UPDATE announcements SET title = ?, content = ?, type = ?, action_url = ?, updated_at = NOW() WHERE id = ?",
      [title, content, type, actionUrl, id]
    );
    return;
  }

  if (key === "settings") {
    const existing = await row<AnyRow>("SELECT * FROM settings WHERE id = ?", [id]);
    if (!existing) throw new ApiError(404, "Pengaturan tidak ditemukan.");

    const settingKey = data.key !== undefined ? String(data.key).trim() : String(existing.key);
    const settingVal = data.value !== undefined ? String(data.value).trim() : String(existing.value);

    await execute(
      "UPDATE settings SET `key` = ?, `value` = ?, updated_at = NOW() WHERE id = ?",
      [settingKey, settingVal, id]
    );
    return;
  }

  throw new ApiError(400, `Modul ${key} belum didukung.`);
}

export async function deleteResource(key: string, id: number, _adminUser: ApiUser) {
  const meta = definitions[key];
  if (!meta || !meta.canDelete) throw new ApiError(403, `Modul ${key} tidak mendukung penghapusan.`);

  if (key === "users") {
    await execute("UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?", [id]);
    await execute("DELETE FROM personal_access_tokens WHERE tokenable_type = 'App\\\\Models\\\\User' AND tokenable_id = ?", [id]);
    return "deactivated";
  }

  if (key === "products") {
    await execute("DELETE FROM products WHERE id = ?", [id]);
    return "deleted";
  }

  if (key === "categories") {
    const count = await row<AnyRow>("SELECT COUNT(*) AS total FROM products WHERE category_id = ?", [id]);
    if (Number(count?.total || 0) > 0) throw new ApiError(422, "Kategori tidak dapat dihapus karena masih digunakan oleh produk.");
    await execute("DELETE FROM categories WHERE id = ?", [id]);
    return "deleted";
  }

  if (key === "expeditions") {
    await execute("DELETE FROM expeditions WHERE id = ?", [id]);
    return "deleted";
  }

  if (key === "banners") {
    await execute("DELETE FROM banners WHERE id = ?", [id]);
    return "deleted";
  }

  if (key === "announcements") {
    await execute("DELETE FROM announcements WHERE id = ?", [id]);
    return "deleted";
  }

  if (key === "chats") {
    await execute("DELETE FROM chat_messages WHERE chat_id = ?", [id]);
    await execute("DELETE FROM chats WHERE id = ?", [id]);
    return "deleted";
  }

  if (key === "reviews") {
    await execute("DELETE FROM product_reviews WHERE id = ?", [id]);
    return "deleted";
  }

  if (key === "settings") {
    await execute("DELETE FROM settings WHERE id = ?", [id]);
    return "deleted";
  }

  throw new ApiError(400, `Modul ${key} belum didukung.`);
}

export async function dashboardData() {
  const [totalSalesRow] = await rows<AnyRow>("SELECT COALESCE(SUM(grand_total), 0) AS total FROM orders WHERE status IN ('paid', 'packed', 'shipped', 'arrived', 'completed')");
  const [totalOrdersRow] = await rows<AnyRow>("SELECT COUNT(*) AS total FROM orders");
  const [totalProductsRow] = await rows<AnyRow>("SELECT COUNT(*) AS total FROM products WHERE is_active = 1");
  const [totalCustomersRow] = await rows<AnyRow>("SELECT COUNT(*) AS total FROM users WHERE role = 'customer'");
  const [pendingOrdersRow] = await rows<AnyRow>("SELECT COUNT(*) AS total FROM orders WHERE status IN ('pending_payment', 'paid', 'packed')");
  const [lowStockRow] = await rows<AnyRow>("SELECT COUNT(*) AS total FROM products WHERE stock <= 5 AND is_active = 1");
  const [unreadChatsRow] = await rows<AnyRow>("SELECT COUNT(*) AS total FROM chats WHERE status = 'open'");
  const [unreadReviewsRow] = await rows<AnyRow>("SELECT COUNT(*) AS total FROM product_reviews WHERE is_read = 0");

  const recentOrders = await rows<AnyRow>(
    `SELECT o.*, u.name AS customer_name FROM orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 5`
  );

  return {
    stats: {
      revenue: Number(totalSalesRow?.total || 0),
      orders: Number(totalOrdersRow?.total || 0),
      products: Number(totalProductsRow?.total || 0),
      customers: Number(totalCustomersRow?.total || 0),
      pending: Number(pendingOrdersRow?.total || 0),
      lowStock: Number(lowStockRow?.total || 0),
      unreadChats: Number(unreadChatsRow?.total || 0),
      unreadReviews: Number(unreadReviewsRow?.total || 0),
    },
    recentOrders,
  };
}


