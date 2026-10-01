import React from "react";
import type { ResourceField } from "@/types";

export const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
export const number = new Intl.NumberFormat("id-ID");
export const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !query.trim() || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = String(text).split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="search-highlight-mark">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function display(value: unknown, format?: string): React.ReactNode {
  if (value === null || value === undefined || value === "") return <span className="muted">—</span>;
  if (format === "currency") return money.format(Number(value));
  if (format === "number") return number.format(Number(value));
  if (format === "date") return <span className="date-cell">{date.format(new Date(String(value)))}</span>;
  if (format === "boolean") return Boolean(value) ? <span className="status-pill success"><span />Aktif</span> : <span className="status-pill neutral"><span />Nonaktif</span>;
  if (format === "status") {
    const raw = String(value);
    const roleLabels: Record<string, string> = {
      customer: "Pelanggan",
      admin: "Admin",
      superadmin: "Superadmin",
    };
    const label = roleLabels[raw] || raw.replaceAll("_", " ");
    return <span className={`status-pill status-${raw}`}><span />{label}</span>;
  }
  if (format === "rating") return <span className="rating-value">★ {Number(value).toFixed(1)}</span>;
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
}

export function truncate(text: string, maxLength = 70): string {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

export function getRowPhotoUrl(row: Record<string, unknown>): string | null {
  const photo =
    row.main_photo_url ||
    row.main_photo ||
    row.image_path_url ||
    row.image_path ||
    row.image_url ||
    row.image ||
    row.photo_url ||
    row.photo ||
    row.avatar_url ||
    row.avatar ||
    row.logo_url ||
    row.logo;
  if (!photo || typeof photo !== "string") return null;
  if (/^https?:\/\//i.test(photo)) return photo;
  return `/storage/${photo.replace(/^\/?storage\/?/, "")}`;
}

export function fieldDefault(field?: ResourceField | null, row?: Record<string, unknown> | null): string {
  if (!field || !field.key) return "";
  const value = row ? row[field.key] : field.defaultValue;
  if (field.kind === "json" && Array.isArray(value)) return value.join(", ");
  if (field.kind === "json" && typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.join(", ") : value; } catch { return value; }
  }
  return value === null || value === undefined ? "" : String(value);
}

export function isEnabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true" || value === "on";
}

export function hasSizeOptions(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value !== "string" || !value.trim()) return false;
  try { return Array.isArray(JSON.parse(value)) && JSON.parse(value).length > 0; } catch { return true; }
}

export function formatDotDate(dateStr: unknown): string {
  try {
    const d = new Date(String(dateStr));
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return String(dateStr);
  }
}

