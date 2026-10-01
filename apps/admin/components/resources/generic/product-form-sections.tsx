"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Select, { SingleValue } from "react-select";
import type { ResourceField } from "@/types";
import { Icon } from "@/components/icon";
import { ColorOption } from "../common/types";
import {
  resolveColorHex,
  reactSelectColorStyles,
  formatColorOptionLabel,
  colorTemplateOptionsWithMore,
  mabaSelectOptionsWithMore,
} from "../common/colors";
import { date, isEnabled } from "../common/utils";

export interface ProductFormSectionsProps {
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
}

export function ProductFormSections({
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
}: ProductFormSectionsProps) {
  // Main photo state & preview
  const [mainPhotoPreview, setMainPhotoPreview] = useState<string>(
    String(row?.main_photo_url || "")
  );
  const mainPhotoInput = useRef<HTMLInputElement>(null);
  const galleryInputs = useRef<Array<HTMLInputElement | null>>([]);
  const [removeMainPhoto, setRemoveMainPhoto] = useState(false);
  const [replaceProductImages, setReplaceProductImages] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  function setInputFile(input: HTMLInputElement | null, file?: File) {
    if (!input) return;
    const transfer = new DataTransfer();
    if (file) transfer.items.add(file);
    input.files = transfer.files;
  }

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

  // Colors management state
  const initialColors = (() => {
    const raw = row?.colors;
    const fallbackTotalStock = Number(row?.stock ?? 50);
    if (Array.isArray(raw)) {
      const defaultStockPerColor = raw.length > 0 ? Math.max(0, Math.floor(fallbackTotalStock / raw.length)) : 10;
      return raw.map((c) =>
        typeof c === "string"
          ? { name: c, hex: resolveColorHex(c), stock: defaultStockPerColor }
          : {
            name: String(c.name || ""),
            hex: String(c.hex || resolveColorHex(String(c.name || ""))),
            stock: c.stock !== undefined && c.stock !== null ? Number(c.stock) : defaultStockPerColor,
          }
      );
    }
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const defaultStockPerColor = parsed.length > 0 ? Math.max(0, Math.floor(fallbackTotalStock / parsed.length)) : 10;
          return parsed.map((c) =>
            typeof c === "string"
              ? { name: c, hex: resolveColorHex(c), stock: defaultStockPerColor }
              : {
                name: String(c.name || ""),
                hex: String(c.hex || resolveColorHex(String(c.name || ""))),
                stock: c.stock !== undefined && c.stock !== null ? Number(c.stock) : defaultStockPerColor,
              }
          );
        }
      } catch {
        const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
        const defaultStockPerColor = parts.length > 0 ? Math.max(0, Math.floor(fallbackTotalStock / parts.length)) : 10;
        return parts.map((s) => ({
          name: s,
          hex: resolveColorHex(s),
          stock: defaultStockPerColor,
        }));
      }
    }
    return [
      { name: "Kuning Emas", hex: "#FFD700", stock: 25 },
      { name: "Putih", hex: "#FFFFFF", stock: 25 },
    ];
  })();

  const [activeColors, setActiveColors] = useState<Array<{ name: string; hex: string; stock: number }>>(initialColors);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#dc2626");
  const [newColorStock, setNewColorStock] = useState<number>(20);

  // MABA color stock state
  const [mabaGanjilStock, setMabaGanjilStock] = useState<number>(() => {
    const raw = row?.colors;
    const targetColor = String(row?.maba_color_ganjil || mabaGanjil || "Putih").toLowerCase();
    if (Array.isArray(raw)) {
      const found = raw.find(
        (c: unknown) =>
          typeof c === "object" &&
          c !== null &&
          "name" in c &&
          String((c as { name: string }).name).toLowerCase() === targetColor
      );
      if (found && typeof found === "object" && "stock" in found && (found as { stock?: number }).stock !== undefined) {
        return Number((found as { stock: number }).stock);
      }
    } else if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const found = parsed.find(
            (c: unknown) =>
              typeof c === "object" &&
              c !== null &&
              "name" in c &&
              String((c as { name: string }).name).toLowerCase() === targetColor
          );
          if (found && typeof found === "object" && "stock" in found && (found as { stock?: number }).stock !== undefined) {
            return Number((found as { stock: number }).stock);
          }
        }
      } catch {}
    }
    return 25;
  });

  const [mabaGenapStock, setMabaGenapStock] = useState<number>(() => {
    const raw = row?.colors;
    const targetColor = String(row?.maba_color_genap || mabaGenap || "Biru").toLowerCase();
    if (Array.isArray(raw)) {
      const found = raw.find(
        (c: unknown) =>
          typeof c === "object" &&
          c !== null &&
          "name" in c &&
          String((c as { name: string }).name).toLowerCase() === targetColor
      );
      if (found && typeof found === "object" && "stock" in found && (found as { stock?: number }).stock !== undefined) {
        return Number((found as { stock: number }).stock);
      }
    } else if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const found = parsed.find(
            (c: unknown) =>
              typeof c === "object" &&
              c !== null &&
              "name" in c &&
              String((c as { name: string }).name).toLowerCase() === targetColor
          );
          if (found && typeof found === "object" && "stock" in found && (found as { stock?: number }).stock !== undefined) {
            return Number((found as { stock: number }).stock);
          }
        }
      } catch {}
    }
    return 25;
  });

  // Stock state: calculated automatically from colors sum or MABA colors sum
  const currentStock = eventMaba
    ? (mabaGanjil.toLowerCase() === mabaGenap.toLowerCase() ? mabaGanjilStock : mabaGanjilStock + mabaGenapStock)
    : activeColors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0);


  function handleMultiImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 6) {
      setImageUploadError("Maksimal 6 foto produk. Silakan pilih ulang hingga 6 foto.");
      e.target.value = "";
      return;
    }
    if (!files.length) return;
    setImageUploadError("");
    setReplaceProductImages(true);
    setInputFile(mainPhotoInput.current, files[0]);
    setMainPhotoPreview(URL.createObjectURL(files[0]));
    setRemoveMainPhoto(false);
    setGalleryPreviews(Array.from({ length: 5 }, (_, idx) => {
      const file = files[idx + 1];
      setInputFile(galleryInputs.current[idx], file);
      return file ? URL.createObjectURL(file) : "";
    }));
    setDeletedGalleryIds(existingGalleryImages.map((img) => img.id));
    e.target.value = "";
  }

  function handleSlotImageChange(slotIdx: number, file: File | null) {
    if (!file) return;
    const existing = existingGalleryImages[slotIdx];
    if (existing) setDeletedGalleryIds((prev) => [...new Set([...prev, existing.id])]);
    const url = URL.createObjectURL(file);
    setGalleryPreviews((prev) => {
      const next = [...prev];
      next[slotIdx] = url;
      return next;
    });
  }

  function handleSlotImageRemove(slotIdx: number) {
    setInputFile(galleryInputs.current[slotIdx]);
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
    const colorStock = Number.isFinite(newColorStock) && newColorStock >= 0 ? Number(newColorStock) : 20;
    const nextColors = [...activeColors, { name: finalName, hex: newColorHex, stock: colorStock }];
    setActiveColors(nextColors);
    setNewColorName("");
    setNewColorStock(20);
  }

  function updateColorStock(idx: number, stockVal: number) {
    setActiveColors((prev) => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], stock: Math.max(0, stockVal) };
      }
      return next;
    });
  }

  function handleSelectTemplate(selected: ColorOption | null) {
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
            const nextColors = [...activeColors, { name: customName, hex: customHex, stock: newColorStock || 20 }];
            setActiveColors(nextColors);
          }
          setNewColorName(customName);
          setNewColorHex(customHex);
        }
      );
      return;
    }
    setNewColorName(selected.name || selected.value);
    setNewColorHex(selected.hex || resolveColorHex(selected.value));
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
          <p>Pilih hingga 6 gambar sekaligus untuk mengganti seluruh foto produk. Foto pertama menjadi Gambar 1 (Utama).</p>
          {imageUploadError && <p role="alert">{imageUploadError}</p>}
          <label className="primary-button dropzone-upload-btn">
            📁 Pilih Banyak Foto Sekaligus
            <input
              type="file"
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
                  ref={mainPhotoInput}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMainPhotoPreview(URL.createObjectURL(file));
                      setRemoveMainPhoto(false);
                    }
                  }}
                />
              </label>
              {mainPhotoPreview && (
                <button
                  type="button"
                  className="danger-button subtle-button slot-btn slot-hapus-btn"
                  onClick={() => {
                    setMainPhotoPreview("");
                    setInputFile(mainPhotoInput.current);
                    setRemoveMainPhoto(true);
                  }}
                >
                  🗑 Hapus
                </button>
              )}
            </div>
          </div>

          <input type="hidden" name="remove_main_photo" value={String(removeMainPhoto)} />
          <input type="hidden" name="replace_product_images" value={String(replaceProductImages)} />
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
                      ref={(input) => { galleryInputs.current[slotIdx] = input; }}
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
                {categoryOptions.map((cat: { label: string; value: string }) => (
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
              <span>Stok Total (Otomatis) <strong className="required-star">*</strong></span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type="number"
                  name="stock"
                  value={currentStock}
                  readOnly
                  style={{
                    background: "#f1f5f9",
                    cursor: "not-allowed",
                    fontWeight: 700,
                    color: currentStock > 0 ? "#0f172a" : "#ef4444",
                    borderColor: "#cbd5e1",
                    paddingRight: "70px",
                  }}
                  title="Stok total terkunci dan dihitung otomatis dari rincian stok masing-masing varian warna di Bagian 4 (Warna & Palet)."
                />
                <span
                  style={{
                    position: "absolute",
                    right: "10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#64748b",
                    pointerEvents: "none",
                  }}
                >
                  🔒 Terkunci
                </span>
              </div>
              <span className="field-subtext stock-subtext">
                {eventMaba
                  ? `🔒 Dihitung otomatis dari akumulasi stok warna MABA (Ganjil: ${mabaGanjilStock} unit + Genap: ${mabaGenapStock} unit = ${currentStock} unit).`
                  : activeColors.length > 0
                  ? `🔒 Dihitung otomatis dari akumulasi ${activeColors.length} varian warna (${currentStock} unit). Kelola stok per warna di Bagian 4.`
                  : `✓ Stok produk (${currentStock} unit).`}
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

          {eventMaba ? (
            <div className="span-two" style={{ marginTop: "4px", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
                🎓 Rincian Stok Warna Seragam MABA (dapat diedit di Bagian Pengaturan Event MABA di bawah):
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: mabaGanjilStock <= 0 ? "#fef2f2" : "#ffffff",
                    border: mabaGanjilStock <= 0 ? "1px solid #fca5a5" : "1px solid #cbd5e1",
                    color: mabaGanjilStock <= 0 ? "#ef4444" : "#1e293b",
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: resolveColorHex(mabaGanjil),
                      border: "1px solid rgba(0,0,0,0.15)",
                    }}
                  />
                  <span>NIM Ganjil ({mabaGanjil}):</span>
                  <strong style={{ color: mabaGanjilStock <= 0 ? "#ef4444" : "#003399" }}>
                    {mabaGanjilStock <= 0 ? "0 (Habis)" : `${mabaGanjilStock} unit`}
                  </strong>
                </span>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: mabaGenapStock <= 0 ? "#fef2f2" : "#ffffff",
                    border: mabaGenapStock <= 0 ? "1px solid #fca5a5" : "1px solid #cbd5e1",
                    color: mabaGenapStock <= 0 ? "#ef4444" : "#1e293b",
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: resolveColorHex(mabaGenap),
                      border: "1px solid rgba(0,0,0,0.15)",
                    }}
                  />
                  <span>NIM Genap ({mabaGenap}):</span>
                  <strong style={{ color: mabaGenapStock <= 0 ? "#ef4444" : "#003399" }}>
                    {mabaGenapStock <= 0 ? "0 (Habis)" : `${mabaGenapStock} unit`}
                  </strong>
                </span>
              </div>
            </div>
          ) : activeColors.length > 0 && (
            <div className="span-two" style={{ marginTop: "4px", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
                🎨 Rincian Stok per Varian Warna (dapat diedit langsung di Bagian 4 di bawah):
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {activeColors.map((col, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: (col.stock ?? 0) <= 0 ? "#fef2f2" : "#ffffff",
                      border: (col.stock ?? 0) <= 0 ? "1px solid #fca5a5" : "1px solid #cbd5e1",
                      color: (col.stock ?? 0) <= 0 ? "#ef4444" : "#1e293b",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: col.hex || resolveColorHex(col.name),
                        border: "1px solid rgba(0,0,0,0.15)",
                      }}
                    />
                    <span>{col.name}:</span>
                    <strong style={{ color: (col.stock ?? 0) <= 0 ? "#ef4444" : "#003399" }}>
                      {(col.stock ?? 0) <= 0 ? "0 (Habis)" : `${col.stock} unit`}
                    </strong>
                  </span>
                ))}
              </div>
            </div>
          )}
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
                            if (f) {
                              setSizeChartUrl(URL.createObjectURL(f));
                              setRemoveSizeChart(false);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="secondary-button subtle-button text-danger"
                        onClick={() => {
                          setSizeChartUrl(null);
                          setRemoveSizeChart(true);
                        }}
                      >
                        🗑 Hapus
                      </button>
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
                        if (f) {
                          setSizeChartUrl(URL.createObjectURL(f));
                          setRemoveSizeChart(false);
                        }
                      }}
                    />
                  </label>
                )}
                {removeSizeChart && <input type="hidden" name="remove_size_chart" value="true" />}
                <p className="size-chart-help">
                  Upload gambar tabel/panduan ukuran khusus (maks 2MB). Jika dikosongkan atau tidak diupload, produk otomatis tidak memiliki foto ukuran.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warna & Palet (Hanya tampil jika BUKAN produk Event MABA) */}
        {!eventMaba && (
          <div className="color-palette-section">
            <span className="field-section-label">Warna & Palet</span>

            {/* 1: Active Color Variants with individual stock inputs */}
            <div className="active-color-variants-list" style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
              {activeColors.map((col, idx) => {
                const hexVal = col.hex || resolveColorHex(col.name);
                const isWhite = hexVal.toUpperCase() === "#FFFFFF" || hexVal.toUpperCase() === "#FFF";
                const isOutOfStock = (col.stock ?? 0) <= 0;
                return (
                  <div
                    key={`${col.name}-${idx}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "#f8fafc",
                      border: isOutOfStock ? "1.5px dashed #ef4444" : "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    <span
                      className="color-dot-circle"
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: hexVal,
                        border: isWhite ? "1px solid #94a3b8" : "1px solid rgba(0,0,0,0.2)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 600, fontSize: "13px", color: "#1e293b" }}>{col.name}</span>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginLeft: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Stok:</span>
                      <input
                        type="number"
                        min="0"
                        value={col.stock ?? 0}
                        onChange={(e) => updateColorStock(idx, parseInt(e.target.value, 10) || 0)}
                        style={{
                          width: "60px",
                          height: "26px",
                          padding: "2px 6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          textAlign: "center",
                          border: "1px solid #cbd5e1",
                          borderRadius: "5px",
                          background: "#ffffff",
                          color: isOutOfStock ? "#ef4444" : "#0f172a",
                        }}
                        title={`Jumlah stok untuk varian ${col.name}`}
                      />
                    </div>

                    {isOutOfStock && (
                      <span style={{ fontSize: "10px", color: "#ef4444", fontWeight: 700, background: "#fee2e2", padding: "1px 5px", borderRadius: "4px" }}>
                        Habis
                      </span>
                    )}

                    <button
                      type="button"
                      className="remove-pill-btn"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        fontSize: "16px",
                        lineHeight: 1,
                        padding: "2px 4px",
                        marginLeft: "2px",
                      }}
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
                  </div>
                );
              })}
            </div>

            {/* 2 & 3: Color Template Dropdown, Name, Hex, Initial Stock, & Custom Palette Adder */}
            <div className="color-adder-row" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
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
                  onChange={(selected) => handleSelectTemplate(selected as SingleValue<ColorOption>)}
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

              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>Stok:</span>
                <input
                  type="number"
                  min="0"
                  placeholder="20"
                  value={newColorStock}
                  onChange={(e) => setNewColorStock(parseInt(e.target.value, 10) || 0)}
                  style={{
                    width: "65px",
                    height: "36px",
                    padding: "4px 8px",
                    fontSize: "13px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    textAlign: "center",
                  }}
                  title="Stok awal untuk warna baru"
                />
              </div>

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
                        const nextColors = [...activeColors, { name: customName, hex: customHex, stock: newColorStock || 20 }];
                        setActiveColors(nextColors);
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
            <p className="field-subtext">Pilih dari template, klik More... untuk palet kustom, atau gunakan kotak hex untuk menambah varian warna.</p>
          </div>
        )}

        {/* Hidden inputs for colors json */}
        {eventMaba ? (
          <input
            type="hidden"
            name="colors"
            value={JSON.stringify([
              { name: mabaGanjil, hex: resolveColorHex(mabaGanjil), stock: mabaGanjilStock },
              ...(mabaGenap.toLowerCase() !== mabaGanjil.toLowerCase()
                ? [{ name: mabaGenap, hex: resolveColorHex(mabaGenap), stock: mabaGenapStock }]
                : [])
            ])}
          />
        ) : (
          <input type="hidden" name="colors" value={JSON.stringify(activeColors)} />
        )}
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
              Tentukan warna seragam wajib yang otomatis terpilih dan terkunci di aplikasi toko sesuai digit terakhir NIM mahasiswa beserta jumlah stok masing-masing warna.
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
                    onChange={(sel) => {
                      const option = sel as SingleValue<ColorOption>;
                      if (!option) return;
                      if (option.value === "__MORE__") {
                        onOpenCustomColorPicker("maba_color_ganjil", mabaGanjil, undefined, (name) => setMabaGanjil(name));
                      } else {
                        setMabaGanjil(option.value || option.name || mabaGanjil);
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

                {/* Input Stok untuk Warna Ganjil */}
                <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <Icon name="Package" size={16} style={{ color: "#0088cc" }} />
                  <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                    Stok Warna Ganjil ({mabaGanjil}):
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={mabaGanjilStock}
                    onChange={(e) => setMabaGanjilStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    style={{
                      width: "80px",
                      height: "32px",
                      padding: "4px 8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      textAlign: "center",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      marginLeft: "auto",
                      background: mabaGanjilStock <= 0 ? "#fef2f2" : "#ffffff",
                      color: mabaGanjilStock <= 0 ? "#ef4444" : "#0f172a",
                    }}
                    title={`Stok untuk warna seragam NIM Ganjil (${mabaGanjil})`}
                  />
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>unit</span>
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
                    onChange={(sel) => {
                      const option = sel as SingleValue<ColorOption>;
                      if (!option) return;
                      if (option.value === "__MORE__") {
                        onOpenCustomColorPicker("maba_color_genap", mabaGenap, undefined, (name) => setMabaGenap(name));
                      } else {
                        setMabaGenap(option.value || option.name || mabaGenap);
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

                {/* Input Stok untuk Warna Genap */}
                <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <Icon name="Package" size={16} style={{ color: "#0088cc" }} />
                  <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                    Stok Warna Genap ({mabaGenap}):
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={mabaGenapStock}
                    onChange={(e) => setMabaGenapStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    style={{
                      width: "80px",
                      height: "32px",
                      padding: "4px 8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      textAlign: "center",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      marginLeft: "auto",
                      background: mabaGenapStock <= 0 ? "#fef2f2" : "#ffffff",
                      color: mabaGenapStock <= 0 ? "#ef4444" : "#0f172a",
                    }}
                    title={`Stok untuk warna seragam NIM Genap (${mabaGenap})`}
                  />
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>unit</span>
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
