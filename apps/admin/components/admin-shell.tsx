"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import type { ResourceMeta } from "@/types";

interface Props {
  user: { name?: unknown; role?: unknown; email?: unknown; photo?: unknown };
  resources: ResourceMeta[];
  storeSettings?: { name: string; logo: string | null };
  children: React.ReactNode;
}

interface NavItemConfig {
  key: string;
  href: string;
  label: string;
  icon: string;
  badge?: string;
}

interface NavSectionConfig {
  title: string;
  items?: NavItemConfig[];
  keys?: string[];
}

interface FloatingToast {
  id: string;
  type: "chat" | "review" | "order";
  title: string;
  message: string;
  url: string;
  time: string;
}

const navSections: NavSectionConfig[] = [
  {
    title: "Ringkasan",
    items: [{ key: "dashboard", href: "/admin", label: "Dashboard", icon: "LayoutDashboard" }],
  },
  {
    title: "Katalog",
    keys: ["products", "categories", "stock-movements"],
  },
  {
    title: "Transaksi",
    keys: ["orders", "chats", "reviews", "announcements"],
  },
  {
    title: "Master Data",
    keys: ["expeditions"],
  },
  {
    title: "Konten & Promo",
    keys: ["banners"],
  },
 
];

// Special badges matching TailAdmin style
const specialBadges: Record<string, string> = {
  "stock-movements": "NEW",
  "announcements": "NEW",
  "banners": "NEW",
};

/**
 * Pure synthesized Web Audio chime for Admin notifications.
 * Works without any external sound assets.
 */
function playAdminNotificationSound(type: "chat" | "review" | "order" | "default" = "default") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";

    let freq1 = 587.33; // D5
    let freq2 = 880.0; // A5
    if (type === "chat") {
      freq1 = 523.25; // C5
      freq2 = 1046.5; // C6 (crisp pleasant high ding)
    } else if (type === "review") {
      freq1 = 659.25; // E5
      freq2 = 987.77; // B5 (warm shimmer)
    } else if (type === "order") {
      freq1 = 440.0; // A4
      freq2 = 880.0; // A5
    }

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(freq1, now);
    osc.frequency.exponentialRampToValueAtTime(freq2, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.39);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 450);
  } catch {
    // Autoplay restrictions or audio disabled
  }
}

