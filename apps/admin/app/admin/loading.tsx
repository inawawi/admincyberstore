import { CyberLoader } from "@/components/cyber-loader";

export default function Loading() {
  return (
    <div
      className="page-stack"
      style={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem 0",
      }}
    >
      <div
        className="detail-loading-box cyber-card"
        style={{ width: "100%", maxWidth: "820px" }}
      >
        <CyberLoader
          size="lg"
          text="MEMUAT DETAIL PANEL..."
          subtext="Mengambil Data & Konfigurasi Sistem..."
        />
      </div>
    </div>
  );
}
