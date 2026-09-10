import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

function key() {
  return createHash("sha256").update(env.apiEncryptionKey).digest();
}

export function encryptPayload(data: unknown) {
  if (!env.apiEncryptionKey) return data;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const plaintext = typeof data === "string" ? data : JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptPayload(payload: string): unknown | null {
  if (!env.apiEncryptionKey) return payload;
  try {
    const raw = Buffer.from(payload, "base64");
    if (raw.length < 29) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
    try {
      return JSON.parse(plaintext);
    } catch {
      return plaintext;
    }
  } catch {
    return null;
  }
}
