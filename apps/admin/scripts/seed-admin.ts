import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const email = process.argv[2] || "admin@cyberstore.local";
const password = process.argv[3] || "Admin123!";
const name = process.argv[4] || "Administrator";
const role = "superadmin";

const database = process.env.DB_DATABASE || "cyber_store_v1";

async function main() {
  console.log(`Connecting to database ${database}...`);
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database,
  });

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();

    const [existing] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT id, email, role FROM users WHERE email = ?",
      [email],
    );

    if (existing.length > 0) {
      console.log(`User dengan email "${email}" sudah ada. Memperbarui password dan role menjadi ${role}...`);
      await connection.execute(
        `UPDATE users 
         SET password = ?, role = ?, is_active = 1, email_verified_at = IFNULL(email_verified_at, ?), updated_at = ?
         WHERE email = ?`,
        [hashedPassword, role, now, now, email],
      );
      console.log(`✓ Berhasil memperbarui user admin: ${email}`);
    } else {
      console.log(`Membuat user admin baru "${email}"...`);
      await connection.execute(
        `INSERT INTO users 
         (name, email, password, role, is_active, email_verified_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
        [name, email, hashedPassword, role, now, now, now],
      );
      console.log(`✓ Berhasil membuat akun superadmin baru!`);
    }

    console.log("-----------------------------------------");
    console.log(`Email    : ${email}`);
    console.log(`Password : ${password}`);
    console.log(`Role     : ${role}`);
    console.log("Simpan kredensial ini baik-baik!");
    console.log("-----------------------------------------");
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("Gagal membuat user admin:", err.message);
  process.exit(1);
});
