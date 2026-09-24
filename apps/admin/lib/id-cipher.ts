// apps/admin/lib/id-cipher.ts
// Secure URL-safe ID encryption/obfuscation for Admin resources (Orders, etc.)

const SECRET_SALT = "bsi-cyberstore-secure-id-salt-v1";

// 32-bit integer permutation using a 4-round Feistel network with fixed round keys
const ROUND_KEYS = [0x9e3779b9, 0x85ebca6b, 0xc2b2ae35, 0x27d4eb2f];

function roundFunction(val: number, key: number): number {
  let x = (val ^ key) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x & 0xffff;
}

function permute32(num: number): number {
  let left = (num >>> 16) & 0xffff;
  let right = num & 0xffff;

  for (let i = 0; i < 4; i++) {
    const newLeft = right;
    const newRight = (left ^ roundFunction(right, ROUND_KEYS[i])) & 0xffff;
    left = newLeft;
    right = newRight;
  }
  return ((left << 16) | right) >>> 0;
}

function unpermute32(permuted: number): number {
  let left = (permuted >>> 16) & 0xffff;
  let right = permuted & 0xffff;

  for (let i = 3; i >= 0; i--) {
    const origRight = left;
    const origLeft = (right ^ roundFunction(left, ROUND_KEYS[i])) & 0xffff;
    left = origLeft;
    right = origRight;
  }
  return ((left << 16) | right) >>> 0;
}

// 16-bit FNV-1a based checksum for tamper detection
function computeChecksum(num: number, prefix: string): number {
  let hash = 0x811c9dc5;
  const str = `${prefix}_${num}_${SECRET_SALT}`;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash & 0xffff;
}

/**
 * Encrypt a numeric ID into an obfuscated, URL-safe string.
 * Example: encryptOrderId(16) => "ord_9f02fd2da14c"
 */
export function encryptOrderId(rawId: number | string): string {
  return encryptId("ord", rawId);
}

/**
 * Decrypt a token back into its numeric ID.
 * Returns null if the token is invalid or tampered with.
 * Supports legacy/raw integer input for backward compatibility.
 * Example: decryptOrderId("ord_9f02fd2da14c") => 16
 * Example: decryptOrderId("16") => 16
 */
export function decryptOrderId(token: string | number | null | undefined): number | null {
  return decryptId("ord", token);
}

/**
 * General purpose ID encryption with custom prefix.
 */
export function encryptId(prefix: string, rawId: number | string): string {
  const id = typeof rawId === "number" ? rawId : parseInt(String(rawId), 10);
  if (!Number.isFinite(id) || id <= 0) return String(rawId);

  const perm = permute32(id);
  const chk = computeChecksum(id, prefix);

  const hex = perm.toString(16).padStart(8, "0") + chk.toString(16).padStart(4, "0");
  return `${prefix}_${hex}`;
}

/**
 * General purpose ID decryption with custom prefix.
 */
export function decryptId(prefix: string, token: string | number | null | undefined): number | null {
  if (token === null || token === undefined || token === "") return null;
  if (typeof token === "number") return Number.isFinite(token) && token > 0 ? token : null;

  const str = String(token).trim();

  // Backward compatibility: If directly a numeric string (e.g. "16")
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    return Number.isFinite(num) && num > 0 ? num : null;
  }

  const expectedPrefix = `${prefix}_`;
  if (!str.startsWith(expectedPrefix)) return null;

  const hex = str.slice(expectedPrefix.length).toLowerCase();
  if (hex.length !== 12 || !/^[0-9a-f]{12}$/.test(hex)) return null;

  const permHex = hex.slice(0, 8);
  const chkHex = hex.slice(8, 12);

  const perm = parseInt(permHex, 16);
  const expectedChk = parseInt(chkHex, 16);

  const id = unpermute32(perm);
  if (id <= 0 || !Number.isFinite(id)) return null;

  const actualChk = computeChecksum(id, prefix);
  if (actualChk !== expectedChk) {
    return null; // Tampered token
  }

  return id;
}
