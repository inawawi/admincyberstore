import { authenticateApi } from "@/lib/auth";
import { handleApiError, apiResponse, requestData, ApiError, checkRateLimit } from "@/lib/http";
import { handleAuth } from "@/lib/api/auth-handler";
import { handleCatalog } from "@/lib/api/catalog-handler";
import { handleCustomer } from "@/lib/api/customer-handler";
import { handleCommerce } from "@/lib/api/commerce-handler";
import { generateRequestId, logger } from "@/lib/logger";
import type { ApiContext } from "@/lib/api/types";

function limit(request: Request, path: string) {
  const rules: Record<string, { max: number; window: number }> = {
    login: { max: 10, window: 60_000 },
    register: { max: 10, window: 5 * 60_000 },
    "forgot-password": { max: 5, window: 15 * 60_000 },
    "resend-otp": { max: 5, window: 5 * 60_000 },
  };
  const rule = rules[path];
  if (!rule) return;
  checkRateLimit(request, path, { max: rule.max, windowMs: rule.window });
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
  if (method === "GET" && ["categories", "products", "expeditions", "about", "help", "store-info", "banners", "announcements", "auth/google/callback"].includes(path)) return true;
  if (method === "GET" && /^products\/[^/]+(?:\/(?:reviews|review-eligibility))?$/.test(path)) return true;
  if (method === "GET" && /^announcements\/\d+$/.test(path)) return true;
  return false;
}

export async function handleV1Request(
  request: Request,
  segments: string[],
) {
  const startedAt = Date.now();
  const reqId = request.headers.get("x-request-id") || generateRequestId();
  try {
    if (!request.headers.get("x-request-id")) {
      request.headers.set("x-request-id", reqId);
    }
  } catch {
    // ignore immutable header error if any
  }
  const method = request.method.toUpperCase();
  const path = segments.join("/");

  logger.debug(`API Request Started: ${method} /api/v1/${path}`, {
    reqId,
    method,
    path,
  });

  try {
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
      if (result) {
        const durationMs = Date.now() - startedAt;
        const status = result.status || 200;
        logger.info(`API Request Completed: ${method} /api/v1/${path} ${status} (${durationMs}ms)`, {
          reqId,
          method,
          path,
          status,
          durationMs,
          userId: context.user?.id,
        });
        return apiResponse(request, result.data, status, { "X-Request-Id": reqId });
      }
    }
    throw new ApiError(404, "Endpoint tidak ditemukan.");
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    logger.warn(`API Request Failed: ${method} /api/v1/${path} (${durationMs}ms)`, {
      reqId,
      method,
      path,
      durationMs,
    });
    return handleApiError(request, error, reqId);
  }
}
