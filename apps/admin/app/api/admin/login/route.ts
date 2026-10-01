import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, publicUser, verifyPassword } from "@/lib/auth";
import { row } from "@/lib/db";
import { handleApiError, ApiError, requestData, checkRateLimit } from "@/lib/http";
import { logger, maskEmail } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";

  try {
    checkRateLimit(request, "admin-login", { max: 5, windowMs: 15 * 60_000 });
    const body = await requestData(request);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const user = await row<RowDataPacket & Record<string, unknown> & { id: number; password: string; role: string; is_active: number; name: string; email: string }>(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    if (!user || !["admin", "superadmin"].includes(user.role) || !(await verifyPassword(password, user.password))) {
      logger.audit("ADMIN_LOGIN", {
        actor: { email: maskEmail(email) },
        status: "failure",
        ip,
        reason: "invalid_credentials",
      });
      throw new ApiError(422, "Email atau password admin tidak sesuai.");
    }
    if (!user.is_active) {
      logger.audit("ADMIN_LOGIN", {
        actor: { id: user.id, email: maskEmail(user.email) },
        status: "blocked",
        ip,
        reason: "account_inactive",
      });
      throw new ApiError(403, "Akun admin sedang dinonaktifkan.");
    }

    logger.audit("ADMIN_LOGIN", {
      actor: { id: user.id, email: maskEmail(user.email), role: user.role },
      status: "success",
      ip,
    });

    const session = await createAdminSession(user as never);
    const response = NextResponse.json({ message: "Login berhasil.", user: publicUser(user) });
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
    const secureCookie = forwardedProtocol === "https" || new URL(request.url).protocol === "https:";
    response.cookies.set(ADMIN_COOKIE, session, {
      httpOnly: true,
      sameSite: "strict",
      secure: secureCookie,
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return response;
  } catch (error) {
    return handleApiError(request, error);
  }
}
