"use client";

import React, { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ResourceMeta, ResourceField } from "@/types";
import { Icon } from "@/components/icon";
import { SweetAlert } from "@/components/sweet-alert";
import {
  display,
  getRowPhotoUrl,
  hasSizeOptions,
  isEnabled,
  money,
  number,
  highlightMatch,
} from "../common/utils";
import {
  COLOR_PALETTE_TEMPLATES,
  mabaColorOptions,
  mabaHexMap,
  parseStockColor,
  resolveColorHex,
} from "../common/colors";
import { ProductFormSections } from "./product-form-sections";
import { EditorField } from "./editor-field";

export interface GenericResourceViewProps {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>>; total: number; page: number; perPage: number; pages: number };
  search: string;
  status?: string;
  productId?: string;
  typeFilter?: string;
  currentUser?: { id: number; role: string; name?: string; email?: string } | null;
}

export function GenericResourceView({
  meta,
  result,
  search,
  status = "",
  typeFilter = "",
  currentUser = null,
}: GenericResourceViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<Array<Record<string, unknown>>>(result.data);
  const [totalCount, setTotalCount] = useState<number>(result.total);

  useEffect(() => {
    setItems(result.data);
    setTotalCount(result.total);
  }, [result.data, result.total]);

  const [dialog, setDialog] = useState<"form" | "delete" | null>(null);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
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
  const [actionMenuRowId, setActionMenuRowId] = useState<string | number | null>(null);

  // Search & Filter state with live search debounce
  const [searchVal, setSearchVal] = useState(search);
  const [statusVal, setStatusVal] = useState(status);
  const [typeFilterVal, setTypeFilterVal] = useState(typeFilter);
  const [showResourceSuggestions, setShowResourceSuggestions] = useState(false);
  const [resourceSuggestions, setResourceSuggestions] = useState<Array<Record<string, unknown>>>([]);
  const [isSearchingResourceSuggestions, setIsSearchingResourceSuggestions] = useState(false);
  const resourceSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchVal(search);
  }, [search]);

  useEffect(() => {
    setStatusVal(status);
  }, [status]);

  useEffect(() => {
    setTypeFilterVal(typeFilter);
  }, [typeFilter]);

  // Close recommendations on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (resourceSearchRef.current && !resourceSearchRef.current.contains(e.target as Node)) {
        setShowResourceSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced server search suggestions for generic resources
  useEffect(() => {
    const q = searchVal.trim();
    if (!q || q.length < 1) {
      setResourceSuggestions([]);
      setIsSearchingResourceSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingResourceSuggestions(true);
      try {
        const res = await fetch(`/api/admin/resources/${meta.key}?search=${encodeURIComponent(q)}`);
        if (res.ok) {
          const json = await res.json();
          const items: Array<Record<string, unknown>> = json.data || [];
          setResourceSuggestions(items.slice(0, 8));
        }
      } catch (err) {
        console.error("Resource suggestions fetch error:", err);
      } finally {
        setIsSearchingResourceSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchVal, meta.key]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal !== search) {
        const params = new URLSearchParams();
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (statusVal) params.set("status", statusVal);
        if (typeFilterVal) params.set("type", typeFilterVal);
        params.set("page", "1");
        const queryStr = params.toString();
        router.replace(`/admin/${meta.key}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchVal, search, statusVal, typeFilterVal, meta.key, router]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".action-dropdown-wrap")) {
        setActionMenuRowId(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
      if (colorPickerModal.field !== "product_color") {
        handleQuickMabaColorChange(colorPickerModal.productId, colorPickerModal.field, finalName);
      }
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
      setItems((prev) =>
        prev.map((it) => (it[meta.primaryKey] === id ? { ...it, is_active: nextIsActive ? 1 : 0 } : it))
      );
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
    for (const field of meta.fields.filter((item: ResourceField) => item.kind === "boolean")) {
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
    const targetId = selected[meta.primaryKey];
    try {
      const response = await fetch(`/api/admin/resources/${meta.key}/${targetId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Data gagal dihapus.");
      setItems((prev) => prev.filter((item) => String(item[meta.primaryKey]) !== String(targetId)));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setDialog(null);
      setMessage({ text: data.message || "Data berhasil dihapus.", type: "success" });
      router.refresh();
    } catch (reason) {
      setDialog(null);
      setMessage({ text: reason instanceof Error ? reason.message : "Data gagal dihapus.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("page", String(page));
    return `/admin/${meta.key}?${params}`;
  };

  const fields = meta.fields.filter((field: ResourceField) => {
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
                : `Aturan warna seragam untuk ${colorPickerModal.field === "maba_color_ganjil"
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

  const hasActiveField = ("is_active" in (result.data[0] || {})) || meta.fields.some((f: ResourceField) => f.key === "is_active") || ["products", "categories", "users", "expeditions"].includes(meta.key);

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
        title={meta.key === "users" ? `Hapus Akun ${selected?.name || "Pengguna"}?` : `${meta.deleteLabel || "Hapus"} ${meta.singular}?`}
        message={
          meta.key === "users"
            ? `Apakah Anda yakin ingin menghapus akun "${selected?.name}" (${selected?.email})? Jika akun memiliki histori transaksi pesanan, akun akan dinonaktifkan demi menjaga arsip audit.`
            : (typeof meta.deleteDescription === "string"
              ? meta.deleteDescription
              : `Data "${String(selected?.name || selected?.title || selected?.invoice_number || selected?.[meta.primaryKey])}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`)
        }
        confirmText={meta.key === "users" ? "Ya, Hapus Akun" : `Ya, ${meta.deleteLabel || "Hapus"}`}
        cancelText="Batal"
        onConfirm={remove}
        onClose={() => setDialog(null)}
        loading={saving}
      />

      {/* Custom MABA Color Palette Modal ("More...") */}
      {colorPickerModalElement}

      <section className="panel data-panel">
        <div className="data-toolbar">
          <form
            className="search-filter-form"
            onSubmit={(e) => {
              e.preventDefault();
              const params = new URLSearchParams();
              if (searchVal.trim()) params.set("search", searchVal.trim());
              if (statusVal) params.set("status", statusVal);
              if (typeFilterVal) params.set("type", typeFilterVal);
              params.set("page", "1");
              const queryStr = params.toString();
              router.replace(`/admin/${meta.key}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
            }}
          >
            <div ref={resourceSearchRef} className="resource-search-container-relative">
              <div className="search-box">
                <Icon name="Search" size={16} />
                <input
                  name="search"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onFocus={() => setShowResourceSuggestions(true)}
                  placeholder={`Cari ${meta.label.toLowerCase()}…`}
                  autoComplete="off"
                />
                {searchVal ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchVal("");
                      setShowResourceSuggestions(false);
                      const params = new URLSearchParams();
                      if (statusVal) params.set("status", statusVal);
                      if (typeFilterVal) params.set("type", typeFilterVal);
                      params.set("page", "1");
                      const queryStr = params.toString();
                      router.replace(`/admin/${meta.key}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
                    }}
                    className="search-clear-btn"
                    title="Hapus pencarian"
                  >
                    <Icon name="X" size={13} />
                  </button>
                ) : null}
              </div>

              {/* Shopee-style Live Search Dropdown for Generic Resources */}
              {showResourceSuggestions && searchVal.trim().length > 0 && (
                <div className="resource-recommendations-dropdown">
                  <div className="recommendations-header">
                    <span>Rekomendasi {meta.label}</span>
                    {isSearchingResourceSuggestions && <span className="recommendations-loading-spinner" />}
                  </div>

                  {resourceSuggestions.length === 0 && !isSearchingResourceSuggestions ? (
                    <div className="recommendations-empty">
                      Tidak ada {meta.label.toLowerCase()} yang cocok dengan "{searchVal}"
                    </div>
                  ) : (
                    <div className="recommendations-list">
                      {resourceSuggestions.map((item) => {
                        const itemPhoto = item.photo_url || item.photo || item.image;
                        const itemTitle = String(item.name || item.title || item.code || item.label || "Item");
                        const itemSubtitle = String(
                          item.sku ||
                          item.category_name ||
                          item.email ||
                          item.phone ||
                          item.description ||
                          (item.price ? money.format(Number(item.price)) : "") ||
                          ""
                        );

                        return (
                          <button
                            key={String(item[meta.primaryKey] || item.id || Math.random())}
                            type="button"
                            onClick={() => {
                              setSearchVal(itemTitle);
                              setShowResourceSuggestions(false);
                              const params = new URLSearchParams();
                              params.set("search", itemTitle);
                              if (statusVal) params.set("status", statusVal);
                              if (typeFilterVal) params.set("type", typeFilterVal);
                              params.set("page", "1");
                              router.replace(`/admin/${meta.key}?${params.toString()}`, { scroll: false });
                            }}
                            className="recommendation-item"
                          >
                            <div className="recommendation-avatar-box">
                              {itemPhoto ? (
                                <Image
                                  unoptimized
                                  src={`/storage/${String(itemPhoto).replace(/^\/?storage\/?/, "")}`}
                                  alt={itemTitle}
                                  width={32}
                                  height={32}
                                  className="recommendation-avatar-img"
                                />
                              ) : (
                                <div className="recommendation-avatar-fallback">
                                  {itemTitle.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="recommendation-text-box">
                              <div className="recommendation-name-row">
                                <span className="recommendation-name">
                                  {highlightMatch(itemTitle, searchVal)}
                                </span>
                                {Boolean(item.price) && (
                                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#2563eb" }}>
                                    {money.format(Number(item.price))}
                                  </span>
                                )}
                              </div>

                              {Boolean(itemSubtitle) && (
                                <div className="recommendation-sub-row">
                                  <span className="recommendation-snippet">
                                    {highlightMatch(itemSubtitle, searchVal)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <Icon name="ChevronRight" size={14} className="recommendation-arrow-icon" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {meta.key === "stock-movements" ? (
              <select
                name="type"
                value={typeFilterVal}
                onChange={(e) => {
                  const val = e.target.value;
                  setTypeFilterVal(val);
                  const params = new URLSearchParams();
                  if (searchVal.trim()) params.set("search", searchVal.trim());
                  if (val) params.set("type", val);
                  params.set("page", "1");
                  const queryStr = params.toString();
                  router.replace(`/admin/${meta.key}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
                }}
                className="status-filter-select"
              >
                <option value="">Semua Tipe Mutasi</option>
                <option value="in">Stok Masuk (In)</option>
                <option value="out">Stok Keluar (Out)</option>
              </select>
            ) : meta.key === "users" ? (
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
                  router.replace(`/admin/${meta.key}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
                }}
                className="status-filter-select"
              >
                <option value="">Semua Status Akun</option>
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            ) : (
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
                  router.replace(`/admin/${meta.key}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
                }}
                className="status-filter-select"
              >
                <option value="">Semua Status</option>
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            )}
            <button type="submit" className="filter-btn">
              <Icon name="Filter" size={14} />
              <span>Filter</span>
            </button>
            {(searchVal || statusVal || typeFilterVal) ? (
              <button
                type="button"
                onClick={() => {
                  setSearchVal("");
                  setStatusVal("");
                  setTypeFilterVal("");
                  router.replace(`/admin/${meta.key}`, { scroll: false });
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
            <span className="record-count-num">{number.format(totalCount)}</span>
            <span className="record-count-label">data</span>
          </div>
        </div>
        <div className="table-scroller">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "48px", textAlign: "center" }}>NO.</th>
                {meta.columns.map((column: { key: string; label: string; format?: string }) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                {meta.key === "products" && <th className="maba-column-header">Rule Event MABA</th>}
                {(meta.canEdit || meta.canDelete) && <th className="action-column">AKSI</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((row, rowIndex) => {
                const rowNumber = (result.page - 1) * result.perPage + rowIndex + 1;
                const photoUrl = getRowPhotoUrl(row);

                return (
                  <tr key={String(row[meta.primaryKey])}>
                    <td style={{ textAlign: "center", color: "var(--muted)", fontWeight: 500, width: "48px" }}>
                      {rowNumber}
                    </td>
                    {meta.columns.map((column: { key: string; label: string; format?: string }, index: number) => (
                      <td key={column.key}>
                        {index === 0 ? (
                          <span className="cell-with-thumb">
                            {photoUrl ? (
                              <Image
                                unoptimized
                                width={meta.key === "banners" ? 54 : 36}
                                height={meta.key === "banners" ? 32 : 36}
                                src={photoUrl}
                                alt=""
                                style={{
                                  width: meta.key === "banners" ? 54 : 36,
                                  height: meta.key === "banners" ? 32 : 36,
                                  borderRadius: meta.key === "users" ? "50%" : 6,
                                  objectFit: "cover",
                                  flexShrink: 0,
                                }}
                              />
                            ) : meta.key === "users" ? (
                              <span
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: "50%",
                                  background: "var(--surface-hover)",
                                  border: "1px solid var(--border)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "var(--muted)",
                                  flexShrink: 0,
                                  fontWeight: 700,
                                  fontSize: 13,
                                }}
                              >
                                {String(row.name || "U").slice(0, 1).toUpperCase()}
                              </span>
                            ) : (
                              <span
                                style={{
                                  width: meta.key === "banners" ? 54 : 36,
                                  height: meta.key === "banners" ? 32 : 36,
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
                                <Icon name={meta.key === "banners" ? "GalleryHorizontalEnd" : "Package"} size={18} />
                              </span>
                            )}
                            <span>{display(row[column.key], column.format)}</span>
                          </span>
                        ) : meta.key === "products" && column.key === "stock" ? (
                          (() => {
                            const parsedColors = (() => {
                              const raw = row.colors;
                              if (!raw) return [];
                              if (Array.isArray(raw)) {
                                return raw.map(parseStockColor);
                              }
                              if (typeof raw === "string" && raw.trim()) {
                                try {
                                  const parsed = JSON.parse(raw);
                                  if (Array.isArray(parsed)) {
                                    return parsed.map(parseStockColor);
                                  }
                                } catch {
                                  return raw.split(",").map((s) => ({ name: s.trim(), hex: resolveColorHex(s.trim()), stock: undefined }));
                                }
                              }
                              return [];
                            })();

                            const totalStockNum = Number(row.stock || 0);

                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontWeight: 700, fontSize: "13px", color: totalStockNum > 0 ? "var(--text)" : "#ef4444" }}>
                                    {totalStockNum} unit
                                  </span>
                                  {totalStockNum <= 0 && (
                                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#ef4444", background: "#fee2e2", padding: "1px 5px", borderRadius: "4px" }}>
                                      Habis
                                    </span>
                                  )}
                                </div>
                                {parsedColors.length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "260px" }}>
                                    {parsedColors.map((c, cIdx) => {
                                      const hex = c.hex || resolveColorHex(c.name);
                                      const isWhite = hex.toUpperCase() === "#FFFFFF" || hex.toUpperCase() === "#FFF";
                                      const isZero = c.stock !== undefined && c.stock <= 0;
                                      return (
                                        <span
                                          key={cIdx}
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            padding: "2px 6px",
                                            borderRadius: "4px",
                                            background: isZero ? "#fef2f2" : "#f1f5f9",
                                            border: isZero ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                                            color: isZero ? "#ef4444" : "#334155",
                                            whiteSpace: "nowrap",
                                          }}
                                          title={c.stock !== undefined ? `Stok ${c.name}: ${c.stock} unit` : c.name}
                                        >
                                          <span
                                            style={{
                                              width: "8px",
                                              height: "8px",
                                              borderRadius: "50%",
                                              backgroundColor: hex,
                                              border: isWhite ? "1px solid #cbd5e1" : "1px solid rgba(0,0,0,0.15)",
                                              flexShrink: 0,
                                            }}
                                          />
                                          <span>{c.name}</span>
                                          {c.stock !== undefined && (
                                            <strong style={{ color: isZero ? "#dc2626" : "#003399" }}>
                                              ({c.stock})
                                            </strong>
                                          )}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          display(row[column.key], column.format)
                        )}
                      </td>
                    ))}
                    {meta.key === "products" && (
                      <td className="maba-column-cell">
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
                                  <span className="maba-pill-val">{currentGanjil}</span>
                                  <span className="maba-select-arrow">▾</span>
                                  <select
                                    className="maba-inline-select-overlay"
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
                                    {!mabaColorOptions.some((opt: { label: string; value: string; hex: string }) => opt.value.toLowerCase() === currentGanjil.toLowerCase()) && (
                                      <option value={currentGanjil}>{currentGanjil} (Kustom)</option>
                                    )}
                                    {mabaColorOptions.map((opt: { label: string; value: string; hex: string }) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.value}
                                      </option>
                                    ))}
                                    <option value="__MORE__">🎨 + More (Palet Warna)...</option>
                                  </select>
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
                                  <span className="maba-pill-val">{currentGenap}</span>
                                  <span className="maba-select-arrow">▾</span>
                                  <select
                                    className="maba-inline-select-overlay"
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
                                    {!mabaColorOptions.some((opt: { label: string; value: string; hex: string }) => opt.value.toLowerCase() === currentGenap.toLowerCase()) && (
                                      <option value={currentGenap}>{currentGenap} (Kustom)</option>
                                    )}
                                    {mabaColorOptions.map((opt: { label: string; value: string; hex: string }) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.value}
                                      </option>
                                    ))}
                                    <option value="__MORE__">🎨 + More (Palet Warna)...</option>
                                  </select>
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
                      <td className="row-actions" style={{ position: "relative" }}>
                        {(() => {
                          const rowId = (row[meta.primaryKey] ?? rowIndex) as string | number;
                          const isMenuOpen = actionMenuRowId === rowId;
                          const openUpward = rowIndex >= items.length - 2 && items.length > 2;

                          const isUserRes = meta.key === "users";
                          const isSelf = isUserRes && row.id === currentUser?.id;
                          const isSuperAdmin = currentUser?.role === "superadmin";
                          const isStaffAccount = isUserRes && (row.role === "admin" || row.role === "superadmin");

                          // Jika Admin biasa melihat akun Admin lain atau Superadmin -> Terkunci penuh
                          if (isUserRes && !isSuperAdmin && isStaffAccount && !isSelf) {
                            return (
                              <span
                                className="status-pill status-closed"
                                style={{ fontSize: "0.75rem", padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}
                                title="Hanya Superadmin yang berhak mengelola atau menghapus akun Admin / Superadmin"
                              >
                                <Icon name="Lock" size={12} />
                                Terkunci
                              </span>
                            );
                          }

                          // Hak Edit: Superadmin bisa edit siapa saja. Admin biasa bisa edit akun sendiri atau akun pelanggan.
                          const canEdit = meta.canEdit && (!isUserRes || isSuperAdmin || isSelf || row.role === "customer");

                          // Hak Delete:
                          // - Akun sendiri tidak boleh dihapus demi keamanan sesi aktif.
                          // - Superadmin bisa menghapus semua akun pengguna (selain diri sendiri).
                          // - Admin biasa HANYA bisa menghapus akun Pelanggan (customer).
                          const canDelete = meta.canDelete && (!isUserRes || (
                            !isSelf && (isSuperAdmin || (currentUser?.role === "admin" && row.role === "customer"))
                          ));

                          const canToggle = canEdit && hasActiveField && !isSelf;

                          if (!canEdit && !canDelete && !canToggle) {
                            return <span className="muted">—</span>;
                          }

                          return (
                            <div className="action-dropdown-wrap">
                              <button
                                type="button"
                                className={`action-dots-btn ${isMenuOpen ? "is-active" : ""}`}
                                title="Pilihan Aksi"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuRowId(isMenuOpen ? null : rowId);
                                }}
                              >
                                <Icon name="MoreHorizontal" size={16} />
                              </button>

                              {isMenuOpen && (
                                <div className={`action-dropdown-popover ${openUpward ? "open-upward" : ""}`}>
                                  {canEdit && (
                                    <button
                                      type="button"
                                      className="action-dropdown-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActionMenuRowId(null);
                                        openEdit(row);
                                      }}
                                    >
                                      <Icon name="Pencil" size={14} style={{ color: "#465FFF" }} />
                                      <span>Edit Data</span>
                                    </button>
                                  )}

                                  {canToggle && (
                                    <button
                                      type="button"
                                      className="action-dropdown-item"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActionMenuRowId(null);
                                        toggleStatus(row);
                                      }}
                                    >
                                      {isEnabled(row.is_active) ? (
                                        <>
                                          <Icon name="EyeOff" size={14} style={{ color: "#F59E0B" }} />
                                          <span>Nonaktifkan</span>
                                        </>
                                      ) : (
                                        <>
                                          <Icon name="CheckCircle2" size={14} style={{ color: "#10B981" }} />
                                          <span>Aktifkan</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {canDelete && (
                                    <button
                                      type="button"
                                      className="action-dropdown-item danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActionMenuRowId(null);
                                        setSelected(row);
                                        setDialog("delete");
                                      }}
                                    >
                                      <Icon name={meta.deleteLabel ? "UserRoundX" : "Trash2"} size={14} />
                                      <span>{meta.deleteLabel || "Hapus Data"}</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!items.length && (
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
              {fields.map((field: ResourceField) => (
                <EditorField
                  key={field.key}
                  field={field}
                  row={selected}
                  currentUser={currentUser}
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
