import test from "node:test";
import assert from "node:assert/strict";
import { asBoolean, parseJsonArray, slugify } from "../lib/utils";
import { decryptPayload, encryptPayload } from "../lib/crypto";

test("slugify membuat slug URL yang stabil", () => {
  assert.equal(slugify("  Jaket Almamater Cyber!  "), "jaket-almamater-cyber");
  assert.equal(slugify("Aksesori & Topi"), "aksesori-topi");
});

test("parser field admin menerima JSON dan daftar koma", () => {
  assert.deepEqual(parseJsonArray('["S","M","L"]'), ["S", "M", "L"]);
  assert.deepEqual(parseJsonArray("Biru, Hitam"), ["Biru", "Hitam"]);
  assert.equal(asBoolean("true"), true);
  assert.equal(asBoolean("false"), false);
});

test("enkripsi API kompatibel melakukan round-trip", () => {
  process.env.API_ENCRYPTION_KEY = "test-secret-key-32-chars-long-abc";
  const source = { message: "aman", nested: { value: 42 } };
  const encrypted = encryptPayload(source);
  assert.equal(typeof encrypted, "string");
  assert.deepEqual(decryptPayload(String(encrypted)), source);
  assert.equal(decryptPayload("payload-tidak-valid"), null);
});

test("CORS whitelist hanya mengizinkan origin valid dan menolak origin asing", async () => {
  const { getCorsHeaders } = await import("../lib/http");
  const allowedReq = new Request("http://localhost:3000/api/v1/products", {
    headers: { origin: "http://localhost:3100" },
  });
  const allowedHeaders = getCorsHeaders(allowedReq);
  assert.equal(allowedHeaders["Access-Control-Allow-Origin"], "http://localhost:3100");
  assert.equal(allowedHeaders["Access-Control-Allow-Credentials"], "true");

  const evilReq = new Request("http://localhost:3000/api/v1/products", {
    headers: { origin: "https://evil-phishing-site.com" },
  });
  const evilHeaders = getCorsHeaders(evilReq);
  assert.equal(evilHeaders["Access-Control-Allow-Origin"], undefined);
  assert.equal(evilHeaders["Access-Control-Allow-Credentials"], undefined);
});

test("checkRateLimit melempar ApiError 429 jika melampaui batas percobaan", async () => {
  const { checkRateLimit, ApiError } = await import("../lib/http");
  const req = new Request("http://localhost:3000/api/admin/login", {
    headers: { "x-forwarded-for": "10.99.88.77" },
  });
  checkRateLimit(req, "test-limit-action", { max: 2, windowMs: 60_000 });
  checkRateLimit(req, "test-limit-action", { max: 2, windowMs: 60_000 });
  assert.throws(
    () => checkRateLimit(req, "test-limit-action", { max: 2, windowMs: 60_000 }),
    (err: any) => err instanceof ApiError && err.status === 429,
  );
});
