"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";

type MonthlySaleItem = {
  month: string;
  monthNum: number;
  orders: number;
  revenue: number;
  sales: number;
};

type DashboardData = {
  stats: Record<string, number>;
  recentOrders: Array<Record<string, unknown>>;
  monthlySales?: MonthlySaleItem[];
};

const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("id-ID");
const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export function DashboardView({ data, name }: { data: DashboardData; name: string }) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [chartMetric, setChartMetric] = useState<"orders" | "revenue">("orders");

  const customersCount = data.stats.customers || 0;
  const ordersCount = data.stats.orders || 0;
  const revenueVal = data.stats.revenue || 0;

  const alerts = [
    { value: data.stats.pending || 0, label: "Pesanan perlu diproses", href: "/admin/orders", icon: "ShoppingBag", tone: "blue" },
    { value: data.stats.lowStock || 0, label: "Produk stok menipis", href: "/admin/products", icon: "Package", tone: "orange" },
    { value: data.stats.unreadChats || 0, label: "Chat belum dibaca", href: "/admin/chats", icon: "MessagesSquare", tone: "purple" },
    { value: data.stats.unreadReviews || 0, label: "Ulasan menunggu", href: "/admin/reviews", icon: "Star", tone: "amber" },
  ];

  // Dynamic monthly sales data from order records
  const defaultMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlySalesData: MonthlySaleItem[] =
    data.monthlySales && data.monthlySales.length > 0
      ? data.monthlySales
      : defaultMonths.map((m, i) => ({ month: m, monthNum: i + 1, orders: 0, revenue: 0, sales: 0 }));

  // Calculate dynamic scale and Y-axis marks based on actual data
  const rawMax = Math.max(
    ...monthlySalesData.map((d) => (chartMetric === "orders" ? d.orders : d.revenue)),
    chartMetric === "orders" ? 10 : 500000
  );

  let maxBarValue: number;
  let yLabels: string[];

  if (chartMetric === "orders") {
    const step = Math.max(1, Math.ceil(rawMax / 4));
    maxBarValue = step * 4;
    yLabels = [
      number.format(maxBarValue),
      number.format(step * 3),
      number.format(step * 2),
      number.format(step),
      "0",
    ];
  } else {
    const step = Math.max(100000, Math.ceil(rawMax / 4 / 100000) * 100000);
    maxBarValue = step * 4;
    const formatCompact = (val: number) => {
      if (val === 0) return "0";
      if (val >= 1000000) return `${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M`;
      return `${Math.round(val / 1000)}k`;
    };
    yLabels = [
      formatCompact(maxBarValue),
      formatCompact(step * 3),
      formatCompact(step * 2),
      formatCompact(step),
      "0",
    ];
  }

  return (
    <div className="tailadmin-dashboard">
      <section className="premium-overview">
        <div>
          <span className="eyebrow">RINGKASAN BISNIS</span>
          <h1>Selamat datang, {name.split(" ")[0] || "Admin"}.</h1>
          <p>Pantau performa toko dan kelola aktivitas hari ini.</p>
        </div>
        <Link href="/admin/orders" className="primary-button premium-overview-link">
          Kelola pesanan <Icon name="ArrowUpRight" size={16} />
        </Link>
      </section>
      {/* ── Top Row: Stat Cards (Customers & Orders) ── */}
      <div className="tailadmin-top-grid">
        {/* Customers Card */}
        <Link href="/admin/users" className="tailadmin-card tailadmin-stat-box">
          <div className="stat-box-icon">
            <Icon name="Users" size={20} />
          </div>
          <div className="stat-box-content">
            <span className="stat-box-label">Total pelanggan</span>
            <div className="stat-box-bottom">
              <strong className="stat-box-value">{number.format(customersCount)}</strong>
              <Icon name="ArrowUpRight" size={18} />
            </div>
          </div>
        </Link>

        {/* Orders Card */}
        <Link href="/admin/orders" className="tailadmin-card tailadmin-stat-box">
          <div className="stat-box-icon">
            <Icon name="Package" size={20} />
          </div>
          <div className="stat-box-content">
            <span className="stat-box-label">Total pesanan</span>
            <div className="stat-box-bottom">
              <strong className="stat-box-value">{number.format(ordersCount)}</strong>
              <Icon name="ArrowUpRight" size={18} />
            </div>
          </div>
        </Link>
        <Link href="/admin/payments" className="tailadmin-card tailadmin-stat-box premium-revenue">
          <div className="stat-box-icon"><Icon name="CreditCard" size={20} /></div>
          <div className="stat-box-content">
            <span className="stat-box-label">Total pendapatan</span>
            <div className="stat-box-bottom">
              <strong className="stat-box-value">{money.format(revenueVal)}</strong>
              <Icon name="ArrowUpRight" size={18} />
            </div>
          </div>
        </Link>
      </div>

      {/* ── Middle Row: Monthly Sales & Action Center ── */}
      <div className="tailadmin-middle-grid">
        {/* Left: Monthly Sales Bar Chart */}
        <div className="tailadmin-card tailadmin-chart-card">
          <div className="target-card-header" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 className="card-title">Performa penjualan</h3>
              <p className="card-subtitle">
                {chartMetric === "orders"
                  ? "Jumlah pesanan masuk per bulan (Tahun ini)"
                  : "Total nominal penjualan per bulan (Tahun ini)"}
              </p>
            </div>
            {/* Metric Toggle: Orders vs Revenue */}
            <div style={{ display: "inline-flex", background: "var(--surface-solid)", padding: "3px", borderRadius: "8px", gap: "2px" }}>
              <button
                type="button"
                onClick={() => setChartMetric("orders")}
                style={{
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  border: "none",
                  background: chartMetric === "orders" ? "#17695f" : "transparent",
                  color: chartMetric === "orders" ? "#ffffff" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: chartMetric === "orders" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                }}
              >
                Pesanan
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("revenue")}
                style={{
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  border: "none",
                  background: chartMetric === "revenue" ? "#17695f" : "transparent",
                  color: chartMetric === "revenue" ? "#ffffff" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: chartMetric === "revenue" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                }}
              >
                Pendapatan
              </button>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="sales-chart-wrapper">
            {/* Y Axis Labels */}
            <div className="chart-y-axis">
              {yLabels.map((lbl, idx) => (
                <span key={`${lbl}-${idx}`}>{lbl}</span>
              ))}
            </div>

            {/* Chart Area */}
            <div className="chart-bars-area">
              {/* Horizontal Grid lines */}
              <div className="chart-grid-lines">
                <span className="grid-line" />
                <span className="grid-line" />
                <span className="grid-line" />
                <span className="grid-line" />
                <span className="grid-line bottom" />
              </div>

              {/* Bars */}
              <div className="chart-bars-container">
                {monthlySalesData.map((item, idx) => {
                  const currentVal = chartMetric === "orders" ? item.orders : item.revenue;
                  const barHeightPercent = maxBarValue > 0 ? (currentVal / maxBarValue) * 100 : 0;
                  const isHovered = hoveredBar === idx;

                  return (
                    <div
                      key={item.month}
                      className="chart-bar-column"
                      onMouseEnter={() => setHoveredBar(idx)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div className="chart-bar-tooltip">
                          <strong>{item.month}</strong>: {number.format(item.orders)} pesanan
                          {item.revenue > 0 && (
                            <div style={{ fontSize: "0.72rem", opacity: 0.95, marginTop: "2px" }}>
                              Rp {Number(item.revenue).toLocaleString("id-ID")}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="chart-bar-track">
                        <div
                          className={`chart-bar-fill ${isHovered ? "hovered" : ""}`}
                          style={{
                            height: currentVal > 0 ? `${Math.max(barHeightPercent, 4)}%` : "0%",
                            transition: "height 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        />
                      </div>
                      <span className="chart-x-label">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Perlu Perhatian (Tasks / Action Center) */}
        <div className="tailadmin-card tailadmin-attention-card">
          <div className="target-card-header">
            <div>
              <h3 className="card-title">Perlu Perhatian</h3>
              <p className="card-subtitle">Aktivitas mendesak yang perlu ditindaklanjuti</p>
            </div>
          </div>

          <div className="tailadmin-attention-list">
            {alerts.map((alert) => (
              <Link href={alert.href} key={alert.label} className="attention-card-item">
                <div className={`attention-item-icon ${alert.tone}`}>
                  <Icon name={alert.icon} size={18} />
                </div>
                <div className="attention-item-text">
                  <span className="attention-item-val">{alert.value}</span>
                  <span className="attention-item-label">{alert.label}</span>
                </div>
                <div className="attention-item-arrow">
                  <Icon name="ChevronRight" size={16} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Pesanan Terbaru (Recent Orders) ── */}
      <div className="tailadmin-card tailadmin-table-card">
        <div className="target-card-header table-header">
          <div>
            <h3 className="card-title">Pesanan Terbaru</h3>
            <p className="card-subtitle">Daftar transaksi pesanan terakhir yang masuk</p>
          </div>
          <Link href="/admin/orders" className="tailadmin-subtle-link">
            <span>Lihat semua pesanan</span>
            <Icon name="ChevronRight" size={15} />
          </Link>
        </div>

        {data.recentOrders.length ? (
          <div className="tailadmin-table-wrapper">
            <table className="tailadmin-table">
              <thead>
                <tr>
                  <th>No. Invoice</th>
                  <th>Pelanggan</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => {
                  const statusStr = String(order.status || "pending").toLowerCase();
                  let statusTone = "pending";
                  if (statusStr.includes("completed") || statusStr.includes("delivered") || statusStr.includes("success")) {
                    statusTone = "success";
                  } else if (statusStr.includes("cancelled") || statusStr.includes("failed")) {
                    statusTone = "danger";
                  } else if (statusStr.includes("shipped") || statusStr.includes("processing")) {
                    statusTone = "processing";
                  }

                  return (
                    <tr key={String(order.id)}>
                      <td>
                        <Link href={`/admin/orders?search=${encodeURIComponent(String(order.invoice_number || ""))}`} className="invoice-link">
                          <strong>{String(order.invoice_number)}</strong>
                        </Link>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <div className="customer-cell-avatar">
                            {String(order.customer_name || "P").slice(0, 1).toUpperCase()}
                          </div>
                          <span className="customer-cell-name">{String(order.customer_name || "Pelanggan")}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`tailadmin-status-pill ${statusTone}`}>
                          {statusStr.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>
                        <strong className="order-total-text">{money.format(Number(order.grand_total || 0))}</strong>
                      </td>
                      <td>
                        <span className="order-date-text">
                          {order.created_at ? date.format(new Date(String(order.created_at))) : "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tailadmin-empty-box">
            <div className="empty-box-icon">
              <Icon name="ShoppingBag" size={32} />
            </div>
            <strong>Belum ada transaksi pesanan</strong>
            <p>Pesanan baru dari pelanggan akan otomatis muncul di sini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
