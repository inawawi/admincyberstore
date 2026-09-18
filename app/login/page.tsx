import { redirect } from "next/navigation";
import Image from "next/image";
import { currentAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { Icon } from "@/components/icon";
import { rows } from "@/lib/db";
import { publicUrl } from "@/lib/utils";
import type { RowDataPacket } from "mysql2";

export const metadata = { title: "Masuk Admin" };

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");

  const settingsRows = await rows<RowDataPacket & { key: string; value: string | null }>(
    "SELECT `key`, value FROM settings WHERE `key` IN ('store_name', 'store_logo')"
  );
  const settingsMap = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
  const storeName = settingsMap.store_name || "Cyber Store";
  const storeLogo = publicUrl(settingsMap.store_logo);

  return (
    <main className="login-screen">
      <div className="login-orb login-orb-one" /><div className="login-orb login-orb-two" />
      <section className="login-window">
        <div className="login-visual">
          <div className="login-brand">
            <span
              className="app-icon large"
              style={storeLogo ? { background: "#ffffff", padding: 4, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" } : undefined}
            >
              {storeLogo ? (
                <Image
                  unoptimized
                  src={storeLogo}
                  alt={storeName}
                  width={34}
                  height={34}
                  style={{ width: 34, height: 34, objectFit: "contain", borderRadius: 8 }}
                />
              ) : (
                <Icon name="Boxes" size={24} />
              )}
            </span>
            <span><strong>{storeName}</strong><small>Commerce control center</small></span>
          </div>
          <div className="login-hero-block">
            <span className="login-tag-badge">
              <Icon name="ShieldCheck" size={14} />
              <span>Sistem Operasional Store • Terintegrasi</span>
            </span>
            <h2 className="login-hero-title">
              Pusat Kendali E-Commerce & Logistik Terpadu
            </h2>
            <p className="login-hero-desc">
              Kelola katalog merchandise resmi, transaksi pelanggan, aturan MABA, dan integrasi kurir dalam satu ekosistem terpadu.
            </p>
          </div>

          <div className="login-features-list">
            <div className="login-feature-card">
              <div className="login-feature-icon">
                <Icon name="Truck" size={17} />
              </div>
              <div className="login-feature-text">
                <h4>Automasi Pesanan & Resi Pengiriman</h4>
                <p>Sinkronisasi status kurir JNE, J&T, SiCepat dan verifikasi Midtrans instan.</p>
              </div>
            </div>

            <div className="login-feature-card">
              <div className="login-feature-icon">
                <Icon name="Package" size={17} />
              </div>
              <div className="login-feature-text">
                <h4>Distribusi Seragam Mahasiswa Baru</h4>
                <p>Penentuan otomatis warna seragam ganjil/genap NIM & manajemen multi-ukuran.</p>
              </div>
            </div>

            <div className="login-feature-card">
              <div className="login-feature-icon">
                <Icon name="MessageSquare" size={17} />
              </div>
              <div className="login-feature-text">
                <h4>Pusat Komunikasi & Ulasan</h4>
                <p>Layanan tiket pesan langsung pelanggan dan moderasi ulasan bintang produk.</p>
              </div>
            </div>
          </div>

          <div className="login-visual-footer">
            <div className="login-live-indicator">
              <span className="login-live-dot" />
              <span>Server Aktif & Sinkron</span>
            </div>
            <span>Enkripsi TLS 1.3 • Sesi Aman</span>
          </div>
        </div>
        <div className="login-panel">
          <LoginForm />
        </div>
      </section>
      <p className="login-footnote">Cyber Store Next.js • Fluent UI inspired</p>
    </main>
  );
}

