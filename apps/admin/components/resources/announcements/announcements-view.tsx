"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResourceMeta } from "@/types";
import { Icon } from "@/components/icon";
import { SweetAlert } from "@/components/sweet-alert";
import { date, number, truncate, getErrorMessage } from "../common/utils";

export interface AnnouncementsViewProps {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>>; total: number; page: number; perPage: number; pages: number };
  search: string;
  status?: string;
}

export function AnnouncementsView({
  meta,
  result,
  search,
  status = "",
}: AnnouncementsViewProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"form" | "delete" | null>(null);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const [searchVal, setSearchVal] = useState(search);
  const [statusVal, setStatusVal] = useState(status);

  useEffect(() => {
    setSearchVal(search);
  }, [search]);

  useEffect(() => {
    setStatusVal(status);
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal !== search) {
        const params = new URLSearchParams();
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (statusVal) params.set("status", statusVal);
        params.set("page", "1");
        const queryStr = params.toString();
        router.replace(`/admin/announcements${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal, search, statusVal, router]);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("info");
  const [formTarget, setFormTarget] = useState("all");
  const [formActionUrl, setFormActionUrl] = useState("");
  const [formContent, setFormContent] = useState("");
  const [actionMenuAnnounceId, setActionMenuAnnounceId] = useState<string | number | null>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".action-dropdown-wrap")) {
        setActionMenuAnnounceId(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal membersihkan cache."), type: "error" });
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
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Terjadi kesalahan."), type: "error" });
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
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal menghapus pengumuman."), type: "error" });
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
          <form
            className="search-filter-form"
            onSubmit={(e) => {
              e.preventDefault();
              const params = new URLSearchParams();
              if (searchVal.trim()) params.set("search", searchVal.trim());
              if (statusVal) params.set("status", statusVal);
              params.set("page", "1");
              const queryStr = params.toString();
              router.replace(`/admin/announcements${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
            }}
          >
            <div className="search-box">
              <Icon name="Search" size={16} />
              <input
                name="search"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Cari judul broadcast atau isi pesan…"
                autoComplete="off"
              />
              {searchVal ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchVal("");
                    const params = new URLSearchParams();
                    if (statusVal) params.set("status", statusVal);
                    params.set("page", "1");
                    const queryStr = params.toString();
                    router.replace(`/admin/announcements${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
                  }}
                  className="search-clear-btn"
                  title="Hapus pencarian"
                >
                  <Icon name="X" size={13} />
                </button>
              ) : null}
            </div>
            <select
              name="status"
              value={statusVal}
              onChange={(e) => {
                const val = e.target.value;
                setStatusVal(val);
                const params = new URLSearchParams();
                if (searchVal.trim()) params.set("search", searchVal.trim());
                if (val) params.set("status", val);
                params.set("page", "1");
                const queryStr = params.toString();
                router.replace(`/admin/announcements${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
              }}
              className="status-filter-select"
            >
              <option value="">Semua Kategori</option>
              <option value="info">Informasi Umum</option>
              <option value="promo">Promo &amp; Diskon</option>
              <option value="order">Status Pesanan</option>
              <option value="warning">Peringatan Penting</option>
            </select>
            <button type="submit" className="filter-btn">
              <Icon name="Filter" size={14} />
              <span>Filter</span>
            </button>
            {(searchVal || statusVal) ? (
              <button
                type="button"
                onClick={() => {
                  setSearchVal("");
                  setStatusVal("");
                  router.replace("/admin/announcements", { scroll: false });
                }}
                className="filter-reset-btn"
                title="Reset filter"
              >
                <Icon name="RotateCcw" size={13} />
                <span>Reset</span>
              </button>
            ) : null}
          </form>
          <div className="record-count">
            <span className="record-count-dot" />
            <span className="record-count-num">{number.format(result.total)}</span>
            <span className="record-count-label">data</span>
          </div>
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
                      <td className="row-actions" style={{ position: "relative" }}>
                        {(() => {
                          const rowId = row.id as string | number;
                          const isMenuOpen = actionMenuAnnounceId === rowId;
                          const openUpward = rowIndex >= result.data.length - 2 && result.data.length > 2;

                          return (
                            <div className="action-dropdown-wrap">
                              <button
                                type="button"
                                className={`action-dots-btn ${isMenuOpen ? "is-active" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuAnnounceId(isMenuOpen ? null : rowId);
                                }}
                                title="Pilihan Aksi"
                              >
                                <Icon name="MoreHorizontal" size={16} />
                              </button>

                              {isMenuOpen && (
                                <div className={`action-dropdown-popover ${openUpward ? "open-upward" : ""}`}>
                                  <button
                                    type="button"
                                    className="action-dropdown-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActionMenuAnnounceId(null);
                                      openEdit(row);
                                    }}
                                  >
                                    <Icon name="Pencil" size={14} style={{ color: "#465FFF" }} />
                                    <span>Edit Pengumuman</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="action-dropdown-item danger"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActionMenuAnnounceId(null);
                                      setSelected(row);
                                      setDialog("delete");
                                    }}
                                  >
                                    <Icon name="Trash2" size={14} />
                                    <span>Hapus Pengumuman</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
