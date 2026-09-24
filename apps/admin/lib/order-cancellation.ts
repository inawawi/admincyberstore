import type { RowDataPacket } from "mysql2";
import { transaction } from "@/lib/db";
import { assert } from "@/lib/http";
import { refundCancelledOrder } from "@/lib/midtrans";
import { clearCatalogCache } from "@/lib/cache";

type Order = RowDataPacket & Record<string, any>;

export async function decideCancellation(id: number, decision: string, adminId: number) {
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
    await tx.execute("UPDATE orders SET status = 'cancelled', cancel_request_status = 'approved', updated_at = NOW() WHERE id = ?", [id]);
    if (result === "cancel") await tx.execute("UPDATE payments SET status = IF(status = 'waiting_payment', 'failed', status), updated_at = NOW() WHERE order_id = ?", [id]);
    const items = await tx.rows<Order>("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [id]);
    for (const item of items) {
      await tx.execute("UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?", [item.quantity, item.product_id]);
      await tx.execute("INSERT INTO stock_movements (product_id, user_id, type, quantity, reference, note, created_at, updated_at) VALUES (?, ?, 'in', ?, ?, 'Restock: Pembatalan disetujui admin', NOW(), NOW())", [item.product_id, adminId, item.quantity, order.invoice_number]);
    }
    await tx.execute("INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, 'cancelled', ?, 'Admin / Midtrans', NOW(), NOW())", [id, result === "refund" ? "Pembatalan disetujui. Permintaan pengembalian dana penuh diterima Midtrans ke metode pembayaran asal. Waktu dana masuk mengikuti penyedia pembayaran." : "Pembatalan disetujui. Transaksi dibatalkan di Midtrans; pelepasan dana yang terotorisasi mengikuti penyedia pembayaran."]);
  });
  clearCatalogCache();
}
