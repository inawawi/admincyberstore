import type { StylesConfig } from "react-select";
import { mabaColorOptions } from "@/lib/constants";
import type { ColorOption, ParsedStockColor } from "./types";

export { mabaColorOptions };

export const mabaHexMap: Record<string, string> = Object.fromEntries(
  mabaColorOptions.map((opt) => [opt.value, opt.hex])
);

export const COLOR_PALETTE_TEMPLATES: Array<{ name: string; hex: string }> = [
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

export function resolveColorHex(name: string): string {
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

export const colorTemplateOptions = COLOR_PALETTE_TEMPLATES.map((t) => ({
  value: t.name,
  label: `${t.name} (${t.hex})`,
  hex: t.hex,
  name: t.name,
}));

export const colorTemplateOptionsWithMore = [
  ...colorTemplateOptions,
  {
    value: "__MORE__",
    label: "🎨 + More (Palet Warna)...",
    hex: "#8b5cf6",
    name: "+ More (Palet Warna)...",
  },
];

export const mabaSelectOptions = mabaColorOptions.map((opt) => ({
  value: opt.value,
  label: `${opt.value} (${opt.hex})`,
  hex: opt.hex,
  name: opt.value,
}));

export const mabaSelectOptionsWithMore = [
  ...mabaSelectOptions,
  {
    value: "__MORE__",
    label: "🎨 + More (Palet Warna)...",
    hex: "#8b5cf6",
    name: "+ More (Palet Warna)...",
  },
];

export const formatColorOptionLabel = (option: { label?: string; value: string; hex?: string; name?: string }) => {
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

export function parseStockColor(value: unknown): ParsedStockColor {
  if (typeof value === "string") {
    return { name: value, hex: resolveColorHex(value) };
  }
  const color = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const name = String(color.name || "");
  return {
    name,
    hex: String(color.hex || resolveColorHex(name)),
    stock: color.stock !== undefined ? Number(color.stock) : undefined,
  };
}

export const reactSelectColorStyles: StylesConfig<ColorOption> = {
  control: (base, state) => ({
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
  valueContainer: (base) => ({
    ...base,
    height: "36px",
    padding: "0 10px",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    color: "var(--text)",
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--text)",
    display: "flex",
    alignItems: "center",
  }),
  placeholder: (base) => ({
    ...base,
    color: "var(--muted)",
    fontSize: "13px",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--surface-raised)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
    zIndex: 99999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 99999,
  }),
  option: (base, state) => ({
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
