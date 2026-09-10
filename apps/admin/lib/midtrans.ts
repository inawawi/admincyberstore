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
