import type { RowDataPacket } from "mysql2";
import { execute, row, rows, transaction } from "@/lib/db";
import { ApiError, assert, pagination } from "@/lib/http";
import { createSnapTransaction, getMidtransStatus, verifyMidtransSignature } from "@/lib/midtrans";
import { hydrateOrder } from "@/lib/api/serializers";
import { findCityId, shippingCost } from "@/lib/shipping";
import { asNumber, nowSql, randomString } from "@/lib/utils";
import type { ApiContext, HandledResult } from "@/lib/api/types";

type AnyRow = RowDataPacket & Record<string, unknown>;

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  paid: "Sudah Dibayar",
  packed: "Sedang Dikemas",
  shipped: "Dalam Pengiriman",
  arrived: "Telah Tiba",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

function text(body: Record<string, unknown>, key: string) {
  return typeof body[key] === "string" ? body[key].trim() : "";
}

async function ownedOrder(id: number, userId: number) {
  const order = await row<AnyRow>("SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1", [id, userId]);
  if (!order) throw new ApiError(404, "Pesanan tidak ditemukan.");
  return order;
}

async function setting(key: string, fallback: string) {
  const value = await row<RowDataPacket & { value: string | null }>("SELECT value FROM settings WHERE `key` = ? LIMIT 1", [key]);
  return value?.value ?? fallback;
}

