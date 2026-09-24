import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/http";

function apiBase() {
  return env.midtrans.production
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
}

function snapBase() {
  return env.midtrans.production
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

function authorization() {
  return `Basic ${Buffer.from(`${env.midtrans.serverKey}:`).toString("base64")}`;
}

export async function createSnapTransaction(input: {
  invoice: string;
  amount: number;
  customer: { name: string; email: string; phone?: string | null };
  items: Array<{ id: string; price: number; quantity: number; name: string }>;
}) {
  if (!env.midtrans.serverKey) {
    return {
      token: null,
      redirect_url: null,
      transaction_id: `MOCK-${input.invoice}`,
    };
  }
  const response = await fetch(`${snapBase()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Authorization: authorization(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      transaction_details: { order_id: input.invoice, gross_amount: Math.round(input.amount) },
      customer_details: {
        first_name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone || undefined,
      },
      item_details: input.items,
      expiry: { unit: "hours", duration: 24 },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    throw new ApiError(502, String(data.error_messages || "Midtrans tidak dapat membuat transaksi."));
  }
  return {
    token: data.token as string,
    redirect_url: data.redirect_url as string,
    transaction_id: input.invoice,
  };
}

export async function getMidtransStatus(invoice: string) {
  if (!env.midtrans.serverKey) return { status: "unknown" };
  const response = await fetch(`${apiBase()}/v2/${encodeURIComponent(invoice)}/status`, {
    headers: { Authorization: authorization(), Accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return { status: "unknown" };
  const data = await response.json() as Record<string, unknown>;
  const va = Array.isArray(data.va_numbers) ? data.va_numbers[0] as Record<string, unknown> : null;
  return {
    status: String(data.transaction_status || "unknown"),
    bank: String(va?.bank || data.payment_type || "") || null,
    va_number: String(va?.va_number || data.permata_va_number || "") || null,
    biller_code: String(data.biller_code || "") || null,
  };
}

export function verifyMidtransSignature(input: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}) {
  if (!env.midtrans.serverKey) return process.env.NODE_ENV !== "production";
  const expected = createHash("sha512")
    .update(`${input.order_id}${input.status_code}${input.gross_amount}${env.midtrans.serverKey}`)
    .digest("hex");
  return expected === input.signature_key;
}

export function midtransClientConfig() {
  return { clientKey: env.midtrans.clientKey, production: env.midtrans.production };
}

// A stable refund key lets an interrupted approval be retried safely.
export async function refundCancelledOrder(invoice: string, amount: number, reason: string) {
  if (!env.midtrans.serverKey) throw new ApiError(422, "Server key Midtrans belum dikonfigurasi. Refund tidak dijalankan.");
  const request = async (path: string, body?: Record<string, unknown>) => {
    const response = await fetch(`${apiBase()}/v2/${path}`, {
      method: body ? "POST" : "GET",
      headers: { Authorization: authorization(), Accept: "application/json", "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json() as Record<string, unknown>;
    if (!response.ok || String(data.status_code) !== "200") {
      throw new ApiError(502, `Midtrans: ${String(data.status_message || "Transaksi belum dapat dibatalkan/refund. Coba sinkronkan kembali.")}`);
    }
    return data;
  };
  const status = await request(`${encodeURIComponent(invoice)}/status`);
  const state = String(status.transaction_status);
  if (state === "refund") return "refund";
  if (["cancel", "expire", "deny", "failure"].includes(state)) return "cancel";
  const reference = encodeURIComponent(String(status.transaction_id || invoice));
  if (["pending", "authorize", "capture"].includes(state)) {
    const result = await request(`${reference}/cancel`, {});
    if (result.transaction_status !== "cancel") throw new ApiError(502, "Midtrans belum mengonfirmasi pembatalan. Coba lagi.");
    return "cancel";
  }
  if (state !== "settlement") throw new ApiError(422, "Status Midtrans tidak mendukung refund penuh otomatis.");
  if (!["credit_card", "gopay", "shopeepay", "dana", "ovo", "qris", "kredivo", "akulaku"].includes(String(status.payment_type).toLowerCase())) {
    throw new ApiError(422, "Metode pembayaran ini tidak mendukung refund otomatis Midtrans. Hubungi Midtrans untuk pengembalian dana; jangan tandai refund selesai.");
  }
  if (Number(status.gross_amount) !== amount) throw new ApiError(422, "Nominal pembayaran Midtrans berbeda dari pesanan. Periksa sebelum refund.");
  const result = await request(`${reference}/refund`, {
    refund_key: `cancel-${invoice}`, amount, reason: reason.slice(0, 255),
  });
  if (result.transaction_status !== "refund") throw new ApiError(502, "Refund penuh belum dikonfirmasi Midtrans. Coba sinkronkan kembali.");
  return "refund";
}
