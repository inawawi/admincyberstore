import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const database = process.env.DB_DATABASE || "cyber_store_v1";

async function main() {
  console.log(`=======================================================`);
  console.log(`[DATABASE RESET] Membersihkan data produk di: ${database}`);
  console.log(`=======================================================`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database,
  });

  try {
    // Nonaktifkan foreign key checks sementara untuk reset tabel dengan aman
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    console.log("-> Menghapus relasi ulasan & balasan produk (product_reviews, product_review_replies)...");
    await connection.query("TRUNCATE TABLE product_review_replies");
    await connection.query("TRUNCATE TABLE product_reviews");

    console.log("-> Menghapus gambar produk (product_images)...");
    await connection.query("TRUNCATE TABLE product_images");

    console.log("-> Menghapus histori pergerakan stok (stock_movements)...");
    await connection.query("TRUNCATE TABLE stock_movements");

    console.log("-> Menghapus item keranjang belanja (cart_items)...");
    await connection.query("TRUNCATE TABLE cart_items");

    console.log("-> Menghapus item pesanan & transaksi terkait produk (order_items, orders, payments, order_trackings)...");
    await connection.query("TRUNCATE TABLE order_items");
    await connection.query("TRUNCATE TABLE order_trackings");
    await connection.query("TRUNCATE TABLE payments");
    await connection.query("TRUNCATE TABLE orders");

    console.log("-> Menghapus seluruh master produk (products)...");
    await connection.query("TRUNCATE TABLE products");

    // Aktifkan kembali foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    // Verifikasi akun superadmin
    const [admins] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT id, name, email, role FROM users WHERE role IN ('superadmin', 'admin')",
    );

    console.log("\n=======================================================");
    console.log("✓ SEMUA DATA PRODUK & TRANSAKSI BERHASIL DI-RESET!");
    console.log("✓ Data Akun Superadmin TETAP AMAN & TERJAGA:");
    admins.forEach((admin) => {
      console.log(`   - [ID: ${admin.id}] ${admin.name} (${admin.email}) -> Role: ${admin.role}`);
    });
    console.log("=======================================================\n");
  } catch (err: any) {
    console.error("Gagal melakukan reset database:", err.message);
  } finally {
    await connection.end();
  }
}

main();
