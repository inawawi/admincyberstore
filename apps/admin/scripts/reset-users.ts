import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const database = process.env.DB_DATABASE || "cyber_store_v1";

async function main() {
  console.log(`=======================================================`);
  console.log(`[DATABASE USER RESET] Membersihkan akun user (customer) di: ${database}`);
  console.log(`=======================================================`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database,
  });

  try {
    // Cari ID semua user non-superadmin
    const [nonAdminUsers] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT id, name, email, role FROM users WHERE role NOT IN ('superadmin')",
    );

    if (nonAdminUsers.length === 0) {
      console.log("ℹ Tidak ada akun user/customer yang perlu dihapus.");
    } else {
      const userIds = nonAdminUsers.map((u) => Number(u.id));
      const placeholders = userIds.map(() => "?").join(",");

      console.log(`Ditemukan ${userIds.length} akun user/customer yang akan dihapus.`);

      // Matikan FK checks sementara agar pembersihan bersih dan tidak terganjal constraint
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");

      console.log("-> Menghapus token autentikasi user non-superadmin...");
      await connection.query(`DELETE FROM personal_access_tokens WHERE tokenable_id IN (${placeholders})`, userIds);
      await connection.query(`DELETE FROM password_reset_tokens WHERE email IN (${nonAdminUsers.map(() => "?").join(",")})`, nonAdminUsers.map(u => u.email));

      console.log("-> Menghapus alamat pengiriman user (customer_addresses)...");
      await connection.query(`DELETE FROM customer_addresses WHERE user_id IN (${placeholders})`, userIds);

      console.log("-> Menghapus keranjang user (carts & cart_items)...");
      await connection.query(`DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id IN (${placeholders}))`, userIds);
      await connection.query(`DELETE FROM carts WHERE user_id IN (${placeholders})`, userIds);

      console.log("-> Menghapus notifikasi & chat user (user_notifications, chats, chat_messages)...");
      await connection.query(`DELETE FROM user_notifications WHERE user_id IN (${placeholders})`, userIds);
      await connection.query(`DELETE FROM chat_messages WHERE sender_id IN (${placeholders})`, userIds);
      await connection.query(`DELETE FROM chats WHERE user_id IN (${placeholders})`, userIds);

      console.log("-> Menghapus ulasan yang dibuat oleh user (product_reviews)...");
      await connection.query(`DELETE FROM product_review_replies WHERE product_review_id IN (SELECT id FROM product_reviews WHERE user_id IN (${placeholders}))`, userIds);
      await connection.query(`DELETE FROM product_reviews WHERE user_id IN (${placeholders})`, userIds);

      console.log("-> Menghapus riwayat order user non-superadmin (orders, order_items, payments)...");
      await connection.query(`DELETE FROM order_trackings WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (${placeholders}))`, userIds);
      await connection.query(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (${placeholders}))`, userIds);
      await connection.query(`DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (${placeholders}))`, userIds);
      await connection.query(`DELETE FROM orders WHERE user_id IN (${placeholders})`, userIds);

      console.log("-> Menghapus data akun di tabel users...");
      await connection.query(`DELETE FROM users WHERE id IN (${placeholders})`, userIds);

      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log(`✓ Berhasil menghapus ${userIds.length} akun user/customer beserta seluruh datanya.`);
    }

    // Tampilkan akun Superadmin yang tetap tersimpan
    const [superadmins] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT id, name, email, role FROM users WHERE role = 'superadmin'",
    );

    console.log("\n=======================================================");
    console.log("✓ Akun SUPERADMIN TETAP AMAN & TERJAGA:");
    if (superadmins.length === 0) {
      console.log("⚠️ PERHATIAN: Tidak ada akun role 'superadmin' di database.");
      console.log("   Jalankan: 'npm run seed:admin' untuk membuat akun superadmin.");
    } else {
      superadmins.forEach((admin) => {
        console.log(`   - [ID: ${admin.id}] ${admin.name} (${admin.email}) -> Role: ${admin.role}`);
      });
    }
    console.log("=======================================================\n");
  } catch (err: any) {
    console.error("Gagal melakukan reset akun user:", err.message);
  } finally {
    await connection.end();
  }
}

main();
