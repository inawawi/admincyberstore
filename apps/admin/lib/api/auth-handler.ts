import type { RowDataPacket } from "mysql2";
import { createHash } from "node:crypto";
import {
  createApiToken,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { execute, row, transaction } from "@/lib/db";
import { ApiError, assert } from "@/lib/http";
import { sendOtpEmail } from "@/lib/mail";
import { serializeUser } from "@/lib/api/serializers";
import { addMinutes, nowSql, randomString } from "@/lib/utils";
import type { ApiContext, HandledResult } from "@/lib/api/types";
import { env } from "@/lib/env";

type UserRow = RowDataPacket & Record<string, unknown> & {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  password: string;
  role: "superadmin" | "admin" | "customer";
  is_active: number;
  otp_code: string | null;
  otp_expires_at: Date | null;
};

function stringValue(body: Record<string, unknown>, key: string) {
  return typeof body[key] === "string" ? body[key].trim() : "";
}

async function newOtp(user: UserRow, purpose: "verify" | "reset") {
  const otp = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  await execute("UPDATE users SET otp_code = ?, otp_expires_at = ?, updated_at = ? WHERE id = ?", [
    await hashPassword(otp), addMinutes(10), nowSql(), user.id,
  ]);
  await sendOtpEmail(user.email, user.name, otp, purpose).catch((error) => {
    console.error("Gagal mengirim OTP", error);
  });
}

async function findUserByEmail(email: string) {
  return row<UserRow>("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
}

export async function handleAuth(ctx: ApiContext): Promise<HandledResult | null> {
  const path = ctx.segments.join("/");
  const body = ctx.body;

  if (ctx.method === "POST" && path === "register") {
    const name = stringValue(body, "name");
    const email = stringValue(body, "email").toLowerCase();
    const password = stringValue(body, "password");
    assert(name.length >= 2 && name.length <= 100, "Nama wajib diisi (maksimal 100 karakter).");
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Format email tidak valid.");
    assert(password.length >= 8, "Password minimal 8 karakter.");
    assert(password === body.password_confirmation, "Konfirmasi password tidak sesuai.");
    assert(!(await findUserByEmail(email)), "Email sudah digunakan.");

    const userId = await transaction(async (tx) => {
      const created = await tx.execute(
        `INSERT INTO users
          (name, email, password, role, phone, address, is_active,
           push_notifications_enabled, email_notifications_enabled,
           biometric_login_enabled, created_at, updated_at)
         VALUES (?, ?, ?, 'customer', ?, ?, 0, 1, 1, 0, ?, ?)`,
        [name, email, await hashPassword(password), body.phone || null, body.address || null, nowSql(), nowSql()],
      );
      await tx.execute("INSERT INTO carts (user_id, created_at, updated_at) VALUES (?, ?, ?)", [
        created.insertId, nowSql(), nowSql(),
      ]);
      if (stringValue(body, "address")) {
        await tx.execute(
          `INSERT INTO customer_addresses
            (user_id, label, receiver_name, phone, address, province, city,
             district, village, postal_code, latitude, longitude, is_default, created_at, updated_at)
           VALUES (?, 'Rumah', ?, ?, ?, 'DKI Jakarta', 'Jakarta Selatan',
             'Pasar Minggu', 'Warung Jati Barat', '12540', -6.2910, 106.8440, 1, ?, ?)`,
          [created.insertId, name, body.phone || "-", body.address, nowSql(), nowSql()],
        );
      }
      return created.insertId;
    });
    const user = await row<UserRow>("SELECT * FROM users WHERE id = ?", [userId]);
    if (user) await newOtp(user, "verify");
    return {
      status: 201,
      data: { message: "Registrasi berhasil. Silakan cek email Anda untuk kode OTP verifikasi.", email },
    };
  }

  if (ctx.method === "POST" && path === "login") {
    const login = stringValue(body, "email");
    const password = stringValue(body, "password");
    assert(login && password, "Email/No. Handphone dan password wajib diisi.");
    const user = await row<UserRow>(
      "SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1",
      [login, login],
    );
    if (!user || !(await verifyPassword(password, user.password))) {
      throw new ApiError(422, "Email/No. Handphone atau password tidak sesuai.", {
        email: ["Email/No. Handphone atau password tidak sesuai."],
      });
    }
    if (!user.is_active) {
      await newOtp(user, "verify");
      throw new ApiError(403, "Akun Anda belum aktif. Kode OTP baru telah dikirim ke email Anda.", {
        requires_otp: ["true"],
        email: [user.email],
      });
    }
    return {
      data: {
        message: "Login berhasil.",
        token: await createApiToken(user.id),
        user: serializeUser(user),
      },
    };
  }

  if (ctx.method === "POST" && ["verify-otp", "resend-otp"].includes(path)) {
    const email = stringValue(body, "email").toLowerCase();
    const user = await findUserByEmail(email);
    if (!user) throw new ApiError(404, "Email tidak ditemukan.");
    if (user.is_active) return { data: { message: "Akun sudah aktif." } };
    if (path === "resend-otp") {
      await newOtp(user, "verify");
      return { data: { message: "Kode verifikasi baru telah dikirim ke email Anda." } };
    }
    const otp = stringValue(body, "otp");
    assert(/^\d{6}$/.test(otp), "Kode OTP harus terdiri dari 6 digit.");
    assert(user.otp_code && await verifyPassword(otp, user.otp_code), "Kode OTP tidak valid.");
    assert(user.otp_expires_at && new Date(user.otp_expires_at) > new Date(), "Kode OTP sudah kedaluwarsa. Silakan minta kode baru.");
    await execute(
      "UPDATE users SET is_active = 1, email_verified_at = ?, otp_code = NULL, otp_expires_at = NULL, updated_at = ? WHERE id = ?",
      [nowSql(), nowSql(), user.id],
    );
    return { data: { message: "Akun berhasil diverifikasi. Silakan login." } };
  }

  if (ctx.method === "POST" && path === "forgot-password") {
    const email = stringValue(body, "email").toLowerCase();
    const user = await findUserByEmail(email);
    if (!user) throw new ApiError(404, "Email tidak ditemukan.");
    await newOtp(user, "reset");
    return { data: { message: "Kode OTP reset password telah dikirim ke email Anda. Berlaku selama 10 menit." } };
  }

  if (ctx.method === "POST" && path === "verify-reset-otp") {
    const email = stringValue(body, "email").toLowerCase();
    const otp = stringValue(body, "otp");
    const user = await findUserByEmail(email);
    if (!user) throw new ApiError(404, "Email tidak ditemukan.");
    assert(user.otp_code && await verifyPassword(otp, user.otp_code), "Kode OTP tidak valid.");
    assert(user.otp_expires_at && new Date(user.otp_expires_at) > new Date(), "Kode OTP sudah kedaluwarsa. Silakan minta kode baru.");
    const resetToken = randomString(64);
    const tokenHash = createHash("sha256").update(resetToken).digest("hex");
    await transaction(async (tx) => {
      await tx.execute("DELETE FROM password_reset_tokens WHERE email = ?", [email]);
      await tx.execute("INSERT INTO password_reset_tokens (email, token, created_at) VALUES (?, ?, ?)", [email, tokenHash, nowSql()]);
      await tx.execute("UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?", [user.id]);
    });
    return { data: { message: "OTP valid. Silakan masukkan password baru Anda.", reset_token: resetToken } };
  }

  if (ctx.method === "POST" && path === "reset-password") {
    const token = stringValue(body, "reset_token");
    const password = stringValue(body, "password");
    assert(password.length >= 8, "Password minimal 8 karakter.");
    assert(password === body.password_confirmation, "Konfirmasi password tidak sesuai.");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const reset = await row<RowDataPacket & { email: string; created_at: Date }>(
      "SELECT * FROM password_reset_tokens WHERE token = ? LIMIT 1",
      [tokenHash],
    );
    assert(reset && Date.now() - new Date(reset.created_at).getTime() < 15 * 60_000, "Token reset password tidak valid atau sudah kedaluwarsa.");
    const user = await findUserByEmail(reset.email);
    if (!user) throw new ApiError(404, "Pengguna tidak ditemukan.");
    await transaction(async (tx) => {
      await tx.execute("UPDATE users SET password = ?, updated_at = ? WHERE id = ?", [await hashPassword(password), nowSql(), user.id]);
      await tx.execute("DELETE FROM password_reset_tokens WHERE email = ?", [reset.email]);
      await tx.execute("DELETE FROM personal_access_tokens WHERE tokenable_id = ?", [user.id]);
    });
    return { data: { message: "Password berhasil diperbarui. Silakan masuk dengan password baru Anda." } };
  }

  if ((ctx.method === "POST" && path === "auth/google") || (ctx.method === "GET" && path === "auth/google/callback")) {
    let google: Record<string, unknown>;

    if (ctx.method === "GET" && path === "auth/google/callback") {
      // Authorization Code Flow: tukarkan code -> token Google
      const code = ctx.url.searchParams.get("code");
      assert(code, "Authorization code Google tidak ditemukan.");

      const clientId = process.env.GOOGLE_CLIENT_ID || env.googleClientIds[0] || "";
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/auth/google/callback";

      assert(clientId && clientSecret, "Konfigurasi Google OAuth belum lengkap di server.");

      // Tukar code dengan token
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        console.error("[Google OAuth] Token exchange failed:", errBody);
        throw new ApiError(422, "Gagal menukarkan authorization code dengan token Google.");
      }

      const tokenData = await tokenRes.json() as Record<string, unknown>;
      const idToken = String(tokenData.id_token || "");
      assert(idToken, "Google tidak mengembalikan id_token. Pastikan scope openid diaktifkan.");

      // Verifikasi id_token
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
        signal: AbortSignal.timeout(7_000),
      });
      if (!verifyRes.ok) throw new ApiError(422, "Token Google tidak valid atau telah kedaluwarsa.");
      google = await verifyRes.json() as Record<string, unknown>;
    } else {
      // ID Token Flow (POST auth/google dengan id_token)
      const idToken = stringValue(body, "id_token");
      assert(idToken, "ID token Google wajib diisi.");
      if (idToken === "mock_google_token" && process.env.NODE_ENV !== "production") {
        google = { sub: `mock-${Date.now()}`, email: body.email, name: body.name || "Mock Google User", email_verified: true };
      } else {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, { signal: AbortSignal.timeout(7_000) });
        if (!response.ok) throw new ApiError(422, "Token Google tidak valid atau telah kedaluwarsa.");
        google = await response.json() as Record<string, unknown>;
      }
    }

    const email = String(google.email || "").toLowerCase();
    const googleId = String(google.sub || "");
    assert(email && googleId, "Data email atau Google ID tidak ditemukan di dalam token.");
    if (env.googleClientIds.length && google.aud && !env.googleClientIds.includes(String(google.aud))) {
      throw new ApiError(422, "Token Google bukan untuk aplikasi ini.");
    }
    let user = await findUserByEmail(email);
    if (!user) {
      const result = await execute(
        `INSERT INTO users (name, email, google_id, email_verified_at, password, role, is_active,
          push_notifications_enabled, email_notifications_enabled, biometric_login_enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'customer', 1, 1, 1, 0, ?, ?)`,
        [String(google.name || "Google User"), email, googleId, nowSql(), await hashPassword(randomString(24)), nowSql(), nowSql()],
      );
      await execute("INSERT INTO carts (user_id, created_at, updated_at) VALUES (?, ?, ?)", [result.insertId, nowSql(), nowSql()]);
      user = await row<UserRow>("SELECT * FROM users WHERE id = ?", [result.insertId]);
    } else if (!user.google_id) {
      await execute("UPDATE users SET google_id = ?, email_verified_at = COALESCE(email_verified_at, ?), is_active = 1 WHERE id = ?", [googleId, nowSql(), user.id]);
      user = await findUserByEmail(email);
    }
    if (!user?.is_active) throw new ApiError(403, "Akun tidak aktif.");
    return { data: { message: "Login Google berhasil.", token: await createApiToken(user.id), user: serializeUser(user) } };
  }

  if (ctx.method === "GET" && path === "me" && ctx.user) {
    const address = await row<RowDataPacket & Record<string, unknown>>(
      "SELECT * FROM customer_addresses WHERE user_id = ? AND is_default = 1 LIMIT 1",
      [ctx.user.id],
    );
    return { data: { user: { ...serializeUser(ctx.user), default_address: address } } };
  }

  if (ctx.method === "POST" && path === "logout" && ctx.user && ctx.tokenId) {
    await execute("DELETE FROM personal_access_tokens WHERE id = ?", [ctx.tokenId]);
    return { data: { message: "Logout berhasil." } };
  }

  return null;
}
