import { authenticateApi } from "@/lib/auth";
import { handleApiError, apiResponse, requestData, ApiError } from "@/lib/http";
import { handleAuth } from "@/lib/api/auth-handler";
import { handleCatalog } from "@/lib/api/catalog-handler";
import { handleCustomer } from "@/lib/api/customer-handler";
import { handleCommerce } from "@/lib/api/commerce-handler";
import type { ApiContext } from "@/lib/api/types";

const attempts = new Map<string, { count: number; resetsAt: number }>();

function limit(request: Request, path: string) {
  const rules: Record<string, { max: number; window: number }> = {
    login: { max: 10, window: 60_000 },
    register: { max: 10, window: 5 * 60_000 },
    "forgot-password": { max: 5, window: 15 * 60_000 },
    "resend-otp": { max: 5, window: 5 * 60_000 },
  };
  const rule = rules[path];
  if (!rule) return;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${ip}:${path}`;
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetsAt <= now) {
    attempts.set(key, { count: 1, resetsAt: now + rule.window });
    return;
  }
  current.count += 1;
  if (current.count > rule.max) {
    const retry = Math.max(1, Math.ceil((current.resetsAt - now) / 1000));
    throw new ApiError(429, `Terlalu banyak percobaan. Silakan tunggu ${retry} detik.`, {
      retry_after: [String(retry)],
    });
  }
}

function publicEndpoint(method: string, path: string) {
  if (method === "POST" && [
    "register",
    "login",
    "verify-otp",
    "resend-otp",
    "forgot-password",
    "verify-reset-otp",
    "reset-password",
    "auth/google",
    "payments/midtrans-callback",
  ].includes(path)) return true;
  if (method === "GET" && ["categories", "products", "expeditions", "about", "help", "store-info", "banners"].includes(path)) return true;
  if (method === "GET" && /^products\/[^/]+(?:\/reviews)?$/.test(path)) return true;
  return false;
}

export async function handleV1Request(
  request: Request,
  segments: string[],
) {
  try {
    const method = request.method.toUpperCase();
    const path = segments.join("/");
    limit(request, path);
    const body = await requestData(request);
    const context: ApiContext = {
      request,
      url: new URL(request.url),
      method,
      segments,
      body,
    };

    const hasBearer = /^Bearer\s+/i.test(request.headers.get("authorization") || "");
    if (hasBearer || !publicEndpoint(method, path)) {
      const auth = await authenticateApi(request);
      context.user = auth.user;
      context.tokenId = auth.tokenId;
    }

    const handlers = [handleAuth, handleCatalog, handleCommerce, handleCustomer];
    for (const handler of handlers) {
      const result = await handler(context);
      if (result) return apiResponse(request, result.data, result.status || 200);
    }
    throw new ApiError(404, "Endpoint tidak ditemukan.");
  } catch (error) {
    return handleApiError(request, error);
  }
}
