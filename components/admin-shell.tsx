"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import type { ResourceMeta } from "@/types";

interface Props {
  user: { name?: unknown; role?: unknown; email?: unknown };
  resources: ResourceMeta[];
  children: React.ReactNode;
}

const navSections = [
  {
    title: "Ringkasan",
    items: [
      { key: "dashboard", href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    title: "Katalog",
    keys: ["categories", "products", "stock-movements"],
  },
  {
    title: "Transaksi",
    keys: ["orders", "payments", "chats", "reviews", "announcements"],
  },
  {
    title: "Master Data",
    keys: ["expeditions"],
  },
  {
    title: "Pengaturan",
    keys: ["settings"],
  },
  {
    title: "Banner",
    keys: ["banners"],
  },
  {
    title: "Pengguna",
    keys: ["users"],
  },
];

export function AdminShell({ user, resources, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("cyber-theme", next);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const resourceMap = new Map(resources.map((r) => [r.key, r]));

  return (
    <div className={`desktop-frame ${isMaximized ? "is-maximized-frame" : ""}`}>
      {/* Windows 11 Ambient Wallpaper Orbs */}
      <div className="wallpaper-orb wallpaper-orb-one" />
      <div className="wallpaper-orb wallpaper-orb-two" />

      {/* Minimized Restore Bar */}
      {isMinimized && (
        <div className="minimized-dock-bar">
          <button className="dock-restore-btn" onClick={() => setIsMinimized(false)}>
            <span className="app-icon"><Icon name="Boxes" size={16} /></span>
            <strong>Cyber Store Admin</strong>
            <span className="dock-tag">Klik untuk pulihkan</span>
          </button>
        </div>
      )}

      {/* Main Glassmorphic Windows 11 App Window */}
      <div className={`app-window ${isMaximized ? "is-maximized" : ""} ${isMinimized ? "is-minimized" : ""}`}>
        {/* Titlebar */}
        <header className="titlebar">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Buka menu">
            <Icon name="Menu" size={18} />
          </button>
          <Link href="/admin" className="titlebar-brand">
            <span className="app-icon"><Icon name="Boxes" size={16} /></span>
            <span>Cyber Store Admin</span>
          </Link>
          <div className="titlebar-drag" />
          <div className="window-controls">
            <button
              type="button"
              className="window-btn"
              title="Minimize"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              —
            </button>
            <button
              type="button"
              className="window-btn"
              title={isMaximized ? "Restore Window" : "Maximize Window"}
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? "❐" : "□"}
            </button>
          </div>
        </header>

        {!isMinimized && (
          <div className="window-body">
            {sidebarOpen && <button className="sidebar-scrim" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)} />}
            
            {/* Windows 11 Fluent Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? "is-open" : ""}`}>
              {/* User Profile Card */}
              <div className="sidebar-profile">
                <div className="avatar">{String(user.name || "A").slice(0, 1).toUpperCase()}</div>
                <div className="profile-copy">
                  <strong>{String(user.name || "Administrator")}</strong>
                  <span>{String(user.role || "admin")}</span>
                </div>
                <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu">
                  <Icon name="X" size={18} />
                </button>
              </div>

              {/* Grouped Sidebar Nav with Windows 11 Vibrant Icon Badges */}
              <nav className="nav-list" aria-label="Navigasi admin">
                {navSections.map((section) => {
                  const sectionResources = (section.keys || [])
                    .map((k) => resourceMap.get(k))
                    .filter(Boolean) as ResourceMeta[];

                  const staticItems = section.items || [];

                  if (!sectionResources.length && !staticItems.length) return null;

                  return (
                    <div key={section.title} className="nav-group-box">
                      <span className="nav-section-label">{section.title}</span>

                      {staticItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.key}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`nav-item ${isActive ? "active" : ""}`}
                          >
                            <span className="nav-icon-badge nav-icon-dashboard">
                              <Icon name={item.icon} size={17} />
                            </span>
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}

                      {sectionResources.map((res) => {
                        const href = `/admin/${res.key}`;
                        const isActive = pathname.startsWith(href);
                        return (
                          <Link
                            key={res.key}
                            href={href}
                            onClick={() => setSidebarOpen(false)}
                            className={`nav-item ${isActive ? "active" : ""}`}
                          >
                            <span className={`nav-icon-badge nav-icon-${res.key}`}>
                              <Icon name={res.icon} size={17} />
                            </span>
                            <span>{res.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </nav>

              {/* Sidebar Footer Controls */}
              <div className="sidebar-footer">
                <button className="nav-item button-reset" onClick={toggleTheme}>
                  <span className="nav-icon-badge nav-icon-theme"><Icon name="Moon" size={17} /></span>
                  <span>Ganti tema</span>
                </button>
                <button className="nav-item button-reset danger-text" onClick={logout}>
                  <span className="nav-icon-badge nav-icon-logout"><Icon name="LogOut" size={17} /></span>
                  <span>Keluar</span>
                </button>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="content-area">{children}</main>
          </div>
        )}
      </div>
    </div>
  );
}
