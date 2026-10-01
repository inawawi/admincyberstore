"use client";

import React from "react";
import Image from "next/image";
import Select from "react-select";
import type { ResourceField } from "@/types";
import { Icon } from "@/components/icon";
import { fieldDefault, isEnabled } from "../common/utils";

export interface EditorFieldProps {
  field: ResourceField;
  row: Record<string, unknown> | null;
  onToggle?: (checked: boolean) => void;
  currentUser?: { id: number; role: string; name?: string; email?: string } | null;
}

export function EditorField({
  field,
  row,
  onToggle,
  currentUser,
}: EditorFieldProps) {
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
    const selectedOption = field.options?.find((option: { label: string; value: string }) => option.value === selectedValue) || null;
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
    let options = field.options;
    const isRoleField = field.key === "role";
    const isRestrictedRole = isRoleField && currentUser?.role !== "superadmin";

    if (isRestrictedRole) {
      options = field.options?.filter((opt: { label: string; value: string }) => opt.value === "customer");
    }

    return (
      <label className="field-label">
        <span>{field.label}{field.required && " *"}</span>
        <select
          name={field.key}
          defaultValue={value}
          required={field.required}
          disabled={field.readonly || (isRestrictedRole && row?.role !== "customer" && !!row)}
          className="field-select-control"
          style={{ backgroundColor: "var(--surface-solid, #ffffff)", color: "var(--text, #0f172a)" }}
        >
          {field.placeholder && <option value="" disabled style={{ backgroundColor: "#ffffff", color: "#64748b" }}>{field.placeholder}</option>}
          {options?.map((option: { label: string; value: string }) => (
            <option
              value={option.value}
              key={option.value}
              style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
            >
              {option.label}
            </option>
          ))}
        </select>
        {isRestrictedRole && (
          <small className="field-help" style={{ color: "#e11d48", fontWeight: 600 }}>
            Hanya Superadmin yang berhak menetapkan peran Admin atau Superadmin.
          </small>
        )}
        {field.placeholder && !isRestrictedRole && <small className="field-help">{field.placeholder}</small>}
      </label>
    );
  }

  if (field.kind === "image") {
    const rawPath =
      field.key === "size_chart_file"
        ? row?.size_chart
        : field.key === "image_file"
          ? (row?.image_path || row?.image)
          : field.key === "photo_file"
            ? row?.photo
            : field.key === "main_photo_file"
              ? row?.main_photo
              : (row?.[field.key] || row?.image_path || row?.photo || row?.image || row?.main_photo);

    const existingUrl =
      rawPath && typeof rawPath === "string"
        ? /^https?:\/\//i.test(rawPath)
          ? rawPath
          : `/storage/${rawPath.replace(/^\/?storage\/?/, "")}`
        : null;

    const isAvatar = field.key === "photo_file";

    return (
      <label className="field-label span-two">
        <span>{field.label}{field.required && " *"}</span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "4px" }}>
          {existingUrl ? (
            <div
              style={{
                position: "relative",
                width: isAvatar ? 52 : 72,
                height: isAvatar ? 52 : 44,
                borderRadius: isAvatar ? "50%" : 8,
                overflow: "hidden",
                border: "1px solid var(--border)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                flexShrink: 0,
                background: "var(--surface)",
              }}
            >
              <Image
                unoptimized
                src={existingUrl}
                alt="Gambar saat ini"
                width={isAvatar ? 52 : 72}
                height={isAvatar ? 52 : 44}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: isAvatar ? 52 : 72,
                height: isAvatar ? 52 : 44,
                borderRadius: isAvatar ? "50%" : 8,
                border: "1px dashed var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: "var(--surface-hover)",
                color: "var(--muted)",
              }}
            >
              <Icon name={isAvatar ? "User" : "GalleryHorizontalEnd"} size={20} />
            </div>
          )}
          <span className="file-input" style={{ flex: 1 }}>
            <Icon name="Upload" size={18} />
            <input
              type="file"
              name={field.key}
              accept="image/jpeg,image/png,image/webp"
              required={field.required && !row}
            />
            <small>{field.placeholder || "Pilih berkas gambar (JPG, PNG, atau WEBP)"}</small>
            {existingUrl && (
              <a className="file-current" href={existingUrl} target="_blank" rel="noreferrer">
                Buka berkas asli
              </a>
            )}
          </span>
        </div>
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
