import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { Icon } from "@/components/icon";

export const metadata = { title: "Masuk Admin" };

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <main className="login-screen">
      <div className="login-orb login-orb-one" /><div className="login-orb login-orb-two" />
      <section className="login-window">
        <div className="login-visual">
          <div className="login-brand"><span className="app-icon large"><Icon name="Boxes" size={24} /></span><span><strong>Cyber Store</strong><small>Commerce control center</small></span></div>
          <div className="visual-copy"><span className="glass-chip"><Icon name="LayoutDashboard" size={15} /> Fluent workspace</span><h2>Semua operasi toko,<br />dalam satu tampilan.</h2><p>Kelola katalog, transaksi, pelanggan, dan layanan dengan antarmuka yang terasa familiar.</p></div>
          <div className="floating-preview"><div className="preview-head"><span /><span /><span /></div><div className="preview-content"><div className="preview-sidebar" /><div className="preview-main"><span /><div><i /><i /><i /></div><b /><b /></div></div></div>
        </div>
        <div className="login-panel"><div className="login-window-controls" aria-hidden="true"><span>—</span><span>□</span><span>×</span></div><LoginForm /></div>
      </section>
      <p className="login-footnote">Cyber Store Next.js • Fluent UI inspired</p>
    </main>
  );
}
