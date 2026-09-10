import { randomBytes } from "node:crypto";

export function nowSql(date = new Date()) {
  return date.toISOString().slice(0, 19).replace("T", " ");
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
