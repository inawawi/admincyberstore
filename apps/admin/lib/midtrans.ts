import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/http";
import { logger } from "@/lib/logger";

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
      customer_imposed_payment_fee: { enable: false },
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
  try {
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
  } catch (error) {
    logger.warn(`Failed to query Midtrans status for invoice ${invoice}:`, { error });
    return { status: "unknown" };
  }
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
export async function refundCancelledOrder(invoice: string, amount: number, reason: string): Promise<"refund" | "cancel" | "manual_refund" | "mock"> {
  if (!env.midtrans.serverKey) {
    logger.info("[Midtrans] Server key tidak diset, pembatalan diproses secara internal/mock.", { invoice });
    return "mock";
  }

  const request = async (path: string, body?: Record<string, unknown>) => {
    try {
      const response = await fetch(`${apiBase()}/v2/${path}`, {
        method: body ? "POST" : "GET",
        headers: { Authorization: authorization(), Accept: "application/json", "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(15_000),
      });
      const data = (await response.json()) as Record<string, unknown>;
      return { ok: response.ok, status_code: String(data.status_code || response.status), data };
    } catch (err) {
      logger.warn("[Midtrans] Request failed:", { path, error: err });
      return { ok: false, status_code: "500", data: { status_message: "Koneksi gateway gagal" } };
    }
  };

  const statusRes = await request(`${encodeURIComponent(invoice)}/status`);
  
  // Jika transaksi tidak ditemukan di server Midtrans (misal dummy sandbox / 404)
  if (statusRes.status_code === "404" || !statusRes.ok) {
    logger.info("[Midtrans] Transaksi tidak ditemukan di gateway (404), diproses sebagai pembatalan sistem.", { invoice });
    return "cancel";
  }

  const status = statusRes.data;
  const state = String(status.transaction_status || "");

  if (state === "refund") return "refund";
  if (["cancel", "expire", "deny", "failure"].includes(state)) return "cancel";

  const reference = encodeURIComponent(String(status.transaction_id || invoice));

  // Jika pembayaran belum lunas atau masih pending/authorize
  if (["pending", "authorize", "capture"].includes(state)) {
    const cancelRes = await request(`${reference}/cancel`, {});
    if (cancelRes.ok && (cancelRes.data.transaction_status === "cancel" || cancelRes.status_code === "200")) {
      return "cancel";
    }
    return "cancel";
  }

  // Jika transaksi sudah lunas (settlement)
  if (state === "settlement") {
    const paymentType = String(status.payment_type || "").toLowerCase();
    
    // Metode yang mendukung Direct Online Refund otomatis via Midtrans
    const autoRefundTypes = ["credit_card", "gopay", "shopeepay", "dana", "ovo", "qris", "kredivo", "akulaku"];
    
    if (!autoRefundTypes.includes(paymentType)) {
      // Metode seperti Bank Transfer (BCA/BNI/BRI/Mandiri/Permata VA) atau Indomaret/Alfamart
      // Midtrans tidak mengizinkan direct API refund untuk VA per regulasi Bank Indonesia.
      logger.info(`[Midtrans] Pembayaran via ${paymentType} memerlukan pengembalian dana manual ke rekening pelanggan.`, { invoice });
      return "manual_refund";
    }

    // Eksekusi direct refund via Midtrans
    const refundRes = await request(`${reference}/refund`, {
      refund_key: `cancel-${invoice}`,
      amount,
      reason: reason.slice(0, 255),
    });

    if (refundRes.ok && (refundRes.data.transaction_status === "refund" || String(refundRes.data.status_code) === "200")) {
      return "refund";
    }

    // Jika Midtrans menolak refund otomatis (misal saldo merchant / limit), fallback ke manual refund
    logger.warn("[Midtrans] Auto-refund tidak berhasil diproses langsung oleh gateway:", refundRes.data);
    return "manual_refund";
  }

  return "cancel";
}

export async function cancelMidtransTransaction(invoice: string) {
  if (!env.midtrans.serverKey) return;
  try {
    await fetch(`${apiBase()}/v2/${encodeURIComponent(invoice)}/cancel`, {
      method: "POST",
      headers: { Authorization: authorization(), Accept: "application/json", "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
  } catch (err) {
    logger.warn("[Midtrans] Cancel pending transaction ignored", { invoice, error: err });
  }
}

