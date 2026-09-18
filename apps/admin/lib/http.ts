import { NextResponse } from "next/server";
import { decryptPayload, encryptPayload } from "@/lib/crypto";
import { safeJson } from "@/lib/utils";

const MAX_REQUEST_BYTES = 12 * 1024 * 1024;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export async function requestData(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") || "";
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredSize) && declaredSize > MAX_REQUEST_BYTES) {
    throw new ApiError(413, "Ukuran request melebihi batas 12 MB.");
  }
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const output: Record<string, unknown> = {};
    let uploadedBytes = 0;
    for (const [key, value] of form.entries()) {
      if (value instanceof File) {
        uploadedBytes += value.size;
        if (uploadedBytes > MAX_REQUEST_BYTES) {
          throw new ApiError(413, "Ukuran file melebihi batas 12 MB.");
        }
      }
      if (key.endsWith("[]")) {
        const normalized = key.slice(0, -2);
        output[normalized] = [...((output[normalized] as unknown[]) || []), value];
      } else if (key in output) {
        output[key] = [...(Array.isArray(output[key]) ? output[key] as unknown[] : [output[key]]), value];
      } else {
        output[key] = value;
      }
    }
    return output;
  }
  if (request.method === "GET" || request.method === "DELETE") return {};
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) {
    throw new ApiError(413, "Ukuran request melebihi batas 12 MB.");
  }
  if (!text) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ApiError(400, "Body request harus berupa JSON yang valid.");
  }
  if (request.headers.get("x-encrypted") === "true") {
    const payload = (parsed as Record<string, unknown>)?.payload;
    if (typeof payload !== "string") {
      throw new ApiError(400, "Payload terenkripsi tidak ditemukan.");
    }
    const decrypted = decryptPayload(payload);
    if (!decrypted || typeof decrypted !== "object") {
      throw new ApiError(400, "Gagal mendekripsi payload request.");
    }
    return decrypted as Record<string, unknown>;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ApiError(400, "Body request harus berupa object JSON.");
  }
  return parsed as Record<string, unknown>;
}

export function getCorsHeaders(request?: Request) {
  const origin = request?.headers.get("origin") || "*";
  const reqHeaders =
    request?.headers.get("access-control-request-headers") ||
    "Content-Type, Authorization, X-Encrypted, Accept, X-Requested-With, ngrok-skip-browser-warning, x-encrypted";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": reqHeaders,
  };
}

export function apiResponse(
  request: Request,
  data: unknown,
  status = 200,
) {
  const safe = safeJson(data);
  const shouldEncrypt =
    request.headers.get("x-encrypted") === "true" &&
    !new URL(request.url).pathname.endsWith("/payments/midtrans-callback");
  const headers = getCorsHeaders(request);
  if (shouldEncrypt && process.env.API_ENCRYPTION_KEY) {
    return NextResponse.json(
      { payload: encryptPayload(safe) },
      { status, headers: { ...headers, "X-Encrypted": "true" } },
    );
  }
  return NextResponse.json(safe, {
    status,
    headers,
  });
}

export function handleApiError(request: Request, error: unknown) {
  if (error instanceof ApiError) {
    return apiResponse(
      request,
      { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
      error.status,
    );
  }
  const candidate = error as { code?: string; message?: string };
  if (candidate?.code === "ER_DUP_ENTRY") {
    return apiResponse(request, { message: "Data tersebut sudah digunakan." }, 422);
  }
  if (candidate?.code === "ER_ROW_IS_REFERENCED_2") {
    return apiResponse(request, { message: "Data masih digunakan dan tidak dapat dihapus." }, 409);
  }
  console.error("Unhandled API error", error);
  return apiResponse(request, { message: "Terjadi kesalahan internal pada server." }, 500);
}

export function assert(
  condition: unknown,
  message: string,
  status = 422,
): asserts condition {
  if (!condition) throw new ApiError(status, message);
}

export function pagination<T>(
  requestUrl: string,
  data: T[],
  total: number,
  page: number,
  perPage: number,
) {
  const url = new URL(requestUrl);
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const link = (target: number) => {
    const result = new URL(url);
    result.searchParams.set("page", String(target));
    return result.toString();
  };
  return {
    current_page: page,
    data,
    first_page_url: link(1),
    from: total === 0 ? null : (page - 1) * perPage + 1,
    last_page: lastPage,
    last_page_url: link(lastPage),
    links: [],
    next_page_url: page < lastPage ? link(page + 1) : null,
    path: `${url.origin}${url.pathname}`,
    per_page: perPage,
    prev_page_url: page > 1 ? link(page - 1) : null,
    to: total === 0 ? null : Math.min(page * perPage, total),
    total,
  };
}
