import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";
import { execute, row } from "@/lib/db";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/http";
import { nowSql, omit, randomString } from "@/lib/utils";
import type { ApiUser } from "@/types";

export const ADMIN_COOKIE = "cyber_admin_session";

type UserRow = ApiUser & RowDataPacket & { password: string };

function normalizeBcrypt(hash: string) {
  return hash.startsWith("$2y$") ? `$2b$${hash.slice(4)}` : hash;
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, normalizeBcrypt(hash));
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function publicUser<T extends Record<string, unknown>>(user: T) {
  return omit(user, ["password", "remember_token", "otp_code", "otp_expires_at"]);
}

export async function createApiToken(userId: number, name = "flutter-token") {
  const plain = randomString(40);
  const hash = createHash("sha256").update(plain).digest("hex");
  const result = await execute(
    `INSERT INTO personal_access_tokens
      (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at)
     VALUES ('App\\\\Models\\\\User', ?, ?, ?, '["*"]', ?, ?)`,
    [userId, name, hash, nowSql(), nowSql()],
  );
  return `${result.insertId}|${plain}`;
}

export async function authenticateApi(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!supplied) throw new ApiError(401, "Unauthenticated.");

  const separator = supplied.indexOf("|");
  const tokenId = separator > 0 ? Number(supplied.slice(0, separator)) : null;
  const plain = separator > 0 ? supplied.slice(separator + 1) : supplied;
  const hash = createHash("sha256").update(plain).digest("hex");

  const token = await row<RowDataPacket & { id: number; tokenable_id: number }>(
    tokenId
      ? "SELECT id, tokenable_id FROM personal_access_tokens WHERE id = ? AND token = ? LIMIT 1"
      : "SELECT id, tokenable_id FROM personal_access_tokens WHERE token = ? LIMIT 1",
    tokenId ? [tokenId, hash] : [hash],
  );
  if (!token) throw new ApiError(401, "Unauthenticated.");

  const user = await row<UserRow>("SELECT * FROM users WHERE id = ? LIMIT 1", [token.tokenable_id]);
  if (!user || !user.is_active) throw new ApiError(401, "Unauthenticated.");

  await execute("UPDATE personal_access_tokens SET last_used_at = ? WHERE id = ?", [
    nowSql(),
    token.id,
  ]);
  return { user, tokenId: token.id };
}

function sessionKey() {
  if (process.env.NODE_ENV === "production" && (env.usingLocalAuthSecret || env.authSecret.length < 32)) {
    throw new Error("AUTH_SECRET wajib diisi dengan minimal 32 karakter pada environment production.");
  }
  return new TextEncoder().encode(env.authSecret);
}

export async function createAdminSession(user: ApiUser) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(sessionKey());
}

export async function verifyAdminSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), {
      algorithms: ["HS256"],
    });
    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId < 1) return null;
    const user = await row<UserRow>("SELECT * FROM users WHERE id = ? LIMIT 1", [
      userId,
    ]);
    if (!user || !user.is_active || !["admin", "superadmin"].includes(user.role)) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export async function currentAdmin() {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  const user = await currentAdmin();
  if (!user) throw new ApiError(401, "Sesi admin tidak valid atau sudah berakhir.");
  return user;
}
