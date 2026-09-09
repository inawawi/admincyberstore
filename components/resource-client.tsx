"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Select from "react-select";
import { Icon } from "@/components/icon";
import type { ResourceField, ResourceMeta } from "@/types";
import { mabaColorOptions } from "@/lib/constants";
import { SweetAlert } from "@/components/sweet-alert";

interface Props {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>>; total: number; page: number; perPage: number; pages: number };
  search: string;
  status?: string;
  productId?: string;
  typeFilter?: string;
  cancelStatus?: string;
  orderId?: string;
  initialOrderDetail?: {
    order: Record<string, unknown>;
    items: Array<Record<string, unknown>>;
    payment: Record<string, unknown> | null;
  } | null;
  chatId?: string;
  initialChatDetail?: {
    chat: Record<string, unknown>;
    messages: Array<Record<string, unknown>>;
    customerOrders: Array<Record<string, unknown>>;
  } | null;
  reviewId?: string;
  initialReviewDetail?: {
    review: Record<string, unknown>;
    otherReviews: Array<Record<string, unknown>>;
    customerOrders: Array<Record<string, unknown>>;
  } | null;
}

const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("id-ID");
const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

const mabaHexMap: Record<string, string> = Object.fromEntries(
  mabaColorOptions.map((opt) => [opt.value, opt.hex])
);

const COLOR_PALETTE_TEMPLATES: Array<{ name: string; hex: string }> = [
  { name: "Hitam", hex: "#080808" },
  { name: "Putih", hex: "#FFFFFF" },
  { name: "Kuning Emas", hex: "#FFD700" },
  { name: "Kuning", hex: "#FFFF00" },
  { name: "Merah", hex: "#FF0000" },
  { name: "Merah Marun", hex: "#800000" },
  { name: "Biru", hex: "#0400FF" },
  { name: "Navy", hex: "#000080" },
  { name: "Biru Muda", hex: "#38BDF8" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Hijau", hex: "#00FF00" },
  { name: "Hijau Tosca", hex: "#0D9488" },
  { name: "Emerald", hex: "#059669" },
  { name: "Mint", hex: "#6EE7B7" },
  { name: "Abu-abu", hex: "#808080" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Charcoal", hex: "#374151" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Coral", hex: "#F43F5E" },
  { name: "Pink", hex: "#FF007B" },
  { name: "Dusty Pink", hex: "#DB7093" },
  { name: "Ungu", hex: "#FF00EA" },
  { name: "Lavender", hex: "#A78BFA" },
  { name: "Cokelat", hex: "#A52A2A" },
  { name: "Mocca", hex: "#8D6E63" },
  { name: "Khaki", hex: "#C3B091" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Olive", hex: "#65A30D" },
];

function resolveColorHex(name: string): string {
  if (!name) return "#4B5563";
  const trimmed = name.trim();
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(trimmed)) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  const known = COLOR_PALETTE_TEMPLATES.find((c) => c.name.toLowerCase() === lower);
  if (known) return known.hex;
  if (mabaHexMap[trimmed]) return mabaHexMap[trimmed];

  if (lower.includes("emas") || lower.includes("gold")) return "#FFD700";
  if (lower.includes("tosca") || lower.includes("toska")) return "#0D9488";
  if (lower.includes("emerald")) return "#059669";
  if (lower.includes("mint")) return "#6EE7B7";
  if (lower.includes("cyan")) return "#06B6D4";
  if (lower.includes("marun") || lower.includes("maroon")) return "#800000";
  if (lower.includes("navy")) return "#000080";
  if (lower.includes("charcoal")) return "#374151";
  if (lower.includes("hitam") || lower.includes("black")) return "#080808";
  if (lower.includes("putih") || lower.includes("white")) return "#FFFFFF";
  if (lower.includes("abu") || lower.includes("grey") || lower.includes("gray")) return "#808080";
  if (lower.includes("merah") || lower.includes("red")) return "#FF0000";
  if (lower.includes("coral")) return "#F43F5E";
  if (lower.includes("biru") || lower.includes("blue")) return "#0400FF";
  if (lower.includes("hijau") || lower.includes("green")) return "#00FF00";
  if (lower.includes("kuning") || lower.includes("yellow")) return "#FFFF00";
  if (lower.includes("mustard")) return "#EAB308";
  if (lower.includes("orange") || lower.includes("oranye")) return "#FFA500";
  if (lower.includes("dusty pink")) return "#DB7093";
  if (lower.includes("pink") || lower.includes("merah muda")) return "#FF007B";
  if (lower.includes("lavender")) return "#A78BFA";
  if (lower.includes("ungu") || lower.includes("purple")) return "#FF00EA";
  if (lower.includes("mocca") || lower.includes("moka")) return "#8D6E63";
  if (lower.includes("cokelat") || lower.includes("brown")) return "#A52A2A";
  if (lower.includes("khaki")) return "#C3B091";
  if (lower.includes("olive")) return "#65A30D";
  if (lower.includes("silver") || lower.includes("perak")) return "#C0C0C0";

  return "#4B5563";
}

const colorTemplateOptions = COLOR_PALETTE_TEMPLATES.map((t) => ({
  value: t.name,
  label: `${t.name} (${t.hex})`,
  hex: t.hex,
  name: t.name,
}));

const colorTemplateOptionsWithMore = [
  ...colorTemplateOptions,
  {
    value: "__MORE__",
    label: "🎨 + More (Palet Warna)...",
    hex: "#8b5cf6",
    name: "+ More (Palet Warna)...",
  },
];

const mabaSelectOptions = mabaColorOptions.map((opt) => ({
  value: opt.value,
  label: `${opt.value} (${opt.hex})`,
  hex: opt.hex,
  name: opt.value,
}));

const mabaSelectOptionsWithMore = [
  ...mabaSelectOptions,
  {
    value: "__MORE__",
    label: "🎨 + More (Palet Warna)...",
    hex: "#8b5cf6",
    name: "+ More (Palet Warna)...",
  },
];

const formatColorOptionLabel = (option: { label?: string; value: string; hex?: string; name?: string }) => {
  if (option.value === "__MORE__") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "9px", width: "100%", color: "var(--accent, #0088cc)", fontWeight: 700 }}>
        <span style={{ fontSize: "15px" }}>🎨</span>
        <span>+ More (Palet Warna)...</span>
      </div>
    );
  }
  const hex = option.hex || resolveColorHex(option.name || option.value);
  const isWhite = hex.toUpperCase() === "#FFFFFF" || hex.toUpperCase() === "#FFF";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "9px", width: "100%" }}>
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          backgroundColor: hex,
          border: isWhite ? "1px solid #d1d5db" : "1px solid rgba(0,0,0,0.25)",
          boxShadow: isWhite ? "inset 0 0 0 1px #e5e7eb" : "inset 0 0 0 1px rgba(255,255,255,0.4)",
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      <span style={{ fontWeight: 550 }}>{option.name || option.value}</span>
      <span style={{ fontSize: "11px", opacity: 0.6, marginLeft: "auto", fontFamily: "monospace" }}>
        {hex}
      </span>
    </div>
  );
};

const reactSelectColorStyles: any = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: "36px",
    height: "36px",
    borderRadius: "6px",
    borderColor: state.isFocused ? "var(--accent)" : "var(--control-border)",
    backgroundColor: "var(--control)",
    boxShadow: state.isFocused ? "0 0 0 1px var(--accent)" : "none",
    fontSize: "13px",
    color: "var(--text)",
    cursor: "pointer",
    "&:hover": {
      borderColor: state.isFocused ? "var(--accent)" : "var(--control-border)",
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    height: "36px",
    padding: "0 10px",
  }),
  input: (base: any) => ({
    ...base,
    margin: 0,
    padding: 0,
    color: "var(--text)",
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "var(--text)",
    display: "flex",
    alignItems: "center",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "var(--muted)",
    fontSize: "13px",
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: "var(--surface-raised)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
    zIndex: 99999,
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 99999,
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--accent)"
      : state.isFocused
      ? "var(--surface-hover)"
      : "transparent",
    color: state.isSelected ? "#ffffff" : "var(--text)",
    fontSize: "13px",
    cursor: "pointer",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
  }),
};

function display(value: unknown, format?: string) {
  if (value === null || value === undefined || value === "") return <span className="muted">—</span>;
  if (format === "currency") return money.format(Number(value));
  if (format === "number") return number.format(Number(value));
  if (format === "date") return <span className="date-cell">{date.format(new Date(String(value)))}</span>;
  if (format === "boolean") return Boolean(value) ? <span className="status-pill success"><span />Aktif</span> : <span className="status-pill neutral"><span />Nonaktif</span>;
  if (format === "status") return <span className={`status-pill status-${String(value)}`}>{String(value).replaceAll("_", " ")}</span>;
  if (format === "rating") return <span className="rating-value">★ {Number(value).toFixed(1)}</span>;
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
}

function truncate(text: string, maxLength = 70) {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function getRowPhotoUrl(row: Record<string, unknown>): string | null {
  const photo =
    row.main_photo_url ||
    row.main_photo ||
    row.image_url ||
    row.image ||
    row.photo_url ||
    row.photo ||
    row.logo_url ||
    row.logo;
  if (!photo || typeof photo !== "string") return null;
  if (/^https?:\/\//i.test(photo)) return photo;
  return `/storage/${photo.replace(/^\/?storage\/?/, "")}`;
}


function fieldDefault(field?: ResourceField | null, row?: Record<string, unknown> | null) {
  if (!field || !field.key) return "";
  const value = row ? row[field.key] : field.defaultValue;
  if (field.kind === "json" && Array.isArray(value)) return value.join(", ");
  if (field.kind === "json" && typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.join(", ") : value; } catch { return value; }
  }
  return value === null || value === undefined ? "" : String(value);
}

function isEnabled(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true" || value === "on";
}

function hasSizeOptions(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value !== "string" || !value.trim()) return false;
  try { return Array.isArray(JSON.parse(value)) && JSON.parse(value).length > 0; } catch { return true; }
}

