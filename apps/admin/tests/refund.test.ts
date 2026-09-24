import test from "node:test";
import assert from "node:assert/strict";
import { env } from "../lib/env";
import { refundCancelledOrder } from "../lib/midtrans";

test("refund Midtrans: full amount, stable key, retries, failures and cancellation", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = env.midtrans.serverKey;
  env.midtrans.serverKey = "test-only-key";
  const calls: Array<{ url: string; body?: Record<string, unknown> }> = [];
  let responses: Record<string, unknown>[] = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return Response.json(responses.shift());
  };
  const settled = { status_code: "200", transaction_status: "settlement", transaction_id: "tx-1", payment_type: "gopay", gross_amount: "150000.00" };
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      responses = [settled, { status_code: "200", transaction_status: "refund" }];
      assert.equal(await refundCancelledOrder("INV-1", 150000, "Alasan"), "refund");
    }
    assert.equal(calls[1].body?.refund_key, calls[3].body?.refund_key);
    assert.equal(calls[1].body?.amount, 150000);
    assert.ok(calls[1].url.endsWith("/tx-1/refund"));
    calls.length = 0;
    responses = [{ status_code: "200", transaction_status: "refund" }];
    assert.equal(await refundCancelledOrder("INV-1", 150000, "Alasan"), "refund");
    assert.equal(calls.length, 1, "Already refunded: no second POST");
    responses = [{ ...settled, payment_type: "bank_transfer" }];
    await assert.rejects(refundCancelledOrder("INV-1", 150000, "Alasan"), /tidak mendukung/);
    responses = [settled];
    await assert.rejects(refundCancelledOrder("INV-1", 100000, "Alasan"), /Nominal/);
    responses = [settled, { status_code: "202", status_message: "Refund denied" }];
    await assert.rejects(refundCancelledOrder("INV-1", 150000, "Alasan"), /Refund denied/);
    responses = [{ status_code: "200", transaction_status: "pending" }, { status_code: "200", transaction_status: "cancel" }];
    assert.equal(await refundCancelledOrder("INV-1", 150000, "Alasan"), "cancel");
    assert.ok(calls.at(-1)?.url.endsWith("/INV-1/cancel"));
    env.midtrans.serverKey = "";
    await assert.rejects(refundCancelledOrder("INV-1", 150000, "Alasan"), /belum dikonfigurasi/);
  } finally {
    globalThis.fetch = originalFetch;
    env.midtrans.serverKey = originalKey;
  }
});
