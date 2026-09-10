import Link from "next/link";
import { Icon } from "@/components/icon";

type DashboardData = {
  stats: Record<string, number>;
  recentOrders: Array<Record<string, unknown>>;
};

const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export function DashboardView({ data, name }: { data: DashboardData; name: string }) {
  const cards = [
    { key: "revenue", label: "Pendapatan", icon: "CreditCard", href: "/admin/orders", value: money.format(data.stats.revenue || 0), tone: "blue" },
    { key: "orders", label: "Total pesanan", icon: "ShoppingBag", href: "/admin/orders", value: String(data.stats.orders || 0), tone: "purple" },
    { key: "products", label: "Produk aktif", icon: "Package", href: "/admin/products", value: String(data.stats.products || 0), tone: "green" },
    { key: "customers", label: "Pelanggan", icon: "Users", href: "/admin/users", value: String(data.stats.customers || 0), tone: "orange" },
  ];
  const alerts = [
    { value: data.stats.pending || 0, label: "pesanan perlu diproses", href: "/admin/orders", icon: "ShoppingBag" },
    { value: data.stats.lowStock || 0, label: "produk stok menipis", href: "/admin/products", icon: "ChartNoAxesCombined" },
    { value: data.stats.unreadChats || 0, label: "chat belum dibaca", href: "/admin/chats", icon: "MessagesSquare" },
    { value: data.stats.unreadReviews || 0, label: "ulasan menunggu", href: "/admin/reviews", icon: "Star" },
  ];
  return (
    <div className="page-stack">
      <section className="page-heading dashboard-heading">
        <div><span className="eyebrow">CYBER STORE</span><h1>Selamat datang, {name.split(" ")[0]}</h1><p>Berikut ringkasan aktivitas toko hari ini.</p></div>
        <div className="live-chip"><span className="live-dot" /> Sistem aktif</div>
      </section>
      <section className="stat-grid">
        {cards.map((card) => (
          <Link className={`stat-card ${card.tone}`} href={card.href} key={card.key}>
            <div className="stat-icon"><Icon name={card.icon} size={21} /></div>
            <div><span>{card.label}</span><strong>{card.value}</strong></div>
            <Icon className="stat-arrow" name="ArrowUpRight" size={17} />
          </Link>
        ))}
      </section>
      <section className="dashboard-grid">
        <div className="panel recent-panel">
          <div className="panel-title"><div><h2>Pesanan terbaru</h2><p>Transaksi yang baru masuk ke sistem</p></div><Link href="/admin/orders" className="subtle-button">Lihat semua <Icon name="ChevronRight" size={16} /></Link></div>
          {data.recentOrders.length ? (
            <div className="compact-list">
              {data.recentOrders.map((order) => (
                <Link href="/admin/orders" className="order-row" key={String(order.id)}>
                  <span className="order-icon"><Icon name="ShoppingBag" size={18} /></span>
                  <span className="order-main"><strong>{String(order.invoice_number)}</strong><small>{String(order.customer_name)}</small></span>
                  <span className={`status-pill status-${String(order.status)}`}>{String(order.status).replaceAll("_", " ")}</span>
                  <span className="order-price">{money.format(Number(order.grand_total || 0))}<small>{order.created_at ? date.format(new Date(String(order.created_at))) : "-"}</small></span>
                </Link>
              ))}
            </div>
          ) : <div className="empty-state"><Icon name="ShoppingBag" size={28} /><strong>Belum ada pesanan</strong><span>Pesanan baru akan muncul di sini.</span></div>}
        </div>
        <div className="panel attention-panel">
          <div className="panel-title"><div><h2>Perlu perhatian</h2><p>Pekerjaan yang sebaiknya ditinjau</p></div></div>
          <div className="attention-list">
            {alerts.map((alert) => (
              <Link href={alert.href} key={alert.label} className="attention-item">
                <span className="attention-icon"><Icon name={alert.icon} size={18} /></span>
                <span><strong>{alert.value}</strong><small>{alert.label}</small></span>
                <Icon name="ChevronRight" size={17} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
