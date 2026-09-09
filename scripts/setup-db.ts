import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const database = process.env.DB_DATABASE || "cyber_store_v1";
if (!/^[a-zA-Z0-9_]+$/.test(database)) {
  throw new Error("DB_DATABASE hanya boleh berisi huruf, angka, dan underscore.");
}

// This project intentionally consumes the Laravel schema. It never creates a
// database, runs migrations, changes existing rows, or seeds replacement data.
const requiredTables = [
  "users", "categories", "products", "product_images", "expeditions",
  "carts", "cart_items", "customer_addresses", "orders", "order_items",
  "order_trackings", "payments", "personal_access_tokens", "password_reset_tokens",
  "product_reviews", "product_review_replies", "chats", "chat_messages",
  "user_notifications", "announcements", "banners", "settings", "stock_movements",
];

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database,
});

try {
  const [tableRows] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
    [database],
  );
  const available = new Set(tableRows.map((entry) => String(entry.TABLE_NAME)));
  const missing = requiredTables.filter((table) => !available.has(table));
  if (missing.length) {
    throw new Error(`Schema Laravel tidak lengkap. Tabel yang belum ada: ${missing.join(", ")}`);
  }

  const [counts] = await connection.query<mysql.RowDataPacket[]>(
    `SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM categories) AS categories,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM orders) AS orders`,
  );
  const count = counts[0] || {};
  console.log(`Database existing ${database} terdeteksi dan siap digunakan.`);
  console.log(`Users: ${count.users}; kategori: ${count.categories}; produk: ${count.products}; order: ${count.orders}`);
  console.log("Tidak ada schema, migration, atau seed yang dijalankan oleh proyek Next.js.");
} finally {
  await connection.end();
}