export function AdminShell({ user, resources, storeSettings, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [bellBadgeDismissed, setBellBadgeDismissed] = useState(false);
  const [viewedBadges, setViewedBadges] = useState<Record<string, boolean>>({});
  const [notifTab, setNotifTab] = useState<"all" | "chats" | "reviews" | "orders">("all");
  const [floatingToasts, setFloatingToasts] = useState<FloatingToast[]>([]);
  const [soundMuted, setSoundMuted] = useState(false);

  const [notifData, setNotifData] = useState<{
    unreadChats: number;
    unreadReviews: number;
    pendingOrders: number;
    totalUnread: number;
    recentChats: any[];
    recentReviews: any[];
    recentOrders: any[];
  }>({
    unreadChats: 0,
    unreadReviews: 0,
    pendingOrders: 0,
    totalUnread: 0,
    recentChats: [],
    recentReviews: [],
    recentOrders: [],
  });

  const prevCountsRef = useRef<{ chats: number; reviews: number; orders: number; initialized: boolean }>({
    chats: 0,
    reviews: 0,
    orders: 0,
    initialized: false,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Load viewed badges from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cyber-viewed-badges");
      if (saved) {
        setViewedBadges(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Mark a badge as viewed so it immediately disappears
  function markBadgeAsOpened(key: string) {
    setViewedBadges((prev) => {
      if (prev[key]) return prev;
      const next = { ...prev, [key]: true };
      try {
        localStorage.setItem("cyber-viewed-badges", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  // Clear specific category badges optimistically and sync backend
  async function handleMarkTypeAsRead(type: "chats" | "reviews" | "orders") {
    markBadgeAsOpened(type);
    setNotifData((prev) => {
      if (type === "chats") {
        const nextTotal = Math.max(0, prev.totalUnread - prev.unreadChats);
        return {
          ...prev,
          unreadChats: 0,
          totalUnread: nextTotal,
          recentChats: prev.recentChats.map((c) => ({ ...c, is_read: 1 })),
        };
      }
      if (type === "reviews") {
        const nextTotal = Math.max(0, prev.totalUnread - prev.unreadReviews);
        return {
          ...prev,
          unreadReviews: 0,
          totalUnread: nextTotal,
          recentReviews: prev.recentReviews.map((r) => ({ ...r, is_read: 1 })),
        };
      }
      if (type === "orders") {
        return {
          ...prev,
          pendingOrders: 0,
        };
      }
      return prev;
    });

    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
    } catch {
      // ignore
    }
  }

  // Automatically dismiss badge when navigating to the corresponding page
  useEffect(() => {
    const currentResource = pathname.replace(/^\/admin\/?/, "").split("?")[0].split("/")[0] || "dashboard";
    if (currentResource && currentResource !== "dashboard") {
      markBadgeAsOpened(currentResource);
      if (currentResource === "chats") handleMarkTypeAsRead("chats");
      if (currentResource === "reviews") handleMarkTypeAsRead("reviews");
      if (currentResource === "orders") handleMarkTypeAsRead("orders");
    }
  }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll notifications from API every 5.5s
  useEffect(() => {
    const isMuted = localStorage.getItem("cyber-admin-sound-muted") === "true";
    setSoundMuted(isMuted);

    let active = true;

    async function fetchNotifications() {
      try {
        const res = await fetch("/api/admin/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;

        setNotifData(data);

        if (prevCountsRef.current.initialized) {
          // Check for new chat messages
          if (data.unreadChats > prevCountsRef.current.chats) {
            setBellBadgeDismissed(false);
            setViewedBadges((prev) => {
              const next = { ...prev };
              delete next.chats;
              return next;
            });
            const currentMuted = localStorage.getItem("cyber-admin-sound-muted") === "true";
            if (!currentMuted) playAdminNotificationSound("chat");
            const latestChat = data.recentChats?.[0];
            const newToast: FloatingToast = {
              id: `chat-${Date.now()}`,
              type: "chat",
              title: `💬 Pesan Baru: ${latestChat?.customer_name || "Pelanggan"}`,
              message: latestChat?.message || "Pelanggan mengirimkan pesan baru.",
              url: `/admin/chats?chat_id=${latestChat?.chat_id || ""}`,
              time: "Baru saja",
            };
            setFloatingToasts((prev) => [newToast, ...prev.slice(0, 2)]);
          }

          // Check for new product reviews
          if (data.unreadReviews > prevCountsRef.current.reviews) {
            setBellBadgeDismissed(false);
            setViewedBadges((prev) => {
              const next = { ...prev };
              delete next.reviews;
              return next;
            });
            const currentMuted = localStorage.getItem("cyber-admin-sound-muted") === "true";
            if (!currentMuted) playAdminNotificationSound("review");
            const latestRev = data.recentReviews?.[0];
            const newToast: FloatingToast = {
              id: `review-${Date.now()}`,
              type: "review",
              title: `⭐ Ulasan Baru (${latestRev?.rating || 5}★)`,
              message: `${latestRev?.user_name || "Pembeli"}: "${latestRev?.comment || "Memberikan ulasan baru"}"`,
              url: `/admin/reviews?review_id=${latestRev?.id || ""}`,
              time: "Baru saja",
            };
            setFloatingToasts((prev) => [newToast, ...prev.slice(0, 2)]);
          }
        } else {
          prevCountsRef.current.initialized = true;
        }

        prevCountsRef.current.chats = data.unreadChats;
        prevCountsRef.current.reviews = data.unreadReviews;
        prevCountsRef.current.orders = data.pendingOrders;
      } catch {
        // ignore network error
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Auto-dismiss floating toasts after 6s
  useEffect(() => {
    if (!floatingToasts.length) return;
    const timer = setTimeout(() => {
      setFloatingToasts((prev) => prev.slice(0, -1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [floatingToasts]);

  function toggleSound() {
    const next = !soundMuted;
    setSoundMuted(next);
    localStorage.setItem("cyber-admin-sound-muted", String(next));
    if (!next) {
      playAdminNotificationSound("default");
    }
  }

  async function handleMarkAllRead() {
    setBellBadgeDismissed(true);
    setNotifData((prev) => ({
      ...prev,
      unreadChats: 0,
      unreadReviews: 0,
      totalUnread: 0,
      recentChats: prev.recentChats.map((c) => ({ ...c, is_read: 1 })),
      recentReviews: prev.recentReviews.map((r) => ({ ...r, is_read: 1 })),
    }));
    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      // ignore
    }
  }

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
  const appTitle = storeSettings?.name || "CyberStore";
  const userName = String(user.name || "Administrator");
  const userRole = String(user.role || "Admin");
  const userPhoto = user.photo ? `/storage/${String(user.photo).replace(/^\/?storage\/?/, "")}` : null;
  const firstName = userName.split(" ")[0] || "Admin";

  return (
    <div className="admin-layout">
      {/* ── Floating Realtime Notification Toast Container ── */}
      {floatingToasts.length > 0 && (
        <div className="admin-floating-notif-container">
          {floatingToasts.map((toast) => (
            <div key={toast.id} className={`admin-floating-notif-card type-${toast.type}`}>
              <div className="notif-card-icon">
                <Icon
                  name={toast.type === "chat" ? "MessagesSquare" : toast.type === "review" ? "Star" : "ShoppingBag"}
                  size={18}
                />
              </div>
              <div className="notif-card-content">
                <div className="notif-card-header">
                  <span className="notif-card-title">{toast.title}</span>
                  <span className="notif-card-time">{toast.time}</span>
                </div>
                <div className="notif-card-body">{toast.message}</div>
                <button
                  type="button"
                  className="notif-card-action-btn"
                  onClick={() => {
                    setFloatingToasts((prev) => prev.filter((t) => t.id !== toast.id));
                    if (toast.type === "chat") handleMarkTypeAsRead("chats");
                    if (toast.type === "review") handleMarkTypeAsRead("reviews");
                    router.push(toast.url);
                  }}
                >
                  Buka & Balas →
                </button>
              </div>
              <button
                type="button"
                className="notif-card-close-btn"
                onClick={() => setFloatingToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                title="Tutup"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Mobile Scrim ── */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-scrim-active"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (TailAdmin style) ── */}
      <aside
        className={`sidebar ${sidebarCollapsed ? "is-collapsed" : ""}`}
        style={
          typeof window !== "undefined" && window.innerWidth < 1024
            ? { transform: mobileSidebarOpen ? "translateX(0)" : "translateX(-105%)" }
            : undefined
        }
      >
        {/* Sidebar Brand Header */}
        <div className="sidebar-brand-header">
          <Link href="/admin" prefetch={false} className="brand-logo-link" onClick={() => setMobileSidebarOpen(false)}>
            {storeSettings?.logo ? (
              <Image
                unoptimized
                src={storeSettings.logo}
                alt={appTitle}
                width={34}
                height={34}
                className="brand-logo-img"
              />
            ) : (
              <div className="tailadmin-logo-icon">
                <span className="bar bar-1" />
                <span className="bar bar-2" />
                <span className="bar bar-3" />
              </div>
            )}
            {!sidebarCollapsed && (
              <span className="brand-logo-text">{appTitle}<span className="brand-logo-caption">Administration</span></span>
            )}
          </Link>
        </div>

        {/* Section Label: MENU */}
        <div className="sidebar-menu-wrapper">
          {!sidebarCollapsed && <span className="menu-group-label">MENU</span>}

          <nav className="sidebar-nav" aria-label="Navigasi admin">
            {navSections.map((section) => {
              const sectionResources = (section.keys || [])
                .map((k) => resourceMap.get(k))
                .filter(Boolean) as ResourceMeta[];
              const staticItems = section.items || [];

              if (!sectionResources.length && !staticItems.length) return null;

              return (
                <div key={section.title} className="sidebar-nav-group">
                  {/* Static items (e.g. Dashboard) */}
                  {staticItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        prefetch={false}
                        onClick={() => {
                          setMobileSidebarOpen(false);
                          markBadgeAsOpened(item.key);
                        }}
                        className={`tailadmin-nav-item ${isActive ? "active" : ""}`}
                        title={item.label}
                      >
                        <span className="tailadmin-nav-icon">
                          <Icon name={item.icon} size={19} />
                        </span>
                        {!sidebarCollapsed && (
                          <>
                            <span className="tailadmin-nav-text">{item.label}</span>
                            {item.badge && !viewedBadges[item.key] && !isActive && (
                              <span className="tailadmin-badge-new">{item.badge}</span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}

                  {/* Resource items with Dynamic & Auto-Dismiss Badges */}
                  {sectionResources.map((res) => {
                    const href = `/admin/${res.key}`;
                    const isCurrentPage = pathname.startsWith(href);
                    const isBadgeOpened = Boolean(viewedBadges[res.key]);

                    // Dynamic realtime badge counter (disappears immediately if current page or opened)
                    let dynamicCount = 0;
                    if (res.key === "chats" && !isCurrentPage && !isBadgeOpened) {
                      dynamicCount = notifData.unreadChats;
                    } else if (res.key === "reviews" && !isCurrentPage && !isBadgeOpened) {
                      dynamicCount = notifData.unreadReviews;
                    } else if (res.key === "orders" && !isCurrentPage && !isBadgeOpened) {
                      dynamicCount = notifData.pendingOrders;
                    }

                    // Static badges (e.g. "NEW") disappear when opened or currently on page
                    const staticBadge = (!isBadgeOpened && !isCurrentPage) ? specialBadges[res.key] : undefined;
                    const badgeText = dynamicCount > 0 ? String(dynamicCount) : staticBadge;

                    return (
                      <Link
                        key={res.key}
                        href={href}
                        prefetch={false}
                        onClick={() => {
                          setMobileSidebarOpen(false);
                          // Ketika sudah dibuka langsung hilang!
                          markBadgeAsOpened(res.key);
                          if (res.key === "chats") handleMarkTypeAsRead("chats");
                          if (res.key === "reviews") handleMarkTypeAsRead("reviews");
                          if (res.key === "orders") handleMarkTypeAsRead("orders");
                        }}
                        className={`tailadmin-nav-item ${isCurrentPage ? "active" : ""}`}
                        title={res.label}
                      >
                        <span className="tailadmin-nav-icon">
                          <Icon name={res.icon} size={19} />
                        </span>
                        {!sidebarCollapsed && (
                          <>
                            <span className="tailadmin-nav-text">{res.label}</span>
                            {badgeText && (
                              <span
                                className="tailadmin-badge-new"
                                style={
                                  dynamicCount > 0
                                    ? {
                                        background: res.key === "chats" ? "#6366f1" : res.key === "reviews" ? "#f59e0b" : "#ef4444",
                                        color: "#ffffff",
                                        fontWeight: 700,
                                        boxShadow: "0 0 8px rgba(0,0,0,0.2)",
                                      }
                                    : undefined
                                }
                              >
                                {badgeText}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / Logout */}
        <div className="sidebar-bottom-action">
          <button
            className="tailadmin-nav-item logout-item"
            onClick={logout}
            title="Keluar"
          >
            <span className="tailadmin-nav-icon danger">
              <Icon name="LogOut" size={19} />
            </span>
            {!sidebarCollapsed && <span className="tailadmin-nav-text">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content Area with Header ── */}
      <div className={`admin-main-wrapper ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* ── Topbar (TailAdmin style) ── */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Hamburger sidebar toggle */}
            <button
              className="tailadmin-toggle-btn"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  setMobileSidebarOpen((v) => !v);
                } else {
                  setSidebarCollapsed((v) => !v);
                }
              }}
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <Icon name="Menu" size={20} />
            </button>
          </div>

          

          {/* Spacer */}
          <div className="topbar-spacer" />

          {/* Topbar Right Controls */}
          <div className="topbar-right">
            {/* Audio Mute/Unmute toggle */}
            <button
              className="tailadmin-circle-btn"
              onClick={toggleSound}
              title={soundMuted ? "Bunyikan notifikasi suara" : "Senyapkan notifikasi suara"}
              aria-label="Toggle notification sound"
              style={{ color: soundMuted ? "#94a3b8" : "#003399" }}
            >
              <Icon name={soundMuted ? "VolumeX" : "Volume2"} size={18} />
            </button>

            {/* Theme Toggle Button */}
            <button
              className="tailadmin-circle-btn"
              onClick={toggleTheme}
              title="Ganti tema (Light / Dark)"
              aria-label="Toggle theme"
            >
              <Icon name="Moon" size={18} />
            </button>

            {/* Notification Bell with Dynamic Count Badge (immediately disappears on open) */}
            <div className="topbar-popover-container" ref={notifRef}>
              <button
                className="tailadmin-circle-btn"
                onClick={() => {
                  const next = !notificationsOpen;
                  setNotificationsOpen(next);
                  if (next) {
                    // Ketika lonceng dibuka, badge merah langsung hilang seketika!
                    setBellBadgeDismissed(true);
                    handleMarkAllRead();
                  }
                }}
                title="Notifikasi"
                aria-label="Notifications"
                style={{ position: "relative" }}
              >
                <Icon name="Bell" size={18} />
                {!bellBadgeDismissed && notifData.totalUnread > 0 ? (
                  <span className="tailadmin-notif-badge">
                    {notifData.totalUnread > 99 ? "99+" : notifData.totalUnread}
                  </span>
                ) : (
                  <span className="tailadmin-notif-dot" />
                )}
              </button>

              {notificationsOpen && (
                <div className="tailadmin-dropdown-menu notif-dropdown" style={{ width: "360px" }}>
                  <div className="dropdown-header" style={{ justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <strong>Notifikasi</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "0.72rem",
                        color: "#003399",
                        cursor: "pointer",
                        fontWeight: 600,
                        textDecoration: "underline",
                      }}
                    >
                      Tandai semua dibaca
                    </button>
                  </div>

                  {/* Notification Category Tabs */}
                  <div className="notif-dropdown-tabs">
                    <button
                      type="button"
                      className={`notif-tab-btn ${notifTab === "all" ? "active" : ""}`}
                      onClick={() => setNotifTab("all")}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      className={`notif-tab-btn ${notifTab === "chats" ? "active" : ""}`}
                      onClick={() => setNotifTab("chats")}
                    >
                      Chat
                      {notifData.unreadChats > 0 && <span className="notif-tab-count">{notifData.unreadChats}</span>}
                    </button>
                    <button
                      type="button"
                      className={`notif-tab-btn ${notifTab === "reviews" ? "active" : ""}`}
                      onClick={() => setNotifTab("reviews")}
                    >
                      Ulasan
                      {notifData.unreadReviews > 0 && <span className="notif-tab-count">{notifData.unreadReviews}</span>}
                    </button>
                    <button
                      type="button"
                      className={`notif-tab-btn ${notifTab === "orders" ? "active" : ""}`}
                      onClick={() => setNotifTab("orders")}
                    >
                      Pesanan
                      {notifData.pendingOrders > 0 && <span className="notif-tab-count">{notifData.pendingOrders}</span>}
                    </button>
                  </div>

                  {/* List of Notification Items */}
                  <div className="notif-dropdown-list" style={{ maxHeight: "330px", overflowY: "auto" }}>
                    {/* Chat items */}
                    {(notifTab === "all" || notifTab === "chats") &&
                      notifData.recentChats.map((c) => {
                        const avatarUrl = c.customer_photo
                          ? `/storage/${String(c.customer_photo).replace(/^\/?storage\/?/, "")}`
                          : null;
                        const initial = String(c.customer_name || "C").charAt(0).toUpperCase();

                        return (
                          <Link
                            key={`chat-${c.message_id || c.chat_id}`}
                            href={`/admin/chats?chat_id=${c.chat_id}`}
                            prefetch={false}
                            className="notif-dropdown-item"
                            onClick={() => {
                              setNotificationsOpen(false);
                              handleMarkTypeAsRead("chats");
                            }}
                          >
                            {avatarUrl ? (
                              <Image
                                unoptimized
                                src={avatarUrl}
                                alt={String(c.customer_name || "Customer")}
                                width={32}
                                height={32}
                                className="notif-dropdown-avatar"
                              />
                            ) : (
                              <div className="notif-dropdown-avatar-fallback">{initial}</div>
                            )}
                            <div className="notif-dropdown-body">
                              <div className="notif-dropdown-top">
                                <span className="notif-dropdown-sender">💬 {c.customer_name || "Pelanggan"}</span>
                                <span className="notif-dropdown-time">
                                  {c.created_at ? new Date(c.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                                </span>
                              </div>
                              <p className="notif-dropdown-snippet">{c.message}</p>
                            </div>
                          </Link>
                        );
                      })}

                    {/* Review items */}
                    {(notifTab === "all" || notifTab === "reviews") &&
                      notifData.recentReviews.map((r) => {
                        return (
                          <Link
                            key={`review-${r.id}`}
                            href={`/admin/reviews?review_id=${r.id}`}
                            prefetch={false}
                            className="notif-dropdown-item"
                            onClick={() => {
                              setNotificationsOpen(false);
                              handleMarkTypeAsRead("reviews");
                            }}
                          >
                            <div className="notif-card-icon" style={{ width: "32px", height: "32px", background: "#fffbeb", color: "#f59e0b" }}>
                              <Icon name="Star" size={16} />
                            </div>
                            <div className="notif-dropdown-body">
                              <div className="notif-dropdown-top">
                                <span className="notif-dropdown-sender">⭐ {r.user_name || "Pembeli"} ({r.rating}★)</span>
                                <span className="notif-dropdown-time">
                                  {r.created_at ? new Date(r.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                                </span>
                              </div>
                              <p className="notif-dropdown-snippet">
                                <strong>{r.product_name}</strong>: {r.comment || "Memberikan rating"}
                              </p>
                            </div>
                          </Link>
                        );
                      })}

                    {/* Order items */}
                    {(notifTab === "all" || notifTab === "orders") &&
                      notifData.recentOrders.map((o) => {
                        return (
                          <Link
                            key={`order-${o.id}`}
                            href={`/admin/orders?order_id=${o.encrypted_id || o.id}`}
                            prefetch={false}
                            className="notif-dropdown-item"
                            onClick={() => {
                              setNotificationsOpen(false);
                              handleMarkTypeAsRead("orders");
                            }}
                          >
                            <div className="notif-card-icon" style={{ width: "32px", height: "32px", background: "#ecfdf5", color: "#10b981" }}>
                              <Icon name="ShoppingBag" size={16} />
                            </div>
                            <div className="notif-dropdown-body">
                              <div className="notif-dropdown-top">
                                <span className="notif-dropdown-sender">📦 {o.invoice_number || `Order #${o.id}`}</span>
                                <span className="notif-dropdown-time">
                                  {o.created_at ? new Date(o.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                                </span>
                              </div>
                              <p className="notif-dropdown-snippet">
                                {o.customer_name || "Pelanggan"} • Rp {Number(o.grand_total || 0).toLocaleString("id-ID")}
                              </p>
                            </div>
                          </Link>
                        );
                      })}

                    {notifData.recentChats.length === 0 &&
                      notifData.recentReviews.length === 0 &&
                      notifData.recentOrders.length === 0 && (
                        <div className="notif-dropdown-empty">
                          <Icon name="BellOff" size={24} style={{ marginBottom: "6px", opacity: 0.5 }} />
                          <p>Belum ada notifikasi baru.</p>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Chip with dropdown */}
            <div className="topbar-popover-container" ref={dropdownRef}>
              <button
                className="tailadmin-user-btn"
                onClick={() => setUserDropdownOpen((v) => !v)}
                aria-label="Menu pengguna"
              >
                <div className="tailadmin-user-avatar">
                  {userPhoto ? (
                    <Image
                      unoptimized
                      src={userPhoto}
                      alt={userName}
                      width={36}
                      height={36}
                      className="avatar-img"
                    />
                  ) : (
                    <span>{userName.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <span className="tailadmin-user-name">{firstName}</span>
                <Icon name="ChevronDown" size={15} className={`chevron-indicator ${userDropdownOpen ? "open" : ""}`} />
              </button>

              {userDropdownOpen && (
                <div className="tailadmin-dropdown-menu profile-dropdown">
                  <div className="user-dropdown-info">
                    <strong>{userName}</strong>
                    <span className="user-dropdown-role">{userRole}</span>
                    <small className="user-dropdown-email">{String(user.email || "")}</small>
                  </div>
                  <div className="dropdown-divider" />
                  <Link
                    href="/admin/settings"
                    prefetch={false}
                    className="dropdown-menu-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Icon name="Settings" size={16} />
                    <span>Pengaturan Toko</span>
                  </Link>
                  <Link
                    href="/admin/users"
                    prefetch={false}
                    className="dropdown-menu-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Icon name="User" size={16} />
                    <span>Profil & Pengguna</span>
                  </Link>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-menu-item danger"
                    onClick={logout}
                  >
                    <Icon name="LogOut" size={16} />
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Content Area ── */}
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
