import { randomBytes } from "node:crypto";

export function nowSql(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function addMinutes(minutes: number) {
  return nowSql(new Date(Date.now() + minutes * 60_000));
}

export function randomString(length = 40) {
  return randomBytes(Math.ceil(length * 0.75))
    .toString("base64url")
    .slice(0, length);
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function asBoolean(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true" || value === "on";
}

export function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function cleanNullable(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return value;
}

export function parseJsonArray(value: unknown): string[] | null {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return null;
}

export function parseColorsArray(value: unknown): Array<{ name: string; hex: string; stock: number }> | null {
  if (value === undefined || value === null || value === "") return null;
  let items: unknown[] = [];
  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) items = parsed;
      else items = value.split(",").map((s) => s.trim()).filter(Boolean);
    } catch {
      items = value.split(",").map((s) => s.trim()).filter(Boolean);
    }
  } else {
    return null;
  }

  const result = items.map((item) => {
    if (typeof item === "string") {
      return { name: item.trim(), hex: "", stock: 0 };
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      return {
        name: String(obj.name || "").trim(),
        hex: typeof obj.hex === "string" ? obj.hex.trim() : "",
        stock: obj.stock !== undefined ? Math.max(0, asNumber(obj.stock, 0)) : 0,
      };
    }
    return null;
  }).filter((c): c is { name: string; hex: string; stock: number } => Boolean(c && c.name));

  return result.length ? result : null;
}

export function publicUrl(path: unknown) {
  if (!path || typeof path !== "string") return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `/storage/${path.replace(/^\/?storage\/?/, "")}`;
}

export function safeJson<T = unknown>(value: T): T {
  if (value instanceof Date) return value.toISOString() as T;
  if (typeof value === "bigint") return Number(value) as T;
  if (Array.isArray(value)) return value.map((entry) => safeJson(entry)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, safeJson(entry)]),
    ) as T;
  }
  return value;
}

export function omit<T extends Record<string, unknown>>(
  source: T,
  keys: string[],
) {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !keys.includes(key)),
  ) as Partial<T>;
}

export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}
