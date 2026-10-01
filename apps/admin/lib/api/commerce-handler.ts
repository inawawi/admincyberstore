import type { RowDataPacket } from "mysql2";
import { execute, row, rows, transaction } from "@/lib/db";
import { ApiError, assert, pagination } from "@/lib/http";
import { cancelMidtransTransaction, createSnapTransaction, getMidtransStatus, verifyMidtransSignature } from "@/lib/midtrans";
import { isWithinBusinessDay } from "@/lib/business-day";
import { hydrateOrder } from "@/lib/api/serializers";
import { findCityId, shippingCost } from "@/lib/shipping";
import { asNumber, nowSql, randomString } from "@/lib/utils";
import type { ApiContext, HandledResult } from "@/lib/api/types";
import { clearCatalogCache, clearAdminSearchCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

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
  if (!order || ["refund_processing", "approved"].includes(String(order.cancel_request_status))) return;
  const updates = [statusData.bank || payment.bank_code, statusData.va_number || payment.virtual_account_number, statusData.biller_code || payment.biller_code];
  if (["settlement", "capture"].includes(statusData.status)) {
    if (payment.status !== "paid") {
      await transaction(async (tx) => {
        const locked = await tx.row<AnyRow>("SELECT * FROM orders WHERE id = ? FOR UPDATE", [order.id]);
        if (!locked || ["refund_processing", "approved"].includes(String(locked.cancel_request_status))) return;
        if (locked.status !== "pending_payment") return;
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
        const locked = await tx.row<AnyRow>("SELECT * FROM orders WHERE id = ? FOR UPDATE", [order.id]);
        if (!locked || ["refund_processing", "approved"].includes(String(locked.cancel_request_status))) return;
        if (locked.status !== "pending_payment") return;
        await tx.execute("UPDATE payments SET bank_code = ?, virtual_account_number = ?, biller_code = ?, status = ?, updated_at = ? WHERE id = ?", [...updates, expired ? "expired" : "failed", nowSql(), payment.id]);
        await tx.execute("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?", [nowSql(), order.id]);
        await tx.execute("INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, 'cancelled', ?, 'Sistem', ?, ?)", [order.id, expired ? "Pesanan dibatalkan karena batas waktu pembayaran habis." : "Pembayaran gagal atau dibatalkan.", nowSql(), nowSql()]);
        const items = await tx.rows<AnyRow>("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [order.id]);
        for (const item of items) {
          await tx.execute("UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?", [item.quantity, nowSql(), item.product_id]);
          await tx.execute("INSERT INTO stock_movements (product_id, user_id, type, quantity, reference, note, created_at, updated_at) VALUES (?, ?, 'in', ?, ?, ?, ?, ?)", [item.product_id, order.user_id, item.quantity, order.invoice_number, expired ? "Restock: Waktu pembayaran habis" : "Restock: Pembayaran gagal/dibatalkan", nowSql(), nowSql()]);
        }
      });
      clearCatalogCache();
      clearAdminSearchCache("orders");
      clearAdminSearchCache("stock-movements");
      clearAdminSearchCache("products");
    }
    return;
  }
  await execute("UPDATE payments SET bank_code = ?, virtual_account_number = ?, biller_code = ?, updated_at = ? WHERE id = ?", [...updates, nowSql(), payment.id]);
}

export async function handleCommerce(ctx: ApiContext): Promise<HandledResult | null> {
  const path = ctx.segments.join("/");
  const body = ctx.body;

  if (ctx.method === "POST" && path === "payments/midtrans-callback") {
    const orderId = text(body, "order_id");
    const statusCode = text(body, "status_code");
    const grossAmount = text(body, "gross_amount");
    const transactionStatus = text(body, "transaction_status");

    logger.info(`[Midtrans Webhook Received] Order: ${orderId}, Status: ${transactionStatus}, Code: ${statusCode}`, {
      orderId,
      statusCode,
      grossAmount,
      transactionStatus,
      paymentType: text(body, "payment_type"),
    });

    const required = ["order_id", "status_code", "gross_amount", "signature_key"];
    if (!required.every((key) => text(body, key))) {
      logger.warn("[Midtrans Webhook Rejected] Missing required webhook fields", { orderId, bodyKeys: Object.keys(body) });
      throw new ApiError(400, "Parameter tidak lengkap.");
    }

    const isValidSignature = verifyMidtransSignature({
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: text(body, "signature_key"),
    });

    if (!isValidSignature) {
      logger.warn(`[Midtrans Webhook Rejected] Signature verification failed for order ${orderId}`, {
        orderId,
        statusCode,
        grossAmount,
      });
      throw new ApiError(403, "Tanda tangan tidak valid.");
    }

    const payment = await row<AnyRow>(
      "SELECT p.* FROM payments p JOIN orders o ON o.id = p.order_id WHERE o.invoice_number = ? LIMIT 1",
      [orderId],
    );
    if (!payment) {
      logger.warn(`[Midtrans Webhook Error] Payment row not found for invoice: ${orderId}`, { orderId });
      throw new ApiError(404, "Data pembayaran order tidak ditemukan.");
    }

    await applyPaymentStatus(payment, {
      status: transactionStatus,
      bank: text(body, "bank") || text(body, "payment_type") || null,
      va_number: Array.isArray(body.va_numbers) ? String((body.va_numbers[0] as Record<string, unknown>)?.va_number || "") : text(body, "permata_va_number") || null,
      biller_code: text(body, "biller_code") || null,
    });

    logger.audit("MIDTRANS_PAYMENT_STATUS_SYNC", {
      target: { type: "order_payment", id: String(payment.id) },
      status: "success",
      metadata: { invoice: orderId, newStatus: transactionStatus, grossAmount },
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
    let cartItems: AnyRow[] = [];
    const dbItemIdsToDelete: number[] = [];

    if (Array.isArray(body.items) && body.items.length > 0) {
      for (const rawItem of body.items as Array<Record<string, unknown>>) {
        const prodId = asNumber(rawItem.product_id);
        const qty = Math.max(1, asNumber(rawItem.quantity, 1));
        if (prodId <= 0) continue;
        const prod = await row<AnyRow>("SELECT id, name, price, stock, weight, is_active, is_event_maba FROM products WHERE id = ?", [prodId]);
        if (!prod) throw new ApiError(404, `Produk dengan ID ${prodId} tidak ditemukan.`);
        cartItems.push({
          id: asNumber(rawItem.id || 0),
          product_id: prod.id,
          name: prod.name,
          price: prod.price,
          stock: prod.stock,
          weight: prod.weight,
          is_active: prod.is_active,
          is_event_maba: Boolean(prod.is_event_maba),
          quantity: qty,
          size: rawItem.size ? String(rawItem.size).slice(0, 50) : null,
          color: rawItem.color ? String(rawItem.color).slice(0, 50) : null,
          nim: rawItem.nim ? String(rawItem.nim).slice(0, 30) : null,
        } as AnyRow);
        if (asNumber(rawItem.id) > 0) {
          dbItemIdsToDelete.push(asNumber(rawItem.id));
        }
      }
    } else {
      const cart = await row<AnyRow>("SELECT * FROM carts WHERE user_id = ?", [userId]);
      if (cart) {
        const selectedIds = Array.isArray(body.cart_item_ids) ? body.cart_item_ids.map(Number).filter(Number.isFinite) : [];
        const whereSelected = selectedIds.length ? ` AND ci.id IN (${selectedIds.map(() => "?").join(",")})` : "";
        cartItems = await rows<AnyRow>(
          `SELECT ci.*, p.name, p.price, p.stock, p.weight, p.is_active, p.is_event_maba
             FROM cart_items ci JOIN products p ON p.id = ci.product_id
            WHERE ci.cart_id = ?${whereSelected}`,
          [cart.id, ...selectedIds],
        );
        for (const item of cartItems) {
          if (asNumber(item.id) > 0) dbItemIdsToDelete.push(asNumber(item.id));
        }
      }
    }

    assert(cartItems.length > 0, "Keranjang masih kosong.");
    for (const item of cartItems) {
      assert(item.is_active, `Produk ${item.name} saat ini sedang tidak aktif.`);
      assert(asNumber(item.stock) >= asNumber(item.quantity), `Stok produk ${item.name} hanya tersisa ${item.stock} unit.`);
    }
    const hasEventMaba = cartItems.some((item) => Boolean(item.is_event_maba));
    const subtotal = cartItems.reduce((total, item) => total + asNumber(item.price) * asNumber(item.quantity), 0);
    const totalWeight = cartItems.reduce((total, item) => total + Math.max(1, asNumber(item.weight, 1000)) * asNumber(item.quantity), 0);
    const totalQuantity = cartItems.reduce((total, item) => total + asNumber(item.quantity), 0);
    const destination = findCityId(String(address.city || ""));
    const origin = await setting("store_city_id", "152");
    const courier = expedition.code === "sicepat" ? "jne" : String(expedition.code).replace(/_reg$/, "");
    const remoteCost = destination ? await shippingCost({ origin, destination, weight: totalWeight, courier, service: expedition.code === "pos" ? "Pos Kilat Khusus" : "REG" }) : null;
    let shipping = hasEventMaba ? 0 : (remoteCost?.value || asNumber(expedition.base_cost) + Math.max(0, totalQuantity - 1) * 1000);
    if (!hasEventMaba && expedition.code === "sicepat" && remoteCost) shipping = Math.max(8000, shipping - 2000);
    const serviceFee = 4400;
    const grandTotal = subtotal + shipping + serviceFee;
    // Urutkan item berdasarkan product_id secara deterministik untuk mencegah deadlock saat row-level locking
    cartItems.sort((a, b) => Number(a.product_id) - Number(b.product_id));

    const invoice = `INV-${nowSql().replace(/[-: ]/g, "").slice(0, 14)}-${randomString(5).toUpperCase()}`;

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
        `INSERT INTO payments (order_id, bank_code, amount, status, expired_at, created_at, updated_at)
         VALUES (?, ?, ?, 'waiting_payment', ?, ?, ?)`,
        [order.insertId, body.bank_code || null, grandTotal, new Date(Date.now() + 86_400_000), nowSql(), nowSql()],
      );
      await tx.execute("INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, 'pending_payment', 'Pesanan dibuat dan menunggu pembayaran.', ?, ?, ?)", [order.insertId, address.city, nowSql(), nowSql()]);
      if (dbItemIdsToDelete.length > 0) {
        await tx.execute(`DELETE FROM cart_items WHERE id IN (${dbItemIdsToDelete.map(() => "?").join(",")})`, dbItemIdsToDelete);
      }
      const userCart = await tx.row<AnyRow>("SELECT id FROM carts WHERE user_id = ?", [userId]);
      if (userCart) {
        const productIds = cartItems.map((ci) => ci.product_id);
        if (productIds.length > 0) {
          await tx.execute(`DELETE FROM cart_items WHERE cart_id = ? AND product_id IN (${productIds.map(() => "?").join(",")})`, [userCart.id, ...productIds]);
        }
      }
      return order.insertId;
    });

    clearCatalogCache();
    clearAdminSearchCache("orders");
    clearAdminSearchCache("stock-movements");
    clearAdminSearchCache("products");

    let midtrans: Awaited<ReturnType<typeof createSnapTransaction>>;
    try {
      midtrans = await createSnapTransaction({
        invoice,
        amount: grandTotal,
        customer: { name: String(ctx.user.name), email: String(ctx.user.email), phone: ctx.user.phone ? String(ctx.user.phone) : null },
        items: [
          ...cartItems.map((item) => ({ id: String(item.product_id), price: Math.round(asNumber(item.price)), quantity: asNumber(item.quantity), name: String(item.name).slice(0, 50) })),
          { id: "shipping", price: Math.round(shipping), quantity: 1, name: `Ongkir ${expedition.name}`.slice(0, 50) },
          { id: "service-fee", price: serviceFee, quantity: 1, name: "Biaya Penanganan" },
        ],
      });
      await execute(
        "UPDATE payments SET snap_token = ?, snap_url = ?, external_reference = ?, updated_at = ? WHERE order_id = ?",
        [midtrans.token, midtrans.redirect_url, midtrans.transaction_id || null, nowSql(), orderId],
      );
    } catch (midtransError) {
      logger.error("[Midtrans Snap Creation Failed]", { invoice, orderId, error: midtransError });
      await transaction(async (tx) => {
        await tx.execute("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?", [nowSql(), orderId]);
        await tx.execute("UPDATE payments SET status = 'failed', updated_at = ? WHERE order_id = ?", [nowSql(), orderId]);
        await tx.execute("INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, 'cancelled', 'Pembayaran gagal diinisialisasi gateway.', 'Sistem', ?, ?)", [orderId, nowSql(), nowSql()]);
        for (const item of cartItems) {
          await tx.execute("UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?", [item.quantity, nowSql(), item.product_id]);
          await tx.execute("INSERT INTO stock_movements (product_id, user_id, type, quantity, reference, note, created_at, updated_at) VALUES (?, ?, 'in', ?, ?, 'Restock: Gagal inisialisasi Midtrans Snap', ?, ?)", [item.product_id, userId, item.quantity, invoice, nowSql(), nowSql()]);
        }
      });
      clearCatalogCache();
      throw new ApiError(502, "Gagal menghubungkan ke gateway pembayaran. Silakan coba beberapa saat lagi.");
    }

    return {
      status: 201,
      data: {
        message: "Checkout berhasil.",
        order: await hydrateOrder(orderId),
        snap_token: midtrans.token,
        snap_url: midtrans.redirect_url,
      },
    };
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
    // ⚠️ Endpoint simulasi — hanya aktif jika ENABLE_SIMULATION=true dan bukan production
    if (process.env.NODE_ENV === "production" || process.env.ENABLE_SIMULATION !== "true") {
      throw new ApiError(404, "Endpoint tidak ditemukan.");
    }
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
    const id = Number(cancelMatch[1]);
    const reason = text(body, "reason").trim() || "Dibatalkan oleh pelanggan";
    assert(reason.length <= 1000, "Alasan pembatalan maksimal 1000 karakter.");

    let wasInstantCancel = false;
    let orderInvoice = "";

    await transaction(async (tx) => {
      const order = await tx.row<AnyRow>("SELECT * FROM orders WHERE id = ? AND user_id = ? FOR UPDATE", [id, userId]);
      assert(order, "Pesanan tidak ditemukan.", 404);
      assert(["pending_payment", "paid"].includes(String(order.status)), "Pesanan sudah diproses atau dikirim dan tidak dapat dibatalkan.");
      assert(!["pending", "approved", "refund_processing"].includes(String(order.cancel_request_status)), "Pengajuan pembatalan sedang diproses atau sudah disetujui.");

      orderInvoice = String(order.invoice_number);

      if (order.status === "pending_payment") {
        // KASUS 1: BELUM MEMBAYAR -> Langsung batalkan seketika tanpa perlu pengajuan/persetujuan admin
        wasInstantCancel = true;
        await tx.execute(
          "UPDATE orders SET status = 'cancelled', cancel_request_status = NULL, cancel_request_reason = ?, updated_at = NOW() WHERE id = ?",
          [reason, id],
        );
        await tx.execute(
          "UPDATE payments SET status = 'failed', updated_at = NOW() WHERE order_id = ? AND status = 'waiting_payment'",
          [id],
        );
        // Kembalikan stok produk
        const items = await tx.rows<AnyRow>("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [id]);
        for (const item of items) {
          await tx.execute("UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?", [item.quantity, item.product_id]);
          await tx.execute(
            "INSERT INTO stock_movements (product_id, user_id, type, quantity, reference, note, created_at, updated_at) VALUES (?, ?, 'in', ?, ?, 'Restock: Dibatalkan pelanggan (belum bayar)', NOW(), NOW())",
            [item.product_id, userId, item.quantity, order.invoice_number],
          );
        }
      } else {
        // KASUS 2: SUDAH MEMBAYAR
        // Aturan Khusus Event MABA: Pesanan Event MABA yang sudah berhasil dibayar TIDAK DAPAT DIBATALKAN.
        const mabaItem = await tx.row<AnyRow>(
          `SELECT oi.id FROM order_items oi 
           JOIN products p ON p.id = oi.product_id 
           WHERE oi.order_id = ? AND (p.is_event_maba = 1 OR p.is_event_maba = TRUE) LIMIT 1`,
          [id],
        );
        assert(!mabaItem, "Pesanan produk Event MABA yang telah dibayar tidak dapat dibatalkan sesuai dengan ketentuan resmi admin kampus UBSI.");

        // Wajib pengajuan pembatalan untuk produk reguler, batas waktu 1 hari kerja sejak pembayaran
        const payment = await tx.row<AnyRow>("SELECT paid_at FROM payments WHERE order_id = ? LIMIT 1", [id]);
        const paidTime = payment?.paid_at ? new Date(String(payment.paid_at)) : new Date(String(order.updated_at || order.created_at));

        assert(isWithinBusinessDay(paidTime), "Batas waktu pengajuan pembatalan (1 hari kerja) telah berakhir.");

        const refundBank = text(body, "refund_bank_name") || text(body, "bank_name") || null;
        const refundAccNum = text(body, "refund_account_number") || text(body, "account_number") || null;
        const refundAccName = text(body, "refund_account_name") || text(body, "account_name") || null;

        await tx.execute(
          "UPDATE orders SET cancel_request_status = 'pending', cancel_request_reason = ?, refund_bank_name = ?, refund_account_number = ?, refund_account_name = ?, refund_amount = grand_total, updated_at = NOW() WHERE id = ?",
          [reason, refundBank, refundAccNum, refundAccName, id],
        );

        let trackingInfo = `Mengajukan pembatalan pesanan (menunggu persetujuan & konfirmasi refund admin). Alasan: ${reason}`;
        if (refundBank && refundAccNum) {
          trackingInfo += `. Rekening Pengembalian Dana: ${refundBank} - ${refundAccNum} (a/n ${refundAccName || "Pelanggan"})`;
        }

        await tx.execute(
          "INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, 'paid', ?, 'Pelanggan', NOW(), NOW())",
          [id, trackingInfo],
        );
      }
    });

    clearCatalogCache();
    clearAdminSearchCache("orders");
    clearAdminSearchCache("stock-movements");

    if (wasInstantCancel && orderInvoice) {
      cancelMidtransTransaction(orderInvoice).catch(() => {});
    }

    return {
      data: {
        message: wasInstantCancel
          ? "Pesanan berhasil dibatalkan."
          : "Pengajuan pembatalan berhasil dikirim. Menunggu konfirmasi rekening & persetujuan admin.",
        order: await hydrateOrder(id),
      },
    };
  }

  const refundBankMatch = path.match(/^orders\/(\d+)\/refund-bank$/);
  if ((ctx.method === "POST" || ctx.method === "PATCH") && refundBankMatch) {
    const id = Number(refundBankMatch[1]);
    const bankName = text(body, "refund_bank_name") || text(body, "bank_name");
    const accNum = text(body, "refund_account_number") || text(body, "account_number");
    const accName = text(body, "refund_account_name") || text(body, "account_name");
    assert(bankName && accNum && accName, "Nama bank/e-wallet, nomor rekening, dan nama pemilik rekening wajib diisi.");

    const order = await row<AnyRow>("SELECT id, status, cancel_request_status FROM orders WHERE id = ? AND user_id = ?", [id, userId]);
    assert(order, "Pesanan tidak ditemukan.", 404);
    assert(["pending", "refund_processing", "approved"].includes(String(order.cancel_request_status)), "Rekening pengembalian dana hanya dapat diubah saat pembatalan diajukan.");

    await execute(
      "UPDATE orders SET refund_bank_name = ?, refund_account_number = ?, refund_account_name = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
      [bankName, accNum, accName, id, userId]
    );

    await execute(
      "INSERT INTO order_trackings (order_id, status, description, location, created_at, updated_at) VALUES (?, ?, ?, 'Pelanggan', NOW(), NOW())",
      [id, String(order.status), `Pelanggan memperbarui data rekening pengembalian dana: ${bankName} - ${accNum} (a/n ${accName})`]
    );

    clearAdminSearchCache("orders");

    return {
      data: {
        message: "Data rekening pengembalian dana berhasil diperbarui.",
        order: await hydrateOrder(id),
      },
    };
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