export function formatDotDateTime(dateStr: unknown): string {
  try {
    const d = new Date(String(dateStr));
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const month = months[d.getMonth()] || "Jan";
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}, ${hours}:${mins}`;
  } catch {
    return String(dateStr);
  }
}

export function resolveProductPhotoUrl(photo: unknown): string {
  if (!photo || typeof photo !== "string" || !photo.trim()) return "/placeholder-product.svg";
  const p = photo.trim().replace(/\\/g, "/");
  if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("data:")) {
    return p;
  }
  if (p.startsWith("/_next") || p.startsWith("/assets") || p.startsWith("assets/") || p.startsWith("/img") || p.startsWith("img/")) {
    return p.startsWith("/") ? p : `/${p}`;
  }
  const clean = p.replace(/^\/?(storage\/)?/, "");
  return `/storage/${clean}`;
}

export function formatShortDate(dateStr: unknown): string {
  try {
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(String(dateStr)));
  } catch {
    return String(dateStr);
  }
}

export function isMabaOrder(order?: Record<string, unknown> | null, items?: Array<Record<string, unknown>>): boolean {
  if (!order) return false;
  if (Boolean(order.is_event_maba)) return true;
  if (order.expedition_name && String(order.expedition_name).toLowerCase().includes("maba")) return true;
  if (order.note && (String(order.note).toLowerCase().includes("maba") || String(order.note).toLowerCase().includes("pengambilan kampus") || String(order.note).toLowerCase().includes("kampus ubsi"))) return true;
  if (items && items.length > 0) {
    return items.some((it) => Boolean(it.is_event_maba || it.nim || it.campus_location || (it.product_name && String(it.product_name).toLowerCase().includes("maba"))));
  }
  return false;
}

export function formatOrderStatus(status: string, isMaba = false) {
  if (isMaba) {
    const mabaMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
      completed: { label: "Selesai (Diserahkan)", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)" },
      arrived: { label: "Tiba di Kampus (Siap Diambil)", color: "#0284c7", bg: "rgba(2, 132, 199, 0.15)", border: "rgba(2, 132, 199, 0.3)" },
      shipped: { label: "Distribusi ke Kampus", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.3)" },
      packed: { label: "Disiapkan Admin Kampus", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.3)" },
      processing: { label: "Disiapkan Admin Kampus", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.3)" },
      paid: { label: "Terverifikasi (Siap Siap)", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)", border: "rgba(6, 182, 212, 0.3)" },
      pending_payment: { label: "Menunggu Pembayaran", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" },
      pending: { label: "Menunggu Pembayaran", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" },
      cancelled: { label: "Dibatalkan", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)" },
      expired: { label: "Kadaluarsa", color: "#64748b", bg: "rgba(100, 116, 139, 0.15)", border: "rgba(100, 116, 139, 0.3)" },
    };
    return mabaMap[status] || { label: status, color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", border: "rgba(148, 163, 184, 0.3)" };
  }

  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    completed: { label: "Selesai", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)" },
    processing: { label: "Diproses", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.3)" },
    shipped: { label: "Dikirim", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)" },
    paid: { label: "Sudah Dibayar", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)", border: "rgba(6, 182, 212, 0.3)" },
    pending_payment: { label: "Menunggu Pembayaran", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" },
    pending: { label: "Menunggu Pembayaran", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" },
    cancelled: { label: "Dibatalkan", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)" },
    expired: { label: "Kadaluarsa", color: "#64748b", bg: "rgba(100, 116, 139, 0.15)", border: "rgba(100, 116, 139, 0.3)" },
  };
  return map[status] || { label: status, color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", border: "rgba(148, 163, 184, 0.3)" };
}

export function generateAutoResi(expeditionCode?: string | null, expeditionName?: string | null, isMaba = false): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");

  if (isMaba) {
    return `MABA26-UBSI-${dateStr}-${rand(4)}`;
  }

  const code = (expeditionCode || expeditionName || "").toLowerCase();

  if (code.includes("j&t") || code.includes("jnt")) {
    return `JP${dateStr}${rand(4)}`;
  }
  if (code.includes("jne")) {
    return `JNE${dateStr}${rand(6)}`;
  }
  if (code.includes("sicepat")) {
    return `00${dateStr}${rand(6)}`;
  }
  if (code.includes("anteraja")) {
    return `1000${dateStr}${rand(4)}`;
  }
  if (code.includes("tiki")) {
    return `TIKI${dateStr}${rand(5)}`;
  }
  if (code.includes("pos")) {
    return `POS${dateStr}${rand(6)}`;
  }
  if (code.includes("ninja")) {
    return `NLID${dateStr}${rand(5)}`;
  }
  if (code.includes("wahana")) {
    return `WHN${dateStr}${rand(6)}`;
  }

  const cleanCode = (expeditionCode || "CS").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "CS";
  return `${cleanCode}${dateStr}${rand(4)}`;
}

export function renderStars(rating: number, max = 5): React.ReactNode {
  const stars = [];
  const score = Math.round(Number(rating || 0));
  for (let i = 1; i <= max; i++) {
    stars.push(
      <span key={i} className={`star-char ${i <= score ? "star-filled" : "star-empty"}`}>
        ★
      </span>
    );
  }
  return <div className="stars-wrapper">{stars}</div>;
}
