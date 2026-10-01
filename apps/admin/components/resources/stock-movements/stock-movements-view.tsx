"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/icon";
import type { ResourceMeta } from "@/types";
import { SweetAlert } from "@/components/sweet-alert";
import { number, highlightMatch, getErrorMessage } from "../common/utils";

export function StockMovementsView({
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

  useEffect(() => {
    setSearchVal(search);
  }, [search]);

  useEffect(() => {
    setProductFilterVal(productId);
  }, [productId]);

  useEffect(() => {
    setTypeFilterVal(typeFilter);
  }, [typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal !== search) {
        const params = new URLSearchParams();
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (productFilterVal) params.set("product_id", productFilterVal);
        if (typeFilterVal) params.set("type", typeFilterVal);
        params.set("page", "1");
        const queryStr = params.toString();
        router.replace(`/admin/stock-movements${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal, search, productFilterVal, typeFilterVal, router]);

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
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Terjadi kesalahan saat mencatat mutasi stok."), type: "error" });
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
            <span style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:12px;font-weight:600;color:${typeColor};background:${isIn ? "#ecfdf5" : "#fef2f2"
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
                  <path d="M1.5 7.5L6 3L10.5 8L15 4L20.5 10" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
              <Icon name="Search" size={14} className="stock-search-icon" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Cari produk, referensi..."
                className="stock-search-input"
              />
              {searchVal ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchVal("");
                    const params = new URLSearchParams();
                    if (productFilterVal) params.set("product_id", productFilterVal);
                    if (typeFilterVal) params.set("type", typeFilterVal);
                    router.replace(`/admin/stock-movements${params.toString() ? `?${params.toString()}` : ""}`);
                  }}
                  className="search-clear-btn"
                  title="Hapus pencarian"
                >
                  <Icon name="X" size={12} />
                </button>
              ) : null}
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
              <Icon name="Filter" size={13} />
              <span>Filter</span>
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
                          <div className="stock-row-product-name">
                            {highlightMatch(String(row.product_name || "Produk"), searchVal)}
                          </div>
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
                          <span className="stock-ref-badge">
                            {highlightMatch(String(row.reference || "—"), searchVal)}
                          </span>
                        </td>
                        <td className="stock-note-cell">
                          {highlightMatch(String(row.note || "—"), searchVal)}
                        </td>
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
