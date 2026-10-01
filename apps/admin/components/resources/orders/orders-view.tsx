"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/icon";
import type { ResourceMeta } from "@/types";
import { SweetAlert } from "@/components/sweet-alert";
import { encryptOrderId } from "@/lib/id-cipher";
import {
  money,
  number,
  highlightMatch,
  getErrorMessage,
  formatDotDate,
  formatDotDateTime,
  formatShortDate,
  isMabaOrder,
  formatOrderStatus,
  generateAutoResi,
  resolveProductPhotoUrl,
} from "../common/utils";

export function OrdersView({
  meta,
  result,
  search,
  status = "",
  cancelStatus = "",
  orderId = "",
  initialOrderDetail = null,
}: {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>>; total: number; page: number; perPage: number; pages: number };
  search: string;
  status?: string;
  cancelStatus?: string;
  orderId?: string;
  initialOrderDetail?: {
    order: Record<string, unknown>;
    items: Array<Record<string, unknown>>;
    payment: Record<string, unknown> | null;
    trackings?: Array<Record<string, unknown>>;
  } | null;
}) {
  const router = useRouter();
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<{
    order: Record<string, unknown>;
    items: Array<Record<string, unknown>>;
    payment: Record<string, unknown> | null;
    trackings?: Array<Record<string, unknown>>;
  } | null>(initialOrderDetail);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Filter toolbar states
  const [searchVal, setSearchVal] = useState(search);
  const [statusVal, setStatusVal] = useState(status);
  const [cancelStatusVal, setCancelStatusVal] = useState(cancelStatus);
  const [showOrderSuggestions, setShowOrderSuggestions] = useState(false);
  const [orderSuggestions, setOrderSuggestions] = useState<Array<Record<string, unknown>>>([]);
  const [isSearchingOrderSuggestions, setIsSearchingOrderSuggestions] = useState(false);
  const ordersSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchVal(search);
  }, [search]);

  useEffect(() => {
    setStatusVal(status);
  }, [status]);

  useEffect(() => {
    setCancelStatusVal(cancelStatus);
  }, [cancelStatus]);

  // Close recommendations on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ordersSearchRef.current && !ordersSearchRef.current.contains(e.target as Node)) {
        setShowOrderSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced server search suggestions for Orders
  useEffect(() => {
    const q = searchVal.trim();
    if (!q || q.length < 1) {
      setOrderSuggestions([]);
      setIsSearchingOrderSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOrderSuggestions(true);
      try {
        const res = await fetch(`/api/admin/resources/orders?search=${encodeURIComponent(q)}`);
        if (res.ok) {
          const json = await res.json();
          const items: Array<Record<string, unknown>> = json.data || [];
          setOrderSuggestions(items.slice(0, 8));
        }
      } catch (err) {
        console.error("Order suggestions fetch error:", err);
      } finally {
        setIsSearchingOrderSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchVal]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal !== search) {
        const params = new URLSearchParams();
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (statusVal) params.set("status", statusVal);
        if (cancelStatusVal) params.set("cancel_status", cancelStatusVal);
        params.set("page", "1");
        const queryStr = params.toString();
        router.replace(`/admin/orders${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchVal, search, statusVal, cancelStatusVal, router]);

  // Order Details mutation states
  const [editStatus, setEditStatus] = useState(String(selectedOrderDetail?.order?.status || "pending_payment"));
  const [editResi, setEditResi] = useState(String(selectedOrderDetail?.order?.resi_number || ""));
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingResi, setSavingResi] = useState(false);
  const [trackingModal, setTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<{ title: string; message: string } | null>(null);
  const [checkingTracking, setCheckingTracking] = useState(false);
  const [refreshingTrackings, setRefreshingTrackings] = useState(false);
  const [actionMenuOrderId, setActionMenuOrderId] = useState<string | number | null>(null);

  // Refund Confirmation Modal States
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [adminRefundBank, setAdminRefundBank] = useState("");
  const [adminRefundAccNum, setAdminRefundAccNum] = useState("");
  const [adminRefundAccName, setAdminRefundAccName] = useState("");
  const [adminRefundAmount, setAdminRefundAmount] = useState<number | string>("");
  const [adminRefundNotes, setAdminRefundNotes] = useState("");
  const [copiedNumber, setCopiedNumber] = useState(false);

  function openRefundConfirmationModal() {
    const o = selectedOrderDetail?.order;
    if (!o) return;
    setAdminRefundBank(String(o.refund_bank_name || "BCA"));
    setAdminRefundAccNum(String(o.refund_account_number || ""));
    setAdminRefundAccName(String(o.refund_account_name || (selectedOrderDetail?.payment as any)?.account_name || ""));
    setAdminRefundAmount(Number(o.refund_amount || o.grand_total || 0));
    setAdminRefundNotes(String(o.refund_notes || ""));
    setShowRefundModal(true);
  }

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".action-dropdown-wrap")) {
        setActionMenuOrderId(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);

    // If URL has legacy plain integer order_id, automatically update URL to encrypted token
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const currentParam = url.searchParams.get("order_id");
      if (currentParam && /^\d+$/.test(currentParam)) {
        const encrypted = encryptOrderId(currentParam);
        url.searchParams.set("order_id", encrypted);
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Auto-reload order details & tracking history from API
  async function refreshOrderDetail(orderId: unknown, silent = false) {
    if (!orderId) return;
    const token = typeof orderId === "string" && orderId.startsWith("ord_") ? orderId : encryptOrderId(Number(orderId));
    if (!silent) setRefreshingTrackings(true);
    try {
      const res = await fetch(`/api/admin/resources/orders/${token}?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (res.ok && data) {
        setSelectedOrderDetail(data);
        if (data.order) {
          setEditStatus(String(data.order.status || "pending_payment"));
          setEditResi(String(data.order.resi_number || ""));
        }
      }
    } catch (err) {
      console.error("Failed to auto-refresh order trackings:", err);
    } finally {
      if (!silent) setRefreshingTrackings(false);
    }
  }

  // Real-time auto-polling every 4 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;

      if (selectedOrderDetail?.order?.id) {
        refreshOrderDetail(selectedOrderDetail.order.id, true);
      } else {
        router.refresh();
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [selectedOrderDetail?.order?.id, router]);

  // Window focus & tab visibility listener for instant refresh
  useEffect(() => {
    function handleVisibilityChange() {
      if (typeof document !== "undefined" && !document.hidden) {
        if (selectedOrderDetail?.order?.id) {
          refreshOrderDetail(selectedOrderDetail.order.id, true);
        }
        router.refresh();
      }
    }
    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedOrderDetail?.order?.id, router]);

  useEffect(() => {
    if (selectedOrderDetail?.order) {
      setEditStatus(String(selectedOrderDetail.order.status || "pending_payment"));
      setEditResi(String(selectedOrderDetail.order.resi_number || ""));
    }
  }, [selectedOrderDetail?.order?.status, selectedOrderDetail?.order?.resi_number]);

  // Open order details
  async function openOrderDetail(row: Record<string, unknown>) {
    const id = Number(row.id);
    const token = (row.encrypted_id as string) || encryptOrderId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/resources/orders/${token || id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat detail pesanan.");
      setSelectedOrderDetail(data);
      if (data?.order) {
        setEditStatus(String(data.order.status || "pending_payment"));
        setEditResi(String(data.order.resi_number || ""));
      }
      const url = new URL(window.location.href);
      url.searchParams.set("order_id", token);
      window.history.pushState({}, "", url.pathname + url.search);
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal membuka detail pesanan."), type: "error" });
    } finally {
      setLoadingDetail(false);
    }
  }

  // Back to orders list
  function backToList() {
    setSelectedOrderDetail(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("order_id");
    window.history.pushState({}, "", url.pathname + url.search);
  }

  // Clear cache handler
  async function handleClearCache() {
    setClearingCache(true);
    try {
      const res = await fetch("/api/admin/cache/clear", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membersihkan cache.");
      setMessage({ text: "Cache sistem berhasil dibersihkan!", type: "success" });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal membersihkan cache."), type: "error" });
    } finally {
      setClearingCache(false);
    }
  }

  // Filter submit handler
  function handleFilterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (statusVal) params.set("status", statusVal);
    if (cancelStatusVal) params.set("cancel_status", cancelStatusVal);
    params.set("page", "1");
    router.push(`/admin/orders?${params.toString()}`);
  }

  // Pagination navigation
  function navigatePage(newPage: number) {
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set("search", searchVal.trim());
    if (statusVal) params.set("status", statusVal);
    if (cancelStatusVal) params.set("cancel_status", cancelStatusVal);
    params.set("page", String(newPage));
    router.push(`/admin/orders?${params.toString()}`);
  }

  // Save Status / Cancellation
  async function handleCancellation(
    decision: "approved" | "rejected",
    refundData?: {
      refund_bank_name?: string;
      refund_account_number?: string;
      refund_account_name?: string;
      refund_amount?: number;
      refund_notes?: string;
    }
  ) {
    const id = selectedOrderDetail?.order?.id;
    if (!id || savingStatus) return;
    setSavingStatus(true);
    try {
      const response = await fetch(`/api/admin/resources/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancel_request_status: decision,
          ...(refundData || {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal memproses pembatalan.");

      if (result.order) {
        setSelectedOrderDetail(result);
        if (result.order.status) setEditStatus(String(result.order.status));
      } else {
        // Optimistically update local state immediately
        setSelectedOrderDetail((prev: any) => {
          if (!prev || !prev.order) return prev;
          return {
            ...prev,
            order: {
              ...prev.order,
              status: decision === "approved" ? "cancelled" : prev.order.status,
              cancel_request_status: decision,
              ...(refundData || {}),
            },
          };
        });
      }

      if (decision === "approved") {
        setEditStatus("cancelled");
        setShowRefundModal(false);
      }

      setMessage({
        text:
          decision === "approved"
            ? "Pembatalan pesanan disetujui & pengembalian dana telah dikonfirmasi!"
            : "Pengajuan pembatalan telah ditolak.",
        type: "success",
      });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Gagal memproses pembatalan.", type: "error" });
    } finally {
      await refreshOrderDetail(id, true);
      router.refresh();
      setSavingStatus(false);
    }
  }

  async function handleSaveStatus(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrderDetail?.order?.id) return;
    const orderId = selectedOrderDetail.order.id;
    const isMaba = isMabaOrder(selectedOrderDetail.order, selectedOrderDetail.items);
    setSavingStatus(true);
    try {
      let resiToSave = editResi.trim();
      if (editStatus === "shipped" && !resiToSave) {
        resiToSave = generateAutoResi(
          selectedOrderDetail.order.expedition_code as string | undefined,
          selectedOrderDetail.order.expedition_name as string | undefined,
          isMaba
        );
        setEditResi(resiToSave);
      }

      const payload: Record<string, unknown> = { status: editStatus };
      if (editStatus === "shipped" && resiToSave) {
        payload.resi_number = resiToSave;
      }

      const res = await fetch(`/api/admin/resources/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan status.");

      if (data.order) {
        setSelectedOrderDetail(data);
        setEditStatus(String(data.order.status || editStatus));
        if (data.order.resi_number) setEditResi(String(data.order.resi_number));
      } else {
        setSelectedOrderDetail((prev) => prev ? {
          ...prev,
          order: {
            ...prev.order,
            status: editStatus,
            ...(payload.resi_number ? { resi_number: resiToSave } : {}),
          },
        } : null);
      }

      setMessage({
        text: `Status pesanan berhasil diperbarui!${payload.resi_number ? ` Nomor ${isMaba ? "referensi batch" : "resi"} (${resiToSave}) otomatis disimpan.` : ""}`,
        type: "success",
      });
      // Auto-load updated trackings and order data
      await refreshOrderDetail(orderId, true);
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal memperbarui status."), type: "error" });
    } finally {
      setSavingStatus(false);
    }
  }

  // Save Resi / Batch Ref
  async function handleSaveResi(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrderDetail?.order?.id) return;
    const orderId = selectedOrderDetail.order.id;
    const isMaba = isMabaOrder(selectedOrderDetail.order, selectedOrderDetail.items);
    setSavingResi(true);
    try {
      const res = await fetch(`/api/admin/resources/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resi_number: editResi.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan nomor resi.");

      if (data.order) {
        setSelectedOrderDetail(data);
        setEditStatus(String(data.order.status || ""));
        setEditResi(String(data.order.resi_number || editResi.trim()));
      } else {
        setSelectedOrderDetail((prev) => {
          if (!prev) return null;
          const currentStatus = String(prev.order?.status || "");
          const newStatus = (currentStatus === "paid" || currentStatus === "packed") ? "shipped" : currentStatus;
          if (newStatus === "shipped") {
            setEditStatus("shipped");
          }
          return {
            ...prev,
            order: { ...prev.order, resi_number: editResi.trim(), status: newStatus },
          };
        });
      }

      setMessage({ text: isMaba ? "Nomor referensi distribusi kampus berhasil disimpan!" : "Nomor resi pengiriman berhasil disimpan!", type: "success" });
      // Auto-load updated trackings and order data
      await refreshOrderDetail(orderId, true);
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal menyimpan nomor resi."), type: "error" });
    } finally {
      setSavingResi(false);
    }
  }

  // Check Waybill / Tracking via RajaOngkir API Handler
  async function handleCheckTracking() {
    const isMaba = isMabaOrder(selectedOrderDetail?.order, selectedOrderDetail?.items);
    if (isMaba) {
      setMessage({ text: "Pesanan Event MABA menggunakan jalur Distribusi Internal Kampus UBSI (Bebas Ongkir), tidak melalui kurir ekspedisi luar.", type: "info" });
      return;
    }
    const resi = editResi.trim() || String(selectedOrderDetail?.order?.resi_number || "").trim();
    if (!resi) {
      setMessage({ text: "Harap masukkan dan simpan Nomor Resi Pengiriman terlebih dahulu sebelum mengecek resi via RajaOngkir.", type: "error" });
      return;
    }
    setCheckingTracking(true);
    try {
      const res = await fetch("/api/admin/tracking/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: selectedOrderDetail?.order?.id,
          resi_number: resi,
          courier: selectedOrderDetail?.order?.expedition_code || selectedOrderDetail?.order?.expedition_name || "jne",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal melacak resi.");

      const expedition = String(selectedOrderDetail?.order?.expedition_name || "Ekspedisi").toUpperCase();
      const manifestList = Array.isArray(data.manifest)
        ? data.manifest.map((m: unknown) => {
          const manifest = m && typeof m === "object" ? m as Record<string, unknown> : {};
          return `• [${manifest.date}] ${manifest.description} (${manifest.city})`;
        }).join("\n")
        : "";

      setTrackingInfo({
        title: `Tracking Resi ${expedition}: ${resi}`,
        message: `Status: ${data.summary?.status || "ON PROCESS / DALAM PENGIRIMAN"}\n\nRiwayat Manifest:\n${manifestList || "Pesanan dalam proses logistik ekspedisi."}`,
      });
      setTrackingModal(true);
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal melacak resi via RajaOngkir."), type: "error" });
    } finally {
      setCheckingTracking(false);
    }
  }

  // Simulate Courier / Campus Handover Auto-POD Handler
  async function handleSimulateAutoPOD() {
    if (!selectedOrderDetail?.order?.id) return;
    const orderId = selectedOrderDetail.order.id;
    const isMaba = isMabaOrder(selectedOrderDetail.order, selectedOrderDetail.items);
    setSavingStatus(true);
    try {
      const defaultCode = isMaba ? `MABA26-UBSI-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-1001` : "JT89823412398";
      const simulatedResi = editResi.trim() || String(selectedOrderDetail.order.resi_number || defaultCode).trim();
      const res = await fetch(`/api/admin/resources/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "arrived", resi_number: simulatedResi }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mensimulasikan status tiba.");

      if (data.order) {
        setSelectedOrderDetail(data);
        setEditStatus(String(data.order.status || "arrived"));
        setEditResi(String(data.order.resi_number || simulatedResi));
      } else {
        setSelectedOrderDetail((prev) => prev ? {
          ...prev,
          order: { ...prev.order, status: "arrived", resi_number: simulatedResi },
        } : null);
        setEditStatus("arrived");
        setEditResi(simulatedResi);
      }

      setMessage({
        text: isMaba
          ? "Simulasi Tiba di Kampus Berhasil! Perlengkapan telah siap diambil di titik temu PMB Kampus UBSI."
          : "Simulasi Kurir Auto-POD Berhasil! Paket telah ditandai diterima (Proof of Delivery) oleh kurir.",
        type: "success",
      });
      // Auto-load updated trackings and order data
      await refreshOrderDetail(orderId, true);
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Gagal mensimulasikan status tiba."), type: "error" });
    } finally {
      setSavingStatus(false);
    }
  }

  // Invoice Print Handler
  function handleDownloadInvoice() {
    if (!selectedOrderDetail?.order) return;
    const order = selectedOrderDetail.order;
    const items = selectedOrderDetail.items || [];
    const isMaba = isMabaOrder(order, items);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const dateFormatted = order.created_at
      ? new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date(String(order.created_at)))
      : "—";

    const itemsHtml = items.map((it, idx) => {
      const nimVal = it.nim || it.student_id || it.nim_number || order.nim || order.student_id;
      return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>
            <strong>${it.product_name || it.name || "Produk"}</strong>
            <div style="font-size:11px;color:#64748b;">
              Ukuran: ${it.size || "—"} • Warna: ${it.color || "—"}
              ${nimVal ? ` • <strong>NIM: ${nimVal}</strong>` : ""}
            </div>
          </td>
          <td style="text-align:right;">${money.format(Number(it.price || 0))}</td>
          <td style="text-align:center;">${it.quantity}</td>
          <td style="text-align:right;font-weight:bold;">${money.format(Number(it.total || (Number(it.price || 0) * Number(it.quantity || 1))))}</td>
        </tr>
      `;
    }).join("");

    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Invoice #${order.invoice_number} - UBSI Cyber Store</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 32px; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo-title { font-size: 24px; font-weight: 800; color: #0b1329; margin: 0 0 4px 0; }
          .tagline { font-size: 13px; color: #64748b; margin: 0; }
          .inv-badge { text-align: right; }
          .inv-title { font-size: 20px; font-weight: 800; color: ${isMaba ? "#003399" : "#e11d48"}; margin: 0 0 4px 0; }
          .inv-meta { font-size: 12px; color: #475569; }
          .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 12.5px; }
          .info-box strong { color: #0f172a; }
          .maba-pill { display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; border: 1px solid #e2e8f0; }
          td { padding: 10px 12px; border: 1px solid #e2e8f0; vertical-align: middle; }
          .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .totals-table { width: 300px; font-size: 13px; }
          .totals-table td { padding: 6px 10px; border: none; }
          .totals-table .grand { font-size: 16px; font-weight: 800; color: ${isMaba ? "#003399" : "#e11d48"}; border-top: 2px solid #cbd5e1; }
          .footer { text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; line-height: 1.5; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="logo-title">UBSI CYBER STORE</h1>
            <p class="tagline">${isMaba ? "Official Campus Merchandise • Pengambilan Perlengkapan MABA" : "Official Campus Merchandise & Technology Store"}</p>
          </div>
          <div class="inv-badge">
            <div class="inv-title">${isMaba ? "INVOICE EVENT MABA" : "INVOICE"}</div>
            <div class="inv-meta">No. #${order.invoice_number}</div>
            <div class="inv-meta">Tanggal: ${dateFormatted}</div>
            ${isMaba ? '<div class="maba-pill">🎓 SERAGAM MABA 2026</div>' : ""}
          </div>
        </div>

        <div class="grid-info">
          <div class="info-box">
            <div style="font-weight:700;margin-bottom:6px;color:#0088cc;text-transform:uppercase;font-size:11px;">Informasi Mahasiswa / Pembeli</div>
            <div><strong>${order.customer_name || "Pelanggan"}</strong></div>
            <div>Email: ${order.customer_email || "—"}</div>
            <div>No. HP: ${order.customer_phone || order.address_phone || "—"}</div>
            <div>Alamat: ${order.customer_address || "—"} ${order.city || ""} ${order.province || ""} ${order.postal_code || ""}</div>
          </div>
          <div class="info-box">
            <div style="font-weight:700;margin-bottom:6px;color:#0088cc;text-transform:uppercase;font-size:11px;">Informasi Distribusi / Pengambilan</div>
            <div>Metode: <strong>${isMaba ? "Ambil Langsung di Kampus UBSI (Bebas Ongkir)" : `${order.expedition_name || "JNE"} ${order.expedition_service || "Regular"}`}</strong></div>
            <div>${isMaba ? "Ref Distribusi" : "No. Resi"}: <strong>${order.resi_number || (isMaba ? "Distribusi Internal Kampus" : "Belum ada resi")}</strong></div>
            <div>Status: <strong>${order.status}</strong></div>
            ${isMaba ? `<div style="margin-top:4px;color:#16a34a;font-weight:600;">✓ Pengambilan Seragam di Titik Temu PMB Kampus UBSI</div>` : ""}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:36px;text-align:center;">NO</th>
              <th>PRODUK</th>
              <th style="text-align:right;">HARGA</th>
              <th style="text-align:center;">QTY</th>
              <th style="text-align:right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || '<tr><td colspan="5" style="text-align:center;padding:20px;">Tidak ada item</td></tr>'}
          </tbody>
        </table>

        <div class="totals-wrap">
          <table class="totals-table">
            <tr>
              <td>Subtotal Produk:</td>
              <td style="text-align:right;">${money.format(Number(order.subtotal || 0))}</td>
            </tr>
            <tr>
              <td>Biaya Pengiriman:</td>
              <td style="text-align:right;">${isMaba ? "Rp 0 (Bebas Ongkir)" : money.format(Number(order.shipping_cost || 0))}</td>
            </tr>
            <tr class="grand">
              <td>Total Bayar:</td>
              <td style="text-align:right;">${money.format(Number(order.grand_total || 0))}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>${isMaba ? "Perlengkapan seragam Mahasiswa Baru diambil langsung di Kampus UBSI. Tunjukkan invoice/QR ini kepada admin kampus saat pengambilan di kampus." : "Terima kasih telah berbelanja di UBSI Cyber Store. Invoice ini merupakan bukti pembayaran resmi yang sah."}</p>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  // If viewing Order Details (Screenshot 2)
  if (selectedOrderDetail) {
    const order = selectedOrderDetail.order;
    const items = selectedOrderDetail.items || [];
    const isMaba = isMabaOrder(order, items);
    const payment = selectedOrderDetail.payment;
    const grandTotal = Number(order.grand_total || 0);
    const subtotal = Number(order.subtotal || 0);
    const shippingCost = isMaba ? 0 : Number(order.shipping_cost || 0);
    const serviceFee = Math.max(0, grandTotal - subtotal - shippingCost) || 2000;
    const statusCfg = formatOrderStatus(String(order.status || "completed"), isMaba);

    const fullAddress = [
      String(order.customer_address || order.address || "").trim(),
      String(order.district || "").trim(),
      String(order.city || "").trim(),
      String(order.province || "").trim(),
      String(order.postal_code || "").trim(),
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <div className="page-stack order-details-page">
        <SweetAlert
          isOpen={!!message}
          isToast={true}
          type={message?.type || "info"}
          message={message?.text || ""}
          onClose={() => setMessage(null)}
        />

        {/* RajaOngkir Tracking Modal */}
        <SweetAlert
          isOpen={trackingModal}
          type="info"
          title={trackingInfo?.title || `Tracking: ${order.expedition_name || "JNE"} (${order.resi_number || "—"})`}
          message={trackingInfo?.message || `Status Pengiriman: Dalam Perjalanan (On Process / Delivered). Paket ditangani oleh kurir ${order.expedition_name || "JNE"} dengan nomor resi ${order.resi_number || "—"} tujuan ${order.city || "Pusat Pengiriman"}.`}
          confirmText="Tutup"
          onConfirm={() => setTrackingModal(false)}
          onClose={() => setTrackingModal(false)}
        />

        {/* Breadcrumb & Main Heading */}
        <div className="order-breadcrumb-row">
          <div className="order-breadcrumb">
            <Link href="/admin" className="order-crumb-link">
              <span className="order-crumb-home">🏠</span> Pages
            </Link>
            <span className="order-crumb-sep">&gt;</span>
            <button type="button" onClick={backToList} className="order-crumb-link order-crumb-btn">
              Pesanan
            </button>
            <span className="order-crumb-sep">&gt;</span>
            <span className="order-crumb-active">#{String(order.invoice_number)}</span>
          </div>
          <h1 className="order-main-heading">Order Details</h1>
        </div>

        {/* Top Card: Order Details Header & Items */}
        <section className="orders-card order-details-top-card">
          <div className="order-top-header">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 className="order-details-card-title">Order Details</h2>
                {isMaba && (
                  <span
                    style={{
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    🎓 EVENT MABA 2026
                  </span>
                )}
              </div>
              <div className="order-details-card-meta">
                Order no. <strong>#{String(order.invoice_number)}</strong> from{" "}
                <strong>{formatDotDate(order.created_at)}</strong> • Status:{" "}
                <strong style={{ color: statusCfg.color }}>{statusCfg.label.toUpperCase()}</strong>
              </div>
            </div>
            <div className="order-top-actions">
              <button
                type="button"
                className="order-invoice-btn"
                onClick={handleDownloadInvoice}
                title="Cetak Invoice Pesanan"
              >
                <Icon name="Printer" size={15} />
                <span>INVOICE</span>
              </button>
              <button
                type="button"
                className="order-back-btn"
                onClick={backToList}
                title="Kembali ke Daftar Pesanan"
              >
                <Icon name="ChevronLeft" size={15} />
                <span>KEMBALI</span>
              </button>
            </div>
          </div>

          {/* MABA Order Notice Banner */}
          {isMaba && (
            <div
              style={{
                margin: "0 0 16px 0",
                padding: "12px 16px",
                background: "linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)",
                border: "1.5px solid #93c5fd",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.5rem" }}>🎓</span>
                <div>
                  <strong style={{ color: "#1e40af", fontSize: "0.92rem" }}>
                    Pesanan Perlengkapan Mahasiswa Baru (Event MABA UBSI)
                  </strong>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#2563eb", lineHeight: 1.4 }}>
                    Pengambilan langsung di Kampus UBSI (Bebas Ongkir). Tidak dikirim melalui jasa ekspedisi luar.
                  </p>
                </div>
              </div>
              <span
                style={{
                  background: "#1d4ed8",
                  color: "#ffffff",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                ✓ PENGAMBILAN KAMPUS
              </span>
            </div>
          )}

          {/* Items in order */}
          <div className="order-items-container">
            {items.map((item, idx) => {
              const photoUrl = resolveProductPhotoUrl(item.main_photo || item.photo || item.image || item.product_photo);
              const nimVal = item.nim || item.student_id || item.nim_number || order.nim || order.student_id;
              const itemIsMaba = Boolean(item.is_event_maba || nimVal || isMaba);
              return (
                <div key={String(item.id || idx)} className="order-item-card">
                  <div className="order-item-left">
                    <div className="order-item-photo-wrap">
                      <img
                        src={photoUrl}
                        alt={String(item.product_name || item.name || "Produk")}
                        className="order-item-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                        }}
                      />
                    </div>
                    <div className="order-item-info">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <h4 className="order-item-name" style={{ margin: 0 }}>{String(item.product_name || item.name || "Produk")}</h4>
                        {itemIsMaba && (
                          <span style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontSize: "0.68rem", fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>
                            MABA
                          </span>
                        )}
                      </div>
                      <div className="order-item-meta" style={{ marginTop: 4 }}>
                        Qty: <strong>{String(item.quantity)}x</strong> • Ukuran:{" "}
                        <strong>{String(item.size || "—")}</strong> • Warna:{" "}
                        <strong>{String(item.color || "—")}</strong>
                        {Boolean(nimVal) && (
                          <> • NIM: <span className="order-nim-badge">🎓 {String(nimVal)}</span></>
                        )}
                      </div>
                      <div className="order-item-status-row">
                        <span
                          className="order-item-status-pill"
                          style={{
                            color: statusCfg.color,
                            backgroundColor: statusCfg.bg,
                            borderColor: statusCfg.border,
                          }}
                        >
                          {statusCfg.label.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="order-item-right">
                    <span className="order-item-price-label">HARGA PRODUK</span>
                    <span className="order-item-price-val">
                      {money.format(Number(item.price || item.total || 0))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3 Column Grid Layout */}
        <div className="order-bottom-grid">
          {/* Column 1: Track order */}
          <section className="orders-card order-subcard">
            <div className="order-subcard-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3>Track order</h3>
                <button
                  type="button"
                  onClick={() => selectedOrderDetail?.order?.id && refreshOrderDetail(selectedOrderDetail.order.id)}
                  disabled={refreshingTrackings}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    display: "inline-flex",
                    alignItems: "center",
                    color: refreshingTrackings ? "#0284c7" : "#64748b",
                    transition: "all 0.2s",
                  }}
                  title="Segarkan riwayat pelacakan (Auto-Load)"
                >
                  <Icon name="RefreshCw" size={13} className={refreshingTrackings ? "spin" : ""} />
                </button>
              </div>
              <span
                className="order-expedition-badge"
                style={isMaba ? { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe", fontWeight: 700 } : undefined}
              >
                {isMaba ? "🏛️ Distribusi Kampus UBSI" : String(order.expedition_name || "Anteraja")}
              </span>
            </div>
            <div className="order-subcard-content">
              {refreshingTrackings && (
                <div style={{ padding: "6px 10px", marginBottom: 10, background: "#f0f9ff", borderRadius: 6, border: "1px solid #bae6fd", fontSize: 12, color: "#0284c7", display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="RefreshCw" size={12} className="spin" />
                  <span>Memperbarui status pelacakan...</span>
                </div>
              )}
              <div className="order-timeline">
                {selectedOrderDetail.trackings && selectedOrderDetail.trackings.length > 0 ? (
                  selectedOrderDetail.trackings.map((t, idx) => {
                    const isLatest = idx === 0;
                    const st = String(t.status || "").toLowerCase();
                    const iconName = st === "completed" || st === "arrived" ? "Check" : st === "shipped" ? "Truck" : st === "packed" ? "Package" : "Bell";
                    const iconClass = isLatest ? (st === "completed" || st === "arrived" ? "green-icon" : st === "shipped" ? "blue-icon" : "red-icon") : "grey-icon";
                    return (
                      <div key={String(t.id || idx)} className="order-timeline-item">
                        <div className={`order-timeline-icon ${iconClass}`}>
                          <Icon name={iconName} size={14} />
                        </div>
                        <div className="order-timeline-content">
                          <h4 className="order-timeline-title">{String(t.description || "Status pesanan diperbarui.")}</h4>
                          <div className="order-timeline-meta">
                            <span>{formatDotDateTime(t.created_at)} WIB</span>
                            <span className="order-timeline-tag">📍 {String(t.location || (isMaba ? "Kampus UBSI" : "Sistem"))}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : isMaba ? (
                  <>
                    {Boolean(order.status === "completed") && (
                      <div className="order-timeline-item">
                        <div className="order-timeline-icon green-icon">
                          <Icon name="Check" size={14} />
                        </div>
                        <div className="order-timeline-content">
                          <h4 className="order-timeline-title">Perlengkapan Event MABA telah resmi diserahkan dan diterima oleh Mahasiswa Baru.</h4>
                          <div className="order-timeline-meta">
                            <span>{formatDotDateTime(order.updated_at || new Date().toISOString())} WIB</span>
                            <span className="order-timeline-tag">📍 Kampus UBSI</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {Boolean(order.status === "arrived" || order.status === "completed") && (
                      <div className="order-timeline-item">
                        <div className="order-timeline-icon green-icon">
                          <Icon name="Check" size={14} />
                        </div>
                        <div className="order-timeline-content">
                          <h4 className="order-timeline-title">Perlengkapan telah tiba di Kampus UBSI tujuan dan siap diambil di titik temu PMB.</h4>
                          <div className="order-timeline-meta">
                            <span>{formatDotDateTime(order.updated_at || new Date().toISOString())} WIB</span>
                            <span className="order-timeline-tag">📍 Titik Temu Kampus UBSI</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {Boolean(order.resi_number || order.status === "shipped" || order.status === "arrived" || order.status === "completed") && (
                      <div className="order-timeline-item">
                        <div className="order-timeline-icon blue-icon">
                          <Icon name="Truck" size={14} />
                        </div>
                        <div className="order-timeline-content">
                          <h4 className="order-timeline-title">
                            Perlengkapan Event MABA dalam proses distribusi internal menuju lokasi Kampus UBSI{order.resi_number ? ` (Ref: ${order.resi_number})` : ""}.
                          </h4>
                          <div className="order-timeline-meta">
                            <span>{formatDotDateTime(order.updated_at || order.created_at)} WIB</span>
                            <span className="order-timeline-tag">📍 Distribusi Internal Kampus</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {Boolean(order.status === "packed" || order.status === "shipped" || order.status === "arrived" || order.status === "completed") && (
                      <div className="order-timeline-item">
                        <div className="order-timeline-icon blue-icon">
                          <Icon name="Package" size={14} />
                        </div>
                        <div className="order-timeline-content">
                          <h4 className="order-timeline-title">Perlengkapan Event MABA sedang disiapkan dan dikemas oleh Admin Kampus.</h4>
                          <div className="order-timeline-meta">
                            <span>{formatDotDateTime(order.updated_at || order.created_at)} WIB</span>
                            <span className="order-timeline-tag">📍 Gudang Logistik UBSI</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="order-timeline-item">
                      <div className="order-timeline-icon red-icon">
                        <Icon name="Bell" size={14} />
                      </div>
                      <div className="order-timeline-content">
                        <h4 className="order-timeline-title">Pembayaran berhasil diverifikasi. Pesanan masuk antrean penyiapan seragam MABA.</h4>
                        <div className="order-timeline-meta">
                          <span>{formatDotDateTime(payment?.created_at || order.created_at)} WIB</span>
                          <span className="order-timeline-tag">📍 Sistem / PMB</span>
                        </div>
                      </div>
                    </div>

                    <div className="order-timeline-item">
                      <div className="order-timeline-icon grey-icon">
                        <Icon name="Package" size={14} />
                      </div>
                      <div className="order-timeline-content">
                        <h4 className="order-timeline-title">Pesanan perlengkapan MABA dibuat dan menunggu pembayaran.</h4>
                        <div className="order-timeline-meta">
                          <span>{formatDotDateTime(order.created_at)} WIB</span>
                          <span className="order-timeline-tag">📍 Sistem Pendaftaran</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {Boolean(order.status === "arrived" || order.status === "completed") && (
                      <div className="order-timeline-item">
                        <div className="order-timeline-icon green-icon">
                          <Icon name="Check" size={14} />
                        </div>
                        <div className="order-timeline-content">
                          <h4 className="order-timeline-title">Pesanan telah diterima oleh pelanggan (Proof of Delivery / POD).</h4>
                          <div className="order-timeline-meta">
                            <span>{formatDotDateTime(order.updated_at || new Date().toISOString())} WIB</span>
                            <span className="order-timeline-tag">📍 {String(order.city || "Tujuan")}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {Boolean(order.resi_number || order.status === "shipped" || order.status === "arrived" || order.status === "completed") && (
                      <div className="order-timeline-item">
                        <div className="order-timeline-icon blue-icon">
                          <Icon name="Truck" size={14} />
                        </div>
                        <div className="order-timeline-content">
                          <h4 className="order-timeline-title">
                            Pesanan diserahkan ke kurir {String(order.expedition_name || "Anteraja")}{order.resi_number ? ` (Resi: ${order.resi_number})` : ""}.
                          </h4>
                          <div className="order-timeline-meta">
                            <span>{formatDotDateTime(order.updated_at || order.created_at)} WIB</span>
                            <span className="order-timeline-tag">📍 {String(order.expedition_name || "Kurir Hub")}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="order-timeline-item">
                      <div className="order-timeline-icon red-icon">
                        <Icon name="Bell" size={14} />
                      </div>
                      <div className="order-timeline-content">
                        <h4 className="order-timeline-title">Pembayaran berhasil diverifikasi oleh sistem.</h4>
                        <div className="order-timeline-meta">
                          <span>{formatDotDateTime(payment?.created_at || order.created_at)} WIB</span>
                          <span className="order-timeline-tag">📍 Sistem</span>
                        </div>
                      </div>
                    </div>

                    <div className="order-timeline-item">
                      <div className="order-timeline-icon grey-icon">
                        <Icon name="Package" size={14} />
                      </div>
                      <div className="order-timeline-content">
                        <h4 className="order-timeline-title">Pesanan dibuat dan menunggu pembayaran.</h4>
                        <div className="order-timeline-meta">
                          <span>{formatDotDateTime(order.created_at)} WIB</span>
                          <span className="order-timeline-tag">📍 {String(order.city || "Bogor")}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Column 2: Payment details & Billing Information */}
          <div className="order-bottom-col-stack" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Payment details */}
            <section className="orders-card order-subcard">
              <div className="order-subcard-header">
                <h3>Payment details</h3>
              </div>
              <div className="order-subcard-content">
                <div className="order-payment-box-v2">
                  <div className="order-pay-badge-row">
                    <div className="order-pay-method-badge">
                      <span className="order-pay-brand">
                        {String(payment?.payment_type || payment?.payment_method || payment?.bank || order.payment_method || "ECHA").toUpperCase()}
                      </span>
                      <span className="order-pay-acc">
                        {String(payment?.account_number || payment?.va_number || (payment?.transaction_id ? `ID: ${String(payment.transaction_id).slice(0, 10)}...` : "**** **** **** 0000"))}
                      </span>
                    </div>
                    <span className="order-pay-status-pill green">{order.cancel_request_status === "refund_processing" ? "KONFIRMASI" : order.cancel_request_status === "approved" ? "DIBATALKAN / LIHAT RIWAYAT" : String(payment?.status || "waiting_payment").toUpperCase()}</span>
                  </div>
                  <div className="order-pay-info-line">
                    <span>Jumlah Pembayaran:</span>
                    <strong>{money.format(grandTotal)}</strong>
                  </div>
                  <div className="order-pay-info-line">
                    <span>Dibayar Pada:</span>
                    <strong>{formatDotDateTime(payment?.created_at || order.created_at)}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* Billing Information */}
            <section className="orders-card order-subcard">
              <div className="order-subcard-header">
                <h3>{isMaba ? "Data Mahasiswa & Pengambilan" : "Billing Information"}</h3>
              </div>
              <div className="order-subcard-content">
                <div className="order-billing-box-v2">
                  <h4 className="order-billing-name">{String(order.customer_name || "Mahasiswa UBSI")}</h4>
                  <div className="order-billing-line">
                    <span>Email:</span>
                    <strong>{String(order.customer_email || "—")}</strong>
                  </div>
                  <div className="order-billing-line">
                    <span>No. HP:</span>
                    <strong>{String(order.customer_phone || order.address_phone || "—")}</strong>
                  </div>
                  <div className="order-billing-line">
                    <span>Metode Distribusi:</span>
                    <strong style={{ color: isMaba ? "#1d4ed8" : "#0f172a" }}>
                      {isMaba ? "🏛️ Ambil Langsung di Kampus UBSI (Bebas Ongkir)" : "Pengiriman Ekspedisi Kurir"}
                    </strong>
                  </div>
                  <div className="order-billing-line">
                    <span>Alamat:</span>
                    <span>{fullAddress || "Kampus UBSI"}</span>
                  </div>

                  {/* Embedded Google Map Box */}
                  <div className="order-map-container" style={{ position: "relative", overflow: "hidden", borderRadius: 8, border: "1px solid #e2e8f0", marginTop: 8 }}>
                    <iframe
                      width="100%"
                      height="125"
                      style={{ border: 0, display: "block" }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress || "Universitas BSI")}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    />
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress || "Universitas BSI")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="order-map-btn"
                    >
                      📌 Buka Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Column 3: Order Summary & Ubah Status & Resi */}
          <div className="order-bottom-col-stack" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Order Summary */}
            <section className="orders-card order-subcard">
              <div className="order-subcard-header">
                <h3>Order Summary</h3>
              </div>
              <div className="order-subcard-content">
                <div className="order-summary-table">
                  <div className="order-summary-row">
                    <span>Subtotal Produk:</span>
                    <strong>{money.format(subtotal)}</strong>
                  </div>
                  <div className="order-summary-row">
                    <span>Biaya Pengiriman:</span>
                    <strong style={isMaba ? { color: "#16a34a" } : undefined}>
                      {isMaba ? "Rp 0 (Bebas Ongkir)" : money.format(shippingCost)}
                    </strong>
                  </div>
                  <div className="order-summary-row">
                    <span>Biaya Layanan:</span>
                    <strong>{money.format(serviceFee)}</strong>
                  </div>
                  <div className="order-summary-row">
                    <span>{isMaba ? "Jalur Distribusi:" : "Ekspedisi:"}</span>
                    <span style={isMaba ? { color: "#1d4ed8", fontWeight: 700 } : undefined}>
                      {isMaba ? "🏛️ Distribusi Kampus UBSI (Bebas Ongkir)" : String(order.expedition_name || "Anteraja")}
                    </span>
                  </div>
                  <div className="order-summary-divider" />
                  <div className="order-summary-row order-summary-grand-total">
                    <span>Total Pembayaran:</span>
                    <strong className="order-grand-total-red">{money.format(grandTotal)}</strong>
                  </div>
                </div>
              </div>
            </section>

            {Boolean(order.cancel_request_status) && (
              <section
                className="orders-card order-subcard"
                style={
                  order.cancel_request_status === "pending"
                    ? {
                      border: "2px solid #ef4444",
                      background: "linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)",
                      boxShadow: "0 4px 14px rgba(239, 68, 68, 0.12)",
                    }
                    : undefined
                }
              >
                <div
                  className="order-subcard-header"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderBottom: order.cancel_request_status === "pending" ? "1px solid #fecaca" : undefined,
                  }}
                >
                  <Icon
                    name={order.cancel_request_status === "pending" ? "AlertTriangle" : "Info"}
                    size={18}
                    style={{ color: order.cancel_request_status === "pending" ? "#dc2626" : "#475569" }}
                  />
                  <h3 style={{ color: order.cancel_request_status === "pending" ? "#991b1b" : undefined }}>
                    Pengajuan Pembatalan Oleh Customer
                  </h3>
                </div>
                <div className="order-subcard-content" style={{ padding: "16px" }}>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700, marginBottom: "4px" }}>
                      Alasan Pembatalan:
                    </div>
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "#ffffff",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.88rem",
                        color: "#1e293b",
                        fontWeight: 500,
                      }}
                    >
                      {String(order.cancel_request_reason || "Tidak mencantumkan alasan khusus.")}
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px", fontSize: "0.82rem", color: "#475569" }}>
                    <strong>Status Pengajuan: </strong>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontWeight: 700,
                        background:
                          order.cancel_request_status === "pending"
                            ? "#fee2e2"
                            : order.cancel_request_status === "approved"
                              ? "#dcfce7"
                              : "#f1f5f9",
                        color:
                          order.cancel_request_status === "pending"
                            ? "#b91c1c"
                            : order.cancel_request_status === "approved"
                              ? "#15803d"
                              : "#475569",
                      }}
                    >
                      {(
                        {
                          pending: "🚨 Menunggu Konfirmasi Rekening & Persetujuan Admin",
                          refund_processing: "⏳ Sedang Diproses / Transfer",
                          approved: "✓ Disetujui & Pengembalian Dana Selesai",
                          rejected: "✕ Ditolak (Pesanan Tetap Dilanjutkan)",
                        } as Record<string, string>
                      )[String(order.cancel_request_status)] || String(order.cancel_request_status)}
                    </span>
                  </div>

                  {/* Customer Bank Account Box for Refund */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#1e293b", fontSize: "0.88rem" }}>
                        <Icon name="CreditCard" size={16} style={{ color: "#003399" }} />
                        <span>Rekening Pengembalian Dana Customer:</span>
                      </div>
                      {Boolean(order.refund_account_number) && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(String(order.refund_account_number));
                            setCopiedNumber(true);
                            setTimeout(() => setCopiedNumber(false), 2000);
                          }}
                          style={{
                            background: copiedNumber ? "#dcfce7" : "#ffffff",
                            color: copiedNumber ? "#15803d" : "#003399",
                            border: "1px solid #cbd5e1",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Icon name={copiedNumber ? "Check" : "Copy"} size={12} />
                          {copiedNumber ? "Tersalin!" : "Salin No Rek"}
                        </button>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", fontSize: "0.82rem" }}>
                      <div>
                        <div style={{ color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>Bank / E-Wallet</div>
                        <div style={{ fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                          {String(order.refund_bank_name || "Belum diisi oleh customer")}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>Nomor Rekening / HP</div>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#003399", marginTop: "2px", fontSize: "0.9rem" }}>
                          {String(order.refund_account_number || "-")}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>Atas Nama (Pemilik)</div>
                        <div style={{ fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                          {String(order.refund_account_name || "-")}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>Jumlah Pengembalian</div>
                        <div style={{ fontWeight: 800, color: "#ea580c", marginTop: "2px", fontSize: "0.95rem" }}>
                          {money.format(Number(order.refund_amount || order.grand_total || 0))}
                        </div>
                      </div>
                    </div>

                    {Boolean(order.refund_notes) && (
                      <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #cbd5e1", fontSize: "0.8rem", color: "#475569" }}>
                        <strong>Catatan Refund:</strong> {String(order.refund_notes)}
                      </div>
                    )}
                  </div>

                  {["pending", "refund_processing"].includes(String(order.cancel_request_status)) && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        type="button"
                        className="order-btn-save-status"
                        style={{
                          background: "#dc2626",
                          borderColor: "#b91c1c",
                          color: "#ffffff",
                          fontWeight: 700,
                          padding: "10px 18px",
                          boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                        disabled={savingStatus}
                        onClick={openRefundConfirmationModal}
                      >
                        <Icon name="Check" size={16} />
                        <span>✓ Konfirmasi Rekening & Setujui Refund</span>
                      </button>
                      {order.cancel_request_status === "pending" && (
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ padding: "10px 18px", fontWeight: 600, color: "#64748b" }}
                          disabled={savingStatus}
                          onClick={() => {
                            if (window.confirm("Apakah Anda yakin ingin MENOLAK pengajuan pembatalan ini? Pesanan akan tetap dilanjutkan.")) {
                              handleCancellation("rejected");
                            }
                          }}
                        >
                          ✕ Tolak Pengajuan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Modal Dialog Konfirmasi Pengembalian Dana Admin */}
            {showRefundModal && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 999999,
                  background: "rgba(15, 23, 42, 0.7)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1rem",
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowRefundModal(false);
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    maxWidth: "520px",
                    width: "100%",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "16px 20px",
                      background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                      borderBottom: "1px solid #fecaca",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon name="AlertTriangle" size={20} style={{ color: "#dc2626" }} />
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#991b1b" }}>
                        Konfirmasi Pengembalian Dana
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRefundModal(false)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8" }}
                    >
                      <Icon name="X" size={18} />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCancellation("approved", {
                        refund_bank_name: adminRefundBank,
                        refund_account_number: adminRefundAccNum,
                        refund_account_name: adminRefundAccName,
                        refund_amount: Number(adminRefundAmount),
                        refund_notes: adminRefundNotes,
                      });
                    }}
                    style={{ padding: "20px" }}
                  >
                    <div
                      style={{
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        marginBottom: "16px",
                        fontSize: "0.82rem",
                        color: "#92400e",
                        lineHeight: 1.45,
                      }}
                    >
                      <strong>PENTING:</strong> Pastikan Anda telah memeriksa kesesuaian nomor rekening customer dan melakukan transfer refund sebelum menyetujui.
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                          Bank / E-Wallet Tujuan <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={adminRefundBank}
                          onChange={(e) => setAdminRefundBank(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1.5px solid #cbd5e1",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                          Jumlah Dana (Rp) <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="number"
                          required
                          value={adminRefundAmount}
                          onChange={(e) => setAdminRefundAmount(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1.5px solid #cbd5e1",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "#ea580c",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                          Nomor Rekening / No. HP <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={adminRefundAccNum}
                          onChange={(e) => setAdminRefundAccNum(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1.5px solid #cbd5e1",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            fontFamily: "monospace",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                          Atas Nama Pemilik Rekening <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={adminRefundAccName}
                          onChange={(e) => setAdminRefundAccName(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1.5px solid #cbd5e1",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                        Catatan Transfer / No. Referensi (Opsional)
                      </label>
                      <input
                        type="text"
                        value={adminRefundNotes}
                        onChange={(e) => setAdminRefundNotes(e.target.value)}
                        placeholder="Contoh: Transfer via KlikBCA Ref #TRX98273"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1.5px solid #cbd5e1",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                      <button
                        type="button"
                        onClick={() => setShowRefundModal(false)}
                        className="secondary-button"
                        style={{ padding: "8px 16px" }}
                        disabled={savingStatus}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="order-btn-save-status"
                        style={{
                          background: "#dc2626",
                          borderColor: "#b91c1c",
                          color: "#ffffff",
                          fontWeight: 700,
                          padding: "8px 18px",
                          boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                        }}
                        disabled={savingStatus || !adminRefundBank || !adminRefundAccNum || !adminRefundAccName}
                      >
                        {savingStatus ? "Menyimpan & Memproses..." : "✓ Konfirmasi & Setujui Refund"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Ubah Status & Resi */}
            <section className="orders-card order-subcard">
              <div className="order-subcard-header">
                <h3>Ubah Status & {isMaba ? "Ref Distribusi" : "Resi"}</h3>
              </div>
              <div className="order-subcard-content order-edit-controls-form">
                {/* Status Form */}
                <form onSubmit={handleSaveStatus} className="order-form-block">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <label className="order-control-label" style={{ margin: 0 }}>Status Pesanan</label>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background:
                          selectedOrderDetail?.order?.status === "paid"
                            ? "#dcfce7"
                            : selectedOrderDetail?.order?.status === "shipped"
                              ? "#e0e7ff"
                              : selectedOrderDetail?.order?.status === "completed"
                                ? "#f0fdf4"
                                : selectedOrderDetail?.order?.status === "cancelled"
                                  ? "#fee2e2"
                                  : "#f1f5f9",
                        color:
                          selectedOrderDetail?.order?.status === "paid"
                            ? "#15803d"
                            : selectedOrderDetail?.order?.status === "shipped"
                              ? "#4338ca"
                              : selectedOrderDetail?.order?.status === "completed"
                                ? "#166534"
                                : selectedOrderDetail?.order?.status === "cancelled"
                                  ? "#991b1b"
                                  : "#475569",
                      }}
                    >
                      Aktif: {statusCfg.label}
                    </span>
                  </div>
                  <select
                    value={editStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setEditStatus(newStatus);
                      if (newStatus === "shipped" && !editResi.trim()) {
                        const autoResi = generateAutoResi(
                          selectedOrderDetail?.order?.expedition_code as string | undefined,
                          selectedOrderDetail?.order?.expedition_name as string | undefined,
                          isMaba
                        );
                        setEditResi(autoResi);
                      }
                    }}
                    className="order-select-control"
                  >
                    {isMaba ? (
                      <>
                        <option value="pending_payment">Menunggu Pembayaran (pending_payment)</option>
                        <option value="paid">Sudah Dibayar / Terverifikasi (paid)</option>
                        <option value="packed">Disiapkan Admin Kampus (packed)</option>
                        <option value="shipped">Distribusi ke Kampus UBSI (shipped)</option>
                        <option value="arrived">Tiba & Siap Diambil di Kampus (arrived)</option>
                        <option value="completed">Selesai / Sudah Diserahkan ke Mahasiswa (completed)</option>
                        <option value="cancelled">Dibatalkan (cancelled)</option>
                      </>
                    ) : (
                      <>
                        <option value="pending_payment">Menunggu Pembayaran (pending_payment)</option>
                        <option value="paid">Sudah Dibayar (paid)</option>
                        <option value="packed">Diproses / Sedang Dikemas (packed)</option>
                        <option value="shipped">Dikirim (shipped)</option>
                        <option value="arrived">Tiba di Tujuan (arrived)</option>
                        <option value="completed">Selesai (completed)</option>
                        <option value="cancelled">Dibatalkan (cancelled)</option>
                      </>
                    )}
                  </select>
                  <button
                    type="submit"
                    disabled={savingStatus}
                    className="order-btn-save-status"
                  >
                    {savingStatus ? (
                      <><span className="spinner" /> Menyimpan...</>
                    ) : (
                      <><Icon name="Printer" size={15} /> SIMPAN STATUS</>
                    )}
                  </button>
                </form>

                {/* Resi / Batch Ref Form */}
                <form onSubmit={handleSaveResi} className="order-form-block">
                  <div className="order-resi-label-row">
                    <label className="order-control-label">
                      {isMaba ? "Nomor Referensi Batch Distribusi Kampus" : "Nomor Resi Pengiriman"}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const autoResi = generateAutoResi(
                          selectedOrderDetail?.order?.expedition_code as string | undefined,
                          selectedOrderDetail?.order?.expedition_name as string | undefined,
                          isMaba
                        );
                        setEditResi(autoResi);
                      }}
                      className="order-btn-generate-resi"
                      title={isMaba ? "Generate nomor referensi batch MABA otomatis" : "Generate nomor resi otomatis sesuai kurir"}
                    >
                      <Icon name="RefreshCw" size={12} /> {isMaba ? "Auto Ref MABA" : "Auto Resi"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editResi}
                    onChange={(e) => setEditResi(e.target.value)}
                    placeholder={isMaba ? "Contoh: MABA26-UBSI-KMP-001 (Ref Distribusi)" : "Masukkan nomor resi"}
                    className="order-input-control"
                  />
                  <button
                    type="submit"
                    disabled={savingResi}
                    className="order-btn-save-resi"
                  >
                    {savingResi ? (
                      <><span className="spinner" /> Menyimpan...</>
                    ) : (
                      <><Icon name="FileText" size={15} /> {isMaba ? "SIMPAN REF DISTRIBUSI" : "SIMPAN RESI"}</>
                    )}
                  </button>
                </form>

                {!isMaba ? (
                  <button
                    type="button"
                    onClick={handleCheckTracking}
                    disabled={checkingTracking}
                    className="order-btn-check-tracking"
                  >
                    {checkingTracking ? (
                      <><span className="spinner" /> Melacak Resi...</>
                    ) : (
                      <><Icon name="RefreshCw" size={14} /> <span>Cek Resi via RajaOngkir</span></>
                    )}
                  </button>
                ) : (
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: 8,
                      fontSize: "0.78rem",
                      color: "#1d4ed8",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icon name="Info" size={14} />
                    <span>Distribusi internal kampus UBSI (Bebas Ongkir / Non-Ekspedisi).</span>
                  </div>
                )}

                {/* Courier / Campus Handover Auto-POD Callout Box */}
                <div
                  className="order-pod-simulation-box"
                  style={isMaba ? { borderColor: "#93c5fd", background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)" } : undefined}
                >
                  <div className="order-pod-header">
                    <Icon name={isMaba ? "Check" : "Truck"} size={16} style={isMaba ? { color: "#16a34a" } : undefined} />
                    <h4>{isMaba ? "Simulasi Serah Terima di Kampus UBSI" : "Simulasi Kurir Selesaikan Pengiriman"}</h4>
                  </div>
                  <p className="order-pod-desc">
                    {isMaba
                      ? "Uji coba serah terima perlengkapan MABA kepada mahasiswa di kampus UBSI. Status akan otomatis diperbarui menjadi Tiba di Kampus (Siap Diambil)."
                      : "Uji coba serah terima paket oleh kurir. Foto bukti pengiriman (Proof of Delivery / POD) akan ter-upload secara otomatis tanpa perlu input manual admin."}
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulateAutoPOD}
                    disabled={savingStatus}
                    className="order-btn-simulate-pod"
                    style={isMaba ? { background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)" } : undefined}
                  >
                    {isMaba ? "🎓 SIMULASIKAN SERAH TERIMA KAMPUS" : "🚀 SIMULASIKAN AUTO-POD KURIR"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Else: Orders List View (Screenshot 1)
  return (
    <div className="page-stack orders-list-page">
      <SweetAlert
        isOpen={!!message}
        isToast={true}
        type={message?.type || "info"}
        message={message?.text || ""}
        onClose={() => setMessage(null)}
      />

      {/* Top Header Row with Outside Bersihkan Cache Button (Same as other menus) */}
      <section className="page-heading orders-page-header">
        <div className="orders-header-title-block">
          <div className="orders-breadcrumb">
            <Link href="/admin" className="orders-crumb-link">
              <span className="orders-crumb-home">🏠</span> Pages
            </Link>
            <span className="orders-crumb-sep">&gt;</span>
            <span className="orders-crumb-active">Pesanan</span>
          </div>
          <h1 className="orders-main-heading">Pesanan</h1>
        </div>
        <div className="header-action-group">
          <button
            type="button"
            className="warning-button clear-cache-btn"
            onClick={handleClearCache}
            disabled={clearingCache}
            title="Bersihkan Cache Sistem"
          >
            <Icon name="RefreshCw" className={clearingCache ? "spin" : ""} size={16} />
            <span>Bersihkan Cache</span>
          </button>
        </div>
      </section>

      {/* Daftar Pesanan Card */}
      <section className="orders-card">
        <div className="orders-card-top-title-row">
          <h2 className="orders-card-heading">Daftar Pesanan</h2>
        </div>

        {/* Banner Alert Pengajuan Pembatalan jika ada pesanan pending pembatalan */}
        {result.data.some((r) => r.cancel_request_status === "pending") && (
          <div className="orders-cancel-alert-banner">
            <div className="cancel-alert-icon">
              <Icon name="AlertTriangle" size={22} />
            </div>
            <div className="cancel-alert-content">
              <strong>Ada Pengajuan Pembatalan Menunggu Konfirmasi!</strong>
              <p>
                Terdapat pesanan dari pelanggan yang meminta pembatalan dan membutuhkan persetujuan atau penolakan admin.
              </p>
            </div>
            <button
              type="button"
              className="cancel-alert-btn"
              onClick={() => {
                setCancelStatusVal("pending");
                const params = new URLSearchParams();
                if (searchVal.trim()) params.set("search", searchVal.trim());
                if (statusVal) params.set("status", statusVal);
                params.set("cancel_status", "pending");
                params.set("page", "1");
                router.push(`/admin/orders?${params.toString()}`);
              }}
            >
              Filter Pengajuan Batal →
            </button>
          </div>
        )}

        {/* Filter Toolbar: Search, Filters, and Total Count all in 1 Single Row */}
        <div className="orders-toolbar-unified">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const params = new URLSearchParams();
              if (searchVal.trim()) params.set("search", searchVal.trim());
              if (statusVal) params.set("status", statusVal);
              if (cancelStatusVal) params.set("cancel_status", cancelStatusVal);
              params.set("page", "1");
              const queryStr = params.toString();
              router.replace(`/admin/orders${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
            }}
            className="orders-filters-group"
          >
            <div ref={ordersSearchRef} className="resource-search-container-relative">
              <div className="search-box orders-search-wrapper">
                <Icon name="Search" size={16} />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onFocus={() => setShowOrderSuggestions(true)}
                  placeholder="Cari invoice, nama customer, produk..."
                  className="orders-search-input"
                  autoComplete="off"
                />
                {searchVal ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchVal("");
                      setShowOrderSuggestions(false);
                      const params = new URLSearchParams();
                      if (statusVal) params.set("status", statusVal);
                      if (cancelStatusVal) params.set("cancel_status", cancelStatusVal);
                      params.set("page", "1");
                      const queryStr = params.toString();
                      router.replace(`/admin/orders${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
                    }}
                    className="search-clear-btn"
                    title="Hapus kata kunci"
                  >
                    <Icon name="X" size={13} />
                  </button>
                ) : null}
              </div>

              {/* Shopee-style Order Search Suggestions */}
              {showOrderSuggestions && searchVal.trim().length > 0 && (
                <div className="resource-recommendations-dropdown">
                  <div className="recommendations-header">
                    <span>Rekomendasi Pesanan</span>
                    {isSearchingOrderSuggestions && <span className="recommendations-loading-spinner" />}
                  </div>

                  {orderSuggestions.length === 0 && !isSearchingOrderSuggestions ? (
                    <div className="recommendations-empty">
                      Tidak ada pesanan yang cocok dengan "{searchVal}"
                    </div>
                  ) : (
                    <div className="recommendations-list">
                      {orderSuggestions.map((item) => {
                        const itemIsMaba = isMabaOrder(item);
                        const statusInfo = formatOrderStatus(String(item.status || ""), itemIsMaba);
                        return (
                          <button
                            key={String(item.id)}
                            type="button"
                            onClick={() => {
                              openOrderDetail(item);
                              setShowOrderSuggestions(false);
                            }}
                            className="recommendation-item"
                          >
                            <div className="recommendation-avatar-box">
                              <div className="recommendation-avatar-fallback">
                                {itemIsMaba ? "🎓" : "📦"}
                              </div>
                            </div>

                            <div className="recommendation-text-box">
                              <div className="recommendation-name-row">
                                <span className="recommendation-name">
                                  {highlightMatch(String(item.invoice_number || ""), searchVal)}
                                </span>
                                <span
                                  className="orders-status-pill"
                                  style={{
                                    fontSize: "0.65rem",
                                    padding: "2px 6px",
                                    color: statusInfo.color,
                                    backgroundColor: statusInfo.bg,
                                    borderColor: statusInfo.border,
                                  }}
                                >
                                  {statusInfo.label}
                                </span>
                              </div>

                              <div className="recommendation-sub-row">
                                <span className="recommendation-meta">
                                  👤 {highlightMatch(String(item.customer_name || "Pelanggan"), searchVal)}
                                  {itemIsMaba && <span style={{ color: "#1d4ed8", marginLeft: 4, fontWeight: 700 }}>• MABA</span>}
                                </span>
                                <span className="recommendation-snippet">
                                  💰 {money.format(Number(item.grand_total || 0))}
                                </span>
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

            <select
              value={statusVal}
              onChange={(e) => {
                const val = e.target.value;
                setStatusVal(val);
                const params = new URLSearchParams();
                if (searchVal.trim()) params.set("search", searchVal.trim());
                if (val) params.set("status", val);
                if (cancelStatusVal) params.set("cancel_status", cancelStatusVal);
                params.set("page", "1");
                const queryStr = params.toString();
                router.replace(`/admin/orders${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
              }}
              className="status-filter-select orders-filter-select"
            >
              <option value="">Semua Status</option>
              <option value="pending">Menunggu Pembayaran</option>
              <option value="paid">Menunggu Konfirmasi</option>
              <option value="processing">Diproses</option>
              <option value="shipped">Dikirim</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
              <option value="expired">Kadaluarsa</option>
            </select>

            <select
              value={cancelStatusVal}
              onChange={(e) => {
                const val = e.target.value;
                setCancelStatusVal(val);
                const params = new URLSearchParams();
                if (searchVal.trim()) params.set("search", searchVal.trim());
                if (statusVal) params.set("status", statusVal);
                if (val) params.set("cancel_status", val);
                params.set("page", "1");
                const queryStr = params.toString();
                router.replace(`/admin/orders${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
              }}
              className="status-filter-select orders-filter-select"
            >
              <option value="">Semua Pengajuan Batal</option>
              <option value="has_request">Ada Pengajuan Batal</option>
              <option value="pending">Menunggu Persetujuan</option>
              <option value="refund_processing">Diproses </option>
              <option value="approved">Pengajuan Disetujui</option>
              <option value="rejected">Pengajuan Ditolak</option>
              <option value="no_request">Tanpa Pengajuan</option>
            </select>

            <button type="submit" className="filter-btn">
              <Icon name="Filter" size={14} />
              <span>Filter</span>
            </button>

            {(searchVal || statusVal || cancelStatusVal) ? (
              <button
                type="button"
                onClick={() => {
                  setSearchVal("");
                  setStatusVal("");
                  setCancelStatusVal("");
                  router.replace("/admin/orders", { scroll: false });
                }}
                className="filter-reset-btn"
                title="Reset semua filter"
              >
                <Icon name="RotateCcw" size={13} />
                <span>Reset</span>
              </button>
            ) : null}
          </form>

          <div className="record-count">
            <span className="record-count-dot" />
            <span className="record-count-num">{number.format(result.total)}</span>
            <span className="record-count-label">order</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: "center" }}>NO.</th>
                <th>INVOICE</th>
                <th>CUSTOMER</th>
                <th>EKSPEDISI</th>
                <th>SUBTOTAL</th>
                <th>ONGKIR</th>
                <th>GRAND TOTAL</th>
                <th>STATUS</th>
                <th>RESI</th>
                <th>TANGGAL</th>
                <th style={{ width: 60, textAlign: "center" }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {result.data.length === 0 ? (
                <tr>
                  <td colSpan={11} className="orders-empty-td">
                    Tidak ada data pesanan ditemukan.
                  </td>
                </tr>
              ) : (
                result.data.map((row, index) => {
                  const rowNum = (result.page - 1) * result.perPage + index + 1;
                  const rowIsMaba = isMabaOrder(row);
                  const statusInfo = formatOrderStatus(String(row.status || ""), rowIsMaba);
                  return (
                    <tr key={String(row.id)}>
                      <td style={{ textAlign: "center", color: "#94a3b8" }}>{rowNum}</td>
                      <td>
                        <button
                          type="button"
                          className="orders-inv-link-btn"
                          onClick={() => openOrderDetail(row)}
                          title="Lihat Detail Pesanan"
                        >
                          {highlightMatch(String(row.invoice_number), searchVal)}
                        </button>
                        {rowIsMaba && (
                          <div style={{ marginTop: 2 }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #bfdbfe",
                                padding: "1px 6px",
                                borderRadius: 4,
                              }}
                            >
                              🎓 EVENT MABA
                            </span>
                          </div>
                        )}
                        {row.cancel_request_status === "pending" && (
                          <div>
                            <span
                              className="cancel-pending-pill"
                              title={`Alasan: ${row.cancel_request_reason || "Tanpa alasan"}`}
                              onClick={() => openOrderDetail(row)}
                              style={{ cursor: "pointer" }}
                            >
                              🚨 Butuh Konfirmasi
                            </span>
                          </div>
                        )}
                        {row.cancel_request_status === "refund_processing" && (
                          <div>
                            <span
                              className="cancel-pending-pill"
                              style={{ background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" }}
                              onClick={() => openOrderDetail(row)}
                            >
                              ⏳ Refund Diproses
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="orders-cust-name">
                          {highlightMatch(String(row.customer_name || "Pelanggan"), searchVal)}
                        </div>
                        <div className="orders-cust-email">
                          {highlightMatch(String(row.customer_email || "—"), searchVal)}
                        </div>
                      </td>
                      <td>
                        {rowIsMaba ? (
                          <>
                            <div className="orders-exp-name" style={{ color: "#1d4ed8", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                              <span>🏛️ Ambil di Kampus</span>
                            </div>
                            <div className="orders-exp-svc" style={{ color: "#16a34a", fontWeight: 600 }}>Bebas Ongkir (UBSI)</div>
                          </>
                        ) : (
                          <>
                            <div className="orders-exp-name">{String(row.expedition_name || "JNE")}</div>
                            <div className="orders-exp-svc">{String(row.expedition_service || "Regular")}</div>
                          </>
                        )}
                      </td>
                      <td>{money.format(Number(row.subtotal || 0))}</td>
                      <td>
                        {rowIsMaba ? (
                          <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "0.82rem" }}>Rp 0</span>
                        ) : (
                          money.format(Number(row.shipping_cost || 0))
                        )}
                      </td>
                      <td>
                        <strong className="orders-grand-total-text">
                          {money.format(Number(row.grand_total || 0))}
                        </strong>
                      </td>
                      <td>
                        <span
                          className="orders-status-pill"
                          style={{
                            color: statusInfo.color,
                            backgroundColor: statusInfo.bg,
                            borderColor: statusInfo.border,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        {row.resi_number ? (
                          <span
                            className="orders-resi-code"
                            style={rowIsMaba ? { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" } : undefined}
                          >
                            {rowIsMaba ? `Ref: ${highlightMatch(String(row.resi_number), searchVal)}` : highlightMatch(String(row.resi_number), searchVal)}
                          </span>
                        ) : rowIsMaba ? (
                          <span style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: 600 }}>Distribusi Kampus</span>
                        ) : (
                          <span className="orders-muted-dash">—</span>
                        )}
                      </td>
                      <td className="orders-date-text">{formatShortDate(row.created_at)}</td>
                      <td style={{ textAlign: "center", position: "relative" }}>
                        {(() => {
                          const rowId = row.id as string | number;
                          const isMenuOpen = actionMenuOrderId === rowId;
                          const openUpward = index >= result.data.length - 2 && result.data.length > 2;

                          return (
                            <div className="action-dropdown-wrap">
                              <button
                                type="button"
                                className={`action-dots-btn ${isMenuOpen ? "is-active" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuOrderId(isMenuOpen ? null : rowId);
                                }}
                                title="Pilihan Aksi"
                              >
                                <Icon name="MoreHorizontal" size={16} />
                              </button>

                              {isMenuOpen && (
                                <div className={`action-dropdown-popover ${openUpward ? "open-upward" : ""}`}>
                                  <button
                                    type="button"
                                    className="action-dropdown-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActionMenuOrderId(null);
                                      openOrderDetail(row);
                                    }}
                                  >
                                    <Icon name="FileText" size={14} style={{ color: "#465FFF" }} />
                                    <span>Lihat Detail Pesanan</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="orders-pagination-bar">
          <div className="orders-pagination-info">
            Menampilkan <strong>{result.data.length}</strong> dari <strong>{number.format(result.total)}</strong> order
          </div>
          {result.pages > 1 && (
            <div className="orders-pagination-actions">
              <button
                type="button"
                disabled={result.page <= 1}
                onClick={() => navigatePage(result.page - 1)}
                className="orders-pager-btn"
              >
                <Icon name="ChevronLeft" size={15} />
                <span>Sebelumnya</span>
              </button>
              <span className="orders-pager-cur">
                {result.page} / {result.pages}
              </span>
              <button
                type="button"
                disabled={result.page >= result.pages}
                onClick={() => navigatePage(result.page + 1)}
                className="orders-pager-btn"
              >
                <span>Berikutnya</span>
                <Icon name="ChevronRight" size={15} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
