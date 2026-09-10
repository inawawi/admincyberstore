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
  const source = { message: "aman", nested: { value: 42 } };
  const encrypted = encryptPayload(source);
  assert.equal(typeof encrypted, "string");
  assert.deepEqual(decryptPayload(String(encrypted)), source);
  assert.equal(decryptPayload("payload-tidak-valid"), null);
});
