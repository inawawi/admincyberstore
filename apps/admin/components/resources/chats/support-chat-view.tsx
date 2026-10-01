"use client";

import { FormEvent, useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/icon";
import type { ResourceMeta } from "@/types";
import { SweetAlert } from "@/components/sweet-alert";
import { CyberLoader } from "@/components/cyber-loader";
import { encryptOrderId } from "@/lib/id-cipher";
import { money, date, highlightMatch, getErrorMessage } from "../common/utils";

export function SupportChatView({
  meta,
  result,
  search,
  chatId = "",
  initialChatDetail = null,
}: {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>>; total: number; page: number; perPage: number; pages: number };
  search: string;
  chatId?: string;
  initialChatDetail?: {
    chat: Record<string, unknown>;
    messages: Array<Record<string, unknown>>;
    customerOrders: Array<Record<string, unknown>>;
  } | null;
}) {
  const router = useRouter();
  const [chatList, setChatList] = useState<Array<Record<string, unknown>>>(result.data);
  const [searchVal, setSearchVal] = useState(search);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<Record<string, unknown>>>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [selectedChatDetail, setSelectedChatDetail] = useState<{
    chat: Record<string, unknown>;
    messages: Array<Record<string, unknown>>;
    customerOrders: Array<Record<string, unknown>>;
  } | null>(initialChatDetail);

  useEffect(() => {
    setSearchVal(search);
  }, [search]);

  // Real-time client-side filtered conversation list
  const filteredChatList = useMemo(() => {
    const q = searchVal.trim().toLowerCase();
    if (!q) return chatList;
    return chatList.filter((c) => {
      const name = String(c.customer_name || "").toLowerCase();
      const email = String(c.customer_email || "").toLowerCase();
      const phone = String(c.customer_phone || "").toLowerCase();
      const msg = String(c.last_message || "").toLowerCase();
      const subject = String(c.subject || "").toLowerCase();
      const prod = String(c.linked_product_name || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        msg.includes(q) ||
        subject.includes(q) ||
        prod.includes(q)
      );
    });
  }, [chatList, searchVal]);

  // Close recommendations on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live Shopee-style recommendations search
  useEffect(() => {
    const q = searchVal.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 1. Instant local matching
    const localMatches = chatList.filter((c) => {
      const name = String(c.customer_name || "").toLowerCase();
      const email = String(c.customer_email || "").toLowerCase();
      const phone = String(c.customer_phone || "").toLowerCase();
      const msg = String(c.last_message || "").toLowerCase();
      const subject = String(c.subject || "").toLowerCase();
      const prod = String(c.linked_product_name || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        msg.includes(q) ||
        subject.includes(q) ||
        prod.includes(q)
      );
    });

    setSuggestions(localMatches);
    setShowSuggestions(true);

    // 2. Fetch server matches to ensure all customers/chats are recommended
    const timer = setTimeout(async () => {
      try {
        setIsSearchingSuggestions(true);
        const res = await fetch(`/api/admin/resources/chats?search=${encodeURIComponent(q)}&perPage=8`);
        if (res.ok) {
          const data = await res.json();
          if (data?.data && Array.isArray(data.data)) {
            const serverData = data.data as Array<Record<string, unknown>>;
            const map = new Map<string, Record<string, unknown>>();
            [...localMatches, ...serverData].forEach((item) => {
              map.set(String(item.id), item);
            });
            setSuggestions(Array.from(map.values()).slice(0, 8));
          }
        }
      } catch {
        // ignore
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchVal, chatList]);

  // Sync URL search query with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal !== search) {
        const params = new URLSearchParams();
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (selectedChatDetail?.chat?.id) params.set("chat_id", String(selectedChatDetail.chat.id));
        const queryStr = params.toString();
        router.replace(`/admin/chats${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchVal, search, selectedChatDetail?.chat?.id, router]);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedChatDetail?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChatDetail?.messages]);

  // Web Audio chime for incoming customer chat message
  function playCustomerChatDing() {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") ctx.resume().catch(() => { });
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.1);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.33);
      setTimeout(() => { ctx.close().catch(() => { }); }, 400);
    } catch { }
  }

  // Active chat ID for realtime polling
  const activeChatId = selectedChatDetail?.chat?.id ? Number(selectedChatDetail.chat.id) : null;
  const messagesRef = useRef<Array<Record<string, unknown>>>(selectedChatDetail?.messages || []);

  useEffect(() => {
    messagesRef.current = selectedChatDetail?.messages || [];
  }, [selectedChatDetail?.messages]);

  // Real-time synchronization for the currently active chat
  useEffect(() => {
    if (!activeChatId) return;
    let active = true;

    async function pollActiveChat() {
      try {
        const res = await fetch(`/api/admin/resources/chats/${activeChatId}`);
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active) return;

        const prevMsgs = messagesRef.current;
        const newMsgs = data.messages || [];

        if (newMsgs.length > prevMsgs.length) {
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg?.sender_type === "customer") {
            playCustomerChatDing();
          }
          setSelectedChatDetail(data);
          setChatList((prev) =>
            prev.map((c) =>
              Number(c.id) === activeChatId
                ? {
                  ...c,
                  last_message: lastMsg?.message || c.last_message,
                  last_message_at: lastMsg?.created_at || c.last_message_at,
                  unread_count: 0,
                }
                : c
            )
          );
        }
      } catch {
        // ignore
      }
    }

    const interval = setInterval(pollActiveChat, 2600);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeChatId]);

  // Periodic refresh for conversations list (every 6.5s)
  useEffect(() => {
    let active = true;
    async function pollChatList() {
      try {
        const res = await fetch("/api/admin/resources/chats?perPage=25");
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active || !data?.data) return;

        setChatList(() => {
          return data.data.map((c: unknown) => {
            const chat = c as Record<string, unknown>;
            if (activeChatId && Number(chat.id) === activeChatId) {
              return { ...chat, unread_count: 0 };
            }
            return chat;
          });
        });
      } catch {
        // ignore
      }
    }

    const interval = setInterval(pollChatList, 6500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeChatId]);

  async function openChat(chat: Record<string, unknown>) {
    const id = Number(chat.id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/resources/chats/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat detail obrolan.");
      setSelectedChatDetail(data);

      setChatList((prev) =>
        prev.map((c) => (Number(c.id) === id ? { ...c, unread_count: 0 } : c))
      );

      const url = new URL(window.location.href);
      url.searchParams.set("chat_id", String(id));
      window.history.pushState({}, "", url.pathname + url.search);
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal membuka obrolan."), type: "error" });
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleClearCache() {
    setClearingCache(true);
    try {
      const res = await fetch("/api/admin/cache/clear", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membersihkan cache.");
      setMessage({ text: "Cache chat & customer berhasil dibersihkan!", type: "success" });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal membersihkan cache."), type: "error" });
    } finally {
      setClearingCache(false);
    }
  }

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (selectedChatDetail?.chat?.id) params.set("chat_id", String(selectedChatDetail.chat.id));
    router.push(`/admin/chats?${params.toString()}`);
  }

  async function handleSendReply(e: FormEvent) {
    e.preventDefault();
    if (!selectedChatDetail?.chat?.id || !replyText.trim() || sendingReply) return;
    const text = replyText.trim();
    const activeId = Number(selectedChatDetail.chat.id);
    setSendingReply(true);

    try {
      const res = await fetch(`/api/admin/resources/chats/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirim pesan balasan.");

      const newMsg = {
        id: Date.now(),
        chat_id: activeId,
        sender_type: "admin",
        sender_id: null,
        sender_name: "Admin",
        message: text,
        is_read: 0,
        created_at: new Date().toISOString(),
      };

      setSelectedChatDetail((prev) =>
        prev
          ? {
            ...prev,
            chat: { ...prev.chat, last_message_at: new Date().toISOString() },
            messages: [...prev.messages, newMsg],
          }
          : null
      );

      setChatList((prev) =>
        prev.map((c) =>
          Number(c.id) === activeId
            ? { ...c, last_message: text, last_message_at: new Date().toISOString() }
            : c
        )
      );

      setReplyText("");
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal mengirim pesan."), type: "error" });
    } finally {
      setSendingReply(false);
    }
  }

  async function handleToggleStatus() {
    if (!selectedChatDetail?.chat?.id || statusUpdating) return;
    const activeId = Number(selectedChatDetail.chat.id);
    const currentStatus = String(selectedChatDetail.chat.status || "open");
    const newStatus = currentStatus === "closed" ? "open" : "closed";
    setStatusUpdating(true);

    try {
      const res = await fetch(`/api/admin/resources/chats/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengubah status obrolan.");

      setSelectedChatDetail((prev) =>
        prev ? { ...prev, chat: { ...prev.chat, status: newStatus } } : null
      );

      setChatList((prev) =>
        prev.map((c) => (Number(c.id) === activeId ? { ...c, status: newStatus } : c))
      );

      setMessage({
        text: newStatus === "closed" ? "Percakapan ditandai selesai." : "Percakapan dibuka kembali.",
        type: "success",
      });
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal mengubah status."), type: "error" });
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleDeleteChat(activeId: number) {
    try {
      const res = await fetch(`/api/admin/resources/chats/${activeId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus percakapan.");

      setChatList((prev) => prev.filter((c) => Number(c.id) !== activeId));
      if (Number(selectedChatDetail?.chat?.id) === activeId) {
        setSelectedChatDetail(null);
        const url = new URL(window.location.href);
        url.searchParams.delete("chat_id");
        window.history.pushState({}, "", url.pathname + url.search);
      }
      setConfirmDeleteModal(null);
      setMessage({ text: "Percakapan berhasil dihapus.", type: "success" });
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal menghapus percakapan."), type: "error" });
    }
  }

  const activeChat = selectedChatDetail?.chat;
  const messages = selectedChatDetail?.messages || [];
  const customerOrders = selectedChatDetail?.customerOrders || [];

  return (
    <div className="page-stack chat-console-page">
      <SweetAlert
        isOpen={!!message}
        isToast={true}
        type={message?.type || "info"}
        message={message?.text || ""}
        onClose={() => setMessage(null)}
      />

      {confirmDeleteModal && (
        <SweetAlert
          isOpen={true}
          type="warning"
          title="Hapus Percakapan?"
          message="Seluruh riwayat obrolan dengan customer ini akan dihapus secara permanen."
          confirmText="Ya, Hapus"
          cancelText="Batal"
          onConfirm={() => handleDeleteChat(confirmDeleteModal)}
          onClose={() => setConfirmDeleteModal(null)}
        />
      )}

      {/* Top Breadcrumb & Heading matching screenshot */}
      <div className="chat-breadcrumb-row">
        <div className="chat-breadcrumb">
          <Link href="/admin" className="chat-crumb-link">
            <span className="chat-crumb-home">🏠</span> Pages
          </Link>
          <span className="chat-crumb-sep">&gt;</span>
          <span className="chat-crumb-active">Support Chat</span>
        </div>
        <h1 className="chat-main-heading">Support Chat</h1>
      </div>

      {/* 3-Column Grid */}
      <div className="chat-console-grid">
        {/* Column 1: Customer Support */}
        <section className="chat-panel chat-panel-left">
          <div className="chat-card chat-sidebar-card">
            <div className="chat-card-header chat-sidebar-header">
              <div className="chat-title-group">
                <span className="chat-icon-badge">
                  <Icon name="MessageSquare" size={17} />
                </span>
                <h2 className="chat-sidebar-title">Customer Support</h2>
              </div>
              <button
                type="button"
                className="chat-cache-pill-btn"
                onClick={handleClearCache}
                disabled={clearingCache}
                title="Bersihkan Cache Obrolan"
              >
                <Icon name="RefreshCw" size={10} className={clearingCache ? "spin" : ""} />
                <span>Cache</span>
              </button>
            </div>

            {/* Search Customer Input & Shopee-Style Recommendation Dropdown */}
            <div ref={searchContainerRef} className="chat-search-container-relative">
              <form onSubmit={handleSearchSubmit} className="chat-search-row">
                <div className="chat-search-input-box">
                  <Icon name="Search" size={14} className="chat-search-input-icon" />
                  <input
                    type="text"
                    placeholder="Cari customer, nama, nomor, atau pesan..."
                    value={searchVal}
                    onFocus={() => {
                      if (searchVal.trim() && suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onChange={(e) => setSearchVal(e.target.value)}
                    className="chat-search-field"
                  />
                  {searchVal && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchVal("");
                        setShowSuggestions(false);
                      }}
                      className="chat-search-clear-btn"
                      title="Hapus pencarian"
                    >
                      <Icon name="X" size={13} />
                    </button>
                  )}
                </div>
                <button type="submit" className="chat-search-submit-btn">
                  <Icon name="Search" size={13} />
                  <span>Cari</span>
                </button>
              </form>

              {/* Shopee-Style Live Recommendation Dropdown */}
              {showSuggestions && (
                <div className="chat-search-recommendations-dropdown">
                  <div className="recommendations-header">
                    <span className="recommendations-title">Rekomendasi Customer</span>
                    {isSearchingSuggestions && <span className="recommendations-loading-spinner" />}
                  </div>

                  {suggestions.length === 0 ? (
                    <div className="recommendations-empty">
                      <span>Tidak ditemukan customer &quot;{searchVal}&quot;</span>
                    </div>
                  ) : (
                    <div className="recommendations-list">
                      {suggestions.map((item) => {
                        const avatarUrl = item.customer_photo
                          ? `/storage/${String(item.customer_photo).replace(/^\/?storage\/?/, "")}`
                          : null;
                        const initial = String(item.customer_name || "C").charAt(0).toUpperCase();
                        const isOnline = item.status === "open";
                        const unread = Number(item.unread_count || 0);

                        return (
                          <button
                            key={String(item.id)}
                            type="button"
                            className="recommendation-item"
                            onClick={() => {
                              openChat(item);
                              setShowSuggestions(false);
                            }}
                          >
                            <div className="recommendation-avatar-box">
                              {avatarUrl ? (
                                <Image
                                  unoptimized
                                  src={avatarUrl}
                                  alt={String(item.customer_name || "Customer")}
                                  width={32}
                                  height={32}
                                  className="recommendation-avatar-img"
                                />
                              ) : (
                                <div className="recommendation-avatar-fallback">{initial}</div>
                              )}
                              <span className={`recommendation-status-dot ${isOnline ? "is-online" : "is-offline"}`} />
                            </div>

                            <div className="recommendation-text-box">
                              <div className="recommendation-name-row">
                                <span className="recommendation-name">
                                  {highlightMatch(String(item.customer_name || "Customer"), searchVal)}
                                </span>
                                {unread > 0 ? (
                                  <span className="recommendation-unread-tag">{unread} baru</span>
                                ) : null}
                              </div>
                              <div className="recommendation-sub-row">
                                {item.customer_email ? (
                                  <span className="recommendation-meta">
                                    {highlightMatch(String(item.customer_email), searchVal)}
                                  </span>
                                ) : item.last_message ? (
                                  <span className="recommendation-snippet">
                                    {highlightMatch(String(item.last_message), searchVal)}
                                  </span>
                                ) : (
                                  <span className="recommendation-meta">Klik untuk buka chat</span>
                                )}
                              </div>
                            </div>
                            <Icon name="ChevronRight" size={14} className="recommendation-arrow-icon" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Conversations List */}
            <div className="chat-conversation-list-container">
              {filteredChatList.length === 0 ? (
                <div className="chat-sidebar-empty-state">
                  <p>{searchVal.trim() ? `Tidak ada chat yang sesuai dengan "${searchVal}"` : "Belum ada chat masuk."}</p>
                </div>
              ) : (
                <div className="chat-items-scroll">
                  {filteredChatList.map((c: Record<string, unknown>) => {
                    const isSelected = Number(activeChat?.id) === Number(c.id);
                    const unread = Number(c.unread_count || 0);
                    const avatarUrl = c.customer_photo
                      ? `/storage/${String(c.customer_photo).replace(/^\/?storage\/?/, "")}`
                      : null;
                    const initial = String(c.customer_name || "C").charAt(0).toUpperCase();

                    return (
                      <button
                        key={String(c.id)}
                        type="button"
                        onClick={() => openChat(c)}
                        className={`chat-item-card ${isSelected ? "is-selected-chat" : ""}`}
                      >
                        <div className="chat-item-avatar-col">
                          {avatarUrl ? (
                            <Image unoptimized src={avatarUrl} alt={String(c.customer_name || "Customer")} width={42} height={42} className="chat-avatar-round" />
                          ) : (
                            <div className="chat-avatar-fallback">{initial}</div>
                          )}
                          <span className={`chat-online-dot ${c.status === "open" ? "dot-open" : "dot-closed"}`} />
                        </div>

                        <div className="chat-item-main-col">
                          <div className="chat-item-head-line">
                            <h4 className="chat-item-cust-name">
                              {highlightMatch(String(c.customer_name || "Customer"), searchVal)}
                            </h4>
                            <span className="chat-item-time">
                              {c.last_message_at
                                ? date.format(new Date(String(c.last_message_at)))
                                : c.created_at
                                  ? date.format(new Date(String(c.created_at)))
                                  : ""}
                            </span>
                          </div>

                          {Boolean(c.linked_product_name) && (
                            <span className="chat-item-product-tag">
                              🛍️ {String(c.linked_product_name)}
                            </span>
                          )}

                          <p className="chat-item-snippet">
                            {highlightMatch(String(c.last_message || c.subject || "Memulai percakapan..."), searchVal)}
                          </p>
                        </div>

                        {unread > 0 && (
                          <div className="chat-item-badge-col">
                            <span className="chat-unread-counter">{unread}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Column 2: Detail Obrolan */}
        <section className="chat-panel chat-panel-center">
          <div className="chat-card chat-conversation-card">
            <div className="chat-card-header chat-conversation-header">
              <h2 className="chat-card-heading">Detail Obrolan</h2>
              {activeChat && (
                <div className="chat-conv-header-actions">
                  <div className="chat-live-pulse-badge" title="Tersambung real-time ke customer">
                    <span className="chat-live-pulse-dot" />
                    <span>LIVE SYNC</span>
                  </div>
                  <span className={`chat-status-pill ${activeChat.status === "closed" ? "pill-closed" : "pill-open"}`}>
                    <span className="status-dot" />
                    {activeChat.status === "closed" ? "Selesai" : "Aktif"}
                  </span>
                  <button
                    type="button"
                    className="chat-action-btn secondary-btn"
                    onClick={handleToggleStatus}
                    disabled={statusUpdating}
                    title={activeChat.status === "closed" ? "Buka kembali obrolan" : "Tandai obrolan selesai"}
                  >
                    {activeChat.status === "closed" ? "Buka Kembali" : "Tandai Selesai"}
                  </button>
                  <button
                    type="button"
                    className="chat-action-btn danger-btn"
                    onClick={() => setConfirmDeleteModal(Number(activeChat.id))}
                    title="Hapus Percakapan"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              )}
            </div>

            {loadingDetail ? (
              <div className="chat-loading-overlay" style={{ minHeight: "350px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CyberLoader size="sm" text="MEMUAT PERCAKAPAN..." subtext="Mengambil riwayat pesan terbaru..." />
              </div>
            ) : !activeChat ? (
              /* Welcome / Empty State exactly matching screenshot */
              <div className="chat-welcome-container">
                <div className="chat-welcome-bubble-icon">
                  <Icon name="MessageSquare" size={48} />
                </div>
                <h3 className="chat-welcome-title">Selamat Datang di Customer Support</h3>
                <p className="chat-welcome-subtitle">
                  Pilih salah satu customer di panel kiri untuk mulai membaca dan membalas pesan obrolan secara interaktif.
                </p>
              </div>
            ) : (
              /* Active Chat Message Stream */
              <div className="chat-active-container">
                <div className="chat-messages-scroll-area">
                  {messages.length === 0 ? (
                    <div className="chat-empty-messages-note">
                      <p>Belum ada riwayat pesan dalam obrolan ini.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isAdmin = m.sender_type === "admin";
                      return (
                        <div
                          key={String(m.id)}
                          className={`chat-message-row ${isAdmin ? "row-admin" : "row-customer"}`}
                        >
                          <div className="chat-message-bubble">
                            <div className="chat-message-sender-name">
                              {isAdmin ? "Anda (Admin Support)" : String(m.sender_name || activeChat.customer_name || "Customer")}
                            </div>
                            <div className="chat-message-body">{String(m.message)}</div>
                            <div className="chat-message-timestamp-row">
                              <span className="chat-msg-time">
                                {m.created_at ? date.format(new Date(String(m.created_at))) : ""}
                              </span>
                              {isAdmin && (
                                <span className="chat-msg-delivery">
                                  {m.is_read ? "✓✓ Dibaca" : "✓ Terkirim"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Bar */}
                <form onSubmit={handleSendReply} className="chat-reply-input-bar">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Ketik pesan balasan... (Tekan Enter untuk kirim)"
                    className="chat-reply-input-field"
                    disabled={sendingReply}
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="chat-send-submit-btn"
                  >
                    {sendingReply ? (
                      <span className="spinner" />
                    ) : (
                      <>
                        <Icon name="Send" size={15} />
                        <span>Kirim</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* Column 3: DETAIL INFORMASI */}
        <section className="chat-panel chat-panel-right">
          <div className="chat-card chat-info-card">
            <div className="chat-info-header">
              <h3 className="chat-info-title">DETAIL INFORMASI</h3>
            </div>
            <div className="chat-info-horizontal-divider" />

            {!activeChat ? (
              /* Empty state matching screenshot */
              <div className="chat-info-empty-state">
                <p>Tidak ada percakapan aktif.</p>
              </div>
            ) : (
              /* Active Customer Detail Information */
              <div className="chat-info-body">
                {/* Customer Profile Card */}
                <div className="chat-info-customer-header">
                  <div className="chat-info-avatar-box">
                    {activeChat.customer_photo ? (
                      <Image
                        unoptimized
                        src={`/storage/${String(activeChat.customer_photo).replace(/^\/?storage\/?/, "")}`}
                        alt={String(activeChat.customer_name || "Customer")}
                        width={54}
                        height={54}
                        className="chat-info-avatar-img"
                      />
                    ) : (
                      <div className="chat-info-avatar-fallback">
                        {String(activeChat.customer_name || "C").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="chat-info-customer-text">
                    <h4 className="chat-info-cust-name">{String(activeChat.customer_name || "Customer")}</h4>
                    <span className="chat-info-cust-email">{String(activeChat.customer_email || "—")}</span>
                    <span className="chat-info-cust-phone">{String(activeChat.customer_phone || "—")}</span>
                  </div>
                </div>

                {/* Customer Details Table */}
                <div className="chat-info-meta-group">
                  <div className="chat-info-meta-item">
                    <span className="chat-info-meta-label">Status Akun:</span>
                    <span className="chat-info-meta-value status-tag-active">Aktif</span>
                  </div>
                  <div className="chat-info-meta-item">
                    <span className="chat-info-meta-label">Terdaftar:</span>
                    <span className="chat-info-meta-value">
                      {activeChat.customer_registered_at
                        ? date.format(new Date(String(activeChat.customer_registered_at)))
                        : "—"}
                    </span>
                  </div>
                  <div className="chat-info-meta-item full-width">
                    <span className="chat-info-meta-label">Alamat:</span>
                    <p className="chat-info-meta-address">
                      {String(activeChat.customer_address || "Belum ada alamat tersimpan.")}
                    </p>
                  </div>
                </div>

                {/* Linked Product Card (if available) */}
                {Boolean(activeChat.linked_product_name) && (
                  <div className="chat-info-product-box">
                    <h5 className="chat-info-subheading">PRODUK TERKAIT</h5>
                    <div className="chat-info-product-inner">
                      {Boolean(activeChat.linked_product_photo) && (
                        <Image
                          unoptimized
                          src={`/storage/${String(activeChat.linked_product_photo).replace(/^\/?storage\/?/, "")}`}
                          alt={String(activeChat.linked_product_name)}
                          width={46}
                          height={46}
                          className="chat-info-prod-img"
                        />
                      )}
                      <div className="chat-info-prod-text">
                        <strong className="chat-info-prod-title">{String(activeChat.linked_product_name)}</strong>
                        <span className="chat-info-prod-price">
                          {money.format(Number(activeChat.linked_product_price || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Orders (if available) */}
                <div className="chat-info-orders-box">
                  <h5 className="chat-info-subheading">RIWAYAT PESANAN</h5>
                  {customerOrders.length === 0 ? (
                    <p className="chat-info-no-orders">Belum ada riwayat pesanan dari customer ini.</p>
                  ) : (
                    <div className="chat-info-orders-list">
                      {customerOrders.map((ord) => (
                        <Link
                          key={String(ord.id)}
                          href={`/admin/orders?order_id=${(ord.encrypted_id as string) || encryptOrderId(Number(ord.id))}`}
                          className="chat-info-order-card"
                        >
                          <div className="chat-info-order-top">
                            <span className="order-inv-code">{String(ord.invoice_number)}</span>
                            <span className={`status-pill status-${ord.status}`}>{String(ord.status)}</span>
                          </div>
                          <div className="chat-info-order-bottom">
                            <span className="order-grand-price">{money.format(Number(ord.grand_total || 0))}</span>
                            <span className="order-date-text">
                              {ord.created_at ? date.format(new Date(String(ord.created_at))) : ""}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