function StockMovementsView({
  meta,
  result,
  search,
  productId = "",
  typeFilter = "",
}: {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>>; total: number; page: number; perPage: number; pages: number };
  search: string;
  productId?: string;
  typeFilter?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Manual mutation form states
  const [manualProductId, setManualProductId] = useState("");
  const [manualType, setManualType] = useState("");
  const [manualQty, setManualQty] = useState(1);
  const [manualRef, setManualRef] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter toolbar states
  const [searchVal, setSearchVal] = useState(search);
  const [productFilterVal, setProductFilterVal] = useState(productId);
  const [typeFilterVal, setTypeFilterVal] = useState(typeFilter);

  const productField = meta.fields.find((f) => f.key === "product_id");
  const productOptions = productField?.options || [];

  async function handleManualSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!manualProductId) {
      setMessage({ text: "Silakan pilih produk terlebih dahulu.", type: "error" });
      return;
    }
    if (!manualType) {
      setMessage({ text: "Silakan pilih tipe mutasi (Masuk atau Keluar).", type: "error" });
      return;
    }
    if (manualQty <= 0) {
      setMessage({ text: "Jumlah unit mutasi harus lebih dari 0.", type: "error" });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("product_id", manualProductId);
      formData.set("type", manualType);
      formData.set("quantity", String(manualQty));
      if (manualRef.trim()) formData.set("reference", manualRef.trim());
      if (manualNote.trim()) formData.set("note", manualNote.trim());

      const res = await fetch(`/api/admin/resources/stock-movements`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mencatat mutasi stok.");

      setMessage({ text: "Mutasi stok berhasil dicatat ke sistem!", type: "success" });
      setManualProductId("");
      setManualType("");
      setManualQty(1);
      setManualRef("");
      setManualNote("");
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Terjadi kesalahan saat mencatat mutasi stok.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  function handleFilterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (productFilterVal) params.set("product_id", productFilterVal);
    if (typeFilterVal) params.set("type", typeFilterVal);
    params.set("page", "1");
    router.push(`/admin/stock-movements?${params.toString()}`);
  }

  function navigatePage(newPage: number) {
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (productFilterVal) params.set("product_id", productFilterVal);
    if (typeFilterVal) params.set("type", typeFilterVal);
    params.set("page", String(newPage));
    router.push(`/admin/stock-movements?${params.toString()}`);
  }

  function handleDownloadPdf() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    const dateStr = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date());

    const rowsHtml = result.data
      .map((row, idx) => {
        const isIn = row.type === "in";
        const qtyText = isIn ? `+${row.quantity}` : `-${row.quantity}`;
        const typeLabel = isIn ? "Stok Masuk" : "Stok Keluar";
        const typeColor = isIn ? "#059669" : "#dc2626";
        const dateFormatted = row.created_at
          ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(String(row.created_at))
            )
          : "-";
        return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>
            <strong>${row.product_name || "Produk"}</strong>
            <div style="font-size:11px;color:#6b7280;">Stok saat ini: ${row.current_stock ?? "-"}</div>
          </td>
          <td style="text-align:center;">
            <span style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:12px;font-weight:600;color:${typeColor};background:${
          isIn ? "#ecfdf5" : "#fef2f2"
        };border:1px solid ${isIn ? "#a7f3d0" : "#fecaca"};">
              ${typeLabel}
            </span>
          </td>
          <td style="text-align:right;font-weight:bold;color:${typeColor};">${qtyText}</td>
          <td><code>${row.reference || "-"}</code></td>
          <td>${row.note || "-"}</td>
          <td>${row.user_name || "Sistem"}</td>
          <td style="font-size:12px;">${dateFormatted}</td>
        </tr>
      `;
      })
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Laporan Mutasi Stok - UBSI Cyber Store</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; margin: 0; padding: 28px; }
          .header { border-bottom: 3px solid #0088cc; padding-bottom: 14px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 24px; font-weight: 800; color: #0b1329; margin: 0 0 4px 0; }
          .subtitle { font-size: 13px; color: #4b5563; margin: 0; }
          .meta-box { font-size: 12px; color: #4b5563; text-align: right; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px; }
          th { background: #f3f4f6; color: #374151; font-weight: 700; text-align: left; padding: 10px 10px; border: 1px solid #e5e7eb; font-size: 11px; text-transform: uppercase; }
          td { padding: 9px 10px; border: 1px solid #e5e7eb; vertical-align: middle; }
          tr:nth-child(even) td { background: #fbfbfb; }
          .signature-area { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sign-box { text-align: center; width: 220px; }
          .sign-line { margin-top: 65px; border-top: 1px solid #374151; padding-top: 5px; font-weight: 600; }
          @media print {
            body { padding: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">UBSI CYBER STORE</h1>
            <p class="subtitle">Laporan Resmi Riwayat Mutasi Stok Barang & Inventaris</p>
          </div>
          <div class="meta-box">
            <div>Tanggal Cetak: <strong>${dateStr}</strong></div>
            <div>Total Data: <strong>${result.total} transaksi</strong></div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:38px;text-align:center;">NO</th>
              <th>PRODUK</th>
              <th style="text-align:center;">TIPE</th>
              <th style="text-align:right;">QTY</th>
              <th>REFERENSI</th>
              <th>CATATAN</th>
              <th>OLEH</th>
              <th>TANGGAL & WAKTU</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="8" style="text-align:center;padding:24px;color:#9ca3af;">Tidak ada data mutasi stok</td></tr>'}
          </tbody>
        </table>
        <div class="signature-area">
          <div class="sign-box">
            <div style="font-size:12px;color:#6b7280;">Dibuat Oleh:</div>
            <div class="sign-line">Admin Logistik / Operator</div>
          </div>
          <div class="sign-box">
            <div style="font-size:12px;color:#6b7280;">Mengetahui:</div>
            <div class="sign-line">Kepala UBSI Cyber Store</div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  return (
    <div className="page-stack stock-movements-page">
      {/* SweetAlert Floating Toast */}
      <SweetAlert
        isOpen={!!message}
        isToast={true}
        type={message?.type || "info"}
        message={message?.text || ""}
        onClose={() => setMessage(null)}
      />

      {/* Top Breadcrumb & Main Heading */}
      <div className="stock-breadcrumb-row">
        <div className="stock-breadcrumb">
          <Link href="/admin" className="stock-crumb-link">
            <span className="stock-crumb-home">🏠</span> Pages
          </Link>
          <span className="stock-crumb-sep">&gt;</span>
          <span className="stock-crumb-active">Mutasi Stok</span>
        </div>
        <h1 className="stock-main-heading">Mutasi Stok</h1>
      </div>

      {/* 2-Column Split Grid */}
      <div className="stock-movements-grid">
        {/* Left Column: Riwayat Mutasi Stok Card */}
        <section className="stock-card stock-history-card">
          <div className="stock-card-header">
            <div className="stock-card-title">
              <span className="stock-title-wave-icon">
                <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.5 7.5L6 3L10.5 8L15 4L20.5 10" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <h2>Riwayat Mutasi Stok</h2>
            </div>
            <button
              type="button"
              className="stock-download-pdf-btn"
              onClick={handleDownloadPdf}
              title="Cetak atau unduh laporan mutasi stok sebagai PDF"
            >
              <Icon name="FileText" size={15} />
              <span>Download PDF</span>
            </button>
          </div>

          {/* Filter Bar */}
          <form onSubmit={handleFilterSubmit} className="stock-filter-row">
            <div className="stock-search-wrapper">
              <span className="stock-search-dot" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Cari produk, referensi..."
                className="stock-search-input"
              />
            </div>
            <select
              value={productFilterVal}
              onChange={(e) => setProductFilterVal(e.target.value)}
              className="stock-filter-select"
            >
              <option value="">Semua Produk</option>
              {productOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={typeFilterVal}
              onChange={(e) => setTypeFilterVal(e.target.value)}
              className="stock-filter-select stock-type-select"
            >
              <option value="">Semua Tipe</option>
              <option value="in">Stok Masuk</option>
              <option value="out">Stok Keluar</option>
            </select>
            <button type="submit" className="stock-red-filter-btn">
              Filter
            </button>
          </form>

          {/* History Table */}
          <div className="stock-table-container">
            <table className="stock-data-table">
              <thead>
                <tr>
                  <th style={{ width: "42px", textAlign: "center" }}>NO.</th>
                  <th>PRODUK</th>
                  <th>TIPE</th>
                  <th style={{ textAlign: "center" }}>QTY</th>
                  <th>REFERENSI</th>
                  <th>CATATAN</th>
                  <th>OLEH</th>
                  <th>TANGGAL</th>
                </tr>
              </thead>
              <tbody>
                {result.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="stock-empty-td">
                      Tidak ada riwayat mutasi stok.
                    </td>
                  </tr>
                ) : (
                  result.data.map((row, index) => {
                    const rowNumber = (result.page - 1) * result.perPage + index + 1;
                    const isIn = row.type === "in";
                    const formattedDate = row.created_at
                      ? new Intl.DateTimeFormat("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(String(row.created_at)))
                      : "—";

                    return (
                      <tr key={String(row.id)}>
                        <td style={{ textAlign: "center", color: "#94a3b8" }}>{rowNumber}</td>
                        <td>
                          <div className="stock-row-product-name">{String(row.product_name || "Produk")}</div>
                          <div className="stock-row-product-current">
                            Stok kini: <strong>{String(row.current_stock ?? "0")}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={`stock-type-badge ${isIn ? "badge-in" : "badge-out"}`}>
                            {isIn ? <Icon name="ArrowDown" size={12} /> : <Icon name="ArrowUp" size={12} />}
                            <span>{isIn ? "Masuk" : "Keluar"}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`stock-qty-val ${isIn ? "qty-in" : "qty-out"}`}>
                            {isIn ? `+${row.quantity}` : `-${row.quantity}`}
                          </span>
                        </td>
                        <td>
                          <span className="stock-ref-badge">{String(row.reference || "—")}</span>
                        </td>
                        <td className="stock-note-cell">{String(row.note || "—")}</td>
                        <td className="stock-user-cell">{String(row.user_name || "Sistem")}</td>
                        <td className="stock-date-cell">{formattedDate}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="stock-pagination-bar">
            <div className="stock-pagination-info">
              Total <strong>{number.format(result.total)}</strong> riwayat mutasi
            </div>
            {result.pages > 1 && (
              <div className="stock-pagination-actions">
                <button
                  type="button"
                  disabled={result.page <= 1}
                  onClick={() => navigatePage(result.page - 1)}
                  className="stock-pager-btn"
                >
                  <Icon name="ChevronLeft" size={15} />
                  <span>Sebelumnya</span>
                </button>
                <span className="stock-pager-cur">
                  {result.page} / {result.pages}
                </span>
                <button
                  type="button"
                  disabled={result.page >= result.pages}
                  onClick={() => navigatePage(result.page + 1)}
                  className="stock-pager-btn"
                >
                  <span>Berikutnya</span>
                  <Icon name="ChevronRight" size={15} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Input Mutasi Manual Card */}
        <section className="stock-card stock-manual-card">
          <div className="stock-manual-title">
            <span className="stock-plus-circle-icon">
              <Icon name="Plus" size={14} />
            </span>
            <h2>Input Mutasi Manual</h2>
          </div>

          <form onSubmit={handleManualSubmit} className="stock-manual-form-body">
            <div className="stock-field-group">
              <label>Produk <span className="req-star">*</span></label>
              <select
                value={manualProductId}
                onChange={(e) => setManualProductId(e.target.value)}
                required
                className="stock-form-control"
              >
                <option value="">— Pilih Produk —</option>
                {productOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="stock-field-group">
              <label>Tipe Mutasi <span className="req-star">*</span></label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value)}
                required
                className="stock-form-control"
              >
                <option value="">— Pilih Tipe —</option>
                <option value="in">Stok Masuk (Tambah)</option>
                <option value="out">Stok Keluar (Kurang)</option>
              </select>
            </div>

            <div className="stock-field-group">
              <label>Jumlah <span className="req-star">*</span></label>
              <input
                type="number"
                min={1}
                value={manualQty}
                onChange={(e) => setManualQty(Math.max(1, Number(e.target.value) || 1))}
                required
                className="stock-form-control"
                placeholder="1"
              />
            </div>

            <div className="stock-field-group">
              <label>Referensi</label>
              <input
                type="text"
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                className="stock-form-control"
                placeholder="No. PO, Kode Retur, dll"
              />
            </div>

            <div className="stock-field-group">
              <label>Catatan</label>
              <textarea
                rows={4}
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                className="stock-form-control stock-textarea"
                placeholder="Keterangan tambahan..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="stock-catat-submit-btn"
            >
              {submitting ? (
                <>
                  <span className="spinner" />
                  <span>Mencatat...</span>
                </>
              ) : (
                <>
                  <Icon name="BarChart3" size={17} />
                  <span>Catat Mutasi</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function formatDotDate(dateStr: unknown) {
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

function formatShortDate(dateStr: unknown) {
  try {
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(String(dateStr)));
  } catch {
    return String(dateStr);
  }
}

function formatOrderStatus(status: string) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    completed: { label: "Selesai", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)" },
    processing: { label: "Diproses", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.3)" },
    shipped: { label: "Dikirim", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)" },
    paid: { label: "Sudah Dibayar", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)", border: "rgba(6, 182, 212, 0.3)" },
    pending: { label: "Menunggu Pembayaran", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" },
    cancelled: { label: "Dibatalkan", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)" },
    expired: { label: "Kadaluarsa", color: "#64748b", bg: "rgba(100, 116, 139, 0.15)", border: "rgba(100, 116, 139, 0.3)" },
  };
  return map[status] || { label: status, color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", border: "rgba(148, 163, 184, 0.3)" };
}

function OrdersView({
  meta,
  result,
  search,
  status = "",
  cancelStatus = "",
  orderId = "",
  initialOrderDetail = null,
}: {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>>; total: number; page: number; perPage: number; pages: number };
  search: string;
  status?: string;
  cancelStatus?: string;
  orderId?: string;
  initialOrderDetail?: {
    order: Record<string, unknown>;
    items: Array<Record<string, unknown>>;
    payment: Record<string, unknown> | null;
  } | null;
}) {
  const router = useRouter();
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<{
    order: Record<string, unknown>;
    items: Array<Record<string, unknown>>;
    payment: Record<string, unknown> | null;
  } | null>(initialOrderDetail);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filter toolbar states
  const [searchVal, setSearchVal] = useState(search);
  const [statusVal, setStatusVal] = useState(status);
  const [cancelStatusVal, setCancelStatusVal] = useState(cancelStatus);

  // Order Details mutation states
  const [editStatus, setEditStatus] = useState(String(selectedOrderDetail?.order?.status || "completed"));
  const [editResi, setEditResi] = useState(String(selectedOrderDetail?.order?.resi_number || ""));
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingResi, setSavingResi] = useState(false);
  const [trackingModal, setTrackingModal] = useState(false);

  useEffect(() => {
    if (selectedOrderDetail?.order) {
      setEditStatus(String(selectedOrderDetail.order.status || "completed"));
      setEditResi(String(selectedOrderDetail.order.resi_number || ""));
    }
  }, [selectedOrderDetail]);

  // Open order details
  async function openOrderDetail(row: Record<string, unknown>) {
    const id = Number(row.id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/resources/orders/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat detail pesanan.");
      setSelectedOrderDetail(data);
      const url = new URL(window.location.href);
      url.searchParams.set("order_id", String(id));
      window.history.pushState({}, "", url.pathname + url.search);
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal membuka detail pesanan.", type: "error" });
    } finally {
      setLoadingDetail(false);
    }
  }

  // Back to orders list
  function backToList() {
    setSelectedOrderDetail(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("order_id");
    window.history.pushState({}, "", url.pathname + url.search);
  }

  // Clear cache handler
  async function handleClearCache() {
    setClearingCache(true);
    try {
      const res = await fetch("/api/admin/cache/clear", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membersihkan cache.");
      setMessage({ text: "Cache sistem berhasil dibersihkan!", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal membersihkan cache.", type: "error" });
    } finally {
      setClearingCache(false);
    }
  }

  // Filter submit handler
  function handleFilterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (statusVal) params.set("status", statusVal);
    if (cancelStatusVal) params.set("cancel_status", cancelStatusVal);
    params.set("page", "1");
    router.push(`/admin/orders?${params.toString()}`);
  }

  // Pagination navigation
  function navigatePage(newPage: number) {
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (statusVal) params.set("status", statusVal);
    if (cancelStatusVal) params.set("cancel_status", cancelStatusVal);
    params.set("page", String(newPage));
    router.push(`/admin/orders?${params.toString()}`);
  }

  // Save Status
  async function handleSaveStatus(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrderDetail?.order?.id) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/resources/orders/${selectedOrderDetail.order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan status.");

      setSelectedOrderDetail((prev) => prev ? {
        ...prev,
        order: { ...prev.order, status: editStatus },
      } : null);

      setMessage({ text: "Status pesanan berhasil diperbarui!", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal memperbarui status.", type: "error" });
    } finally {
      setSavingStatus(false);
    }
  }

  // Save Resi
  async function handleSaveResi(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrderDetail?.order?.id) return;
    setSavingResi(true);
    try {
      const res = await fetch(`/api/admin/resources/orders/${selectedOrderDetail.order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resi_number: editResi.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan nomor resi.");

      setSelectedOrderDetail((prev) => prev ? {
        ...prev,
        order: { ...prev.order, resi_number: editResi.trim() },
      } : null);

      setMessage({ text: "Nomor resi pengiriman berhasil disimpan!", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal menyimpan nomor resi.", type: "error" });
    } finally {
      setSavingResi(false);
    }
  }

  // Invoice Print Handler
  function handleDownloadInvoice() {
    if (!selectedOrderDetail?.order) return;
    const order = selectedOrderDetail.order;
    const items = selectedOrderDetail.items || [];
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const dateFormatted = order.created_at
      ? new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date(String(order.created_at)))
      : "—";

    const itemsHtml = items.map((it, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>
          <strong>${it.product_name || it.name || "Produk"}</strong>
          <div style="font-size:11px;color:#64748b;">Ukuran: ${it.size || "—"} • Warna: ${it.color || "—"}</div>
        </td>
        <td style="text-align:right;">${money.format(Number(it.price || 0))}</td>
        <td style="text-align:center;">${it.quantity}</td>
        <td style="text-align:right;font-weight:bold;">${money.format(Number(it.total || (Number(it.price || 0) * Number(it.quantity || 1))))}</td>
      </tr>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Invoice #${order.invoice_number} - UBSI Cyber Store</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 32px; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo-title { font-size: 24px; font-weight: 800; color: #0b1329; margin: 0 0 4px 0; }
          .tagline { font-size: 13px; color: #64748b; margin: 0; }
          .inv-badge { text-align: right; }
          .inv-title { font-size: 20px; font-weight: 800; color: #e11d48; margin: 0 0 4px 0; }
          .inv-meta { font-size: 12px; color: #475569; }
          .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 12.5px; }
          .info-box strong { color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; border: 1px solid #e2e8f0; }
          td { padding: 10px 12px; border: 1px solid #e2e8f0; vertical-align: middle; }
          .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .totals-table { width: 280px; font-size: 13px; }
          .totals-table td { padding: 6px 10px; border: none; }
          .totals-table .grand { font-size: 16px; font-weight: 800; color: #e11d48; border-top: 2px solid #cbd5e1; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="logo-title">UBSI CYBER STORE</h1>
            <p class="tagline">Official Campus Merchandise & Technology Store</p>
          </div>
          <div class="inv-badge">
            <div class="inv-title">INVOICE</div>
            <div class="inv-meta">No. #${order.invoice_number}</div>
            <div class="inv-meta">Tanggal: ${dateFormatted}</div>
          </div>
        </div>

        <div class="grid-info">
          <div class="info-box">
            <div style="font-weight:700;margin-bottom:6px;color:#0088cc;text-transform:uppercase;font-size:11px;">Informasi Pembeli</div>
            <div><strong>${order.customer_name || "Pelanggan"}</strong></div>
            <div>Email: ${order.customer_email || "—"}</div>
            <div>No. HP: ${order.customer_phone || order.address_phone || "—"}</div>
            <div>Alamat: ${order.customer_address || "—"} ${order.city || ""} ${order.province || ""} ${order.postal_code || ""}</div>
          </div>
          <div class="info-box">
            <div style="font-weight:700;margin-bottom:6px;color:#0088cc;text-transform:uppercase;font-size:11px;">Informasi Pengiriman</div>
            <div>Kurir: <strong>${order.expedition_name || "JNE"} ${order.expedition_service || "Regular"}</strong></div>
            <div>No. Resi: <strong>${order.resi_number || "Belum ada resi"}</strong></div>
            <div>Status: <strong>${order.status}</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:36px;text-align:center;">NO</th>
              <th>PRODUK</th>
              <th style="text-align:right;">HARGA</th>
              <th style="text-align:center;">QTY</th>
              <th style="text-align:right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || '<tr><td colspan="5" style="text-align:center;padding:20px;">Tidak ada item</td></tr>'}
          </tbody>
        </table>

        <div class="totals-wrap">
          <table class="totals-table">
            <tr>
              <td>Subtotal Produk:</td>
              <td style="text-align:right;">${money.format(Number(order.subtotal || 0))}</td>
            </tr>
            <tr>
              <td>Biaya Pengiriman:</td>
              <td style="text-align:right;">${money.format(Number(order.shipping_cost || 0))}</td>
            </tr>
            <tr class="grand">
              <td>Total Bayar:</td>
              <td style="text-align:right;">${money.format(Number(order.grand_total || 0))}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>Terima kasih telah berbelanja di UBSI Cyber Store. Invoice ini merupakan bukti pembayaran resmi yang sah.</p>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  // If viewing Order Details (Screenshot 2)
  if (selectedOrderDetail) {
    const order = selectedOrderDetail.order;
    const items = selectedOrderDetail.items || [];
    const payment = selectedOrderDetail.payment;
    const grandTotal = Number(order.grand_total || 0);
    const subtotal = Number(order.subtotal || 0);
    const shippingCost = Number(order.shipping_cost || 0);
    const serviceFee = Math.max(0, grandTotal - subtotal - shippingCost) || 2000;
    const statusCfg = formatOrderStatus(String(order.status || "completed"));

    return (
      <div className="page-stack order-details-page">
        <SweetAlert
          isOpen={!!message}
          isToast={true}
          type={message?.type || "info"}
          message={message?.text || ""}
          onClose={() => setMessage(null)}
        />

        {/* RajaOngkir Tracking Modal */}
        <SweetAlert
          isOpen={trackingModal}
          type="info"
          title={`Tracking: ${order.expedition_name || "JNE"} (${order.resi_number || "—"})`}
          message={`Status Pengiriman: Dalam Perjalanan (On Process / Delivered). Paket ditangani oleh kurir ${order.expedition_name || "JNE"} dengan nomor resi ${order.resi_number || "—"} tujuan ${order.city || "Jakarta Selatan"}.`}
          confirmText="Tutup"
          onConfirm={() => setTrackingModal(false)}
          onClose={() => setTrackingModal(false)}
        />

        {/* Breadcrumb & Main Heading */}
        <div className="order-breadcrumb-row">
          <div className="order-breadcrumb">
            <Link href="/admin" className="order-crumb-link">
              <span className="order-crumb-home">🏠</span> Pages
            </Link>
            <span className="order-crumb-sep">&gt;</span>
            <button type="button" onClick={backToList} className="order-crumb-link order-crumb-btn">
              Pesanan
            </button>
            <span className="order-crumb-sep">&gt;</span>
            <span className="order-crumb-active">#{String(order.invoice_number)}</span>
          </div>
          <h1 className="order-main-heading">Order Details</h1>
        </div>

        {/* Top Card: Order Details Header & Items */}
        <section className="orders-card order-details-top-card">
          <div className="order-top-header">
            <div>
              <h2 className="order-details-card-title">Order Details</h2>
              <div className="order-details-card-meta">
                Order no. <strong>#{String(order.invoice_number)}</strong> from{" "}
                <strong>{formatDotDate(order.created_at)}</strong> • Code:{" "}
                <strong>{String(order.resi_number || "—")}</strong>
              </div>
            </div>
            <div className="order-top-actions">
              <button
                type="button"
                className="order-invoice-btn"
                onClick={handleDownloadInvoice}
                title="Cetak Invoice Pesanan"
              >
                <Icon name="Printer" size={15} />
                <span>INVOICE</span>
              </button>
              <button
                type="button"
                className="order-back-btn"
                onClick={backToList}
                title="Kembali ke Daftar Pesanan"
              >
                <Icon name="ChevronLeft" size={15} />
                <span>KEMBALI</span>
              </button>
            </div>
          </div>

          {/* Items in order */}
          <div className="order-items-container">
            {items.map((item, idx) => {
              const photoUrl = item.main_photo
                ? `/storage/${String(item.main_photo).replace(/^\/?storage\/?/, "")}`
                : null;
              return (
                <div key={String(item.id || idx)} className="order-item-card">
                  <div className="order-item-left">
                    <div className="order-item-photo-wrap">
                      {photoUrl ? (
                        <Image unoptimized src={photoUrl} width={58} height={58} alt="" className="order-item-img" />
                      ) : (
                        <div className="order-item-photo-placeholder">
                          <Icon name="ShoppingBag" size={24} />
                        </div>
                      )}
                    </div>
                    <div className="order-item-info">
                      <h4 className="order-item-name">{String(item.product_name || item.name || "Produk")}</h4>
                      <div className="order-item-meta">
                        Qty: <strong>{String(item.quantity)}x</strong> • Ukuran:{" "}
                        <strong>{String(item.size || "—")}</strong> • Warna:{" "}
                        <strong>{String(item.color || "—")}</strong>
                      </div>
                      <div className="order-item-status-row">
                        <span
                          className="order-item-status-pill"
                          style={{
                            color: statusCfg.color,
                            backgroundColor: statusCfg.bg,
                            borderColor: statusCfg.border,
                          }}
                        >
                          {statusCfg.label.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="order-item-right">
                    <span className="order-item-price-label">HARGA PRODUK</span>
                    <span className="order-item-price-val">
                      {money.format(Number(item.price || item.total || 0))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Grid Layout (Left 3 cards, Right 2 cards) */}
        <div className="order-bottom-grid">
          {/* Left Column: Track order, Payment details, Billing Information */}
          <div className="order-bottom-left-col">
            {/* 1. Track order */}
            <section className="orders-card order-subcard">
              <div className="order-subcard-header">
                <h3>Track order</h3>
                <span className="order-expedition-badge">
                  {String(order.expedition_name || "JNE")} {String(order.expedition_service || "Regular")}
                </span>
              </div>
              <div className="order-subcard-content">
                {order.resi_number ? (
                  <div className="order-track-box">
                    <div className="order-track-resi-row">
                      <span>No. Resi:</span>
                      <code>{String(order.resi_number)}</code>
                    </div>
                    <p className="order-track-status-text">
                      Paket dalam proses pengiriman oleh kurir {String(order.expedition_name || "ekspedisi")}.
                    </p>
                  </div>
                ) : (
                  <p className="order-muted-note">Belum ada riwayat tracking pengiriman.</p>
                )}
              </div>
            </section>

            {/* 2. Payment details */}
            <section className="orders-card order-subcard">
              <div className="order-subcard-header">
                <h3>Payment details</h3>
              </div>
              <div className="order-subcard-content">
                {payment ? (
                  <div className="order-payment-box">
                    <div className="order-pay-row">
                      <span>Metode Pembayaran:</span>
                      <strong>{String(payment.payment_type || payment.payment_method || "Transfer Bank")}</strong>
                    </div>
                    <div className="order-pay-row">
                      <span>Status:</span>
                      <span className="status-pill success">{String(payment.status || "paid")}</span>
                    </div>
                    {Boolean(payment.transaction_id) && (
                      <div className="order-pay-row">
                        <span>ID Transaksi:</span>
                        <code>{String(payment.transaction_id)}</code>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="order-muted-note">Belum ada transaksi pembayaran.</p>
                )}
              </div>
            </section>

            {/* 3. Billing Information */}
            <section className="orders-card order-subcard">
              <div className="order-subcard-header">
                <h3>Billing Information</h3>
              </div>
              <div className="order-subcard-content">
                <div className="order-billing-box">
                  <h4 className="order-billing-name">{String(order.customer_name || "Pelanggan")}</h4>
                  <div className="order-billing-line">
                    <span>Email:</span>
                    <strong>{String(order.customer_email || "—")}</strong>
                  </div>
                  <div className="order-billing-line">
                    <span>No. HP:</span>
                    <strong>{String(order.customer_phone || order.address_phone || "—")}</strong>
                  </div>
                  <div className="order-billing-line">
                    <span>Alamat:</span>
                    <span>
                      {String(order.customer_address || "—")}
                      {order.district ? `, ${String(order.district)}` : ""}
                      {order.city ? `, ${String(order.city)}` : ""}
                      {order.province ? `, ${String(order.province)}` : ""}
                      {order.postal_code ? ` ${String(order.postal_code)}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary & Ubah Status & Resi */}
          <div className="order-bottom-right-col">
            {/* 4. Order Summary */}
            <section className="orders-card order-subcard">
              <div className="order-subcard-header">
                <h3>Order Summary</h3>
              </div>
              <div className="order-subcard-content">
                <div className="order-summary-table">
                  <div className="order-summary-row">
                    <span>Subtotal Produk:</span>
                    <strong>{money.format(subtotal)}</strong>
                  </div>
                  <div className="order-summary-row">
                    <span>Biaya Pengiriman:</span>
                    <strong>{money.format(shippingCost)}</strong>
                  </div>
                  <div className="order-summary-row">
                    <span>Biaya Layanan:</span>
                    <strong>{money.format(serviceFee)}</strong>
                  </div>
                  <div className="order-summary-row">
                    <span>Ekspedisi:</span>
                    <span>{String(order.expedition_name || "JNE")} {String(order.expedition_service || "Regular")}</span>
                  </div>
                  <div className="order-summary-divider" />
                  <div className="order-summary-row order-summary-grand-total">
                    <span>Total Pembayaran:</span>
                    <strong className="order-grand-total-red">{money.format(grandTotal)}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Ubah Status & Resi */}
            <section className="orders-card order-subcard">
              <div className="order-subcard-header">
                <h3>Ubah Status & Resi</h3>
              </div>
              <div className="order-subcard-content order-edit-controls-form">
                {/* Status Form */}
                <form onSubmit={handleSaveStatus} className="order-form-block">
                  <label className="order-control-label">Status Pesanan</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="order-select-control"
                  >
                    <option value="pending">Menunggu Pembayaran</option>
                    <option value="paid">Menunggu Konfirmasi (Sudah Bayar)</option>
                    <option value="processing">Diproses</option>
                    <option value="shipped">Dikirim</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                    <option value="expired">Kadaluarsa</option>
                  </select>
                  <button
                    type="submit"
                    disabled={savingStatus}
                    className="order-btn-save-status"
                  >
                    {savingStatus ? (
                      <><span className="spinner" /> Menyimpan...</>
                    ) : (
                      <><Icon name="Receipt" size={15} /> SIMPAN STATUS</>
                    )}
                  </button>
                </form>

                {/* Resi Form */}
                <form onSubmit={handleSaveResi} className="order-form-block">
                  <label className="order-control-label">Nomor Resi Pengiriman</label>
                  <input
                    type="text"
                    value={editResi}
                    onChange={(e) => setEditResi(e.target.value)}
                    placeholder="JT... / JNE..."
                    className="order-input-control"
                  />
                  <button
                    type="submit"
                    disabled={savingResi}
                    className="order-btn-save-resi"
                  >
                    {savingResi ? (
                      <><span className="spinner" /> Menyimpan...</>
                    ) : (
                      <><Icon name="FileText" size={15} /> SIMPAN RESI</>
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setTrackingModal(true)}
                  className="order-btn-check-tracking"
                >
                  <Icon name="RefreshCw" size={14} />
                  <span>Cek Resi via RajaOngkir</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Else: Orders List View (Screenshot 1)
  return (
    <div className="page-stack orders-list-page">
      <SweetAlert
        isOpen={!!message}
        isToast={true}
        type={message?.type || "info"}
        message={message?.text || ""}
        onClose={() => setMessage(null)}
      />

      {/* Top Header Row with Outside Bersihkan Cache Button (Same as other menus) */}
      <section className="page-heading orders-page-header">
        <div className="orders-header-title-block">
          <div className="orders-breadcrumb">
            <Link href="/admin" className="orders-crumb-link">
              <span className="orders-crumb-home">🏠</span> Pages
            </Link>
            <span className="orders-crumb-sep">&gt;</span>
            <span className="orders-crumb-active">Pesanan</span>
          </div>
          <h1 className="orders-main-heading">Pesanan</h1>
        </div>
        <div className="header-action-group">
          <button
            type="button"
            className="warning-button clear-cache-btn"
            onClick={handleClearCache}
            disabled={clearingCache}
            title="Bersihkan Cache Sistem"
          >
            <Icon name="RefreshCw" className={clearingCache ? "spin" : ""} size={16} />
            <span>Bersihkan Cache</span>
          </button>
        </div>
      </section>

      {/* Daftar Pesanan Card */}
      <section className="orders-card">
        <div className="orders-card-top-title-row">
          <h2 className="orders-card-heading">Daftar Pesanan</h2>
        </div>

        {/* Filter Toolbar: Search, Filters, and Total Count all in 1 Single Row */}
        <div className="orders-toolbar-unified">
          <form onSubmit={handleFilterSubmit} className="orders-filters-group">
            <div className="orders-search-wrapper">
              <span className="orders-search-dot" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Cari invoice, nama customer..."
                className="orders-search-input"
              />
            </div>

            <select
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value)}
              className="orders-filter-select"
            >
              <option value="">Semua Status</option>
              <option value="pending">Menunggu Pembayaran</option>
              <option value="paid">Menunggu Konfirmasi</option>
              <option value="processing">Diproses</option>
              <option value="shipped">Dikirim</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
              <option value="expired">Kadaluarsa</option>
            </select>

            <select
              value={cancelStatusVal}
              onChange={(e) => setCancelStatusVal(e.target.value)}
              className="orders-filter-select"
            >
              <option value="">Semua Pengajuan Batal</option>
              <option value="has_request">Ada Pengajuan Batal</option>
              <option value="pending">Menunggu Persetujuan</option>
              <option value="approved">Pengajuan Disetujui</option>
              <option value="rejected">Pengajuan Ditolak</option>
              <option value="no_request">Tanpa Pengajuan</option>
            </select>

            <button type="submit" className="orders-red-filter-btn">
              Filter
            </button>
          </form>

          <div className="orders-count-badge-wrap">
            <span className="orders-count-tag">Total: {number.format(result.total)} order</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: "center" }}>NO.</th>
                <th>INVOICE</th>
                <th>CUSTOMER</th>
                <th>EKSPEDISI</th>
                <th>SUBTOTAL</th>
                <th>ONGKIR</th>
                <th>GRAND TOTAL</th>
                <th>STATUS</th>
                <th>RESI</th>
                <th>TANGGAL</th>
                <th style={{ width: 60, textAlign: "center" }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {result.data.length === 0 ? (
                <tr>
                  <td colSpan={11} className="orders-empty-td">
                    Tidak ada data pesanan ditemukan.
                  </td>
                </tr>
              ) : (
                result.data.map((row, index) => {
                  const rowNum = (result.page - 1) * result.perPage + index + 1;
                  const statusInfo = formatOrderStatus(String(row.status || ""));
                  return (
                    <tr key={String(row.id)}>
                      <td style={{ textAlign: "center", color: "#94a3b8" }}>{rowNum}</td>
                      <td>
                        <button
                          type="button"
                          className="orders-inv-link-btn"
                          onClick={() => openOrderDetail(row)}
                          title="Lihat Detail Pesanan"
                        >
                          {String(row.invoice_number)}
                        </button>
                      </td>
                      <td>
                        <div className="orders-cust-name">{String(row.customer_name || "Pelanggan")}</div>
                        <div className="orders-cust-email">{String(row.customer_email || "—")}</div>
                      </td>
                      <td>
                        <div className="orders-exp-name">{String(row.expedition_name || "JNE")}</div>
                        <div className="orders-exp-svc">{String(row.expedition_service || "Regular")}</div>
                      </td>
                      <td>{money.format(Number(row.subtotal || 0))}</td>
                      <td>{money.format(Number(row.shipping_cost || 0))}</td>
                      <td>
                        <strong className="orders-grand-total-text">
                          {money.format(Number(row.grand_total || 0))}
                        </strong>
                      </td>
                      <td>
                        <span
                          className="orders-status-pill"
                          style={{
                            color: statusInfo.color,
                            backgroundColor: statusInfo.bg,
                            borderColor: statusInfo.border,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        {row.resi_number ? (
                          <span className="orders-resi-code">{String(row.resi_number)}</span>
                        ) : (
                          <span className="orders-muted-dash">—</span>
                        )}
                      </td>
                      <td className="orders-date-text">{formatShortDate(row.created_at)}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="orders-action-detail-btn"
                          onClick={() => openOrderDetail(row)}
                          title="Lihat Detail Pesanan"
                        >
                          <Icon name="FileText" size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="orders-pagination-bar">
          <div className="orders-pagination-info">
            Menampilkan <strong>{result.data.length}</strong> dari <strong>{number.format(result.total)}</strong> order
          </div>
          {result.pages > 1 && (
            <div className="orders-pagination-actions">
              <button
                type="button"
                disabled={result.page <= 1}
                onClick={() => navigatePage(result.page - 1)}
                className="orders-pager-btn"
              >
                <Icon name="ChevronLeft" size={15} />
                <span>Sebelumnya</span>
              </button>
              <span className="orders-pager-cur">
                {result.page} / {result.pages}
              </span>
              <button
                type="button"
                disabled={result.page >= result.pages}
                onClick={() => navigatePage(result.page + 1)}
                className="orders-pager-btn"
              >
                <span>Berikutnya</span>
                <Icon name="ChevronRight" size={15} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SupportChatView({
  meta,
  result,
  search,
  chatId = "",
  initialChatDetail = null,
}: {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>>; total: number; page: number; perPage: number; pages: number };
  search: string;
  chatId?: string;
  initialChatDetail?: {
    chat: Record<string, unknown>;
    messages: Array<Record<string, unknown>>;
    customerOrders: Array<Record<string, unknown>>;
  } | null;
}) {
  const router = useRouter();
  const [chatList, setChatList] = useState<Array<Record<string, unknown>>>(result.data);
  const [searchVal, setSearchVal] = useState(search);
  const [selectedChatDetail, setSelectedChatDetail] = useState<{
    chat: Record<string, unknown>;
    messages: Array<Record<string, unknown>>;
    customerOrders: Array<Record<string, unknown>>;
  } | null>(initialChatDetail);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatList(result.data);
  }, [result.data]);

  useEffect(() => {
    if (initialChatDetail) {
      setSelectedChatDetail(initialChatDetail);
    }
  }, [initialChatDetail]);

  useEffect(() => {
    if (selectedChatDetail?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChatDetail?.messages]);

  async function openChat(chat: Record<string, unknown>) {
    const id = Number(chat.id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/resources/chats/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat detail obrolan.");
      setSelectedChatDetail(data);

      setChatList((prev) =>
        prev.map((c) => (Number(c.id) === id ? { ...c, unread_count: 0 } : c))
      );

      const url = new URL(window.location.href);
      url.searchParams.set("chat_id", String(id));
      window.history.pushState({}, "", url.pathname + url.search);
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal membuka obrolan.", type: "error" });
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleClearCache() {
    setClearingCache(true);
    try {
      const res = await fetch("/api/admin/cache/clear", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membersihkan cache.");
      setMessage({ text: "Cache chat & customer berhasil dibersihkan!", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal membersihkan cache.", type: "error" });
    } finally {
      setClearingCache(false);
    }
  }

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (selectedChatDetail?.chat?.id) params.set("chat_id", String(selectedChatDetail.chat.id));
    router.push(`/admin/chats?${params.toString()}`);
  }

  async function handleSendReply(e: FormEvent) {
    e.preventDefault();
    if (!selectedChatDetail?.chat?.id || !replyText.trim() || sendingReply) return;
    const text = replyText.trim();
    const activeId = Number(selectedChatDetail.chat.id);
    setSendingReply(true);

    try {
      const res = await fetch(`/api/admin/resources/chats/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirim pesan balasan.");

      const newMsg = {
        id: Date.now(),
        chat_id: activeId,
        sender_type: "admin",
        sender_id: null,
        sender_name: "Admin",
        message: text,
        is_read: 0,
        created_at: new Date().toISOString(),
      };

      setSelectedChatDetail((prev) =>
        prev
          ? {
              ...prev,
              chat: { ...prev.chat, last_message_at: new Date().toISOString() },
              messages: [...prev.messages, newMsg],
            }
          : null
      );

      setChatList((prev) =>
        prev.map((c) =>
          Number(c.id) === activeId
            ? { ...c, last_message: text, last_message_at: new Date().toISOString() }
            : c
        )
      );

      setReplyText("");
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal mengirim pesan.", type: "error" });
    } finally {
      setSendingReply(false);
    }
  }

  async function handleToggleStatus() {
    if (!selectedChatDetail?.chat?.id || statusUpdating) return;
    const activeId = Number(selectedChatDetail.chat.id);
    const currentStatus = String(selectedChatDetail.chat.status || "open");
    const newStatus = currentStatus === "closed" ? "open" : "closed";
    setStatusUpdating(true);

    try {
      const res = await fetch(`/api/admin/resources/chats/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengubah status obrolan.");

      setSelectedChatDetail((prev) =>
        prev ? { ...prev, chat: { ...prev.chat, status: newStatus } } : null
      );

      setChatList((prev) =>
        prev.map((c) => (Number(c.id) === activeId ? { ...c, status: newStatus } : c))
      );

      setMessage({
        text: newStatus === "closed" ? "Percakapan ditandai selesai." : "Percakapan dibuka kembali.",
        type: "success",
      });
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal mengubah status.", type: "error" });
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleDeleteChat(activeId: number) {
    try {
      const res = await fetch(`/api/admin/resources/chats/${activeId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus percakapan.");

      setChatList((prev) => prev.filter((c) => Number(c.id) !== activeId));
      if (Number(selectedChatDetail?.chat?.id) === activeId) {
        setSelectedChatDetail(null);
        const url = new URL(window.location.href);
        url.searchParams.delete("chat_id");
        window.history.pushState({}, "", url.pathname + url.search);
      }
      setConfirmDeleteModal(null);
      setMessage({ text: "Percakapan berhasil dihapus.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal menghapus percakapan.", type: "error" });
    }
  }

  const activeChat = selectedChatDetail?.chat;
  const messages = selectedChatDetail?.messages || [];
  const customerOrders = selectedChatDetail?.customerOrders || [];

  return (
    <div className="page-stack chat-console-page">
      <SweetAlert
        isOpen={!!message}
        isToast={true}
        type={message?.type || "info"}
        message={message?.text || ""}
        onClose={() => setMessage(null)}
      />

      {confirmDeleteModal && (
        <SweetAlert
          isOpen={true}
          type="warning"
          title="Hapus Percakapan?"
          message="Seluruh riwayat obrolan dengan customer ini akan dihapus secara permanen."
          confirmText="Ya, Hapus"
          cancelText="Batal"
          onConfirm={() => handleDeleteChat(confirmDeleteModal)}
          onClose={() => setConfirmDeleteModal(null)}
        />
      )}

      {/* Top Breadcrumb & Heading matching screenshot */}
      <div className="chat-breadcrumb-row">
        <div className="chat-breadcrumb">
          <Link href="/admin" className="chat-crumb-link">
            <span className="chat-crumb-home">🏠</span> Pages
          </Link>
          <span className="chat-crumb-sep">&gt;</span>
          <span className="chat-crumb-active">Support Chat</span>
        </div>
        <h1 className="chat-main-heading">Support Chat</h1>
      </div>

      {/* 3-Column Grid */}
      <div className="chat-console-grid">
        {/* Column 1: Customer Support */}
        <section className="chat-panel chat-panel-left">
          <div className="chat-card chat-sidebar-card">
            <div className="chat-card-header chat-sidebar-header">
              <div className="chat-title-group">
                <span className="chat-icon-badge">
                  <Icon name="MessageSquare" size={17} />
                </span>
                <h2 className="chat-sidebar-title">Customer Support</h2>
              </div>
              <button
                type="button"
                className="chat-cache-pill-btn"
                onClick={handleClearCache}
                disabled={clearingCache}
                title="Bersihkan Cache Obrolan"
              >
                <Icon name="RefreshCw" size={10} className={clearingCache ? "spin" : ""} />
                <span>Cache</span>
              </button>
            </div>

            {/* Search Customer Input & Button */}
            <form onSubmit={handleSearchSubmit} className="chat-search-row">
              <div className="chat-search-input-box">
                <input
                  type="text"
                  placeholder="Cari customer..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="chat-search-field"
                />
              </div>
              <button type="submit" className="chat-search-submit-btn">
                <Icon name="Search" size={13} />
                <span>Cari</span>
              </button>
            </form>

            {/* Conversations List */}
            <div className="chat-conversation-list-container">
              {chatList.length === 0 ? (
                <div className="chat-sidebar-empty-state">
                  <p>Belum ada chat masuk.</p>
                </div>
              ) : (
                <div className="chat-items-scroll">
                  {chatList.map((c) => {
                    const isSelected = Number(activeChat?.id) === Number(c.id);
                    const unread = Number(c.unread_count || 0);
                    const avatarUrl = c.customer_photo
                      ? `/storage/${String(c.customer_photo).replace(/^\/?storage\/?/, "")}`
                      : null;
                    const initial = String(c.customer_name || "C").charAt(0).toUpperCase();

                    return (
                      <button
                        key={String(c.id)}
                        type="button"
                        onClick={() => openChat(c)}
                        className={`chat-item-card ${isSelected ? "is-selected-chat" : ""}`}
                      >
                        <div className="chat-item-avatar-col">
                          {avatarUrl ? (
                            <Image unoptimized src={avatarUrl} alt={String(c.customer_name || "Customer")} width={42} height={42} className="chat-avatar-round" />
                          ) : (
                            <div className="chat-avatar-fallback">{initial}</div>
                          )}
                          <span className={`chat-online-dot ${c.status === "open" ? "dot-open" : "dot-closed"}`} />
                        </div>

                        <div className="chat-item-main-col">
                          <div className="chat-item-head-line">
                            <h4 className="chat-item-cust-name">{String(c.customer_name || "Customer")}</h4>
                            <span className="chat-item-time">
                              {c.last_message_at
                                ? date.format(new Date(String(c.last_message_at)))
                                : c.created_at
                                ? date.format(new Date(String(c.created_at)))
                                : ""}
                            </span>
                          </div>

                          {Boolean(c.linked_product_name) && (
                            <span className="chat-item-product-tag">
                              🛍️ {String(c.linked_product_name)}
                            </span>
                          )}

                          <p className="chat-item-snippet">
                            {String(c.last_message || c.subject || "Memulai percakapan...")}
                          </p>
                        </div>

                        {unread > 0 && (
                          <div className="chat-item-badge-col">
                            <span className="chat-unread-counter">{unread}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Column 2: Detail Obrolan */}
        <section className="chat-panel chat-panel-center">
          <div className="chat-card chat-conversation-card">
            <div className="chat-card-header chat-conversation-header">
              <h2 className="chat-card-heading">Detail Obrolan</h2>
              {activeChat && (
                <div className="chat-conv-header-actions">
                  <span className={`chat-status-pill ${activeChat.status === "closed" ? "pill-closed" : "pill-open"}`}>
                    <span className="status-dot" />
                    {activeChat.status === "closed" ? "Selesai" : "Aktif"}
                  </span>
                  <button
                    type="button"
                    className="chat-action-btn secondary-btn"
                    onClick={handleToggleStatus}
                    disabled={statusUpdating}
                    title={activeChat.status === "closed" ? "Buka kembali obrolan" : "Tandai obrolan selesai"}
                  >
                    {activeChat.status === "closed" ? "Buka Kembali" : "Tandai Selesai"}
                  </button>
                  <button
                    type="button"
                    className="chat-action-btn danger-btn"
                    onClick={() => setConfirmDeleteModal(Number(activeChat.id))}
                    title="Hapus Percakapan"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              )}
            </div>

            {loadingDetail ? (
              <div className="chat-loading-overlay">
                <span className="spinner" />
                <p>Memuat percakapan...</p>
              </div>
            ) : !activeChat ? (
              /* Welcome / Empty State exactly matching screenshot */
              <div className="chat-welcome-container">
                <div className="chat-welcome-bubble-icon">
                  <Icon name="MessageSquare" size={48} />
                </div>
                <h3 className="chat-welcome-title">Selamat Datang di Customer Support</h3>
                <p className="chat-welcome-subtitle">
                  Pilih salah satu customer di panel kiri untuk mulai membaca dan membalas pesan obrolan secara interaktif.
                </p>
              </div>
            ) : (
              /* Active Chat Message Stream */
              <div className="chat-active-container">
                <div className="chat-messages-scroll-area">
                  {messages.length === 0 ? (
                    <div className="chat-empty-messages-note">
                      <p>Belum ada riwayat pesan dalam obrolan ini.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isAdmin = m.sender_type === "admin";
                      return (
                        <div
                          key={String(m.id)}
                          className={`chat-message-row ${isAdmin ? "row-admin" : "row-customer"}`}
                        >
                          <div className="chat-message-bubble">
                            <div className="chat-message-sender-name">
                              {isAdmin ? "Anda (Admin Support)" : String(m.sender_name || activeChat.customer_name || "Customer")}
                            </div>
                            <div className="chat-message-body">{String(m.message)}</div>
                            <div className="chat-message-timestamp-row">
                              <span className="chat-msg-time">
                                {m.created_at ? date.format(new Date(String(m.created_at))) : ""}
                              </span>
                              {isAdmin && (
                                <span className="chat-msg-delivery">
                                  {m.is_read ? "✓✓ Dibaca" : "✓ Terkirim"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Bar */}
                <form onSubmit={handleSendReply} className="chat-reply-input-bar">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Ketik pesan balasan... (Tekan Enter untuk kirim)"
                    className="chat-reply-input-field"
                    disabled={sendingReply}
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="chat-send-submit-btn"
                  >
                    {sendingReply ? (
                      <span className="spinner" />
                    ) : (
                      <>
                        <Icon name="Send" size={15} />
                        <span>Kirim</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* Column 3: DETAIL INFORMASI */}
        <section className="chat-panel chat-panel-right">
          <div className="chat-card chat-info-card">
            <div className="chat-info-header">
              <h3 className="chat-info-title">DETAIL INFORMASI</h3>
            </div>
            <div className="chat-info-horizontal-divider" />

            {!activeChat ? (
              /* Empty state matching screenshot */
              <div className="chat-info-empty-state">
                <p>Tidak ada percakapan aktif.</p>
              </div>
            ) : (
              /* Active Customer Detail Information */
              <div className="chat-info-body">
                {/* Customer Profile Card */}
                <div className="chat-info-customer-header">
                  <div className="chat-info-avatar-box">
                    {activeChat.customer_photo ? (
                      <Image
                        unoptimized
                        src={`/storage/${String(activeChat.customer_photo).replace(/^\/?storage\/?/, "")}`}
                        alt={String(activeChat.customer_name || "Customer")}
                        width={54}
                        height={54}
                        className="chat-info-avatar-img"
                      />
                    ) : (
                      <div className="chat-info-avatar-fallback">
                        {String(activeChat.customer_name || "C").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="chat-info-customer-text">
                    <h4 className="chat-info-cust-name">{String(activeChat.customer_name || "Customer")}</h4>
                    <span className="chat-info-cust-email">{String(activeChat.customer_email || "—")}</span>
                    <span className="chat-info-cust-phone">{String(activeChat.customer_phone || "—")}</span>
                  </div>
                </div>

                {/* Customer Details Table */}
                <div className="chat-info-meta-group">
                  <div className="chat-info-meta-item">
                    <span className="chat-info-meta-label">Status Akun:</span>
                    <span className="chat-info-meta-value status-tag-active">Aktif</span>
                  </div>
                  <div className="chat-info-meta-item">
                    <span className="chat-info-meta-label">Terdaftar:</span>
                    <span className="chat-info-meta-value">
                      {activeChat.customer_registered_at
                        ? date.format(new Date(String(activeChat.customer_registered_at)))
                        : "—"}
                    </span>
                  </div>
                  <div className="chat-info-meta-item full-width">
                    <span className="chat-info-meta-label">Alamat:</span>
                    <p className="chat-info-meta-address">
                      {String(activeChat.customer_address || "Belum ada alamat tersimpan.")}
                    </p>
                  </div>
                </div>

                {/* Linked Product Card (if available) */}
                {Boolean(activeChat.linked_product_name) && (
                  <div className="chat-info-product-box">
                    <h5 className="chat-info-subheading">PRODUK TERKAIT</h5>
                    <div className="chat-info-product-inner">
                      {Boolean(activeChat.linked_product_photo) && (
                        <Image
                          unoptimized
                          src={`/storage/${String(activeChat.linked_product_photo).replace(/^\/?storage\/?/, "")}`}
                          alt={String(activeChat.linked_product_name)}
                          width={46}
                          height={46}
                          className="chat-info-prod-img"
                        />
                      )}
                      <div className="chat-info-prod-text">
                        <strong className="chat-info-prod-title">{String(activeChat.linked_product_name)}</strong>
                        <span className="chat-info-prod-price">
                          {money.format(Number(activeChat.linked_product_price || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Orders (if available) */}
                <div className="chat-info-orders-box">
                  <h5 className="chat-info-subheading">RIWAYAT PESANAN</h5>
                  {customerOrders.length === 0 ? (
                    <p className="chat-info-no-orders">Belum ada riwayat pesanan dari customer ini.</p>
                  ) : (
                    <div className="chat-info-orders-list">
                      {customerOrders.map((ord) => (
                        <Link
                          key={String(ord.id)}
                          href={`/admin/orders?order_id=${ord.id}`}
                          className="chat-info-order-card"
                        >
                          <div className="chat-info-order-top">
                            <span className="order-inv-code">{String(ord.invoice_number)}</span>
                            <span className={`status-pill status-${ord.status}`}>{String(ord.status)}</span>
                          </div>
                          <div className="chat-info-order-bottom">
                            <span className="order-grand-price">{money.format(Number(ord.grand_total || 0))}</span>
                            <span className="order-date-text">
                              {ord.created_at ? date.format(new Date(String(ord.created_at))) : ""}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function renderStars(rating: number, max = 5) {
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

function ProductReviewsView({
  meta,
  result,
  search,
  status = "",
  reviewId = "",
  initialReviewDetail = null,
}: {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>>; total: number; page: number; perPage: number; pages: number };
  search: string;
  status?: string;
  reviewId?: string;
  initialReviewDetail?: {
    review: Record<string, unknown>;
    otherReviews: Array<Record<string, unknown>>;
    customerOrders: Array<Record<string, unknown>>;
  } | null;
}) {
  const router = useRouter();
  const [reviewList, setReviewList] = useState<Array<Record<string, unknown>>>(result.data);
  const [searchVal, setSearchVal] = useState(search);
  const [statusVal, setStatusVal] = useState(status);
  const [selectedReviewDetail, setSelectedReviewDetail] = useState<{
    review: Record<string, unknown>;
    otherReviews: Array<Record<string, unknown>>;
    customerOrders: Array<Record<string, unknown>>;
  } | null>(initialReviewDetail);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [replyText, setReplyText] = useState(String(initialReviewDetail?.review?.reply || ""));
  const [sendingReply, setSendingReply] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<number | null>(null);

  useEffect(() => {
    setReviewList(result.data);
  }, [result.data]);

  useEffect(() => {
    if (initialReviewDetail) {
      setSelectedReviewDetail(initialReviewDetail);
      setReplyText(String(initialReviewDetail.review?.reply || ""));
    }
  }, [initialReviewDetail]);

  async function openReview(rev: Record<string, unknown>) {
    const id = Number(rev.id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/resources/reviews/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat detail ulasan.");
      setSelectedReviewDetail(data);
      setReplyText(String(data.review?.reply || ""));

      setReviewList((prev) =>
        prev.map((r) => (Number(r.id) === id ? { ...r, is_read: 1 } : r))
      );

      const url = new URL(window.location.href);
      url.searchParams.set("review_id", String(id));
      window.history.pushState({}, "", url.pathname + url.search);
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal membuka ulasan.", type: "error" });
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleClearCache() {
    setClearingCache(true);
    try {
      const res = await fetch("/api/admin/cache/clear", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membersihkan cache.");
      setMessage({ text: "Cache ulasan & produk berhasil dibersihkan!", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal membersihkan cache.", type: "error" });
    } finally {
      setClearingCache(false);
    }
  }

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (statusVal) params.set("status", statusVal);
    if (selectedReviewDetail?.review?.id) params.set("review_id", String(selectedReviewDetail.review.id));
    router.push(`/admin/reviews?${params.toString()}`);
  }

  function handleFilterClick(newStatus: string) {
    setStatusVal(newStatus);
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (newStatus) params.set("status", newStatus);
    if (selectedReviewDetail?.review?.id) params.set("review_id", String(selectedReviewDetail.review.id));
    router.push(`/admin/reviews?${params.toString()}`);
  }

  async function handleSendReply(e: FormEvent) {
    e.preventDefault();
    if (!selectedReviewDetail?.review?.id || !replyText.trim() || sendingReply) return;
    const text = replyText.trim();
    const activeId = Number(selectedReviewDetail.review.id);
    setSendingReply(true);

    try {
      const res = await fetch(`/api/admin/resources/reviews/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: text, is_read: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan balasan ulasan.");

      setSelectedReviewDetail((prev) =>
        prev
          ? {
              ...prev,
              review: { ...prev.review, reply: text, is_read: 1, updated_at: new Date().toISOString() },
            }
          : null
      );

      setReviewList((prev) =>
        prev.map((r) => (Number(r.id) === activeId ? { ...r, reply: text, is_read: 1 } : r))
      );

      setMessage({ text: "Balasan resmi admin berhasil disimpan!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal menyimpan balasan.", type: "error" });
    } finally {
      setSendingReply(false);
    }
  }

  async function handleDeleteReview(activeId: number) {
    try {
      const res = await fetch(`/api/admin/resources/reviews/${activeId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus ulasan.");

      setReviewList((prev) => prev.filter((r) => Number(r.id) !== activeId));
      if (Number(selectedReviewDetail?.review?.id) === activeId) {
        setSelectedReviewDetail(null);
        const url = new URL(window.location.href);
        url.searchParams.delete("review_id");
        window.history.pushState({}, "", url.pathname + url.search);
      }
      setConfirmDeleteModal(null);
      setMessage({ text: "Ulasan berhasil dihapus.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal menghapus ulasan.", type: "error" });
    }
  }

  const activeReview = selectedReviewDetail?.review;
  const otherReviews = selectedReviewDetail?.otherReviews || [];
  const customerOrders = selectedReviewDetail?.customerOrders || [];

  return (
    <div className="page-stack chat-console-page review-console-page">
      <SweetAlert
        isOpen={!!message}
        isToast={true}
        type={message?.type || "info"}
        message={message?.text || ""}
        onClose={() => setMessage(null)}
      />

      {confirmDeleteModal && (
        <SweetAlert
          isOpen={true}
          type="warning"
          title="Hapus Ulasan?"
          message="Ulasan ini beserta balasan admin akan dihapus secara permanen dari sistem."
          confirmText="Ya, Hapus"
          cancelText="Batal"
          onConfirm={() => handleDeleteReview(confirmDeleteModal)}
          onClose={() => setConfirmDeleteModal(null)}
        />
      )}

      {/* Top Breadcrumb & Heading */}
      <div className="chat-breadcrumb-row">
        <div className="chat-breadcrumb">
          <Link href="/admin" className="chat-crumb-link">
            <span className="chat-crumb-home">🏠</span> Pages
          </Link>
          <span className="chat-crumb-sep">&gt;</span>
          <span className="chat-crumb-active">Ulasan Produk</span>
        </div>
        <h1 className="chat-main-heading">Ulasan Produk</h1>
      </div>

      {/* 3-Column Grid */}
      <div className="chat-console-grid">
        {/* Column 1: Daftar Ulasan */}
        <section className="chat-panel chat-panel-left">
          <div className="chat-card chat-sidebar-card">
            <div className="chat-card-header chat-sidebar-header">
              <div className="chat-title-group">
                <span className="chat-icon-badge review-icon-badge">
                  <Icon name="Star" size={17} />
                </span>
                <h2 className="chat-sidebar-title">Daftar Ulasan</h2>
              </div>
              <button
                type="button"
                className="chat-cache-pill-btn"
                onClick={handleClearCache}
                disabled={clearingCache}
                title="Bersihkan Cache Ulasan"
              >
                <Icon name="RefreshCw" size={10} className={clearingCache ? "spin" : ""} />
                <span>Cache</span>
              </button>
            </div>

            {/* Search Input & Button */}
            <form onSubmit={handleSearchSubmit} className="chat-search-row">
              <div className="chat-search-input-box">
                <input
                  type="text"
                  placeholder="Cari ulasan, produk, customer..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="chat-search-field"
                />
              </div>
              <button type="submit" className="chat-search-submit-btn">
                <Icon name="Search" size={13} />
                <span>Cari</span>
              </button>
            </form>

            {/* Filter Pills Row */}
            <div className="review-filter-pills-bar">
              {[
                { label: "Semua", val: "" },
                { label: "★ 5", val: "5" },
                { label: "★ 4", val: "4" },
                { label: "★ 3", val: "3" },
                { label: "Belum Dibalas", val: "unreplied" },
                { label: "Dibalas", val: "replied" },
              ].map((pill) => {
                const isActive = statusVal === pill.val;
                return (
                  <button
                    key={pill.val || "all"}
                    type="button"
                    onClick={() => handleFilterClick(pill.val)}
                    className={`review-filter-pill-btn ${isActive ? "active-pill" : ""}`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Review Items List */}
            <div className="chat-conversation-list-container">
              {reviewList.length === 0 ? (
                <div className="chat-sidebar-empty-state">
                  <p>Belum ada ulasan masuk.</p>
                </div>
              ) : (
                <div className="chat-items-scroll">
                  {reviewList.map((r) => {
                    const isSelected = Number(activeReview?.id) === Number(r.id);
                    const hasReply = Boolean(r.reply);
                    const avatarUrl = r.customer_photo
                      ? `/storage/${String(r.customer_photo).replace(/^\/?storage\/?/, "")}`
                      : null;
                    const initial = String(r.customer_name || "P").charAt(0).toUpperCase();
                    const ratingScore = Number(r.rating || 5);

                    return (
                      <button
                        key={String(r.id)}
                        type="button"
                        onClick={() => openReview(r)}
                        className={`chat-item-card review-item-card ${isSelected ? "is-selected-chat" : ""}`}
                      >
                        <div className="chat-item-avatar-col">
                          {avatarUrl ? (
                            <Image unoptimized src={avatarUrl} alt={String(r.customer_name || "Pelanggan")} width={42} height={42} className="chat-avatar-round" />
                          ) : (
                            <div className="chat-avatar-fallback">{initial}</div>
                          )}
                          <span className={`chat-online-dot ${hasReply ? "dot-closed" : "dot-open"}`} title={hasReply ? "Sudah dibalas" : "Menunggu balasan"} />
                        </div>

                        <div className="chat-item-main-col">
                          <div className="chat-item-head-line">
                            <h4 className="chat-item-cust-name">{String(r.customer_name || "Pelanggan")}</h4>
                            <span className="chat-item-time">
                              {r.created_at ? date.format(new Date(String(r.created_at))) : ""}
                            </span>
                          </div>

                          <div className="review-item-rating-row">
                            <span className="review-stars-snippet">
                              {"★".repeat(Math.min(5, Math.max(1, ratingScore)))}
                              {"☆".repeat(Math.max(0, 5 - ratingScore))}
                            </span>
                            <span className="review-score-label">{ratingScore.toFixed(1)}</span>
                          </div>

                          {Boolean(r.product_name) && (
                            <span className="chat-item-product-tag">
                              🛍️ {String(r.product_name)}
                            </span>
                          )}

                          <p className="chat-item-snippet">
                            {String(r.comment || "Tidak ada komentar.")}
                          </p>

                          <div className="review-item-bottom-meta">
                            <span className={`review-status-tag ${hasReply ? "tag-replied" : "tag-pending"}`}>
                              {hasReply ? "✓ Dibalas" : "⏳ Belum Dibalas"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Column 2: Detail Ulasan & Balasan */}
        <section className="chat-panel chat-panel-center">
          <div className="chat-card chat-conversation-card">
            <div className="chat-card-header chat-conversation-header">
              <h2 className="chat-card-heading">Detail Ulasan</h2>
              {activeReview && (
                <div className="chat-conv-header-actions">
                  <span className={`chat-status-pill ${activeReview.reply ? "pill-closed" : "pill-open"}`}>
                    <span className="status-dot" />
                    {activeReview.reply ? "Dibalas" : "Menunggu Balasan"}
                  </span>
                  <button
                    type="button"
                    className="chat-action-btn danger-btn"
                    onClick={() => setConfirmDeleteModal(Number(activeReview.id))}
                    title="Hapus Ulasan Ini"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              )}
            </div>

            {loadingDetail ? (
              <div className="chat-loading-overlay">
                <span className="spinner" />
                <p>Memuat detail ulasan...</p>
              </div>
            ) : !activeReview ? (
              /* Welcome / Empty State exactly matching screenshot */
              <div className="chat-welcome-container">
                <div className="chat-welcome-bubble-icon review-welcome-icon">
                  <Icon name="Star" size={48} />
                </div>
                <h3 className="chat-welcome-title">Selamat Datang di Ulasan Produk</h3>
                <p className="chat-welcome-subtitle">
                  Pilih salah satu ulasan di panel kiri untuk melihat rincian penilaian pelanggan dan memberikan balasan resmi secara interaktif.
                </p>
              </div>
            ) : (
              /* Active Review Showcase & Reply Area */
              <div className="review-active-container">
                <div className="review-main-scroll-area">
                  {/* Top Review Showcase Card */}
                  <div className="review-detail-card">
                    <div className="review-detail-header">
                      <div className="review-detail-user">
                        <div className="review-user-avatar">
                          {activeReview.customer_photo ? (
                            <Image
                              unoptimized
                              src={`/storage/${String(activeReview.customer_photo).replace(/^\/?storage\/?/, "")}`}
                              alt={String(activeReview.customer_name || "Pelanggan")}
                              width={46}
                              height={46}
                              className="chat-avatar-round"
                            />
                          ) : (
                            <div className="chat-avatar-fallback">
                              {String(activeReview.customer_name || "P").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="review-user-info">
                          <h4 className="review-user-name">{String(activeReview.customer_name || "Pelanggan")}</h4>
                          <div className="review-user-sub">
                            <span className="review-time-text">
                              {activeReview.created_at ? date.format(new Date(String(activeReview.created_at))) : "—"}
                            </span>
                            {Boolean(activeReview.invoice_number) && (
                              <span className="review-invoice-tag">
                                🧾 {String(activeReview.invoice_number)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rating Star Badge */}
                      <div className="review-rating-score-box">
                        <div className="review-score-num">
                          <span className="score-val">{Number(activeReview.rating || 5).toFixed(1)}</span>
                          <span className="score-max">/ 5.0</span>
                        </div>
                        <div className="review-stars-display">
                          {renderStars(Number(activeReview.rating || 5))}
                        </div>
                      </div>
                    </div>

                    {/* Product Tag Bar */}
                    <div className="review-product-tag-bar">
                      <span className="product-tag-pill">
                        🛍️ <strong>{String(activeReview.product_name || "Produk")}</strong>
                      </span>
                    </div>

                    {/* Customer Comment Text */}
                    <div className="review-comment-body">
                      <p className="review-comment-text">&ldquo;{String(activeReview.comment || "Tidak ada komentar teks.")}&rdquo;</p>
                    </div>

                    {/* Attached Photo */}
                    {Boolean(activeReview.photo) && (
                      <div className="review-photo-attachment">
                        <span className="review-photo-label">Foto Ulasan dari Pelanggan:</span>
                        <a
                          href={`/storage/${String(activeReview.photo).replace(/^\/?storage\/?/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="review-photo-link"
                        >
                          <Image
                            unoptimized
                            src={`/storage/${String(activeReview.photo).replace(/^\/?storage\/?/, "")}`}
                            alt="Foto Ulasan"
                            width={160}
                            height={160}
                            className="review-photo-img"
                          />
                          <span className="photo-zoom-hint">🔍 Perbesar Foto</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Admin Reply Card (if already replied) */}
                  {Boolean(activeReview.reply) && (
                    <div className="admin-reply-card">
                      <div className="admin-reply-header">
                        <div className="admin-badge-title">
                          <span className="admin-badge-shield">🛡️</span>
                          <strong>Balasan Resmi Admin Cyber Store</strong>
                        </div>
                        <span className="admin-reply-time">
                          {activeReview.updated_at ? date.format(new Date(String(activeReview.updated_at))) : "Terkirim"}
                        </span>
                      </div>
                      <div className="admin-reply-content">
                        <p>{String(activeReview.reply)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply Form Bar at Bottom */}
                <form onSubmit={handleSendReply} className="review-reply-section">
                  <div className="review-reply-field-header">
                    <label htmlFor="review-reply-input" className="review-reply-label">
                      <Icon name="MessageCircle" size={15} />
                      <span>{activeReview.reply ? "Perbarui Balasan Resmi Admin:" : "Tulis Balasan Resmi Admin:"}</span>
                    </label>
                    {Boolean(activeReview.reply) && (
                      <span className="review-replied-hint">Ulasan ini sudah memiliki balasan. Anda dapat mengubah teks balasan di bawah.</span>
                    )}
                  </div>
                  <div className="review-reply-input-wrapper">
                    <textarea
                      id="review-reply-input"
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Tuliskan ucapan terima kasih atau tanggapan resmi admin untuk ulasan ini..."
                      className="review-reply-textarea"
                      disabled={sendingReply}
                    />
                    <div className="review-reply-actions-row">
                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        className="primary-button review-reply-submit-btn"
                      >
                        {sendingReply ? (
                          <><span className="spinner" /> <span>Menyimpan…</span></>
                        ) : (
                          <>
                            <Icon name="Send" size={14} />
                            <span>{activeReview.reply ? "Perbarui Balasan" : "Kirim Balasan"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* Column 3: DETAIL INFORMASI */}
        <section className="chat-panel chat-panel-right">
          <div className="chat-card chat-info-card">
            <div className="chat-info-header">
              <h3 className="chat-info-title">DETAIL INFORMASI</h3>
            </div>
            <div className="chat-info-horizontal-divider" />

            {!activeReview ? (
              <div className="chat-info-empty-state">
                <p>Tidak ada ulasan aktif.</p>
              </div>
            ) : (
              <div className="chat-info-body">
                {/* Customer Profile Card */}
                <div className="chat-info-customer-header">
                  <div className="chat-info-avatar-box">
                    {activeReview.customer_photo ? (
                      <Image
                        unoptimized
                        src={`/storage/${String(activeReview.customer_photo).replace(/^\/?storage\/?/, "")}`}
                        alt={String(activeReview.customer_name || "Pelanggan")}
                        width={54}
                        height={54}
                        className="chat-info-avatar-img"
                      />
                    ) : (
                      <div className="chat-info-avatar-fallback">
                        {String(activeReview.customer_name || "P").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="chat-info-customer-text">
                    <h4 className="chat-info-cust-name">{String(activeReview.customer_name || "Pelanggan")}</h4>
                    <span className="chat-info-cust-email">{String(activeReview.customer_email || "—")}</span>
                    <span className="chat-info-cust-phone">{String(activeReview.customer_phone || "—")}</span>
                  </div>
                </div>

                {/* Customer Details Table */}
                <div className="chat-info-meta-group">
                  <div className="chat-info-meta-item">
                    <span className="chat-info-meta-label">Status Akun:</span>
                    <span className="chat-info-meta-value status-tag-active">Aktif</span>
                  </div>
                  <div className="chat-info-meta-item">
                    <span className="chat-info-meta-label">Terdaftar:</span>
                    <span className="chat-info-meta-value">
                      {activeReview.customer_registered_at
                        ? date.format(new Date(String(activeReview.customer_registered_at)))
                        : "—"}
                    </span>
                  </div>
                  <div className="chat-info-meta-item full-width">
                    <span className="chat-info-meta-label">Alamat:</span>
                    <p className="chat-info-meta-address">
                      {String(activeReview.customer_address || "Belum ada alamat tersimpan.")}
                    </p>
                  </div>
                </div>

                {/* Linked Product Card */}
                <div className="chat-info-product-box">
                  <h5 className="chat-info-subheading">PRODUK YANG DIULAS</h5>
                  <div className="chat-info-product-inner">
                    {Boolean(activeReview.product_photo) ? (
                      <Image
                        unoptimized
                        src={`/storage/${String(activeReview.product_photo).replace(/^\/?storage\/?/, "")}`}
                        alt={String(activeReview.product_name || "Produk")}
                        width={48}
                        height={48}
                        className="chat-info-prod-img"
                      />
                    ) : (
                      <div className="chat-info-prod-img prod-fallback-img">🛍️</div>
                    )}
                    <div className="chat-info-prod-text">
                      <strong className="chat-info-prod-title">{String(activeReview.product_name || "Produk")}</strong>
                      <div className="review-prod-meta-row">
                        <span className="chat-info-prod-price">
                          {money.format(Number(activeReview.product_price || 0))}
                        </span>
                        <span className="review-prod-stock">
                          Stok: <strong>{String(activeReview.product_stock ?? "—")}</strong>
                        </span>
                      </div>
                      <div className="review-prod-rating-row">
                        <span className="review-star-mini">★</span>
                        <span>{Number(activeReview.product_rating || 0).toFixed(1)}</span>
                        <span className="review-count-mini">({String(activeReview.product_reviews_count || 0)} ulasan)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Related Order Card */}
                {Boolean(activeReview.invoice_number) && (
                  <div className="chat-info-orders-box">
                    <h5 className="chat-info-subheading">PESANAN TERKAIT</h5>
                    <Link
                      href={`/admin/orders?order_id=${activeReview.order_id}`}
                      className="chat-info-order-card"
                    >
                      <div className="chat-info-order-top">
                        <span className="order-inv-code">{String(activeReview.invoice_number)}</span>
                        <span className={`status-pill status-${activeReview.order_status}`}>
                          {String(activeReview.order_status || "selesai")}
                        </span>
                      </div>
                      <div className="chat-info-order-bottom">
                        <span className="order-grand-price">
                          {money.format(Number(activeReview.order_grand_total || 0))}
                        </span>
                        <span className="order-date-text">
                          {activeReview.order_created_at ? date.format(new Date(String(activeReview.order_created_at))) : ""}
                        </span>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Other reviews by customer */}
                <div className="chat-info-orders-box">
                  <h5 className="chat-info-subheading">ULASAN LAIN DARI CUSTOMER</h5>
                  {otherReviews.length === 0 ? (
                    <p className="chat-info-no-orders">Belum ada ulasan lain dari pelanggan ini.</p>
                  ) : (
                    <div className="chat-info-orders-list">
                      {otherReviews.map((rev) => (
                        <button
                          key={String(rev.id)}
                          type="button"
                          onClick={() => openReview(rev)}
                          className="chat-info-order-card other-review-card-btn"
                        >
                          <div className="chat-info-order-top">
                            <span className="order-inv-code other-rev-prod-name">{String(rev.product_name)}</span>
                            <span className="other-rev-stars">
                              ★ {Number(rev.rating || 5)}
                            </span>
                          </div>
                          <p className="other-rev-snippet">{String(rev.comment || "—")}</p>
                          <div className="chat-info-order-bottom">
                            <span className={`other-rev-status ${rev.reply ? "is-replied" : "is-unreplied"}`}>
                              {rev.reply ? "✓ Dibalas" : "Belum Dibalas"}
                            </span>
                            <span className="order-date-text">
                              {rev.created_at ? date.format(new Date(String(rev.created_at))) : ""}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AnnouncementsView({
  meta,
  result,
  search,
  status = "",
}: {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>>; total: number; page: number; perPage: number; pages: number };
  search: string;
  status?: string;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"form" | "delete" | null>(null);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("info");
  const [formTarget, setFormTarget] = useState("all");
  const [formActionUrl, setFormActionUrl] = useState("");
  const [formContent, setFormContent] = useState("");

  const promoCount = result.data.filter((a) => String(a.type || "").toLowerCase() === "promo").length;
  const systemCount = result.data.filter((a) =>
    ["info", "order", "warning", "system"].includes(String(a.type || "").toLowerCase())
  ).length;

  const navigatePage = (p: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("page", String(p));
    router.push(`/admin/announcements?${params.toString()}`);
  };

  const handleClearCache = async () => {
    try {
      setClearingCache(true);
      const res = await fetch("/api/admin/cache/clear", { method: "POST" });
      if (!res.ok) throw new Error("Gagal membersihkan cache.");
      setMessage({ text: "Cache sistem berhasil dibersihkan!", type: "success" });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal membersihkan cache.", type: "error" });
    } finally {
      setClearingCache(false);
    }
  };

  const openCreate = () => {
    setSelected(null);
    setFormTitle("");
    setFormType("info");
    setFormTarget("all");
    setFormActionUrl("");
    setFormContent("");
    setDialog("form");
  };

  const openEdit = (row: Record<string, unknown>) => {
    setSelected(row);
    setFormTitle(String(row.title || ""));
    setFormType(String(row.type || "info"));
    setFormTarget(String(row.target_scope || "all"));
    setFormActionUrl(String(row.action_url || ""));
    setFormContent(String(row.content || ""));
    setDialog("form");
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const endpoint = selected ? `/api/admin/resources/announcements/${selected.id}` : "/api/admin/resources/announcements";
      const method = selected ? "PUT" : "POST";
      const body = {
        title: formTitle,
        type: formType,
        target_scope: formTarget,
        action_url: formActionUrl,
        content: formContent,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan pengumuman.");

      setMessage({
        text: selected ? "Pengumuman berhasil diperbarui!" : "Pengumuman broadcast berhasil terkirim!",
        type: "success",
      });
      setDialog(null);
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Terjadi kesalahan.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/resources/announcements/${selected.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus pengumuman.");

      setMessage({ text: "Pengumuman berhasil dihapus.", type: "success" });
      setDialog(null);
      setSelected(null);
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal menghapus pengumuman.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack announcement-page-wrapper">
      <section className="page-heading resource-heading">
        <div>
          <span className="eyebrow">PAGES &gt; PENGUMUMAN</span>
          <h1>Pengumuman &amp; Push Notification</h1>
          <p>Kirim pengumuman broadcast dan notifikasi push otomatis ke inbox aplikasi pengguna.</p>
        </div>
        <div className="header-action-group">
          <button
            type="button"
            className="warning-button clear-cache-btn"
            onClick={handleClearCache}
            disabled={clearingCache}
            title="Bersihkan Cache Sistem"
          >
            <Icon name="RefreshCw" className={clearingCache ? "spin" : ""} size={16} />
            <span>Bersihkan Cache</span>
          </button>
        </div>
      </section>

      {/* Top 4 Stat Cards */}
      <div className="announcement-stats-grid">
        <div className="announcement-stat-card card-total">
          <div className="stat-card-icon-box icon-blue">
            <Icon name="Volume2" size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{number.format(result.total)}</span>
            <span className="stat-card-label">Total Broadcast Sent</span>
          </div>
        </div>

        <div className="announcement-stat-card card-promo">
          <div className="stat-card-icon-box icon-yellow">
            <Icon name="Tag" size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{number.format(promoCount)}</span>
            <span className="stat-card-label">Promo &amp; Diskon</span>
          </div>
        </div>

        <div className="announcement-stat-card card-system">
          <div className="stat-card-icon-box icon-purple">
            <Icon name="Settings" size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{number.format(systemCount)}</span>
            <span className="stat-card-label">Notifikasi Sistem</span>
          </div>
        </div>

        <div className="announcement-stat-card card-inbox">
          <div className="stat-card-icon-box icon-teal">
            <Icon name="Users" size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-value">{number.format(result.total > 0 ? result.total * 5 : 0)}</span>
            <span className="stat-card-label">Total Penerima Inbox</span>
          </div>
        </div>
      </div>

      {/* Info Broadcast Banner */}
      <div className="announcement-info-banner">
        <div className="info-banner-icon-box">
          <Icon name="Bell" size={22} />
        </div>
        <div className="info-banner-text">
          <strong>Info Broadcast:</strong> Setiap pengumuman yang dikirim akan otomatis muncul di inbox notifikasi aplikasi Flutter pengguna dan memicu Push Notification ke perangkat yang terhubung.
        </div>
      </div>

      {/* Main Riwayat Broadcast Panel */}
      <section className="panel data-panel announcement-main-panel">
        <div className="announcement-panel-header">
          <div className="announcement-panel-title">
            <Icon name="ListFilter" size={19} className="panel-title-icon" />
            <h2>Riwayat Broadcast Notifikasi</h2>
          </div>
          <button type="button" className="primary-button create-broadcast-btn" onClick={openCreate}>
            <Icon name="PlusCircle" size={17} />
            <span>Buat Pengumuman Baru</span>
          </button>
        </div>

        <div className="data-toolbar">
          <form className="search-filter-form" method="GET">
            <div className="search-box">
              <Icon name="Search" size={17} />
              <input name="search" defaultValue={search} placeholder="Cari judul broadcast atau isi pesan…" />
            </div>
            <select name="status" defaultValue={status} className="status-filter-select">
              <option value="">Semua Kategori</option>
              <option value="info">Informasi Umum</option>
              <option value="promo">Promo &amp; Diskon</option>
              <option value="order">Status Pesanan</option>
              <option value="warning">Peringatan Penting</option>
            </select>
            <button type="submit" className="filter-btn">
              <Icon name="Filter" size={15} />
              <span>Filter</span>
            </button>
          </form>
          <div className="record-count"><span>{number.format(result.total)}</span> data</div>
        </div>

        <div className="table-scroller">
          <table className="data-table announcement-table">
            <thead>
              <tr>
                <th style={{ width: "48px", textAlign: "center" }}>NO.</th>
                <th>JUDUL BROADCAST</th>
                <th>ISI PESAN</th>
                <th>KATEGORI</th>
                <th>JANGKAUAN USER</th>
                <th>WAKTU KIRIM</th>
                <th className="action-column">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {result.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="announcement-empty-td">
                    <div className="empty-state announcement-empty-state">
                      <div className="empty-icon-circle">
                        <Icon name="Volume2" size={44} />
                      </div>
                      <strong>Belum Ada Pengumuman</strong>
                      <span>Klik tombol &quot;Buat Pengumuman Baru&quot; di atas untuk mengirimkan broadcast pertama Anda.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                result.data.map((row, rowIndex) => {
                  const rowNumber = (result.page - 1) * result.perPage + rowIndex + 1;
                  const categoryType = String(row.type || "info").toLowerCase();
                  const badgeClass =
                    categoryType === "promo"
                      ? "status-promo"
                      : categoryType === "warning"
                      ? "status-warning"
                      : categoryType === "order"
                      ? "status-order"
                      : "status-info";
                  const categoryLabel =
                    categoryType === "promo"
                      ? "Promo & Diskon"
                      : categoryType === "warning"
                      ? "Peringatan"
                      : categoryType === "order"
                      ? "Status Pesanan"
                      : "Informasi Umum";

                  return (
                    <tr key={String(row.id)}>
                      <td style={{ textAlign: "center", color: "var(--muted)", fontWeight: 500, width: "48px" }}>
                        {rowNumber}
                      </td>
                      <td style={{ fontWeight: 650, color: "var(--text)" }}>
                        {String(row.title || "-")}
                      </td>
                      <td className="content-preview-cell" title={String(row.content || "")}>
                        {truncate(String(row.content || ""), 70)}
                      </td>
                      <td>
                        <span className={`status-pill ${badgeClass}`}>
                          <span />
                          {categoryLabel}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill neutral">
                          <Icon name="Users" size={12} />
                          Semua Pelanggan
                        </span>
                      </td>
                      <td className="date-cell">
                        {row.created_at ? date.format(new Date(String(row.created_at))) : "-"}
                      </td>
                      <td className="row-actions">
                        <button className="icon-button edit-action-btn" title="Edit Pengumuman" onClick={() => openEdit(row)}>
                          <Icon name="Pencil" size={16} />
                        </button>
                        <button className="icon-button danger delete-action-btn" title="Hapus Pengumuman" onClick={() => { setSelected(row); setDialog("delete"); }}>
                          <Icon name="Trash2" size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {result.pages > 1 && (
          <div className="pagination-bar">
            <span>
              Halaman {result.page} dari {result.pages} ({result.total} data)
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                disabled={result.page <= 1}
                onClick={() => navigatePage(result.page - 1)}
                className="stock-pager-btn"
              >
                <Icon name="ChevronLeft" size={15} />
                <span>Sebelumnya</span>
              </button>
              <button
                type="button"
                disabled={result.page >= result.pages}
                onClick={() => navigatePage(result.page + 1)}
                className="stock-pager-btn"
              >
                <span>Berikutnya</span>
                <Icon name="ChevronRight" size={15} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Floating SweetAlert Toast */}
      <SweetAlert
        isOpen={!!message}
        isToast={true}
        type={message?.type || "info"}
        message={message?.text || ""}
        onClose={() => setMessage(null)}
      />

      {/* SweetAlert Delete Modal */}
      <SweetAlert
        isOpen={dialog === "delete"}
        type="warning"
        title="Hapus Pengumuman?"
        message={`Pengumuman "${String(selected?.title || "")}" akan dihapus secara permanen dari histori. Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Pengumuman"
        cancelText="Batal"
        onConfirm={handleDelete}
        onClose={() => setDialog(null)}
        loading={saving}
      />

      {/* Form Modal for Creating / Editing Announcement */}
      {dialog === "form" && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDialog(null);
          }}
        >
          <div className="dialog-window" style={{ maxWidth: 640 }}>
            <div className="dialog-titlebar">
              <span className="dialog-icon">📢</span>
              <div>
                <strong>{selected ? "Edit Pengumuman Broadcast" : "Buat Pengumuman Baru"}</strong>
                <small>Pengumuman ini akan dikirim ke inbox dan notifikasi push aplikasi pengguna.</small>
              </div>
              <button type="button" className="icon-button" onClick={() => setDialog(null)}>
                <Icon name="X" size={17} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="dialog-content">
                <div className="form-grid">
                  <label className="field-label span-two">
                    <span>
                      Judul Broadcast <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Contoh: Pengumuman Pengambilan Ukuran Jaket MABA 2026"
                    />
                  </label>

                  <label className="field-label">
                    <span>
                      Kategori Notifikasi <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <select value={formType} onChange={(e) => setFormType(e.target.value)}>
                      <option value="info">Informasi Umum</option>
                      <option value="promo">Promo &amp; Diskon</option>
                      <option value="order">Status Pesanan</option>
                      <option value="warning">Peringatan Penting</option>
                    </select>
                  </label>

                  <label className="field-label">
                    <span>Jangkauan Penerima</span>
                    <select value={formTarget} onChange={(e) => setFormTarget(e.target.value)}>
                      <option value="all">Semua Pelanggan (Broadcast)</option>
                      <option value="active">Pelanggan Aktif Saja</option>
                    </select>
                  </label>

                  <label className="field-label span-two">
                    <span>Tautan / Link Aksi (Opsional)</span>
                    <input
                      type="text"
                      value={formActionUrl}
                      onChange={(e) => setFormActionUrl(e.target.value)}
                      placeholder="Contoh: /products atau https://ubsi.ac.id"
                    />
                  </label>

                  <label className="field-label span-two">
                    <span>
                      Isi Pesan Broadcast <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <textarea
                      required
                      rows={4}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Tuliskan isi pengumuman atau informasi lengkap di sini..."
                    />
                  </label>
                </div>
              </div>

              <div className="dialog-actions">
                <button type="button" className="secondary-button" onClick={() => setDialog(null)}>
                  Batal
                </button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? "Menyimpan…" : selected ? "Simpan Perubahan" : "🚀 Kirim Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function ResourceClient({
  meta,
  result,
  search,
  status = "",
  productId = "",
  typeFilter = "",
  cancelStatus = "",
  orderId = "",
  initialOrderDetail = null,
  chatId = "",
  initialChatDetail = null,
  reviewId = "",
  initialReviewDetail = null,
}: Props) {
  const router = useRouter();
  if (meta.key === "stock-movements") {
    return (
      <StockMovementsView
        meta={meta}
        result={result}
        search={search}
        productId={productId}
        typeFilter={typeFilter}
      />
    );
  }
  if (meta.key === "orders") {
    return (
      <OrdersView
        meta={meta}
        result={result}
        search={search}
        status={status}
        cancelStatus={cancelStatus}
        orderId={orderId}
        initialOrderDetail={initialOrderDetail}
      />
    );
  }
  if (meta.key === "chats") {
    return (
      <SupportChatView
        meta={meta}
        result={result}
        search={search}
        chatId={chatId}
        initialChatDetail={initialChatDetail}
      />
    );
  }
  if (meta.key === "reviews") {
    return (
      <ProductReviewsView
        meta={meta}
        result={result}
        search={search}
        status={status}
        reviewId={reviewId}
        initialReviewDetail={initialReviewDetail}
      />
    );
  }
  if (meta.key === "announcements") {
    return (
      <AnnouncementsView
        meta={meta}
        result={result}
        search={search}
        status={status}
      />
    );
  }
  const [dialog, setDialog] = useState<"form" | "delete" | null>(null);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [hasSizes, setHasSizes] = useState(false);
  const [eventMaba, setEventMaba] = useState(false);

  // MABA color states for live swatches preview
  const [mabaGanjil, setMabaGanjil] = useState("Putih");
  const [mabaGenap, setMabaGenap] = useState("Biru");

  // Gallery image states for product edit
  const [deletedGalleryIds, setDeletedGalleryIds] = useState<number[]>([]);
  const [removeSizeChart, setRemoveSizeChart] = useState(false);

  // Inline MABA color state for quick table changes
  const [inlineMabaColors, setInlineMabaColors] = useState<Record<number, { ganjil?: string; genap?: string }>>({});
  const [updatingMabaKey, setUpdatingMabaKey] = useState<string | null>(null);

  // Custom color palette modal state ("More...")
  const [colorPickerModal, setColorPickerModal] = useState<{
    isOpen: boolean;
    productId?: number;
    field: "maba_color_ganjil" | "maba_color_genap" | "product_color";
    initialColorName: string;
    initialHex: string;
    onApply?: (colorName: string, hex: string) => void;
  } | null>(null);
  const [customPaletteName, setCustomPaletteName] = useState("");
  const [customPaletteHex, setCustomPaletteHex] = useState("#dc2626");

  function openCustomColorPicker(
    field: "maba_color_ganjil" | "maba_color_genap" | "product_color",
    currentColor: string,
    productId?: number,
    onApply?: (colorName: string, hex: string) => void
  ) {
    const hex = resolveColorHex(currentColor);
    setCustomPaletteName(currentColor && currentColor !== "__MORE__" ? currentColor : "");
    setCustomPaletteHex(hex || "#dc2626");
    setColorPickerModal({
      isOpen: true,
      productId,
      field,
      initialColorName: currentColor,
      initialHex: hex,
      onApply,
    });
  }

  function handleApplyCustomColor() {
    if (!colorPickerModal) return;
    const finalName = customPaletteName.trim() || `Warna ${customPaletteHex.toUpperCase()}`;

    if (colorPickerModal.onApply) {
      colorPickerModal.onApply(finalName, customPaletteHex);
    } else if (colorPickerModal.productId) {
      handleQuickMabaColorChange(colorPickerModal.productId, colorPickerModal.field as any, finalName);
    } else {
      if (colorPickerModal.field === "maba_color_ganjil") {
        setMabaGanjil(finalName);
      } else if (colorPickerModal.field === "maba_color_genap") {
        setMabaGenap(finalName);
      }
    }
    setColorPickerModal(null);
  }

  async function handleQuickMabaColorChange(
    productId: number,
    field: "maba_color_ganjil" | "maba_color_genap",
    newColor: string
  ) {
    const isGanjil = field === "maba_color_ganjil";
    const shortField = isGanjil ? "ganjil" : "genap";
    const fieldLabel = isGanjil ? "NIM Ganjil" : "NIM Genap";

    // Optimistic update
    setInlineMabaColors((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [shortField]: newColor,
      },
    }));

    const updateKey = `${productId}-${field}`;
    setUpdatingMabaKey(updateKey);

    try {
      const response = await fetch(`/api/admin/resources/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newColor }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal mengubah warna MABA.");

      setMessage({
        text: `Warna MABA ${fieldLabel} berhasil diubah menjadi ${newColor}.`,
        type: "success",
      });
      router.refresh();
    } catch (reason) {
      setInlineMabaColors((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
      setMessage({
        text: reason instanceof Error ? reason.message : "Gagal mengubah warna MABA.",
        type: "error",
      });
    } finally {
      setUpdatingMabaKey(null);
    }
  }

  async function handleClearCache() {
    setClearingCache(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/cache/clear", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal membersihkan cache.");
      setMessage({ text: data.message || "Cache sistem berhasil dibersihkan.", type: "success" });
      router.refresh();
    } catch (reason) {
      setMessage({ text: reason instanceof Error ? reason.message : "Gagal membersihkan cache.", type: "error" });
    } finally {
      setClearingCache(false);
    }
  }

  async function toggleStatus(row: Record<string, unknown>) {
    const currentIsActive = isEnabled(row.is_active);
    const nextIsActive = !currentIsActive;
    const id = row[meta.primaryKey];
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/resources/${meta.key}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextIsActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal mengubah status.");
      setMessage({
        text: `Status ${meta.singular.toLowerCase()} berhasil diubah menjadi ${nextIsActive ? "Aktif" : "Nonaktif"}.`,
        type: "success",
      });
      router.refresh();
    } catch (reason) {
      setMessage({ text: reason instanceof Error ? reason.message : "Gagal mengubah status.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setSelected(null);
    setHasSizes(false);
    setEventMaba(false);
    setMabaGanjil("Putih");
    setMabaGenap("Biru");
    setDeletedGalleryIds([]);
    setRemoveSizeChart(false);
    setDialog("form");
    setMessage(null);
  }

  function openEdit(row: Record<string, unknown>) {
    const withFormFlags = { ...row, has_sizes: hasSizeOptions(row.sizes) };
    setSelected(withFormFlags);
    setHasSizes(hasSizeOptions(row.sizes));
    setEventMaba(isEnabled(row.is_event_maba));
    setMabaGanjil(String(row.maba_color_ganjil || "Putih"));
    setMabaGenap(String(row.maba_color_genap || "Biru"));
    setDeletedGalleryIds([]);
    setRemoveSizeChart(false);
    setDialog("form");
    setMessage(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    for (const field of meta.fields.filter((item) => item.kind === "boolean")) {
      if (!form.has(field.key)) form.set(field.key, "false");
    }
    if (meta.key === "products") {
      if (deletedGalleryIds.length > 0) {
        form.set("delete_gallery_image_ids", deletedGalleryIds.join(","));
      }
      if (removeSizeChart) {
        form.set("remove_size_chart", "true");
      }
    }
    try {
      const endpoint = selected ? `/api/admin/resources/${meta.key}/${selected[meta.primaryKey]}` : `/api/admin/resources/${meta.key}`;
      const response = await fetch(endpoint, { method: selected ? "PATCH" : "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Perubahan gagal disimpan.");
      setDialog(null);
      setMessage({ text: data.message || "Perubahan berhasil disimpan.", type: "success" });
      router.refresh();
    } catch (reason) {
      setMessage({ text: reason instanceof Error ? reason.message : "Perubahan gagal disimpan.", type: "error" });
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/resources/${meta.key}/${selected[meta.primaryKey]}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Data gagal dihapus.");
      setDialog(null); setMessage({ text: data.message, type: "success" }); router.refresh();
    } catch (reason) { setDialog(null); setMessage({ text: reason instanceof Error ? reason.message : "Data gagal dihapus.", type: "error" }); }
    finally { setSaving(false); }
  }

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("page", String(page));
    return `/admin/${meta.key}?${params}`;
  };

  const fields = meta.fields.filter((field) => {
    if (meta.key !== "products") return true;
    if (["sizes", "size_chart_file"].includes(field.key)) return hasSizes;
    if (["maba_color_ganjil", "maba_color_genap"].includes(field.key)) return eventMaba;
    return true;
  });

  const existingGalleryImages = (Array.isArray(selected?.images) ? selected.images : []) as Array<{ id: number; image: string; image_url: string }>;

  const colorPickerModalElement = colorPickerModal?.isOpen ? (
    <div
      className="dialog-backdrop"
      role="presentation"
      style={{ zIndex: 999999 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setColorPickerModal(null);
      }}
    >
      <div className="dialog-window custom-color-modal" style={{ maxWidth: 490 }}>
        <div className="dialog-titlebar">
          <span className="dialog-icon">🎨</span>
          <div>
            <strong>
              {colorPickerModal.field === "product_color"
                ? "Pilih Palet Warna Varian Produk"
                : "Pilih Palet Warna Seragam MABA"}
            </strong>
            <small>
              {colorPickerModal.field === "product_color"
                ? "Pilih warna hex dan tentukan nama untuk varian produk yang belum ada di daftar template"
                : `Aturan warna seragam untuk ${
                    colorPickerModal.field === "maba_color_ganjil"
                      ? "NIM Ganjil (1, 3, 5, 7, 9)"
                      : "NIM Genap (0, 2, 4, 6, 8)"
                  }`}
            </small>
          </div>
          <button type="button" className="icon-button" onClick={() => setColorPickerModal(null)}>
            <Icon name="X" size={17} />
          </button>
        </div>

        <div className="dialog-content" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="field-label" style={{ marginBottom: 6 }}>
              <span>Pilih Palet Hex & Tentukan Nama Warna</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="color"
                className="color-hex-picker"
                value={customPaletteHex}
                onChange={(e) => {
                  setCustomPaletteHex(e.target.value);
                  const found = COLOR_PALETTE_TEMPLATES.find((t) => t.hex.toLowerCase() === e.target.value.toLowerCase());
                  if (found) setCustomPaletteName(found.name);
                }}
                title="Klik untuk membuka palet spektrum warna native & eyedropper"
              />
              <input
                className="color-name-input"
                style={{ width: "95px", flex: "0 0 95px", fontFamily: "monospace", textTransform: "uppercase" }}
                placeholder="#000000"
                maxLength={7}
                value={customPaletteHex}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomPaletteHex(val);
                  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
                    const found = COLOR_PALETTE_TEMPLATES.find((t) => t.hex.toLowerCase() === val.toLowerCase());
                    if (found) setCustomPaletteName(found.name);
                  }
                }}
                title="Kode Hex Warna (#RRGGBB)"
              />
              <input
                className="color-name-input"
                style={{ flex: 1 }}
                placeholder="Nama Warna (Cth: Kuning Emas, Tosca, Mint, dsb.)"
                value={customPaletteName}
                onChange={(e) => setCustomPaletteName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600, display: "block", marginBottom: 7 }}>
              Template Palet Populer (Klik untuk memilih cepat):
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 130, overflowY: "auto", padding: "2px" }}>
              {COLOR_PALETTE_TEMPLATES.map((t) => {
                const isSelected = customPaletteHex.toLowerCase() === t.hex.toLowerCase();
                return (
                  <button
                    type="button"
                    key={t.name}
                    className={`quick-pill-btn ${isSelected ? "is-selected-pill" : ""}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      border: isSelected ? "1.5px solid var(--accent, #0088cc)" : undefined,
                      backgroundColor: isSelected ? "var(--surface-hover)" : undefined,
                    }}
                    onClick={() => {
                      setCustomPaletteName(t.name);
                      setCustomPaletteHex(t.hex);
                    }}
                  >
                    <span className="color-swatch-dot" style={{ backgroundColor: t.hex }} />
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-hover)",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: customPaletteHex,
                border: customPaletteHex.toUpperCase() === "#FFFFFF" ? "1px solid #d1d5db" : "1px solid rgba(0,0,0,0.25)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                {customPaletteName.trim() || `Warna ${customPaletteHex.toUpperCase()}`}
              </div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)" }}>
                {customPaletteHex}
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 4,
                  backgroundColor: customPaletteHex,
                  color:
                    customPaletteHex.toUpperCase() === "#FFFFFF" ||
                    customPaletteHex.toUpperCase() === "#FFF" ||
                    customPaletteHex.toUpperCase() === "#FFFF00" ||
                    customPaletteHex.toUpperCase() === "#FFD700"
                      ? "#111827"
                      : "#FFFFFF",
                  fontWeight: 600,
                }}
              >
                Pratinjau
              </span>
            </div>
          </div>
        </div>

        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={() => setColorPickerModal(null)}>
            Batal
          </button>
          <button
            type="button"
            className="primary-button"
            style={{ background: "#10b981", borderColor: "#059669" }}
            onClick={handleApplyCustomColor}
          >
            {colorPickerModal.field === "product_color" ? "✓ Tambahkan ke Daftar Warna" : "✓ Terapkan & Simpan"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (dialog === "form" && meta.key === "products") {
    return (
      <div className="page-stack product-editor-page">
        <form onSubmit={submit} className="product-page-form">
          <section className="page-heading editor-page-heading">
            <div className="editor-title-row">
              <span className="editor-title-icon">📷</span>
              <h1 className="editor-page-title">
                {selected ? `Edit: ${String(selected.name || "")}` : "Tambah Produk Baru"}
              </h1>
            </div>
            <div className="header-action-buttons">
              <button type="button" className="secondary-button back-link-btn" onClick={() => setDialog(null)}>
                <Icon name="ChevronLeft" size={17} />
                Kembali
              </button>
            </div>
          </section>

          {message?.type === "error" && (
            <div className="toast-message error">
              <Icon name="AlertTriangle" size={18} />
              <span>{message.text}</span>
              <button type="button" onClick={() => setMessage(null)}><Icon name="X" size={16} /></button>
            </div>
          )}

          <ProductFormSections
            fields={fields}
            row={selected}
            hasSizes={hasSizes}
            setHasSizes={setHasSizes}
            eventMaba={eventMaba}
            setEventMaba={setEventMaba}
            mabaGanjil={mabaGanjil}
            setMabaGanjil={setMabaGanjil}
            mabaGenap={mabaGenap}
            setMabaGenap={setMabaGenap}
            existingGalleryImages={existingGalleryImages}
            deletedGalleryIds={deletedGalleryIds}
            setDeletedGalleryIds={setDeletedGalleryIds}
            removeSizeChart={removeSizeChart}
            setRemoveSizeChart={setRemoveSizeChart}
            onCancel={() => setDialog(null)}
            saving={saving}
            onOpenCustomColorPicker={openCustomColorPicker}
          />
        </form>
        {colorPickerModalElement}
      </div>
    );
  }

  const hasActiveField = ("is_active" in (result.data[0] || {})) || meta.fields.some((f) => f.key === "is_active") || ["products", "categories", "users", "expeditions"].includes(meta.key);

  return (
    <div className="page-stack">
      <section className="page-heading resource-heading">
        <div><span className="eyebrow">MANAJEMEN</span><h1>{meta.label}</h1><p>{meta.description}</p></div>
        <div className="header-action-group">
          <button type="button" className="warning-button clear-cache-btn" onClick={handleClearCache} disabled={clearingCache} title="Bersihkan Cache Sistem">
            <Icon name="RefreshCw" className={clearingCache ? "spin" : ""} size={16} />
            <span>Bersihkan Cache</span>
          </button>
          {meta.canCreate && <button className="primary-button" onClick={openCreate}><Icon name="Plus" size={17} />Tambah {meta.singular}</button>}
        </div>
      </section>

      {/* Top-Right SweetAlert Floating Toast */}
      <SweetAlert
        isOpen={!!message}
        isToast={true}
        type={message?.type || "info"}
        message={message?.text || ""}
        onClose={() => setMessage(null)}
      />

      {/* SweetAlert Delete Confirmation Modal */}
      <SweetAlert
        isOpen={dialog === "delete"}
        type="warning"
        title={`${meta.deleteLabel || "Hapus"} ${meta.singular}?`}
        message={
          typeof meta.deleteDescription === "string"
            ? meta.deleteDescription
            : `Data "${String(selected?.name || selected?.title || selected?.invoice_number || selected?.[meta.primaryKey])}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText={`Ya, ${meta.deleteLabel || "Hapus"}`}
        cancelText="Batal"
        onConfirm={remove}
        onClose={() => setDialog(null)}
        loading={saving}
      />

      {/* Custom MABA Color Palette Modal ("More...") */}
      {colorPickerModalElement}

      <section className="panel data-panel">
        <div className="data-toolbar">
          <form className="search-filter-form" method="GET">
            <div className="search-box">
              <Icon name="Search" size={17} />
              <input name="search" defaultValue={search} placeholder={`Cari ${meta.label.toLowerCase()}…`} />
            </div>
            <select name="status" defaultValue={status} className="status-filter-select">
              <option value="">Semua Status</option>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
            <button type="submit" className="filter-btn">
              <Icon name="Filter" size={15} />
              <span>Filter</span>
            </button>
          </form>
          <div className="record-count"><span>{number.format(result.total)}</span> data</div>
        </div>
        <div className="table-scroller">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "48px", textAlign: "center" }}>NO.</th>
                {meta.columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                {meta.key === "products" && <th>Rule Event MABA</th>}
                {(meta.canEdit || meta.canDelete) && <th className="action-column">AKSI</th>}
              </tr>
            </thead>
            <tbody>
              {result.data.map((row, rowIndex) => {
                const rowNumber = (result.page - 1) * result.perPage + rowIndex + 1;
                const photoUrl = getRowPhotoUrl(row);

                return (
                  <tr key={String(row[meta.primaryKey])}>
                    <td style={{ textAlign: "center", color: "var(--muted)", fontWeight: 500, width: "48px" }}>
                      {rowNumber}
                    </td>
                    {meta.columns.map((column, index) => (
                      <td key={column.key}>
                        {index === 0 ? (
                          <span className="cell-with-thumb">
                            {photoUrl ? (
                              <Image
                                unoptimized
                                width={36}
                                height={36}
                                src={photoUrl}
                                alt=""
                                style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
                              />
                            ) : (
                              <span
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 6,
                                  background: "var(--surface-hover)",
                                  border: "1px solid var(--border)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "var(--muted)",
                                  flexShrink: 0,
                                }}
                              >
                                <Icon name="Package" size={18} />
                              </span>
                            )}
                            <span>{display(row[column.key], column.format)}</span>
                          </span>
                        ) : (
                          display(row[column.key], column.format)
                        )}
                      </td>
                    ))}
                  {meta.key === "products" && (
                    <td>
                      {isEnabled(row.is_event_maba) ? (
                        (() => {
                          const prodId = Number(row[meta.primaryKey]);
                          const currentGanjil =
                            inlineMabaColors[prodId]?.ganjil !== undefined
                              ? inlineMabaColors[prodId].ganjil
                              : String(row.maba_color_ganjil || "Putih");
                          const currentGenap =
                            inlineMabaColors[prodId]?.genap !== undefined
                              ? inlineMabaColors[prodId].genap
                              : String(row.maba_color_genap || "Biru");

                          const hexGanjil = mabaHexMap[currentGanjil] || resolveColorHex(currentGanjil);
                          const hexGenap = mabaHexMap[currentGenap] || resolveColorHex(currentGenap);
                          const isWhiteGanjil = hexGanjil.toUpperCase() === "#FFFFFF" || hexGanjil.toUpperCase() === "#FFF";
                          const isWhiteGenap = hexGenap.toUpperCase() === "#FFFFFF" || hexGenap.toUpperCase() === "#FFF";

                          const isUpdatingGanjil = updatingMabaKey === `${prodId}-maba_color_ganjil`;
                          const isUpdatingGenap = updatingMabaKey === `${prodId}-maba_color_genap`;

                          return (
                            <div className="maba-inline-editor">
                              <div
                                className={`maba-pill-select-wrapper ${isUpdatingGanjil ? "is-updating" : ""}`}
                                title="Klik untuk ubah warna seragam NIM Ganjil"
                              >
                                <span
                                  className="color-swatch-dot"
                                  style={{
                                    backgroundColor: hexGanjil,
                                    border: isWhiteGanjil ? "1px solid #d1d5db" : "1px solid rgba(0,0,0,0.25)",
                                  }}
                                />
                                <span className="maba-pill-prefix">Ganjil:</span>
                                <select
                                  className="maba-inline-select"
                                  value={currentGanjil}
                                  disabled={isUpdatingGanjil}
                                  onChange={(e) => {
                                    if (e.target.value === "__MORE__") {
                                      openCustomColorPicker("maba_color_ganjil", currentGanjil, prodId);
                                    } else {
                                      handleQuickMabaColorChange(prodId, "maba_color_ganjil", e.target.value);
                                    }
                                  }}
                                >
                                  {!mabaColorOptions.some((opt) => opt.value.toLowerCase() === currentGanjil.toLowerCase()) && (
                                    <option value={currentGanjil}>{currentGanjil} (Kustom)</option>
                                  )}
                                  {mabaColorOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.value}
                                    </option>
                                  ))}
                                  <option value="__MORE__">🎨 + More (Palet Warna)...</option>
                                </select>
                                <span className="maba-select-arrow">▾</span>
                              </div>

                              <div
                                className={`maba-pill-select-wrapper ${isUpdatingGenap ? "is-updating" : ""}`}
                                title="Klik untuk ubah warna seragam NIM Genap"
                              >
                                <span
                                  className="color-swatch-dot"
                                  style={{
                                    backgroundColor: hexGenap,
                                    border: isWhiteGenap ? "1px solid #d1d5db" : "1px solid rgba(0,0,0,0.25)",
                                  }}
                                />
                                <span className="maba-pill-prefix">Genap:</span>
                                <select
                                  className="maba-inline-select"
                                  value={currentGenap}
                                  disabled={isUpdatingGenap}
                                  onChange={(e) => {
                                    if (e.target.value === "__MORE__") {
                                      openCustomColorPicker("maba_color_genap", currentGenap, prodId);
                                    } else {
                                      handleQuickMabaColorChange(prodId, "maba_color_genap", e.target.value);
                                    }
                                  }}
                                >
                                  {!mabaColorOptions.some((opt) => opt.value.toLowerCase() === currentGenap.toLowerCase()) && (
                                    <option value={currentGenap}>{currentGenap} (Kustom)</option>
                                  )}
                                  {mabaColorOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.value}
                                    </option>
                                  ))}
                                  <option value="__MORE__">🎨 + More (Palet Warna)...</option>
                                </select>
                                <span className="maba-select-arrow">▾</span>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <span className="muted">Non-MABA</span>
                      )}
                    </td>
                  )}
                  {(meta.canEdit || meta.canDelete) && (
                    <td className="row-actions">
                      {meta.canEdit && (
                        <button className="icon-button edit-action-btn" title="Edit Data" onClick={() => openEdit(row)}>
                          <Icon name="Pencil" size={16} />
                        </button>
                      )}
                      {meta.canEdit && hasActiveField && (
                        <button
                          type="button"
                          className={`icon-button toggle-status-btn ${isEnabled(row.is_active) ? "is-active" : "is-inactive"}`}
                          title={isEnabled(row.is_active) ? "Nonaktifkan" : "Aktifkan"}
                          onClick={() => toggleStatus(row)}
                        >
                          <Icon name={isEnabled(row.is_active) ? "Ban" : "CheckCircle"} size={16} />
                        </button>
                      )}
                      {meta.canDelete && (
                        <button
                          className="icon-button danger delete-action-btn"
                          title={meta.deleteLabel || "Hapus Data"}
                          onClick={() => {
                            setSelected(row);
                            setDialog("delete");
                          }}
                        >
                          <Icon name={meta.deleteLabel ? "UserRoundX" : "Trash2"} size={16} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          </table>
          {!result.data.length && (
            <div className="empty-state table-empty">
              <Icon name={meta.icon} size={30} />
              <strong>Data tidak ditemukan</strong>
              <span>Coba kata pencarian lain atau tambahkan data baru.</span>
            </div>
          )}
        </div>
        <div className="pagination-bar">
          <span>
            Halaman {result.page} dari {result.pages}
          </span>
          <div>
            <Link aria-disabled={result.page <= 1} className={`icon-button ${result.page <= 1 ? "disabled" : ""}`} href={pageHref(Math.max(1, result.page - 1))}>
              <Icon name="ChevronLeft" size={17} />
            </Link>
            <Link aria-disabled={result.page >= result.pages} className={`icon-button ${result.page >= result.pages ? "disabled" : ""}`} href={pageHref(Math.min(result.pages, result.page + 1))}>
              <Icon name="ChevronRight" size={17} />
            </Link>
          </div>
        </div>
      </section>

      {dialog === "form" && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setDialog(null);
          }}
        >
          <form className="dialog-window" onSubmit={submit}>
            <div className="dialog-titlebar">
              <span className="dialog-icon">
                <Icon name={meta.icon} size={18} />
              </span>
              <div>
                <strong>{selected ? `Edit ${meta.singular}` : `Tambah ${meta.singular}`}</strong>
                <small>{selected ? `ID ${String(selected[meta.primaryKey])}` : "Data baru"}</small>
              </div>
              <button type="button" className="icon-button" onClick={() => setDialog(null)}>
                <Icon name="X" size={17} />
              </button>
            </div>
            <div className="dialog-content form-grid">
              {fields.map((field) => (
                <EditorField
                  key={field.key}
                  field={field}
                  row={selected}
                  onToggle={(checked) => {
                    if (field.key === "has_sizes") setHasSizes(checked);
                    if (field.key === "is_event_maba") setEventMaba(checked);
                  }}
                />
              ))}
            </div>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setDialog(null)}>
                Batal
              </button>
              <button className="primary-button" disabled={saving} type="submit">
                {saving ? (
                  <>
                    <span className="spinner" />
                    Menyimpan…
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={17} />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ProductFormSections({
  fields,
  row,
  hasSizes,
  setHasSizes,
  eventMaba,
  setEventMaba,
  mabaGanjil,
  setMabaGanjil,
  mabaGenap,
  setMabaGenap,
  existingGalleryImages,
  deletedGalleryIds,
  setDeletedGalleryIds,
  removeSizeChart,
  setRemoveSizeChart,
  onCancel,
  saving,
  onOpenCustomColorPicker,
}: {
  fields: ResourceField[];
  row: Record<string, unknown> | null;
  hasSizes: boolean;
  setHasSizes: (v: boolean) => void;
  eventMaba: boolean;
  setEventMaba: (v: boolean) => void;
  mabaGanjil: string;
  setMabaGanjil: (v: string) => void;
  mabaGenap: string;
  setMabaGenap: (v: string) => void;
  existingGalleryImages: Array<{ id: number; image: string; image_url: string }>;
  deletedGalleryIds: number[];
  setDeletedGalleryIds: React.Dispatch<React.SetStateAction<number[]>>;
  removeSizeChart: boolean;
  setRemoveSizeChart: (v: boolean) => void;
  onCancel: () => void;
  saving: boolean;
  onOpenCustomColorPicker: (
    field: "maba_color_ganjil" | "maba_color_genap" | "product_color",
    current: string,
    productId?: number,
    onApply?: (colorName: string, hex: string) => void
  ) => void;
}) {
  // Main photo state & preview
  const [mainPhotoPreview, setMainPhotoPreview] = useState<string>(
    String(row?.main_photo_url || "")
  );

  // 5 Gallery slots state (for Slots 2 to 6)
  const initialActiveGallery = existingGalleryImages.filter(
    (img) => !deletedGalleryIds.includes(img.id)
  );
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(() => {
    const slots = ["", "", "", "", ""];
    initialActiveGallery.forEach((img, idx) => {
      if (idx < 5) slots[idx] = img.image_url;
    });
    return slots;
  });

  // Size chart state
  const [sizeChartUrl, setSizeChartUrl] = useState<string | null>(
    !removeSizeChart
      ? (row?.size_chart_url as string) ||
          (row?.size_chart
            ? `/storage/${String(row.size_chart).replace(/^\/?storage\/?/, "")}`
            : null)
      : null
  );

  // Stock state & helper text
  const [currentStock, setCurrentStock] = useState<number>(
    Number(row?.stock ?? 50)
  );

  // Colors management state
  const initialColors = (() => {
    const raw = row?.colors;
    if (Array.isArray(raw)) {
      return raw.map((c) =>
        typeof c === "string"
          ? { name: c, hex: resolveColorHex(c) }
          : { name: String(c.name || ""), hex: String(c.hex || resolveColorHex(String(c.name || ""))) }
      );
    }
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((c) =>
            typeof c === "string"
              ? { name: c, hex: resolveColorHex(c) }
              : { name: String(c.name || ""), hex: String(c.hex || resolveColorHex(String(c.name || ""))) }
          );
        }
      } catch {
        return raw.split(",").map((s) => ({
          name: s.trim(),
          hex: resolveColorHex(s.trim()),
        }));
      }
    }
    return [
      { name: "Kuning Emas", hex: "#FFD700" },
      { name: "Putih", hex: "#FFFFFF" },
    ];
  })();

  const [activeColors, setActiveColors] = useState<Array<{ name: string; hex: string }>>(initialColors);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#dc2626");

  function handleMultiImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (files[0]) {
      setMainPhotoPreview(URL.createObjectURL(files[0]));
    }
    const remainingFiles = files.slice(1, 6);
    if (remainingFiles.length) {
      setGalleryPreviews((prev) => {
        const next = [...prev];
        remainingFiles.forEach((f, idx) => {
          if (idx < 5) next[idx] = URL.createObjectURL(f);
        });
        return next;
      });
    }
  }

  function handleSlotImageChange(slotIdx: number, file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setGalleryPreviews((prev) => {
      const next = [...prev];
      next[slotIdx] = url;
      return next;
    });
  }

  function handleSlotImageRemove(slotIdx: number) {
    setGalleryPreviews((prev) => {
      const next = [...prev];
      next[slotIdx] = "";
      return next;
    });
    if (existingGalleryImages[slotIdx]) {
      setDeletedGalleryIds((prev) => [...prev, existingGalleryImages[slotIdx].id]);
    }
  }

  function handleAddColor() {
    const trimmed = newColorName.trim();
    const finalName = trimmed || (newColorHex ? `Warna ${newColorHex.toUpperCase()}` : "");
    if (!finalName) return;
    if (activeColors.some((c) => c.name.toLowerCase() === finalName.toLowerCase())) {
      setNewColorName("");
      return;
    }
    setActiveColors((prev) => [...prev, { name: finalName, hex: newColorHex }]);
    setNewColorName("");
  }

  function handleSelectTemplate(selected: { value: string; label: string; hex: string; name: string } | null) {
    if (!selected) {
      setNewColorName("");
      return;
    }
    if (selected.value === "__MORE__") {
      onOpenCustomColorPicker(
        "product_color",
        newColorName || "",
        undefined,
        (customName, customHex) => {
          if (!activeColors.some((c) => c.name.toLowerCase() === customName.toLowerCase())) {
            setActiveColors((prev) => [...prev, { name: customName, hex: customHex }]);
          }
          setNewColorName(customName);
          setNewColorHex(customHex);
        }
      );
      return;
    }
    setNewColorName(selected.name || selected.value);
    setNewColorHex(selected.hex);
  }

  function removeColor(idx: number) {
    setActiveColors((prev) => prev.filter((_, i) => i !== idx));
  }

  const categoryField = fields.find((f) => f.key === "category_id");
  const categoryOptions = categoryField?.options || [];

  const initialSizesText = (() => {
    if (row?.sizes) {
      if (Array.isArray(row.sizes)) return row.sizes.join(", ");
      if (typeof row.sizes === "string") {
        try {
          const parsed = JSON.parse(row.sizes);
          if (Array.isArray(parsed)) return parsed.join(", ");
          return row.sizes;
        } catch {
          return row.sizes;
        }
      }
    }
    return "S, M, L, XL, XXL";
  })();

  return (
    <div className="product-page-form">
      {/* Section 1: 📷 GAMBAR PRODUK */}
      <div className="form-section-card">
        <div className="section-title">
          <span className="section-icon-emoji">📷</span>
          <h3>GAMBAR PRODUK</h3>
        </div>

        {/* Multi-Upload Drag & Drop Box */}
        <div className="multi-upload-dropzone">
          <div className="dropzone-folder-icon">📁</div>
          <strong>Upload Banyak Foto Sekaligus (Drag & Drop)</strong>
          <p>Pilih atau tarik hingga 6 gambar sekaligus. Foto akan otomatis mengisi Gambar 1 (Utama) hingga Gambar 6.</p>
          <label className="primary-button dropzone-upload-btn">
            📁 Pilih Banyak Foto Sekaligus
            <input
              type="file"
              name="multi_images"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden-file-input"
              onChange={handleMultiImageSelect}
            />
          </label>
        </div>

        {/* 6 Image Slots Grid (3 Cols x 2 Rows) */}
        <div className="product-image-slots-grid">
          {/* Slot 1: Gambar 1 (Utama) */}
          <div className="image-slot-card">
            <span className="slot-title">Gambar 1 (Utama)</span>
            <div className="slot-preview-box">
              {mainPhotoPreview ? (
                <Image unoptimized src={mainPhotoPreview} alt="Gambar 1" width={140} height={140} className="slot-img" />
              ) : (
                <div className="slot-placeholder-icon"><Icon name="Image" size={32} /></div>
              )}
            </div>
            <div className="slot-actions">
              <label className="secondary-button subtle-button slot-btn slot-ganti-btn">
                📷 Ganti
                <input
                  type="file"
                  name="main_photo_file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setMainPhotoPreview(URL.createObjectURL(file));
                  }}
                />
              </label>
              {mainPhotoPreview && (
                <button
                  type="button"
                  className="danger-button subtle-button slot-btn slot-hapus-btn"
                  onClick={() => setMainPhotoPreview("")}
                >
                  🗑 Hapus
                </button>
              )}
            </div>
          </div>

          {/* Slots 2 to 6: Gambar 2 s/d Gambar 6 */}
          {[2, 3, 4, 5, 6].map((slotIndex) => {
            const slotIdx = slotIndex - 2;
            const previewUrl = galleryPreviews[slotIdx] || "";
            return (
              <div className="image-slot-card" key={slotIndex}>
                <span className="slot-title">Gambar {slotIndex}</span>
                <div className="slot-preview-box">
                  {previewUrl ? (
                    <Image unoptimized src={previewUrl} alt={`Gambar ${slotIndex}`} width={140} height={140} className="slot-img" />
                  ) : (
                    <div className="slot-placeholder-icon gradient-placeholder">
                      <Icon name="Image" size={32} />
                    </div>
                  )}
                </div>
                <div className="slot-actions">
                  <label className="secondary-button subtle-button slot-btn slot-ganti-btn">
                    📷 Ganti
                    <input
                      type="file"
                      name={`gallery_slot_${slotIndex}`}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden-file-input"
                      onChange={(e) => handleSlotImageChange(slotIdx, e.target.files?.[0] || null)}
                    />
                  </label>
                  {previewUrl && (
                    <button
                      type="button"
                      className="danger-button subtle-button slot-btn slot-hapus-btn"
                      onClick={() => handleSlotImageRemove(slotIdx)}
                    >
                      🗑 Hapus
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: 📄 INFORMASI DASAR */}
      <div className="form-section-card">
        <div className="section-title">
          <span className="section-icon-emoji">📄</span>
          <h3>INFORMASI DASAR</h3>
        </div>
        <div className="section-grid">
          <label className="field-label span-two">
            <span>Nama Produk <strong className="required-star">*</strong></span>
            <input name="name" defaultValue={String(row?.name || "")} required placeholder="Kaos BSI Cyber Elite Hijau Tosca" />
          </label>

          <div className="two-col-row span-two">
            <label className="field-label">
              <span>Kategori <strong className="required-star">*</strong></span>
              <select name="category_id" defaultValue={String(row?.category_id || "")} required>
                <option value="" disabled>Pilih Kategori...</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </label>

            <label className="field-label">
              <span>SKU</span>
              <input name="sku" defaultValue={String(row?.sku || "")} placeholder="TS-BSI-GRN" />
            </label>
          </div>

          <label className="field-label span-two">
            <span>Deskripsi Produk</span>
            <textarea name="description" rows={4} defaultValue={String(row?.description || "")} placeholder="Tuliskan deskripsi lengkap produk di sini..." />
          </label>
        </div>
      </div>

      {/* Section 3: 🏷️ HARGA & STOK */}
      <div className="form-section-card">
        <div className="section-title">
          <span className="section-icon-emoji">🏷️</span>
          <h3>HARGA & STOK</h3>
        </div>
        <div className="section-grid">
          <div className="two-col-row span-two">
            <label className="field-label">
              <span>Harga Jual (Rp) <strong className="required-star">*</strong></span>
              <input type="number" name="price" defaultValue={String(row?.price || "")} required placeholder="95000" />
            </label>
            <label className="field-label">
              <span>Harga Asli / Coret (Rp)</span>
              <input type="number" name="original_price" defaultValue={String(row?.original_price || "")} placeholder="125000" />
            </label>
          </div>

          <div className="three-col-row span-two">
            <label className="field-label">
              <span>Stok <strong className="required-star">*</strong></span>
              <input type="number" name="stock" defaultValue={String(row?.stock ?? 50)} required placeholder="50" onChange={(e) => setCurrentStock(Number(e.target.value))} />
              <span className="field-subtext stock-subtext">
                ✓ Stok aman ({currentStock} unit).
              </span>
            </label>

            <label className="field-label">
              <span>Berat (gram) <strong className="required-star">*</strong></span>
              <input type="number" name="weight" defaultValue={String(row?.weight ?? 250)} required placeholder="250" />
            </label>

            <label className="field-label">
              <span>Rating Produk (Bintang 0.0 - 5.0)</span>
              <input type="number" step="0.1" min="0" max="5" name="rating" defaultValue={String(row?.rating ?? "4.8")} placeholder="4.8" />
              <span className="field-subtext">
                Isi rating kustom (misal 4.8). Kosongkan atau isi 0 untuk status Produk Baru.
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 4: VARIAN PRODUK */}
      <div className="form-section-card">
        <div className="section-title">
          <h3>VARIAN PRODUK</h3>
        </div>

        {/* Has Sizes Checkbox Card */}
        <div className="variant-checkbox-card">
          <label className="checkbox-field-label">
            <input
              type="checkbox"
              name="has_sizes"
              checked={hasSizes}
              onChange={(e) => setHasSizes(e.target.checked)}
            />
            <strong>✏️ Produk Memiliki Varian Ukuran (Pakaian, Jas, Jaket, Sepatu, dll)</strong>
          </label>
          <p>Centang jika produk memiliki pilihan ukuran (misal S, M, L, XL). Jika tidak dicentang, pilihan ukuran dan panduan ukuran tidak akan muncul di aplikasi.</p>
        </div>

        {hasSizes && (
          <div className="has-sizes-container">
            <label className="field-label span-two">
              <span>Daftar Pilihan Ukuran</span>
              <input name="sizes" defaultValue={initialSizesText} placeholder="S, M, L, XL, XXL" />
              <span className="field-subtext">Contoh: S, M, L, XL atau All Size (pisahkan dengan koma)</span>
            </label>

            {/* Size Chart Card */}
            <div className="inner-card size-chart-card">
              <h4>✏️ FOTO PANDUAN UKURAN (SIZE CHART)</h4>
              <p className="inner-card-sub">Foto Tabel / Diagram Panduan Ukuran (Opsional)</p>

              <div className="size-chart-box">
                {sizeChartUrl ? (
                  <div className="size-chart-preview-row">
                    <Image unoptimized src={sizeChartUrl} alt="Size Chart" width={160} height={120} className="size-chart-thumb" />
                    <div className="size-chart-actions">
                      <label className="secondary-button subtle-button">
                        📷 Ganti
                        <input
                          type="file"
                          name="size_chart_file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden-file-input"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setSizeChartUrl(URL.createObjectURL(f));
                          }}
                        />
                      </label>
                      <label className="checkbox-inline-delete">
                        <input type="checkbox" name="remove_size_chart" onChange={(e) => setRemoveSizeChart(e.target.checked)} />
                        🗑 Hapus
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="secondary-button subtle-button">
                    📷 Upload Foto Size Chart
                    <input
                      type="file"
                      name="size_chart_file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden-file-input"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setSizeChartUrl(URL.createObjectURL(f));
                      }}
                    />
                  </label>
                )}
                <p className="size-chart-help">
                  Upload gambar tabel/panduan ukuran khusus (maks 2MB). Jika dikosongkan, aplikasi akan otomatis menyajikan tabel ukuran interaktif berdasarkan varian ukuran yang diisi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warna & Palet */}
        <div className="color-palette-section">
          <span className="field-section-label">Warna & Palet</span>

          {/* 1: Active Color Pills with working delete button */}
          <div className="active-color-pills">
            {activeColors.map((col, idx) => {
              const hexVal = col.hex || resolveColorHex(col.name);
              const isWhite = hexVal.toUpperCase() === "#FFFFFF" || hexVal.toUpperCase() === "#FFF";
              return (
                <span className="color-pill-item" key={`${col.name}-${idx}`}>
                  <span
                    className="color-dot-circle"
                    style={{
                      backgroundColor: hexVal,
                      border: isWhite ? "1px solid #d1d5db" : "1px solid rgba(0,0,0,0.25)",
                    }}
                  />
                  <span className="color-pill-name">{col.name}</span>
                  <button
                    type="button"
                    className="remove-pill-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeColor(idx);
                    }}
                    title={`Hapus warna ${col.name}`}
                    aria-label={`Hapus warna ${col.name}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>

          {/* 2 & 3: Color Template Dropdown & Custom Palette Adder */}
          <div className="color-adder-row">
            <div className="template-color-select-container">
              <Select
                styles={reactSelectColorStyles}
                menuPortalTarget={typeof document === "undefined" ? undefined : document.body}
                menuPosition="fixed"
                isSearchable
                isClearable
                placeholder="— Gunakan Template Warna —"
                options={colorTemplateOptionsWithMore}
                formatOptionLabel={formatColorOptionLabel}
                value={
                  newColorName
                    ? colorTemplateOptionsWithMore.find((o) => o.value.toLowerCase() === newColorName.toLowerCase()) || {
                        value: newColorName,
                        label: `${newColorName} (${newColorHex})`,
                        hex: newColorHex,
                        name: newColorName,
                      }
                    : null
                }
                onChange={(selected: any) => handleSelectTemplate(selected)}
              />
            </div>

            <input
              className="color-name-input"
              placeholder="Nama Warna (Cth: Merah)"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddColor();
                }
              }}
            />

            <input
              type="color"
              className="color-hex-picker"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              title="Pilih Palet Warna Hex (Klik untuk membuka spektrum warna native)"
            />

            <button
              type="button"
              className="secondary-button subtle-button more-palette-trigger-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                height: "36px",
                padding: "0 12px",
                fontSize: "12.5px",
                fontWeight: 650,
                color: "var(--accent, #0088cc)",
              }}
              onClick={() => {
                onOpenCustomColorPicker(
                  "product_color",
                  newColorName || "",
                  undefined,
                  (customName, customHex) => {
                    if (!activeColors.some((c) => c.name.toLowerCase() === customName.toLowerCase())) {
                      setActiveColors((prev) => [...prev, { name: customName, hex: customHex }]);
                    }
                    setNewColorName(customName);
                    setNewColorHex(customHex);
                  }
                );
              }}
              title="Buka Palet Warna Lengkap untuk warna yang belum ada di daftar"
            >
              🎨 More...
            </button>

            <button type="button" className="primary-button add-color-btn" onClick={handleAddColor}>
              + Tambah
            </button>
          </div>
          <input type="hidden" name="colors" value={JSON.stringify(activeColors.map((c) => c.name))} />
          <p className="field-subtext">Pilih dari template, klik More... untuk palet kustom, atau gunakan kotak hex untuk menambah varian warna.</p>
        </div>
      </div>

      {/* Section 5: ⚙️ PENGATURAN */}
      <div className="form-section-card">
        <div className="section-title">
          <span className="section-icon-emoji">⚙️</span>
          <h3>PENGATURAN</h3>
        </div>

        {/* 3 Checkboxes Horizontal Row */}
        <div className="three-checkboxes-row">
          <label className="checkbox-item-label">
            <input type="checkbox" name="is_active" defaultChecked={isEnabled(row?.is_active ?? true)} />
            <span>Produk Aktif (tampil di toko)</span>
          </label>

          <label className="checkbox-item-label">
            <input type="checkbox" name="is_recommended" defaultChecked={isEnabled(row?.is_recommended)} />
            <span>Tandai sebagai Rekomendasi</span>
          </label>

          <label className="checkbox-item-label">
            <input
              type="checkbox"
              name="is_event_maba"
              checked={eventMaba}
              onChange={(e) => setEventMaba(e.target.checked)}
            />
            <span>🎓 Produk Event Maba (Ormik & Semot)</span>
          </label>
        </div>

        {/* MABA Rule Inner Box */}
        {eventMaba && (
          <div className="inner-card maba-rule-card">
            <h4>🎓 Aturan Penentuan Warna Mahasiswa Baru (Ormik & Semot)</h4>
            <p className="inner-card-sub">
              Tentukan warna seragam wajib yang otomatis terpilih dan terkunci di aplikasi toko sesuai digit terakhir NIM mahasiswa.
            </p>

            <div className="two-col-row">
              <div className="maba-color-col">
                <label className="field-label">
                  <span>Warna untuk NIM Ganjil (1, 3, 5, 7, 9) <strong className="required-star">*</strong></span>
                  <Select
                    styles={reactSelectColorStyles}
                    menuPortalTarget={typeof document === "undefined" ? undefined : document.body}
                    menuPosition="fixed"
                    isSearchable
                    options={mabaSelectOptionsWithMore}
                    formatOptionLabel={formatColorOptionLabel}
                    value={
                      mabaSelectOptionsWithMore.find((o) => o.value.toLowerCase() === mabaGanjil.toLowerCase()) || {
                        value: mabaGanjil,
                        label: `${mabaGanjil} (${resolveColorHex(mabaGanjil)})`,
                        hex: resolveColorHex(mabaGanjil),
                        name: mabaGanjil,
                      }
                    }
                    onChange={(sel: any) => {
                      if (sel?.value === "__MORE__") {
                        onOpenCustomColorPicker("maba_color_ganjil", mabaGanjil, undefined, (name) => setMabaGanjil(name));
                      } else if (sel) {
                        setMabaGanjil(sel.value || sel.name);
                      }
                    }}
                  />
                  <input type="hidden" name="maba_color_ganjil" value={mabaGanjil} />
                </label>
                <div className="quick-pills-row">
                  <span className="quick-pill-label">Pilihan Cepat:</span>
                  {["Putih", "Biru", "Kuning", "Hitam"].map((c) => (
                    <button type="button" className="quick-pill-btn" key={c} onClick={() => setMabaGanjil(c)}>{c}</button>
                  ))}
                  <button
                    type="button"
                    className="quick-pill-btn"
                    style={{ color: "var(--accent)", fontWeight: 700 }}
                    onClick={() => onOpenCustomColorPicker("maba_color_ganjil", mabaGanjil, undefined, (name) => setMabaGanjil(name))}
                  >
                    🎨 + More
                  </button>
                </div>
              </div>

              <div className="maba-color-col">
                <label className="field-label">
                  <span>Warna untuk NIM Genap (0, 2, 4, 6, 8) <strong className="required-star">*</strong></span>
                  <Select
                    styles={reactSelectColorStyles}
                    menuPortalTarget={typeof document === "undefined" ? undefined : document.body}
                    menuPosition="fixed"
                    isSearchable
                    options={mabaSelectOptionsWithMore}
                    formatOptionLabel={formatColorOptionLabel}
                    value={
                      mabaSelectOptionsWithMore.find((o) => o.value.toLowerCase() === mabaGenap.toLowerCase()) || {
                        value: mabaGenap,
                        label: `${mabaGenap} (${resolveColorHex(mabaGenap)})`,
                        hex: resolveColorHex(mabaGenap),
                        name: mabaGenap,
                      }
                    }
                    onChange={(sel: any) => {
                      if (sel?.value === "__MORE__") {
                        onOpenCustomColorPicker("maba_color_genap", mabaGenap, undefined, (name) => setMabaGenap(name));
                      } else if (sel) {
                        setMabaGenap(sel.value || sel.name);
                      }
                    }}
                  />
                  <input type="hidden" name="maba_color_genap" value={mabaGenap} />
                </label>
                <div className="quick-pills-row">
                  <span className="quick-pill-label">Pilihan Cepat:</span>
                  {["Biru", "Putih", "Kuning", "Hitam"].map((c) => (
                    <button type="button" className="quick-pill-btn" key={c} onClick={() => setMabaGenap(c)}>{c}</button>
                  ))}
                  <button
                    type="button"
                    className="quick-pill-btn"
                    style={{ color: "var(--accent)", fontWeight: 700 }}
                    onClick={() => onOpenCustomColorPicker("maba_color_genap", mabaGenap, undefined, (name) => setMabaGenap(name))}
                  >
                    🎨 + More
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 6: Footer Info & Buttons Bar */}
      <div className="product-edit-footer-bar">
        <div className="footer-stat-info">
          {row ? (
            <>⭐ Statistik: Rating <strong>{String(row.rating || "4.8")}</strong> · {String(row.reviews_count || "0")} ulasan · Slug: <code className="slug-code">{String(row.slug || "")}</code> · Dibuat: {row.created_at ? date.format(new Date(String(row.created_at))) : "—"}</>
          ) : (
            <>✨ Menambahkan produk baru ke katalog UBSI Cyber Store.</>
          )}
        </div>

        <div className="footer-action-btns">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Batal
          </button>
          <button className="primary-button red-submit-btn" disabled={saving} type="submit">
            {saving ? (
              <><span className="spinner" /> {row ? "Menyimpan Perubahan…" : "Menambahkan Produk…"}</>
            ) : (
              <>{row ? "✓ Simpan Perubahan" : "✓ Tambah Produk"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditorField({ field, row, onToggle }: { field: ResourceField; row: Record<string, unknown> | null; onToggle?: (checked: boolean) => void }) {
  const value = fieldDefault(field, row);
  if (field.kind === "boolean") {
    return (
      <label className="toggle-field">
        <input
          type="checkbox"
          name={field.key}
          value="true"
          defaultChecked={row ? isEnabled(row[field.key]) : field.defaultValue ?? true}
          onChange={(event) => onToggle?.(event.target.checked)}
        />
        <span className="toggle-switch" />
        <span>
          <strong>{field.label}</strong>
          <small>{field.placeholder || "Aktifkan atau nonaktifkan opsi ini."}</small>
        </span>
      </label>
    );
  }
  if (field.kind === "textarea") {
    return (
      <label className="field-label span-two">
        <span>{field.label}{field.required && " *"}</span>
        <textarea
          name={field.key}
          defaultValue={value}
          required={field.required}
          placeholder={field.placeholder || `Tuliskan ${field.label.toLowerCase()} di sini...`}
          readOnly={field.readonly}
          rows={4}
        />
        {field.placeholder && <small className="field-help">{field.placeholder}</small>}
      </label>
    );
  }
  if (field.key === "maba_color_ganjil" || field.key === "maba_color_genap") {
    const fallback = field.key === "maba_color_ganjil" ? "Putih" : "Biru";
    const selectedValue = String(value || fallback);
    const selectedOption = field.options?.find((option) => option.value === selectedValue) || null;
    return (
      <label className="field-label">
        <span>{field.label}{field.required && " *"}</span>
        <Select
          classNamePrefix="select2"
          name={field.key}
          options={field.options}
          defaultValue={selectedOption}
          isSearchable
          isClearable={false}
          placeholder={field.placeholder || "Pilih warna..."}
          noOptionsMessage={() => "Warna tidak ditemukan"}
          menuPortalTarget={typeof document === "undefined" ? undefined : document.body}
          menuPosition="fixed"
        />
        {field.placeholder && <small className="field-help">{field.placeholder}</small>}
      </label>
    );
  }
  if (field.kind === "select") {
    return (
      <label className="field-label">
        <span>{field.label}{field.required && " *"}</span>
        <select name={field.key} defaultValue={value} required={field.required} disabled={field.readonly}>
          {field.placeholder && <option value="" disabled>{field.placeholder}</option>}
          {field.options?.map((option) => (
            <option value={option.value} key={option.value}>{option.label}</option>
          ))}
        </select>
        {field.placeholder && <small className="field-help">{field.placeholder}</small>}
      </label>
    );
  }
  if (field.kind === "image") {
    const existingPath = field.key === "size_chart_file" ? row?.size_chart : null;
    const existingUrl = existingPath ? `/storage/${String(existingPath).replace(/^\/?storage\/?/, "")}` : null;
    return (
      <label className="field-label span-two">
        <span>{field.label}{field.required && " *"}</span>
        <span className="file-input">
          <Icon name="GalleryHorizontalEnd" size={18} />
          <input
            type="file"
            name={field.key}
            accept="image/jpeg,image/png,image/webp"
            required={field.required && !row}
          />
          <small>{field.placeholder || "Pilih berkas gambar (JPG, PNG, atau WEBP)"}</small>
          {existingUrl && (
            <a className="file-current" href={existingUrl} target="_blank" rel="noreferrer">
              Lihat gambar saat ini
            </a>
          )}
        </span>
        {field.placeholder && <small className="field-help">{field.placeholder}</small>}
      </label>
    );
  }
  const inputType = field.kind === "password" ? "password" : field.kind === "email" ? "email" : ["number", "currency"].includes(field.kind) ? "number" : "text";
  return (
    <label className="field-label">
      <span>{field.label}{field.required && " *"}</span>
      <input
        type={inputType}
        name={field.key}
        defaultValue={value}
        required={field.required && !(field.kind === "password" && row)}
        placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}...`}
        readOnly={field.readonly}
        min={inputType === "number" ? 0 : undefined}
      />
      {field.placeholder && <small className="field-help">{field.placeholder}</small>}
    </label>
  );
}

