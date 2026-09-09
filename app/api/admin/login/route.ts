import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, publicUser, verifyPassword } from "@/lib/auth";
import { row } from "@/lib/db";
import { handleApiError, ApiError, requestData } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await requestData(request);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const user = await row<RowDataPacket & Record<string, unknown> & { id: number; password: string; role: string; is_active: number; name: string; email: string }>(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    if (!user || !["admin", "superadmin"].includes(user.role) || !(await verifyPassword(password, user.password))) {
      throw new ApiError(422, "Email atau password admin tidak sesuai.");
    }
    if (!user.is_active) throw new ApiError(403, "Akun admin sedang dinonaktifkan.");
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
