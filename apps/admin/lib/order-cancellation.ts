import type { RowDataPacket } from "mysql2";
import { transaction } from "@/lib/db";
import { assert } from "@/lib/http";
import { refundCancelledOrder } from "@/lib/midtrans";
import { clearCatalogCache, clearAdminSearchCache } from "@/lib/cache";

type Order = RowDataPacket & Record<string, any>;

export interface RefundInfoPayload {
  refund_bank_name?: string;
  refund_account_number?: string;
  refund_account_name?: string;
  refund_amount?: number;
  refund_notes?: string;
  refund_proof_photo?: string;
}

export async function decideCancellation(id: number, decision: string, adminId: number, refundInfo?: RefundInfoPayload) {
  assert(["approved", "rejected"].includes(decision), "Keputusan pembatalan tidak valid.");
  const order = await transaction(async (tx) => {
    const order = await tx.row<Order>("SELECT * FROM orders WHERE id = ? FOR UPDATE", [id]);
    assert(order, "Pesanan tidak ditemukan.", 404);
    if (order.cancel_request_status === decision) return null;
    assert(["pending", "refund_processing"].includes(order.cancel_request_status), "Tidak ada pengajuan pembatalan yang menunggu keputusan.");
    assert(["pending_payment", "paid", "packed"].includes(order.status), "Pesanan sudah dikirim atau dibatalkan.");
    if (decision === "rejected") {
      assert(order.cancel_request_status === "pending", "Refund sedang diproses. Sinkronkan kembali; pengajuan tidak dapat ditolak.");
      await tx.execute("UPDATE orders SET cancel_request_status = 'rejected', updated_at = NOW() WHERE id = ?", [id]);
      await tx.execute("INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, ?, 'Pengajuan pembatalan ditolak admin. Pesanan dilanjutkan.', 'Admin', NOW(), NOW())", [id, order.status]);
      return null;
    }
    // Persist intent before contacting the gateway, including on timeout/crash.
    await tx.execute("UPDATE orders SET cancel_request_status = 'refund_processing', updated_at = NOW() WHERE id = ?", [id]);
    return order;
  });
  if (!order) return;
  const result = await refundCancelledOrder(String(order.invoice_number), Number(order.grand_total), String(order.cancel_request_reason || "Pembatalan disetujui admin"));
  await transaction(async (tx) => {
    const fresh = await tx.row<Order>("SELECT * FROM orders WHERE id = ? FOR UPDATE", [id]);
    if (fresh?.cancel_request_status === "approved") return;
    assert(fresh?.cancel_request_status === "refund_processing", "Status pembatalan berubah. Sinkronkan kembali.");
    
    const finalBankName = refundInfo?.refund_bank_name || fresh.refund_bank_name || null;
    const finalAccNum = refundInfo?.refund_account_number || fresh.refund_account_number || null;
    const finalAccName = refundInfo?.refund_account_name || fresh.refund_account_name || null;
    const finalAmount = refundInfo?.refund_amount || fresh.refund_amount || fresh.grand_total;
    const finalNotes = refundInfo?.refund_notes || fresh.refund_notes || null;
    const finalProof = refundInfo?.refund_proof_photo || fresh.refund_proof_photo || null;

    await tx.execute(
      `UPDATE orders SET 
        status = 'cancelled', 
        cancel_request_status = 'approved', 
        refund_bank_name = ?,
        refund_account_number = ?,
        refund_account_name = ?,
        refund_amount = ?,
        refund_notes = ?,
        refund_proof_photo = ?,
        refund_at = NOW(),
        updated_at = NOW() 
      WHERE id = ?`,
      [finalBankName, finalAccNum, finalAccName, finalAmount, finalNotes, finalProof, id]
    );

    if (result === "cancel") {
      await tx.execute("UPDATE payments SET status = IF(status = 'waiting_payment', 'failed', status), updated_at = NOW() WHERE order_id = ?", [id]);
    } else if (result === "refund" || result === "manual_refund") {
      await tx.execute("UPDATE payments SET status = 'refunded', updated_at = NOW() WHERE order_id = ?", [id]);
    }
    const items = await tx.rows<Order>("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [id]);
    for (const item of items) {
      await tx.execute("UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?", [item.quantity, item.product_id]);
      await tx.execute("INSERT INTO stock_movements (product_id, user_id, type, quantity, reference, note, created_at, updated_at) VALUES (?, ?, 'in', ?, ?, 'Restock: Pembatalan disetujui admin', NOW(), NOW())", [item.product_id, adminId, item.quantity, order.invoice_number]);
    }

    let trackingDesc = "Pembatalan pesanan disetujui.";
    if (finalBankName && finalAccNum) {
      trackingDesc = `Pembatalan disetujui. Dana sebesar Rp ${Number(finalAmount).toLocaleString("id-ID")} telah dikonfirmasi dan ditransfer oleh admin ke ${finalBankName} - ${finalAccNum} a/n ${finalAccName || "Pelanggan"}.${finalNotes ? " Catatan: " + finalNotes : ""}`;
    } else if (result === "refund") {
      trackingDesc = "Pembatalan disetujui. Permintaan pengembalian dana penuh diterima Midtrans ke metode pembayaran asal (E-Wallet/QRIS/Kartu). Waktu dana masuk mengikuti penyedia pembayaran.";
    } else if (result === "manual_refund") {
      trackingDesc = "Pembatalan disetujui admin. Pengembalian dana diproses secara manual oleh admin toko ke rekening pelanggan.";
    } else if (result === "cancel") {
      trackingDesc = "Pembatalan disetujui. Tagihan transaksi dibatalkan di sistem pembayaran.";
    } else {
      trackingDesc = "Pembatalan disetujui dan stok produk telah dikembalikan ke inventaris.";
    }

    await tx.execute(
      "INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, 'cancelled', ?, 'Admin / Sistem', NOW(), NOW())",
      [id, trackingDesc]
    );
  });
  clearCatalogCache();
  clearAdminSearchCache("orders");
  clearAdminSearchCache("stock-movements");
  clearAdminSearchCache("products");
}
