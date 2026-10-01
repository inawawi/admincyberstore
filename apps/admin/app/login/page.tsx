import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import { currentAdmin } from "@/lib/auth";
import { rows } from "@/lib/db";
import { publicUrl } from "@/lib/utils";
import { LoginForm } from "@/components/login-form";
import { Icon } from "@/components/icon";

export const dynamic = "force-dynamic";

// Share the query between metadata and page rendering for this request only.
const getLoginBranding = cache(async () => {
  const settings = await rows<RowDataPacket & { key: string; value: string | null }>(
    "SELECT `key`, value FROM settings WHERE `key` IN ('store_name', 'store_logo', 'store_description', 'store_email')",
  );
  const values = Object.fromEntries(settings.map(({ key, value }) => [key, value?.trim() || ""]));
  return {
    name: values.store_name || "UBSI Cyber Store",
    logo: publicUrl(values.store_logo),
    description: values.store_description || "Kelola katalog, transaksi, pelanggan, dan layanan toko dalam satu tempat.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.store_email || "") ? values.store_email : null,
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const store = await getLoginBranding();
  return {
    title: { absolute: `Masuk Admin | ${store.name}` },
    description: `Masuk ke panel administrasi ${store.name}.`,
  };
}

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  const store = await getLoginBranding();
  const year = new Date().getFullYear();

  return (
    <main className="login-screen">
      <div className="login-orb login-orb-one" /><div className="login-orb login-orb-two" />
      <section className="login-window">
        <div className="login-visual">
          <div className="login-brand">
            <span className="app-icon large">
              {store.logo ? (
                <Image src={store.logo} alt={`Logo ${store.name}`} width={48} height={48} unoptimized style={{ objectFit: "contain", borderRadius: 10 }} />
              ) : <Icon name="Boxes" size={24} />}
            </span>
            <span><strong>{store.name}</strong><small>Pusat administrasi toko</small></span>
          </div>
          <div className="visual-copy">
            <span className="glass-chip"><Icon name="LayoutDashboard" size={15} /> Workspace {store.name}</span>
            <h2>Semua operasi toko,<br />dalam satu tampilan.</h2>
            <p>{store.description}</p>
          </div>
          <div className="floating-preview" aria-hidden="true"><div className="preview-head"><span /><span /><span /></div><div className="preview-content"><div className="preview-sidebar" /><div className="preview-main"><span /><div><i /><i /><i /></div><b /><b /></div></div></div>
        </div>
        <div className="login-panel">
          <LoginForm storeName={store.name} />
        </div>
      </section>
      <p className="login-footnote">
        &copy; Powered by BTI-BSI {year} {store.name} &middot; 
      </p>
    </main>
  );
}