async function applyPaymentStatus(payment: AnyRow, statusData: { status: string; bank?: string | null; va_number?: string | null; biller_code?: string | null }) {
  const order = await row<AnyRow>("SELECT * FROM orders WHERE id = ?", [payment.order_id]);
  if (!order) return;
  const updates = [statusData.bank || payment.bank_code, statusData.va_number || payment.virtual_account_number, statusData.biller_code || payment.biller_code];
  if (["settlement", "capture"].includes(statusData.status)) {
    if (payment.status !== "paid") {
      await transaction(async (tx) => {
        await tx.execute("UPDATE payments SET bank_code = ?, virtual_account_number = ?, biller_code = ?, status = 'paid', paid_at = ?, updated_at = ? WHERE id = ?", [...updates, nowSql(), nowSql(), payment.id]);
        await tx.execute("UPDATE orders SET status = 'paid', updated_at = ? WHERE id = ?", [nowSql(), order.id]);
        await tx.execute("INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, 'paid', 'Pembayaran berhasil diverifikasi oleh sistem.', 'Sistem', ?, ?)", [order.id, nowSql(), nowSql()]);
      });
    }
    return;
  }
  if (["cancel", "deny", "failure", "expire"].includes(statusData.status)) {
    if (order.status !== "cancelled") {
      const expired = statusData.status === "expire";
      await transaction(async (tx) => {
        await tx.execute("UPDATE payments SET bank_code = ?, virtual_account_number = ?, biller_code = ?, status = ?, updated_at = ? WHERE id = ?", [...updates, expired ? "expired" : "failed", nowSql(), payment.id]);
        await tx.execute("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?", [nowSql(), order.id]);
        await tx.execute("INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, 'cancelled', ?, 'Sistem', ?, ?)", [order.id, expired ? "Pesanan dibatalkan karena batas waktu pembayaran habis." : "Pembayaran gagal atau dibatalkan.", nowSql(), nowSql()]);
        const items = await tx.rows<AnyRow>("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [order.id]);
        for (const item of items) {
          await tx.execute("UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?", [item.quantity, nowSql(), item.product_id]);
          await tx.execute("INSERT INTO stock_movements (product_id, user_id, type, quantity, reference, note, created_at, updated_at) VALUES (?, ?, 'in', ?, ?, ?, ?, ?)", [item.product_id, order.user_id, item.quantity, order.invoice_number, expired ? "Restock: Waktu pembayaran habis" : "Restock: Pembayaran gagal/dibatalkan", nowSql(), nowSql()]);
        }
      });
    }
    return;
  }
  await execute("UPDATE payments SET bank_code = ?, virtual_account_number = ?, biller_code = ?, updated_at = ? WHERE id = ?", [...updates, nowSql(), payment.id]);
}

export async function handleCommerce(ctx: ApiContext): Promise<HandledResult | null> {
  const path = ctx.segments.join("/");
  const body = ctx.body;

  if (ctx.method === "POST" && path === "payments/midtrans-callback") {
    const required = ["order_id", "status_code", "gross_amount", "signature_key"];
    assert(required.every((key) => text(body, key)), "Parameter tidak lengkap.", 400);
    assert(verifyMidtransSignature({
      order_id: text(body, "order_id"),
      status_code: text(body, "status_code"),
      gross_amount: text(body, "gross_amount"),
      signature_key: text(body, "signature_key"),
    }), "Tanda tangan tidak valid.", 403);
    const payment = await row<AnyRow>(
      "SELECT p.* FROM payments p JOIN orders o ON o.id = p.order_id WHERE o.invoice_number = ? LIMIT 1",
      [text(body, "order_id")],
    );
    if (!payment) throw new ApiError(404, "Data pembayaran order tidak ditemukan.");
    await applyPaymentStatus(payment, {
      status: text(body, "transaction_status"),
      bank: text(body, "bank") || text(body, "payment_type") || null,
      va_number: Array.isArray(body.va_numbers) ? String((body.va_numbers[0] as Record<string, unknown>)?.va_number || "") : text(body, "permata_va_number") || null,
      biller_code: text(body, "biller_code") || null,
    });
    return { data: { message: "Status pembayaran berhasil diperbarui." } };
  }

  if (!ctx.user) return null;
  const userId = Number(ctx.user.id);

  if (ctx.method === "POST" && path === "checkout") {
    const addressId = asNumber(body.customer_address_id);
    const expeditionId = asNumber(body.expedition_id);
    assert(addressId > 0 && expeditionId > 0, "Alamat dan ekspedisi wajib dipilih.");
    const address = await row<AnyRow>("SELECT * FROM customer_addresses WHERE id = ? AND user_id = ?", [addressId, userId]);
    if (!address) throw new ApiError(404, "Alamat tidak ditemukan.");
    assert(address.latitude !== null && address.longitude !== null, "Lokasi belum lengkap. Silakan pilih titik lokasi pada map terlebih dahulu.");
    const expedition = await row<AnyRow>("SELECT * FROM expeditions WHERE id = ? AND is_active = 1", [expeditionId]);
    if (!expedition) throw new ApiError(404, "Ekspedisi tidak ditemukan.");
    const cart = await row<AnyRow>("SELECT * FROM carts WHERE user_id = ?", [userId]);
    if (!cart) throw new ApiError(422, "Keranjang masih kosong.");
    const selectedIds = Array.isArray(body.cart_item_ids) ? body.cart_item_ids.map(Number).filter(Number.isFinite) : [];
    const whereSelected = selectedIds.length ? ` AND ci.id IN (${selectedIds.map(() => "?").join(",")})` : "";
    const cartItems = await rows<AnyRow>(
      `SELECT ci.*, p.name, p.price, p.stock, p.weight, p.is_active
         FROM cart_items ci JOIN products p ON p.id = ci.product_id
        WHERE ci.cart_id = ?${whereSelected}`,
      [cart.id, ...selectedIds],
    );
    assert(cartItems.length, "Keranjang masih kosong.");
    for (const item of cartItems) {
      assert(item.is_active, `Produk ${item.name} saat ini sedang tidak aktif.`);
      assert(asNumber(item.stock) >= asNumber(item.quantity), `Stok produk ${item.name} hanya tersisa ${item.stock} unit.`);
    }
    const subtotal = cartItems.reduce((total, item) => total + asNumber(item.price) * asNumber(item.quantity), 0);
    const totalWeight = cartItems.reduce((total, item) => total + Math.max(1, asNumber(item.weight, 1000)) * asNumber(item.quantity), 0);
    const totalQuantity = cartItems.reduce((total, item) => total + asNumber(item.quantity), 0);
    const destination = findCityId(String(address.city || ""));
    const origin = await setting("store_city_id", "152");
    const courier = expedition.code === "sicepat" ? "jne" : String(expedition.code).replace(/_reg$/, "");
    const remoteCost = destination ? await shippingCost({ origin, destination, weight: totalWeight, courier, service: expedition.code === "pos" ? "Pos Kilat Khusus" : "REG" }) : null;
    let shipping = remoteCost?.value || asNumber(expedition.base_cost) + Math.max(0, totalQuantity - 1) * 1000;
    if (expedition.code === "sicepat" && remoteCost) shipping = Math.max(8000, shipping - 2000);
    const serviceFee = 2000;
    const grandTotal = subtotal + shipping + serviceFee;
    const invoice = `INV-${nowSql().replace(/[-: ]/g, "").slice(0, 14)}-${randomString(5).toUpperCase()}`;
    const midtrans = await createSnapTransaction({
      invoice,
      amount: grandTotal,
      customer: { name: String(ctx.user.name), email: String(ctx.user.email), phone: ctx.user.phone ? String(ctx.user.phone) : null },
      items: [
        ...cartItems.map((item) => ({ id: String(item.product_id), price: Math.round(asNumber(item.price)), quantity: asNumber(item.quantity), name: String(item.name).slice(0, 50) })),
        { id: "shipping", price: Math.round(shipping), quantity: 1, name: `Ongkir ${expedition.name}`.slice(0, 50) },
        { id: "service-fee", price: serviceFee, quantity: 1, name: "Biaya layanan" },
      ],
    });
    const orderId = await transaction(async (tx) => {
      for (const item of cartItems) {
        const locked = await tx.row<AnyRow>("SELECT stock, is_active, name FROM products WHERE id = ? FOR UPDATE", [item.product_id]);
        assert(locked?.is_active && asNumber(locked.stock) >= asNumber(item.quantity), `Stok produk ${item.name} berubah. Silakan periksa keranjang.`);
      }
      const order = await tx.execute(
        `INSERT INTO orders (invoice_number, user_id, customer_address_id, expedition_id, subtotal, shipping_cost, grand_total, status, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?, ?, ?)`,
        [invoice, userId, addressId, expeditionId, subtotal, shipping, grandTotal, body.note || null, nowSql(), nowSql()],
      );
      for (const item of cartItems) {
        await tx.execute(
          "INSERT INTO order_items (order_id, product_id, size, color, nim, product_name, price, quantity, total, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [order.insertId, item.product_id, item.size, item.color, item.nim, item.name, item.price, item.quantity, asNumber(item.price) * asNumber(item.quantity), nowSql(), nowSql()],
        );
        await tx.execute("UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?", [item.quantity, nowSql(), item.product_id]);
        await tx.execute("INSERT INTO stock_movements (product_id, user_id, type, quantity, reference, note, created_at, updated_at) VALUES (?, ?, 'out', ?, ?, 'Checkout customer', ?, ?)", [item.product_id, userId, item.quantity, invoice, nowSql(), nowSql()]);
      }
      await tx.execute(
        `INSERT INTO payments (order_id, bank_code, amount, status, expired_at, external_reference, snap_token, snap_url, created_at, updated_at)
         VALUES (?, ?, ?, 'waiting_payment', ?, ?, ?, ?, ?, ?)`,
        [order.insertId, body.bank_code || null, grandTotal, new Date(Date.now() + 86_400_000), midtrans.transaction_id, midtrans.token, midtrans.redirect_url, nowSql(), nowSql()],
      );
      await tx.execute("INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, 'pending_payment', 'Pesanan dibuat dan menunggu pembayaran.', ?, ?, ?)", [order.insertId, address.city, nowSql(), nowSql()]);
      await tx.execute(`DELETE FROM cart_items WHERE id IN (${cartItems.map(() => "?").join(",")})`, cartItems.map((item) => item.id));
      return order.insertId;
    });
    return { status: 201, data: { message: "Checkout berhasil.", order: await hydrateOrder(orderId) } };
  }

  if (ctx.method === "GET" && path === "orders") {
    const page = Math.max(1, asNumber(ctx.url.searchParams.get("page"), 1));
    const search = (ctx.url.searchParams.get("search") || "").trim();
    const perPage = Math.min(50, Math.max(1, asNumber(ctx.url.searchParams.get("per_page"), search ? 50 : 10)));
    const params: unknown[] = [userId];
    const searchSql = search ? " AND invoice_number LIKE ?" : "";
    if (search) params.push(`%${search}%`);
    const count = await row<AnyRow>(`SELECT COUNT(*) AS total FROM orders WHERE user_id = ?${searchSql}`, params);
    const orderRows = await rows<AnyRow>(`SELECT id FROM orders WHERE user_id = ?${searchSql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, [...params, perPage, (page - 1) * perPage]);
    const orders = await Promise.all(orderRows.map((order) => hydrateOrder(Number(order.id))));
    return { data: pagination(ctx.request.url, orders, asNumber(count?.total), page, perPage) };
  }

  const orderBaseMatch = path.match(/^orders\/(\d+)$/);
  if (ctx.method === "GET" && orderBaseMatch) {
    const order = await ownedOrder(Number(orderBaseMatch[1]), userId);
    const payment = await row<AnyRow>("SELECT * FROM payments WHERE order_id = ?", [order.id]);
    if (payment?.status === "waiting_payment") {
      const statusData = await getMidtransStatus(String(order.invoice_number));
      if (statusData.status !== "unknown") await applyPaymentStatus(payment, statusData);
      else if (payment.expired_at && new Date(payment.expired_at as string | Date) < new Date()) await applyPaymentStatus(payment, { status: "expire" });
    }
    return { data: {
      order: await hydrateOrder(Number(order.id)),
      status_labels: STATUS_LABELS,
      store_name: await setting("store_name", "UBSI Cyber Store"),
      store_address: await setting("store_address", "Jl. Kramat Raya No.98, Jakarta Pusat"),
      store_email: await setting("store_email", "support@cyberstore.test"),
      store_phone: await setting("store_phone", "(021) 7867868"),
    } };
  }

  const completeMatch = path.match(/^orders\/(\d+)\/complete$/);
  if (ctx.method === "POST" && completeMatch) {
    const order = await ownedOrder(Number(completeMatch[1]), userId);
    assert(order.status === "arrived", "Pesanan belum dapat diselesaikan.");
    await transaction(async (tx) => {
      await tx.execute("UPDATE orders SET status = 'completed', updated_at = ? WHERE id = ?", [nowSql(), order.id]);
      await tx.execute("INSERT INTO order_trackings (order_id, status, description, created_at, updated_at) VALUES (?, 'completed', 'Pesanan telah diselesaikan oleh customer.', ?, ?)", [order.id, nowSql(), nowSql()]);
    });
    return { data: { message: "Pesanan selesai.", order: await hydrateOrder(Number(order.id)) } };
  }

  const simulateMatch = path.match(/^orders\/(\d+)\/simulate-courier-pod$/);
  if (ctx.method === "POST" && simulateMatch) {
    const order = await ownedOrder(Number(simulateMatch[1]), userId);
    const detail = await hydrateOrder(Number(order.id)) as Record<string, unknown>;
    const address = detail.address as Record<string, unknown>;
    const expedition = detail.expedition as Record<string, unknown>;
    await transaction(async (tx) => {
      await tx.execute("UPDATE orders SET status = 'arrived', updated_at = ? WHERE id = ?", [nowSql(), order.id]);
      await tx.execute("INSERT INTO order_trackings (order_id, status, description, location, proof_photo, created_at, updated_at) VALUES (?, 'arrived', ?, ?, 'order_proofs/mock_pod_sample.jpg', ?, ?)", [order.id, `Paket diserahkan oleh ${expedition.name || "kurir"} kepada ${address.receiver_name || "pelanggan"}.`, address.city || "Alamat tujuan", nowSql(), nowSql()]);
    });
    return { data: { message: "Simulasi kurir berhasil! Bukti pengiriman otomatis tercatat.", order: await hydrateOrder(Number(order.id)) } };
  }

  const trackMatch = path.match(/^orders\/(\d+)\/track$/);
  if (ctx.method === "POST" && trackMatch) {
    const order = await ownedOrder(Number(trackMatch[1]), userId);
    assert(order.resi_number, "Nomor resi belum diisi.");
    const existing = await row<AnyRow>("SELECT id FROM order_trackings WHERE order_id = ? AND description LIKE 'Paket sedang dalam perjalanan%' LIMIT 1", [order.id]);
    if (!existing) await execute("INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, 'shipped', 'Paket sedang dalam perjalanan ke kota tujuan.', 'Transit Hub', ?, ?)", [order.id, nowSql(), nowSql()]);
    return { data: { message: "Sinkronisasi resi berhasil.", order: await hydrateOrder(Number(order.id)) } };
  }

  const cancelMatch = path.match(/^orders\/(\d+)\/cancel$/);
  if (ctx.method === "POST" && cancelMatch) {
    const order = await ownedOrder(Number(cancelMatch[1]), userId);
    const reason = text(body, "reason") || "Tidak ada alasan khusus";
    if (order.status === "pending_payment") {
      await transaction(async (tx) => {
        await tx.execute("UPDATE payments SET status = 'failed', updated_at = ? WHERE order_id = ?", [nowSql(), order.id]);
        await tx.execute("UPDATE orders SET status = 'cancelled', note = CONCAT_WS(' | ', note, ?), updated_at = ? WHERE id = ?", [`Alasan Batal: ${reason}`, nowSql(), order.id]);
        await tx.execute("INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, 'cancelled', ?, 'Sistem', ?, ?)", [order.id, `Pesanan dibatalkan oleh pembeli. Alasan: ${reason}`, nowSql(), nowSql()]);
        const items = await tx.rows<AnyRow>("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [order.id]);
        for (const item of items) {
          await tx.execute("UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?", [item.quantity, nowSql(), item.product_id]);
          await tx.execute("INSERT INTO stock_movements (product_id, user_id, type, quantity, reference, note, created_at, updated_at) VALUES (?, ?, 'in', ?, ?, 'Restock: Dibatalkan pelanggan', ?, ?)", [item.product_id, userId, item.quantity, order.invoice_number, nowSql(), nowSql()]);
        }
      });
      return { data: { message: "Pesanan berhasil dibatalkan.", order: await hydrateOrder(Number(order.id)) } };
    }
    if (["paid", "packed"].includes(String(order.status))) {
      assert(order.cancel_request_status !== "pending", "Pengajuan pembatalan sedang diproses oleh Admin.");
      assert(order.cancel_request_status !== "approved", "Pengajuan pembatalan sudah disetujui.");
      await transaction(async (tx) => {
        await tx.execute("UPDATE orders SET cancel_request_status = 'pending', cancel_request_reason = ?, updated_at = ? WHERE id = ?", [reason, nowSql(), order.id]);
        await tx.execute("INSERT INTO order_trackings (order_id, status, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", [order.id, order.status, `Mengajukan pembatalan pesanan. Alasan: ${reason}`, nowSql(), nowSql()]);
      });
      return { data: { message: "Pengajuan pembatalan pesanan berhasil dikirim ke Admin.", order: await hydrateOrder(Number(order.id)) } };
    }
    throw new ApiError(422, "Pesanan tidak dapat dibatalkan karena sudah dikirim/selesai.");
  }

  const paymentMatch = path.match(/^payments\/(\d+)\/check-status$/);
  if (ctx.method === "POST" && paymentMatch) {
    const payment = await row<AnyRow>("SELECT p.*, o.user_id, o.invoice_number FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.id = ? AND o.user_id = ?", [Number(paymentMatch[1]), userId]);
    if (!payment) throw new ApiError(404, "Pembayaran tidak ditemukan.");
    if (payment.status !== "paid") await applyPaymentStatus(payment, await getMidtransStatus(String(payment.invoice_number)));
    const fresh = await row<AnyRow>("SELECT * FROM payments WHERE id = ?", [payment.id]);
    return { data: { message: fresh?.status === "paid" ? "Pembayaran sudah lunas." : "Status pembayaran berhasil disinkronisasi.", payment: fresh, order: await hydrateOrder(Number(payment.order_id)) } };
  }

  return null;
}
