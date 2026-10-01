"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";

interface ChatItem {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_photo?: string | null;
  product_id?: number | null;
  product_name?: string | null;
  subject?: string;
  status?: string;
  last_message?: string;
  unread_count?: number;
  last_activity_time?: string;
  created_at?: string;
}

interface MessageItem {
  id: number;
  chat_id: number;
  sender_type: "customer" | "admin";
  sender_id: number;
  sender_name?: string;
  sender_photo?: string | null;
  message: string;
  is_read: number;
  created_at: string;
}

interface Props {
  unreadCount?: number;
  onRefreshParentNotif?: () => void;
}

export function FloatingAdminChat({ unreadCount = 0, onRefreshParentNotif }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "product" | "cs">("all");
  const [showTooltip, setShowTooltip] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<any>(null);

  // Quick reply prompt presets
  const quickReplies = [
    "Halo Kak! Stok produk ini masih tersedia & siap dikirim.",
    "Pesanan Anda sedang diproses oleh tim gudang kami.",
    "Bisa tolong infokan nomor invoice atau kendala lengkapnya?",
    "Terima kasih sudah berbelanja di BSI Cyber Store!",
  ];

  // Fetch list of chats from backend API
  const fetchChatList = async (showLoading = false) => {
    if (showLoading) setIsLoadingList(true);
    try {
      const res = await fetch("/api/admin/resources/chats?per_page=30", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data.data || [];
        setChatList(items);
      }
    } catch (e) {
      console.warn("Error fetching admin chats:", e);
    } finally {
      if (showLoading) setIsLoadingList(false);
    }
  };

  // Fetch active chat thread detail & messages
  const fetchActiveChat = async (chatId: number, showLoading = false) => {
    if (showLoading) setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/resources/chats/${chatId}`, { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        setActiveChat(data.chat || null);
        setMessages(data.messages || []);
        
        // Refresh parent notification counts after reading
        if (onRefreshParentNotif) {
          onRefreshParentNotif();
        }
      }
    } catch (e) {
      console.warn("Error fetching chat thread detail:", e);
    } finally {
      if (showLoading) setIsLoadingMessages(false);
    }
  };

  // Open specific chat thread
  const handleSelectChat = (chat: ChatItem) => {
    setActiveChatId(chat.id);
    fetchActiveChat(chat.id, true);
    // Optimistically mark as read in list
    setChatList((prev) =>
      prev.map((c) => (c.id === chat.id ? { ...c, unread_count: 0 } : c))
    );
  };

  // Back to chat list view
  const handleBackToList = () => {
    setActiveChatId(null);
    setActiveChat(null);
    setMessages([]);
    fetchChatList();
  };

  // Send reply message to customer
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = replyText.trim();
    if (!text || !activeChatId || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/admin/resources/chats/${activeChatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        credentials: "same-origin",
      });

      if (res.ok) {
        setReplyText("");
        // Reload messages
        await fetchActiveChat(activeChatId, false);
        fetchChatList(false);
      }
    } catch (e) {
      console.error("Failed to send admin chat message:", e);
    } finally {
      setIsSending(false);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (activeChatId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeChatId]);

  // Handle opening floating window
  const toggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setShowTooltip(false);
      fetchChatList(true);
    }
  };

  // Live polling for chat list or active conversation
  useEffect(() => {
    if (isOpen) {
      pollTimerRef.current = setInterval(() => {
        if (activeChatId) {
          fetchActiveChat(activeChatId, false);
        } else {
          fetchChatList(false);
        }
      }, 5000);
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, activeChatId]);

  // Initial greeting tooltip on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (unreadCount > 0) {
        setShowTooltip(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [unreadCount]);

  // Filtered chats based on search query and tab
  const filteredChats = chatList.filter((chat) => {
    const matchesSearch =
      !searchQuery ||
      (chat.customer_name && chat.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (chat.product_name && chat.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (chat.subject && chat.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (chat.last_message && chat.last_message.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === "unread") return Number(chat.unread_count || 0) > 0;
    if (filterTab === "product") return Boolean(chat.product_id);
    if (filterTab === "cs") return !chat.product_id;
    return true;
  });

  const totalUnreadBadge = chatList.reduce((acc, curr) => acc + Number(curr.unread_count || 0), 0) || unreadCount;

  return (
    <div className="admin-floating-chat-container">
      {/* ═══════════════════════════════════════
          FLOATING CHAT WINDOW (DOCK / MODAL)
      ═══════════════════════════════════════ */}
      {isOpen && (
        <div className="admin-chat-dock cyber-card">
          {/* Header Bar */}
          <div className="admin-dock-header">
            <div className="dock-header-left">
              {activeChatId ? (
                <button
                  type="button"
                  className="dock-btn-back"
                  onClick={handleBackToList}
                  title="Kembali ke Daftar Chat"
                >
                  <Icon name="ArrowLeft" size={16} />
                </button>
              ) : (
                <div className="dock-header-icon-box">
                  <Icon name="MessageSquare" size={17} className="text-white" />
                </div>
              )}

              <div className="dock-header-info">
                {activeChatId ? (
                  <>
                    <h4 className="dock-header-title">
                      {activeChat?.customer_name || "Pelanggan"}
                    </h4>
                    <span className="dock-header-subtitle">
                      {activeChat?.product_name
                        ? `📦 ${activeChat.product_name}`
                        : "💬 Chat CS & Bantuan"}
                    </span>
                  </>
                ) : (
                  <>
                    <h4 className="dock-header-title">Chat Pelanggan</h4>
                    <span className="dock-header-subtitle">
                      {totalUnreadBadge > 0
                        ? `${totalUnreadBadge} pesan belum dibaca`
                        : "Komunikasi langsung dengan pembeli"}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="dock-header-actions">
              <Link
                href="/admin/chats"
                prefetch={false}
                className="dock-header-btn"
                title="Buka Halaman Chat Lengkap"
                onClick={() => setIsOpen(false)}
              >
                <Icon name="ExternalLink" size={15} />
              </Link>
              <button
                type="button"
                className="dock-header-btn"
                onClick={() => {
                  if (activeChatId) {
                    fetchActiveChat(activeChatId, true);
                  } else {
                    fetchChatList(true);
                  }
                }}
                title="Perbarui data"
              >
                <Icon name="RotateCw" size={15} />
              </button>
              <button
                type="button"
                className="dock-header-btn close-btn"
                onClick={() => setIsOpen(false)}
                title="Tutup Jendela Chat"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════
              VIEW 1: CHAT LIST
          ═══════════════════════════════════════ */}
          {!activeChatId ? (
            <div className="dock-chat-list-view">
              {/* Search Box */}
              <div className="dock-search-row">
                <div className="dock-search-wrapper">
                  <Icon name="Search" size={14} className="dock-search-icon" />
                  <input
                    type="text"
                    placeholder="Cari pelanggan, pesan, produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="dock-search-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="dock-search-clear"
                      onClick={() => setSearchQuery("")}
                    >
                      <Icon name="X" size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="dock-filter-tabs">
                <button
                  type="button"
                  className={`dock-filter-tab ${filterTab === "all" ? "is-active" : ""}`}
                  onClick={() => setFilterTab("all")}
                >
                  Semua ({chatList.length})
                </button>
                <button
                  type="button"
                  className={`dock-filter-tab ${filterTab === "unread" ? "is-active" : ""}`}
                  onClick={() => setFilterTab("unread")}
                >
                  Belum Dibaca
                  {totalUnreadBadge > 0 && (
                    <span className="tab-pill-badge">{totalUnreadBadge}</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`dock-filter-tab ${filterTab === "product" ? "is-active" : ""}`}
                  onClick={() => setFilterTab("product")}
                >
                  Produk
                </button>
                <button
                  type="button"
                  className={`dock-filter-tab ${filterTab === "cs" ? "is-active" : ""}`}
                  onClick={() => setFilterTab("cs")}
                >
                  CS & Komplain
                </button>
              </div>

              {/* Chat List Items */}
              <div className="dock-list-scroll-area">
                {isLoadingList && chatList.length === 0 ? (
                  <div className="dock-loading-state">
                    <div className="spinner-tailadmin"></div>
                    <p>Memuat obrolan...</p>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="dock-empty-state">
                    <Icon name="MessageSquareDashed" size={32} className="dock-empty-icon" />
                    <h5>Tidak Ada Obrolan</h5>
                    <p>
                      {searchQuery
                        ? "Pencarian tidak cocok dengan chat mana pun."
                        : "Belum ada pesan obrolan baru dari pelanggan."}
                    </p>
                  </div>
                ) : (
                  <div className="dock-items-wrapper">
                    {filteredChats.map((chat) => {
                      const hasUnread = Number(chat.unread_count || 0) > 0;
                      return (
                        <div
                          key={chat.id}
                          className={`dock-chat-item ${hasUnread ? "is-unread" : ""}`}
                          onClick={() => handleSelectChat(chat)}
                        >
                          <div className="dock-item-avatar">
                            {chat.customer_photo ? (
                              <img
                                src={chat.customer_photo}
                                alt={chat.customer_name || "User"}
                                className="avatar-img-circle"
                              />
                            ) : (
                              <span className="avatar-initials">
                                {(chat.customer_name || "P").slice(0, 2).toUpperCase()}
                              </span>
                            )}
                            <span className="user-online-pip"></span>
                          </div>

                          <div className="dock-item-content">
                            <div className="dock-item-top">
                              <span className="dock-item-name">
                                {chat.customer_name || "Pelanggan"}
                              </span>
                              <span className="dock-item-time">
                                {chat.last_activity_time
                                  ? new Date(chat.last_activity_time).toLocaleTimeString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                            </div>

                            {/* Badge tag for product or complaint */}
                            <div className="dock-item-tags">
                              {chat.product_name ? (
                                <span className="dock-tag-product">
                                  📦 {chat.product_name}
                                </span>
                              ) : (
                                <span className="dock-tag-cs">
                                  🛡️ {chat.subject || "Customer Service"}
                                </span>
                              )}
                            </div>

                            <p className="dock-item-snippet">
                              {chat.last_message || "Memulai percakapan..."}
                            </p>
                          </div>

                          {hasUnread && (
                            <div className="dock-unread-badge">
                              {chat.unread_count}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ═══════════════════════════════════════
               VIEW 2: ACTIVE CONVERSATION THREAD
            ═══════════════════════════════════════ */
            <div className="dock-thread-view">
              {/* Customer summary bar */}
              <div className="dock-customer-bar">
                <div className="customer-bar-details">
                  <span className="customer-bar-name">
                    {activeChat?.customer_name || "Pelanggan"}
                  </span>
                  {activeChat?.customer_phone && (
                    <span className="customer-bar-meta">
                      📱 {activeChat.customer_phone}
                    </span>
                  )}
                  {activeChat?.customer_email && (
                    <span className="customer-bar-meta">
                      ✉️ {activeChat.customer_email}
                    </span>
                  )}
                </div>
                {activeChat?.product_id && (
                  <Link
                    href={`/admin/products?search=${encodeURIComponent(activeChat.product_name || "")}`}
                    prefetch={false}
                    className="customer-bar-product-link"
                    title="Lihat Produk"
                  >
                    Detail Produk →
                  </Link>
                )}
              </div>

              {/* Messages Scroll Area */}
              <div className="dock-messages-scroll-area">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="dock-loading-state">
                    <div className="spinner-tailadmin"></div>
                    <p>Memuat pesan...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="dock-empty-messages">
                    <p>Belum ada riwayat pesan dalam obrolan ini.</p>
                  </div>
                ) : (
                  <div className="dock-messages-list">
                    {messages.map((msg) => {
                      const isAdmin = msg.sender_type === "admin";
                      return (
                        <div
                          key={msg.id}
                          className={`dock-message-bubble-row ${isAdmin ? "row-admin" : "row-customer"}`}
                        >
                          <div className={`dock-bubble ${isAdmin ? "bubble-admin" : "bubble-customer"}`}>
                            <div className="bubble-header-meta">
                              <span className="bubble-sender-name">
                                {isAdmin ? "Admin (Saya)" : (msg.sender_name || "Pelanggan")}
                              </span>
                              <span className="bubble-time">
                                {msg.created_at
                                  ? new Date(msg.created_at).toLocaleTimeString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                            </div>
                            <div className="bubble-text" style={{ whiteSpace: "pre-line" }}>
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Quick Reply Presets Chips */}
              <div className="dock-quick-presets">
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-chip"
                    onClick={() => setReplyText(reply)}
                    title="Gunakan balasan cepat ini"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Reply Input Box */}
              <form className="dock-reply-form" onSubmit={handleSendReply}>
                <textarea
                  rows={2}
                  placeholder="Ketik balasan untuk pelanggan... (Enter untuk kirim)"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="dock-reply-textarea"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="dock-btn-send"
                  title="Kirim balasan"
                >
                  {isSending ? (
                    <div className="spinner-tailadmin small"></div>
                  ) : (
                    <Icon name="Send" size={16} />
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════
          GREETING TOOLTIP / POPUP HINT
      ═══════════════════════════════════════ */}
      {showTooltip && !isOpen && (
        <div className="admin-chat-tooltip-bubble" onClick={toggleOpen}>
          <div className="tooltip-tag">
            <span className="pulse-dot-red"></span>
            <span>Pesan Masuk</span>
          </div>
          <p className="tooltip-text">
            Ada {totalUnreadBadge} pesan baru dari pelanggan yang perlu direspon!
          </p>
          <button
            type="button"
            className="tooltip-close"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
          >
            <Icon name="X" size={12} />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MAIN FLOATING ACTION BUTTON (FAB)
      ═══════════════════════════════════════ */}
      <button
        type="button"
        className={`admin-fab-btn ${isOpen ? "is-open" : ""}`}
        onClick={toggleOpen}
        aria-label="Pusat Chat Pelanggan"
        title={isOpen ? "Tutup obrolan" : "Buka Chat Pelanggan"}
      >
        <div className="admin-fab-icon-box">
          {isOpen ? (
            <Icon name="X" size={22} className="fab-icon" />
          ) : (
            <Icon name="MessageSquare" size={22} className="fab-icon" />
          )}
        </div>

        {/* Live Unread Badge */}
        {totalUnreadBadge > 0 && !isOpen && (
          <span className="admin-fab-badge">
            {totalUnreadBadge > 99 ? "99+" : totalUnreadBadge}
            <span className="admin-fab-badge-pulse"></span>
          </span>
        )}
      </button>
    </div>
  );
}
