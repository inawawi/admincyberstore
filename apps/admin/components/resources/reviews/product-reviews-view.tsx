"use client";

import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ResourceMeta } from "@/types";
import { encryptOrderId } from "@/lib/id-cipher";
import { Icon } from "@/components/icon";
import { SweetAlert } from "@/components/sweet-alert";
import { CyberLoader } from "@/components/cyber-loader";
import { date, money, getErrorMessage, highlightMatch, renderStars } from "../common/utils";

export interface ProductReviewsViewProps {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>>; total: number; page: number; perPage: number; pages: number };
  search: string;
  status?: string;
  reviewId?: string;
  initialReviewDetail?: {
    review: Record<string, unknown>;
    otherReviews: Array<Record<string, unknown>>;
    customerOrders: Array<Record<string, unknown>>;
  } | null;
}

export function ProductReviewsView({
  meta,
  result,
  search,
  status = "",
  reviewId = "",
  initialReviewDetail = null,
}: ProductReviewsViewProps) {
  const router = useRouter();
  const [reviewList, setReviewList] = useState<Array<Record<string, unknown>>>(result.data);
  const [searchVal, setSearchVal] = useState(search);
  const [statusVal, setStatusVal] = useState(status);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<Record<string, unknown>>>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [selectedReviewDetail, setSelectedReviewDetail] = useState<{
    review: Record<string, unknown>;
    otherReviews: Array<Record<string, unknown>>;
    customerOrders: Array<Record<string, unknown>>;
  } | null>(initialReviewDetail);

  useEffect(() => {
    setReviewList(result.data);
  }, [result.data]);

  useEffect(() => {
    setSearchVal(search);
  }, [search]);

  useEffect(() => {
    setStatusVal(status);
  }, [status]);

  useEffect(() => {
    setSelectedReviewDetail(initialReviewDetail);
    if (initialReviewDetail?.review?.reply) {
      setReplyText(String(initialReviewDetail.review.reply || ""));
    }
  }, [initialReviewDetail]);

  // Real-time client-side and server synced filtered review list
  const filteredReviewList = useMemo(() => {
    let list = reviewList;

    const s = String(statusVal || "").trim();
    if (s === "unreplied") {
      list = list.filter((r) => !r.reply || !String(r.reply).trim());
    } else if (s === "replied") {
      list = list.filter((r) => Boolean(r.reply && String(r.reply).trim()));
    } else if (s && !isNaN(Number(s))) {
      const targetRating = Number(s);
      list = list.filter((r) => Math.round(Number(r.rating || 0)) === targetRating);
    }

    const q = searchVal.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const name = String(r.customer_name || "").toLowerCase();
      const email = String(r.customer_email || "").toLowerCase();
      const prod = String(r.product_name || "").toLowerCase();
      const comment = String(r.comment || "").toLowerCase();
      const reply = String(r.reply || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        prod.includes(q) ||
        comment.includes(q) ||
        reply.includes(q)
      );
    });
  }, [reviewList, searchVal, statusVal]);

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

  // Debounced server search suggestions
  useEffect(() => {
    const q = searchVal.trim();
    if (!q || q.length < 1) {
      setSuggestions([]);
      setIsSearchingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const queryParams = new URLSearchParams({ search: q });
        if (statusVal) queryParams.set("status", statusVal);
        const res = await fetch(`/api/admin/resources/reviews?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          const items: Array<Record<string, unknown>> = json.data || [];
          const combined = [
            ...filteredReviewList,
            ...items.filter((item) => !filteredReviewList.some((c) => Number(c.id) === Number(item.id))),
          ].slice(0, 8);
          setSuggestions(combined);
        }
      } catch (err) {
        console.error("Suggestion fetch error:", err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchVal, statusVal, filteredReviewList]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal !== search) {
        const params = new URLSearchParams();
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (statusVal) params.set("status", statusVal);
        if (selectedReviewDetail?.review?.id) params.set("review_id", String(selectedReviewDetail.review.id));
        const queryStr = params.toString();
        router.replace(`/admin/reviews${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal, search, statusVal, selectedReviewDetail?.review?.id, router]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [replyText, setReplyText] = useState(String(initialReviewDetail?.review?.reply || ""));
  const [sendingReply, setSendingReply] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<number | null>(null);

  async function openReview(rev: Record<string, unknown>) {
    const id = Number(rev.id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/resources/reviews/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat detail ulasan.");
      setSelectedReviewDetail(data);
      setReplyText(String(data.review?.reply || ""));

      setReviewList((prev) =>
        prev.map((r) => (Number(r.id) === id ? { ...r, is_read: 1 } : r))
      );

      const url = new URL(window.location.href);
      url.searchParams.set("review_id", String(id));
      window.history.pushState({}, "", url.pathname + url.search);
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal membuka ulasan."), type: "error" });
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
      setMessage({ text: "Cache ulasan & produk berhasil dibersihkan!", type: "success" });
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
    if (statusVal) params.set("status", statusVal);
    if (selectedReviewDetail?.review?.id) params.set("review_id", String(selectedReviewDetail.review.id));
    router.push(`/admin/reviews?${params.toString()}`);
  }

  function handleFilterClick(newStatus: string) {
    setStatusVal(newStatus);
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (newStatus) params.set("status", newStatus);
    if (selectedReviewDetail?.review?.id) params.set("review_id", String(selectedReviewDetail.review.id));
    router.replace(`/admin/reviews${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  async function handleSendReply(e: FormEvent) {
    e.preventDefault();
    if (!selectedReviewDetail?.review?.id || !replyText.trim() || sendingReply) return;
    const text = replyText.trim();
    const activeId = Number(selectedReviewDetail.review.id);
    setSendingReply(true);

    try {
      const res = await fetch(`/api/admin/resources/reviews/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: text, is_read: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan balasan ulasan.");

      setSelectedReviewDetail((prev) =>
        prev
          ? {
            ...prev,
            review: { ...prev.review, reply: text, is_read: 1, updated_at: new Date().toISOString() },
          }
          : null
      );

      setReviewList((prev) =>
        prev.map((r) => (Number(r.id) === activeId ? { ...r, reply: text, is_read: 1 } : r))
      );

      setMessage({ text: "Balasan resmi admin berhasil disimpan!", type: "success" });
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal menyimpan balasan."), type: "error" });
    } finally {
      setSendingReply(false);
    }
  }

  async function handleDeleteReview(activeId: number) {
    try {
      const res = await fetch(`/api/admin/resources/reviews/${activeId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus ulasan.");

      setReviewList((prev) => prev.filter((r) => Number(r.id) !== activeId));
      if (Number(selectedReviewDetail?.review?.id) === activeId) {
        setSelectedReviewDetail(null);
        const url = new URL(window.location.href);
        url.searchParams.delete("review_id");
        window.history.pushState({}, "", url.pathname + url.search);
      }
      setConfirmDeleteModal(null);
      setMessage({ text: "Ulasan berhasil dihapus.", type: "success" });
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal menghapus ulasan."), type: "error" });
    }
  }

  const activeReview = selectedReviewDetail?.review;
  const otherReviews = selectedReviewDetail?.otherReviews || [];

  return (
    <div className="page-stack chat-console-page review-console-page">
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
          title="Hapus Ulasan?"
          message="Ulasan ini beserta balasan admin akan dihapus secara permanen dari sistem."
          confirmText="Ya, Hapus"
          cancelText="Batal"
          onConfirm={() => handleDeleteReview(confirmDeleteModal)}
          onClose={() => setConfirmDeleteModal(null)}
        />
      )}

      {/* Top Breadcrumb & Heading */}
      <div className="chat-breadcrumb-row">
        <div className="chat-breadcrumb">
          <Link href="/admin" className="chat-crumb-link">
            <span className="chat-crumb-home">🏠</span> Pages
          </Link>
          <span className="chat-crumb-sep">&gt;</span>
          <span className="chat-crumb-active">Ulasan Produk</span>
        </div>
        <h1 className="chat-main-heading">Ulasan Produk</h1>
      </div>

      {/* 3-Column Grid */}
      <div className="chat-console-grid">
        {/* Column 1: Daftar Ulasan */}
        <section className="chat-panel chat-panel-left">
          <div className="chat-card chat-sidebar-card">
            <div className="chat-card-header chat-sidebar-header">
              <div className="chat-title-group">
                <span className="chat-icon-badge review-icon-badge">
                  <Icon name="Star" size={17} />
                </span>
                <h2 className="chat-sidebar-title">Daftar Ulasan</h2>
              </div>
              <button
                type="button"
                className="chat-cache-pill-btn"
                onClick={handleClearCache}
                disabled={clearingCache}
                title="Bersihkan Cache Ulasan"
              >
                <Icon name="RefreshCw" size={10} className={clearingCache ? "spin" : ""} />
                <span>Cache</span>
              </button>
            </div>

            {/* Search Input & Button with Shopee-style Recommendations */}
            <div ref={searchContainerRef} className="chat-search-container-relative">
              <form onSubmit={handleSearchSubmit} className="chat-search-row">
                <div className="chat-search-input-box">
                  <Icon name="Search" size={14} className="chat-search-input-icon" />
                  <input
                    type="text"
                    placeholder="Cari ulasan, produk, customer..."
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    className="chat-search-field"
                  />
                  {searchVal ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchVal("");
                        setShowSuggestions(false);
                        const params = new URLSearchParams();
                        if (statusVal) params.set("status", statusVal);
                        if (selectedReviewDetail?.review?.id) params.set("review_id", String(selectedReviewDetail.review.id));
                        router.push(`/admin/reviews${params.toString() ? `?${params.toString()}` : ""}`);
                      }}
                      className="chat-search-clear-btn"
                      title="Hapus pencarian"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  ) : null}
                </div>
                <button type="submit" className="chat-search-submit-btn">
                  <Icon name="Search" size={13} />
                  <span>Cari</span>
                </button>
              </form>

              {/* Shopee-Style Recommendation Overlay Dropdown */}
              {showSuggestions && searchVal.trim().length > 0 && (
                <div className="chat-search-recommendations-dropdown">
                  <div className="recommendations-header">
                    <span>Rekomendasi Ulasan</span>
                    {isSearchingSuggestions && <span className="recommendations-loading-spinner" />}
                  </div>

                  {suggestions.length === 0 && !isSearchingSuggestions ? (
                    <div className="recommendations-empty">
                      Tidak ada ulasan yang cocok dengan "{searchVal}"
                    </div>
                  ) : (
                    <div className="recommendations-list">
                      {suggestions.map((item) => {
                        const avatarUrl = item.customer_photo
                          ? `/storage/${String(item.customer_photo).replace(/^\/?storage\/?/, "")}`
                          : null;
                        const initial = String(item.customer_name || "P").charAt(0).toUpperCase();
                        const ratingScore = Number(item.rating || 5);
                        const hasReply = Boolean(item.reply);

                        return (
                          <button
                            key={String(item.id)}
                            type="button"
                            onClick={() => {
                              openReview(item);
                              setShowSuggestions(false);
                            }}
                            className="recommendation-item"
                          >
                            <div className="recommendation-avatar-box">
                              {avatarUrl ? (
                                <Image
                                  unoptimized
                                  src={avatarUrl}
                                  alt={String(item.customer_name || "Pelanggan")}
                                  width={32}
                                  height={32}
                                  className="recommendation-avatar-img"
                                />
                              ) : (
                                <div className="recommendation-avatar-fallback">{initial}</div>
                              )}
                              <span
                                className={`recommendation-status-dot ${hasReply ? "is-offline" : "is-online"}`}
                                title={hasReply ? "Sudah dibalas" : "Menunggu balasan"}
                              />
                            </div>

                            <div className="recommendation-text-box">
                              <div className="recommendation-name-row">
                                <span className="recommendation-name">
                                  {highlightMatch(String(item.customer_name || "Pelanggan"), searchVal)}
                                </span>
                                <span className="recommendation-stars-text">
                                  {"★".repeat(Math.min(5, Math.max(1, ratingScore)))}
                                </span>
                              </div>

                              <div className="recommendation-sub-row">
                                {Boolean(item.product_name) && (
                                  <span className="recommendation-meta">
                                    🛍️ {highlightMatch(String(item.product_name), searchVal)}
                                  </span>
                                )}
                                {Boolean(item.comment) && (
                                  <span className="recommendation-snippet">
                                    {highlightMatch(String(item.comment), searchVal)}
                                  </span>
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

            {/* Filter Pills Row */}
            <div className="review-filter-pills-bar">
              {[
                { label: "Semua", val: "" },
                { label: "★ 5", val: "5" },
                { label: "★ 4", val: "4" },
                { label: "★ 3", val: "3" },
                { label: "★ 2", val: "2" },
                { label: "★ 1", val: "1" },
                { label: "Belum Dibalas", val: "unreplied" },
                { label: "Dibalas", val: "replied" },
              ].map((pill) => {
                const isActive = statusVal === pill.val;
                return (
                  <button
                    key={pill.val || "all"}
                    type="button"
                    onClick={() => handleFilterClick(pill.val)}
                    className={`review-filter-pill-btn ${isActive ? "active-pill" : ""}`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Review Items List */}
            <div className="chat-conversation-list-container">
              {filteredReviewList.length === 0 ? (
                <div className="chat-sidebar-empty-state">
                  <p>
                    {searchVal.trim()
                      ? `Tidak ada ulasan yang sesuai dengan "${searchVal}"`
                      : statusVal === "unreplied"
                      ? "Semua ulasan telah dibalas! 👍"
                      : statusVal === "replied"
                      ? "Belum ada ulasan yang dibalas."
                      : statusVal
                      ? `Tidak ada ulasan dengan rating ★ ${statusVal}.`
                      : "Belum ada ulasan masuk."}
                  </p>
                </div>
              ) : (
                <div className="chat-items-scroll">
                  {filteredReviewList.map((r: Record<string, unknown>) => {
                    const isSelected = Number(activeReview?.id) === Number(r.id);
                    const hasReply = Boolean(r.reply);
                    const avatarUrl = r.customer_photo
                      ? `/storage/${String(r.customer_photo).replace(/^\/?storage\/?/, "")}`
                      : null;
                    const initial = String(r.customer_name || "P").charAt(0).toUpperCase();
                    const ratingScore = Number(r.rating || 5);

                    return (
                      <button
                        key={String(r.id)}
                        type="button"
                        onClick={() => openReview(r)}
                        className={`chat-item-card review-item-card ${isSelected ? "is-selected-chat" : ""}`}
                      >
                        <div className="chat-item-avatar-col">
                          {avatarUrl ? (
                            <Image unoptimized src={avatarUrl} alt={String(r.customer_name || "Pelanggan")} width={42} height={42} className="chat-avatar-round" />
                          ) : (
                            <div className="chat-avatar-fallback">{initial}</div>
                          )}
                          <span className={`chat-online-dot ${hasReply ? "dot-closed" : "dot-open"}`} title={hasReply ? "Sudah dibalas" : "Menunggu balasan"} />
                        </div>

                        <div className="chat-item-main-col">
                          <div className="chat-item-head-line">
                            <h4 className="chat-item-cust-name">
                              {highlightMatch(String(r.customer_name || "Pelanggan"), searchVal)}
                            </h4>
                            <span className="chat-item-time">
                              {r.created_at ? date.format(new Date(String(r.created_at))) : ""}
                            </span>
                          </div>

                          <div className="review-item-rating-row">
                            <span className="review-stars-snippet">
                              {"★".repeat(Math.min(5, Math.max(1, ratingScore)))}
                              {"☆".repeat(Math.max(0, 5 - ratingScore))}
                            </span>
                            <span className="review-score-label">{ratingScore.toFixed(1)}</span>
                          </div>

                          {Boolean(r.product_name) && (
                            <span className="chat-item-product-tag">
                              🛍️ {highlightMatch(String(r.product_name), searchVal)}
                            </span>
                          )}

                          <p className="chat-item-snippet">
                            {highlightMatch(String(r.comment || "Tidak ada komentar."), searchVal)}
                          </p>

                          <div className="review-item-bottom-meta">
                            <span className={`review-status-tag ${hasReply ? "tag-replied" : "tag-pending"}`}>
                              {hasReply ? "✓ Dibalas" : "⏳ Belum Dibalas"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Column 2: Detail Ulasan & Balasan */}
        <section className="chat-panel chat-panel-center">
          <div className="chat-card chat-conversation-card">
            <div className="chat-card-header chat-conversation-header">
              <h2 className="chat-card-heading">Detail Ulasan</h2>
              {activeReview && (
                <div className="chat-conv-header-actions">
                  <span className={`chat-status-pill ${activeReview.reply ? "pill-closed" : "pill-open"}`}>
                    <span className="status-dot" />
                    {activeReview.reply ? "Dibalas" : "Menunggu Balasan"}
                  </span>
                  <button
                    type="button"
                    className="chat-action-btn danger-btn"
                    onClick={() => setConfirmDeleteModal(Number(activeReview.id))}
                    title="Hapus Ulasan Ini"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              )}
            </div>

            {loadingDetail ? (
              <div className="chat-loading-overlay" style={{ minHeight: "350px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CyberLoader size="sm" text="MEMUAT DETAIL ULASAN..." subtext="Mengambil data ulasan & pesanan pelanggan..." />
              </div>
            ) : !activeReview ? (
              /* Welcome / Empty State */
              <div className="chat-welcome-container">
                <div className="chat-welcome-bubble-icon review-welcome-icon">
                  <Icon name="Star" size={48} />
                </div>
                <h3 className="chat-welcome-title">Selamat Datang di Ulasan Produk</h3>
                <p className="chat-welcome-subtitle">
                  Pilih salah satu ulasan di panel kiri untuk melihat rincian penilaian pelanggan dan memberikan balasan resmi secara interaktif.
                </p>
              </div>
            ) : (
              /* Active Review Showcase & Reply Area */
              <div className="review-active-container">
                <div className="review-main-scroll-area">
                  {/* Top Review Showcase Card */}
                  <div className="review-detail-card">
                    <div className="review-detail-header">
                      <div className="review-detail-user">
                        <div className="review-user-avatar">
                          {activeReview.customer_photo ? (
                            <Image
                              unoptimized
                              src={`/storage/${String(activeReview.customer_photo).replace(/^\/?storage\/?/, "")}`}
                              alt={String(activeReview.customer_name || "Pelanggan")}
                              width={46}
                              height={46}
                              className="chat-avatar-round"
                            />
                          ) : (
                            <div className="chat-avatar-fallback">
                              {String(activeReview.customer_name || "P").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="review-user-info">
                          <h4 className="review-user-name">{String(activeReview.customer_name || "Pelanggan")}</h4>
                          <div className="review-user-sub">
                            <span className="review-time-text">
                              {activeReview.created_at ? date.format(new Date(String(activeReview.created_at))) : "—"}
                            </span>
                            {Boolean(activeReview.invoice_number) && (
                              <span className="review-invoice-tag">
                                🧾 {String(activeReview.invoice_number)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rating Star Badge */}
                      <div className="review-rating-score-box">
                        <div className="review-score-num">
                          <span className="score-val">{Number(activeReview.rating || 5).toFixed(1)}</span>
                          <span className="score-max">/ 5.0</span>
                        </div>
                        <div className="review-stars-display">
                          {renderStars(Number(activeReview.rating || 5))}
                        </div>
                      </div>
                    </div>

                    {/* Product Tag Bar */}
                    <div className="review-product-tag-bar">
                      <span className="product-tag-pill">
                        🛍️ <strong>{String(activeReview.product_name || "Produk")}</strong>
                      </span>
                    </div>

                    {/* Customer Comment Text */}
                    <div className="review-comment-body">
                      <p className="review-comment-text">&ldquo;{String(activeReview.comment || "Tidak ada komentar teks.")}&rdquo;</p>
                    </div>

                    {/* Attached Photo */}
                    {Boolean(activeReview.photo) && (
                      <div className="review-photo-attachment">
                        <span className="review-photo-label">Foto Ulasan dari Pelanggan:</span>
                        <a
                          href={`/storage/${String(activeReview.photo).replace(/^\/?storage\/?/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="review-photo-link"
                        >
                          <Image
                            unoptimized
                            src={`/storage/${String(activeReview.photo).replace(/^\/?storage\/?/, "")}`}
                            alt="Foto Ulasan"
                            width={160}
                            height={160}
                            className="review-photo-img"
                          />
                          <span className="photo-zoom-hint">🔍 Perbesar Foto</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Admin Reply Card (if already replied) */}
                  {Boolean(activeReview.reply) && (
                    <div className="admin-reply-card">
                      <div className="admin-reply-header">
                        <div className="admin-badge-title">
                          <span className="admin-badge-shield">🛡️</span>
                          <strong>Balasan Resmi Admin Cyber Store</strong>
                        </div>
                        <span className="admin-reply-time">
                          {activeReview.updated_at ? date.format(new Date(String(activeReview.updated_at))) : "Terkirim"}
                        </span>
                      </div>
                      <div className="admin-reply-content">
                        <p>{String(activeReview.reply)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply Form Bar at Bottom */}
                <form onSubmit={handleSendReply} className="review-reply-section">
                  <div className="review-reply-field-header">
                    <label htmlFor="review-reply-input" className="review-reply-label">
                      <Icon name="MessageCircle" size={15} />
                      <span>{activeReview.reply ? "Perbarui Balasan Resmi Admin:" : "Tulis Balasan Resmi Admin:"}</span>
                    </label>
                    {Boolean(activeReview.reply) && (
                      <span className="review-replied-hint">Ulasan ini sudah memiliki balasan. Anda dapat mengubah teks balasan di bawah.</span>
                    )}
                  </div>
                  <div className="review-reply-input-wrapper">
                    <textarea
                      id="review-reply-input"
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Tuliskan ucapan terima kasih atau tanggapan resmi admin untuk ulasan ini..."
                      className="review-reply-textarea"
                      disabled={sendingReply}
                    />
                    <div className="review-reply-actions-row">
                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        className="primary-button review-reply-submit-btn"
                      >
                        {sendingReply ? (
                          <><span className="spinner" /> <span>Menyimpan…</span></>
                        ) : (
                          <>
                            <Icon name="Send" size={14} />
                            <span>{activeReview.reply ? "Perbarui Balasan" : "Kirim Balasan"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
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

            {!activeReview ? (
              <div className="chat-info-empty-state">
                <p>Tidak ada ulasan aktif.</p>
              </div>
            ) : (
              <div className="chat-info-body">
                {/* Customer Profile Card */}
                <div className="chat-info-customer-header">
                  <div className="chat-info-avatar-box">
                    {activeReview.customer_photo ? (
                      <Image
                        unoptimized
                        src={`/storage/${String(activeReview.customer_photo).replace(/^\/?storage\/?/, "")}`}
                        alt={String(activeReview.customer_name || "Pelanggan")}
                        width={54}
                        height={54}
                        className="chat-info-avatar-img"
                      />
                    ) : (
                      <div className="chat-info-avatar-fallback">
                        {String(activeReview.customer_name || "P").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="chat-info-customer-text">
                    <h4 className="chat-info-cust-name">{String(activeReview.customer_name || "Pelanggan")}</h4>
                    <span className="chat-info-cust-email">{String(activeReview.customer_email || "—")}</span>
                    <span className="chat-info-cust-phone">{String(activeReview.customer_phone || "—")}</span>
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
                      {activeReview.customer_registered_at
                        ? date.format(new Date(String(activeReview.customer_registered_at)))
                        : "—"}
                    </span>
                  </div>
                  <div className="chat-info-meta-item full-width">
                    <span className="chat-info-meta-label">Alamat:</span>
                    <p className="chat-info-meta-address">
                      {String(activeReview.customer_address || "Belum ada alamat tersimpan.")}
                    </p>
                  </div>
                </div>

                {/* Linked Product Card */}
                <div className="chat-info-product-box">
                  <h5 className="chat-info-subheading">PRODUK YANG DIULAS</h5>
                  <div className="chat-info-product-inner">
                    {Boolean(activeReview.product_photo) ? (
                      <Image
                        unoptimized
                        src={`/storage/${String(activeReview.product_photo).replace(/^\/?storage\/?/, "")}`}
                        alt={String(activeReview.product_name || "Produk")}
                        width={48}
                        height={48}
                        className="chat-info-prod-img"
                      />
                    ) : (
                      <div className="chat-info-prod-img prod-fallback-img">🛍️</div>
                    )}
                    <div className="chat-info-prod-text">
                      <strong className="chat-info-prod-title">{String(activeReview.product_name || "Produk")}</strong>
                      <div className="review-prod-meta-row">
                        <span className="chat-info-prod-price">
                          {money.format(Number(activeReview.product_price || 0))}
                        </span>
                        <span className="review-prod-stock">
                          Stok: <strong>{String(activeReview.product_stock ?? "—")}</strong>
                        </span>
                      </div>
                      <div className="review-prod-rating-row">
                        <span className="review-star-mini">★</span>
                        <span>{Number(activeReview.product_rating || 0).toFixed(1)}</span>
                        <span className="review-count-mini">({String(activeReview.product_reviews_count || 0)} ulasan)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Related Order Card */}
                {Boolean(activeReview.invoice_number) && (
                  <div className="chat-info-orders-box">
                    <h5 className="chat-info-subheading">PESANAN TERKAIT</h5>
                    <Link
                      href={`/admin/orders?order_id=${encryptOrderId(Number(activeReview.order_id))}`}
                      className="chat-info-order-card"
                    >
                      <div className="chat-info-order-top">
                        <span className="order-inv-code">{String(activeReview.invoice_number)}</span>
                        <span className={`status-pill status-${activeReview.order_status}`}>
                          {String(activeReview.order_status || "selesai")}
                        </span>
                      </div>
                      <div className="chat-info-order-bottom">
                        <span className="order-grand-price">
                          {money.format(Number(activeReview.order_grand_total || 0))}
                        </span>
                        <span className="order-date-text">
                          {activeReview.order_created_at ? date.format(new Date(String(activeReview.order_created_at))) : ""}
                        </span>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Other reviews by customer */}
                <div className="chat-info-orders-box">
                  <h5 className="chat-info-subheading">ULASAN LAIN DARI CUSTOMER</h5>
                  {otherReviews.length === 0 ? (
                    <p className="chat-info-no-orders">Belum ada ulasan lain dari pelanggan ini.</p>
                  ) : (
                    <div className="chat-info-orders-list">
                      {otherReviews.map((rev) => (
                        <button
                          key={String(rev.id)}
                          type="button"
                          onClick={() => openReview(rev)}
                          className="chat-info-order-card other-review-card-btn"
                        >
                          <div className="chat-info-order-top">
                            <span className="order-inv-code other-rev-prod-name">{String(rev.product_name)}</span>
                            <span className="other-rev-stars">
                              ★ {Number(rev.rating || 5)}
                            </span>
                          </div>
                          <p className="other-rev-snippet">{String(rev.comment || "—")}</p>
                          <div className="chat-info-order-bottom">
                            <span className={`other-rev-status ${rev.reply ? "is-replied" : "is-unreplied"}`}>
                              {rev.reply ? "✓ Dibalas" : "Belum Dibalas"}
                            </span>
                            <span className="order-date-text">
                              {rev.created_at ? date.format(new Date(String(rev.created_at))) : ""}
                            </span>
                          </div>
                        </button>
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
