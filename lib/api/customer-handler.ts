import type { RowDataPacket } from "mysql2";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { execute, row, rows, transaction } from "@/lib/db";
import { ApiError, assert, pagination } from "@/lib/http";
import { saveImage } from "@/lib/media";
import {
  hydrateCart,
  serializeProduct,
  serializeUser,
} from "@/lib/api/serializers";
import {
  asBoolean,
  asNumber,
  cleanNullable,
  nowSql,
  publicUrl,
} from "@/lib/utils";
import type { ApiContext, HandledResult } from "@/lib/api/types";

type AnyRow = RowDataPacket & Record<string, unknown>;

function text(body: Record<string, unknown>, key: string) {
  return typeof body[key] === "string" ? body[key].trim() : "";
}

async function ensureCart(userId: number) {
  let cart = await row<AnyRow>("SELECT * FROM carts WHERE user_id = ? LIMIT 1", [userId]);
  if (!cart) {
    const result = await execute("INSERT INTO carts (user_id, created_at, updated_at) VALUES (?, ?, ?)", [userId, nowSql(), nowSql()]);
    cart = await row<AnyRow>("SELECT * FROM carts WHERE id = ?", [result.insertId]);
  }
  return cart!;
}

async function productByKey(key: string) {
  return row<AnyRow>(
    /^\d+$/.test(key) ? "SELECT * FROM products WHERE id = ? LIMIT 1" : "SELECT * FROM products WHERE slug = ? LIMIT 1",
    [key],
  );
}

async function addressForUser(id: number, userId: number) {
  const address = await row<AnyRow>("SELECT * FROM customer_addresses WHERE id = ? AND user_id = ? LIMIT 1", [id, userId]);
  if (!address) throw new ApiError(404, "Alamat tidak ditemukan.");
  return address;
}

export async function handleCustomer(ctx: ApiContext): Promise<HandledResult | null> {
  if (!ctx.user) return null;
  const path = ctx.segments.join("/");
  const body = ctx.body;
  const userId = Number(ctx.user.id);

  if (ctx.method === "POST" && path === "profile") {
    const name = text(body, "name");
    const email = text(body, "email").toLowerCase();
    assert(name && name.length <= 100, "Nama wajib diisi dan maksimal 100 karakter.");
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Format email tidak valid.");
    const duplicate = await row<AnyRow>("SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1", [email, userId]);
    assert(!duplicate, "Email sudah digunakan.");
    let password = ctx.user.password as string;
    if (text(body, "password")) {
      assert(text(body, "password").length >= 8, "Password minimal 8 karakter.");
      assert(text(body, "password") === body.password_confirmation, "Konfirmasi password tidak sesuai.");
      assert(text(body, "current_password") && await verifyPassword(text(body, "current_password"), password), "Password saat ini tidak sesuai.");
      password = await hashPassword(text(body, "password"));
    }
    let photo = ctx.user.photo || null;
    if (body.photo instanceof File && body.photo.size > 0) {
      photo = await saveImage(body.photo, "users", 2);
    }
    await execute(
      `UPDATE users SET name = ?, email = ?, phone = ?, address = ?, password = ?, photo = ?,
        push_notifications_enabled = ?, email_notifications_enabled = ?, biometric_login_enabled = ?, updated_at = ? WHERE id = ?`,
      [
        name,
        email,
        cleanNullable(body.phone),
        cleanNullable(body.address),
        password,
        photo,
        body.push_notifications_enabled === undefined ? Number(ctx.user.push_notifications_enabled) : Number(asBoolean(body.push_notifications_enabled)),
        body.email_notifications_enabled === undefined ? Number(ctx.user.email_notifications_enabled) : Number(asBoolean(body.email_notifications_enabled)),
        body.biometric_login_enabled === undefined ? Number(ctx.user.biometric_login_enabled) : Number(asBoolean(body.biometric_login_enabled)),
        nowSql(),
        userId,
      ],
    );
    const user = await row<AnyRow>("SELECT * FROM users WHERE id = ?", [userId]);
    return { data: { message: "Profil berhasil diperbarui.", user: serializeUser(user!) } };
  }

  if (ctx.method === "GET" && path === "addresses") {
    return { data: { addresses: await rows<AnyRow>("SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY created_at DESC, id DESC", [userId]) } };
  }

  if (ctx.method === "POST" && path === "addresses") {
    for (const key of ["label", "receiver_name", "phone", "address", "province", "city"]) {
      assert(text(body, key), `${key.replaceAll("_", " ")} wajib diisi.`);
    }
    const isDefault = asBoolean(body.is_default);
    const addressId = await transaction(async (tx) => {
      if (isDefault) await tx.execute("UPDATE customer_addresses SET is_default = 0 WHERE user_id = ?", [userId]);
      const result = await tx.execute(
        `INSERT INTO customer_addresses
          (user_id, label, receiver_name, phone, address, notes, province, city, district,
           village, postal_code, latitude, longitude, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, text(body, "label"), text(body, "receiver_name"), text(body, "phone"), text(body, "address"), cleanNullable(body.notes), text(body, "province"), text(body, "city"), cleanNullable(body.district), cleanNullable(body.village), cleanNullable(body.postal_code), cleanNullable(body.latitude), cleanNullable(body.longitude), Number(isDefault), nowSql(), nowSql()],
      );
      return result.insertId;
    });
    return { status: 201, data: { message: "Alamat berhasil ditambahkan.", address: await row<AnyRow>("SELECT * FROM customer_addresses WHERE id = ?", [addressId]) } };
  }

  const addressMatch = path.match(/^addresses\/(\d+)$/);
  if (addressMatch) {
    const id = Number(addressMatch[1]);
    const address = await addressForUser(id, userId);
    if (ctx.method === "GET") return { data: { address } };
    if (["PUT", "PATCH"].includes(ctx.method)) {
      for (const key of ["label", "receiver_name", "phone", "address", "province", "city"]) {
        assert(text(body, key), `${key.replaceAll("_", " ")} wajib diisi.`);
      }
      const isDefault = asBoolean(body.is_default);
      await transaction(async (tx) => {
        if (isDefault) await tx.execute("UPDATE customer_addresses SET is_default = 0 WHERE user_id = ? AND id <> ?", [userId, id]);
        await tx.execute(
          `UPDATE customer_addresses SET label = ?, receiver_name = ?, phone = ?, address = ?, notes = ?,
           province = ?, city = ?, district = ?, village = ?, postal_code = ?, latitude = ?, longitude = ?,
           is_default = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
          [text(body, "label"), text(body, "receiver_name"), text(body, "phone"), text(body, "address"), cleanNullable(body.notes), text(body, "province"), text(body, "city"), cleanNullable(body.district), cleanNullable(body.village), cleanNullable(body.postal_code), cleanNullable(body.latitude), cleanNullable(body.longitude), Number(isDefault), nowSql(), id, userId],
        );
      });
      return { data: { message: "Alamat berhasil diperbarui.", address: await addressForUser(id, userId) } };
    }
    if (ctx.method === "DELETE") {
      await execute("DELETE FROM customer_addresses WHERE id = ? AND user_id = ?", [id, userId]);
      return { data: { message: "Alamat berhasil dihapus." } };
    }
  }

  if (ctx.method === "GET" && path === "cart") {
    await ensureCart(userId);
    return { data: { cart: await hydrateCart(userId) } };
  }

  if (ctx.method === "POST" && path === "cart/add") {
    const productId = asNumber(body.product_id);
    const quantity = asNumber(body.quantity);
    assert(productId > 0 && quantity >= 1, "Produk dan jumlah wajib diisi.");
    const product = await row<AnyRow>("SELECT * FROM products WHERE id = ? AND is_active = 1", [productId]);
    if (!product) throw new ApiError(404, "Produk tidak ditemukan.");
    assert(asNumber(product.stock) >= quantity, `Stok produk ${product.name} hanya tersisa ${product.stock} unit.`);
    const cart = await ensureCart(userId);
    const size = cleanNullable(body.size);
    const color = cleanNullable(body.color);
    const existing = await row<AnyRow>(
      "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND size <=> ? AND color <=> ? LIMIT 1",
      [cart.id, productId, size, color],
    );
    if (existing) {
      const nextQuantity = asNumber(existing.quantity) + quantity;
      assert(asNumber(product.stock) >= nextQuantity, `Stok produk ${product.name} hanya tersisa ${product.stock} unit.`);
      await execute("UPDATE cart_items SET quantity = ?, nim = ?, updated_at = ? WHERE id = ?", [nextQuantity, cleanNullable(body.nim) ?? existing.nim, nowSql(), existing.id]);
    } else {
      await execute(
        "INSERT INTO cart_items (cart_id, product_id, size, color, nim, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [cart.id, productId, size, color, cleanNullable(body.nim), quantity, nowSql(), nowSql()],
      );
    }
    return { status: 201, data: { message: "Produk berhasil ditambahkan ke keranjang.", cart: await hydrateCart(userId) } };
  }

  const cartItemMatch = path.match(/^cart\/items\/(\d+)$/);
  if (cartItemMatch) {
    const id = Number(cartItemMatch[1]);
    const item = await row<AnyRow>(
      `SELECT ci.*, p.stock, p.name FROM cart_items ci
        JOIN carts c ON c.id = ci.cart_id JOIN products p ON p.id = ci.product_id
       WHERE ci.id = ? AND c.user_id = ? LIMIT 1`,
      [id, userId],
    );
    if (!item) throw new ApiError(404, "Item keranjang tidak ditemukan.");
    if (ctx.method === "PATCH") {
      const quantity = asNumber(body.quantity);
      assert(quantity >= 1, "Jumlah minimal 1.");
      assert(asNumber(item.stock) >= quantity, `Stok produk ${item.name} hanya tersisa ${item.stock} unit.`);
      await execute("UPDATE cart_items SET quantity = ?, size = ?, color = ?, nim = ?, updated_at = ? WHERE id = ?", [quantity, cleanNullable(body.size), cleanNullable(body.color), cleanNullable(body.nim), nowSql(), id]);
      return { data: { message: "Keranjang berhasil diperbarui.", cart: await hydrateCart(userId) } };
    }
    if (ctx.method === "DELETE") {
      await execute("DELETE FROM cart_items WHERE id = ?", [id]);
      return { data: { message: "Item berhasil dihapus dari keranjang.", cart: await hydrateCart(userId) } };
    }
  }

  if (ctx.method === "DELETE" && path === "cart") {
    const cart = await ensureCart(userId);
    await execute("DELETE FROM cart_items WHERE cart_id = ?", [cart.id]);
    return { data: { message: "Keranjang berhasil dikosongkan." } };
  }

  if (ctx.method === "POST" && path === "cart/items/delete-bulk") {
    const itemIds = Array.isArray(body.item_ids) ? body.item_ids.map(Number).filter(Number.isFinite) : [];
    assert(itemIds.length > 0, "Pilih item yang akan dihapus.");
    const cart = await ensureCart(userId);
    await execute(`DELETE FROM cart_items WHERE cart_id = ? AND id IN (${itemIds.map(() => "?").join(",")})`, [cart.id, ...itemIds]);
    return { data: { message: "Items berhasil dihapus dari keranjang.", cart: await hydrateCart(userId) } };
  }

  const reviewStoreMatch = path.match(/^products\/([^/]+)\/reviews$/);
  if (ctx.method === "POST" && reviewStoreMatch) {
    const product = await productByKey(decodeURIComponent(reviewStoreMatch[1]));
    if (!product) throw new ApiError(404, "Produk tidak ditemukan.");
    const orderId = asNumber(body.order_id);
    const rating = asNumber(body.rating);
    assert(orderId > 0 && rating >= 1 && rating <= 5, "Pesanan dan rating 1-5 wajib diisi.");
    const order = await row<AnyRow>("SELECT * FROM orders WHERE id = ? AND user_id = ?", [orderId, userId]);
    if (!order) throw new ApiError(404, "Pesanan tidak ditemukan.");
    assert(order.status === "completed", "Pesanan belum diselesaikan.");
    const ordered = await row<AnyRow>("SELECT id FROM order_items WHERE order_id = ? AND product_id = ?", [orderId, product.id]);
    if (!ordered) throw new ApiError(404, "Produk tidak ditemukan dalam pesanan ini.");
    const files = Object.values(body).flatMap((value) => Array.isArray(value) ? value : [value]).filter((value): value is File => value instanceof File && value.size > 0);
    const photos: string[] = [];
    for (const file of files.slice(0, 5)) photos.push(await saveImage(file, "reviews", 4));
    const result = await execute(
      `INSERT INTO product_reviews (product_id, user_id, order_id, rating, comment, photo, is_read, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [product.id, userId, orderId, rating, cleanNullable(body.comment), photos.length ? JSON.stringify(photos) : null, nowSql(), nowSql()],
    );
    const aggregate = await row<AnyRow>("SELECT AVG(rating) AS rating, COUNT(*) AS total FROM product_reviews WHERE product_id = ?", [product.id]);
    await execute("UPDATE products SET rating = ?, reviews_count = ?, updated_at = ? WHERE id = ?", [aggregate?.rating || 0, aggregate?.total || 0, nowSql(), product.id]);
    return { status: 201, data: { message: "Ulasan berhasil dikirim.", review: await row<AnyRow>("SELECT * FROM product_reviews WHERE id = ?", [result.insertId]) } };
  }

  const replyMatch = path.match(/^reviews\/(\d+)\/reply$/);
  if (ctx.method === "POST" && replyMatch) {
    assert(["admin", "superadmin"].includes(String(ctx.user.role)), "Hanya admin yang dapat membalas ulasan.", 403);
    const reply = text(body, "reply") || text(body, "message");
    assert(reply, "Balasan wajib diisi.");
    const result = await execute("INSERT INTO product_review_replies (product_review_id, user_id, reply, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", [Number(replyMatch[1]), userId, reply, nowSql(), nowSql()]);
    return { status: 201, data: { message: "Balasan berhasil dikirim.", reply: await row<AnyRow>("SELECT * FROM product_review_replies WHERE id = ?", [result.insertId]) } };
  }

  const repliesMatch = path.match(/^reviews\/(\d+)\/replies$/);
  if (ctx.method === "GET" && repliesMatch) {
    return { data: await rows<AnyRow>(`SELECT rr.*, u.name AS user_name, u.role AS user_role FROM product_review_replies rr JOIN users u ON u.id = rr.user_id WHERE rr.product_review_id = ? ORDER BY rr.created_at`, [Number(repliesMatch[1])]) };
  }

  if (ctx.method === "GET" && path === "my-reviews") {
    const page = Math.max(1, asNumber(ctx.url.searchParams.get("page"), 1));
    const perPage = Math.min(50, Math.max(1, asNumber(ctx.url.searchParams.get("per_page"), 10)));
    const count = await row<AnyRow>("SELECT COUNT(*) AS total FROM product_reviews WHERE user_id = ?", [userId]);
    const reviews = await rows<AnyRow>(
      `SELECT r.*, p.name AS product_name, p.slug AS product_slug, p.main_photo
         FROM product_reviews r JOIN products p ON p.id = r.product_id
        WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [userId, perPage, (page - 1) * perPage],
    );
    return { data: pagination(ctx.request.url, reviews.map((review) => ({ ...review, product: serializeProduct({ id: review.product_id, name: review.product_name, slug: review.product_slug, main_photo: review.main_photo }) })), asNumber(count?.total), page, perPage) };
  }

  if (ctx.method === "GET" && path === "chats") {
    const chats = await rows<AnyRow>(
      `SELECT c.*, p.main_photo, p.slug,
        (SELECT message FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1) AS last_message,
        (SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id AND sender_type = 'admin' AND is_read = 0) AS unread_count
       FROM chats c LEFT JOIN products p ON p.id = c.product_id
       WHERE c.customer_id = ? ORDER BY c.last_message_at DESC, c.id DESC`,
      [userId],
    );
    return { data: { chats: chats.map((chat) => ({ ...chat, product_photo_url: publicUrl(chat.main_photo) })) } };
  }

  if (ctx.method === "POST" && path === "chats") {
    const subject = text(body, "subject") || "Pertanyaan Produk";
    const message = text(body, "message");
    assert(message, "Pesan wajib diisi.");
    const productId = asNumber(body.product_id) || null;
    let productName = text(body, "product_name") || null;
    if (productId) {
      const product = await row<AnyRow>("SELECT name FROM products WHERE id = ?", [productId]);
      productName = String(product?.name || productName || "");
    }
    const chatId = await transaction(async (tx) => {
      const created = await tx.execute(
        "INSERT INTO chats (customer_id, product_id, product_name, subject, status, last_message_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'open', ?, ?, ?)",
        [userId, productId, productName, subject, nowSql(), nowSql(), nowSql()],
      );
      await tx.execute(
        "INSERT INTO chat_messages (chat_id, sender_type, sender_id, message, is_read, created_at, updated_at) VALUES (?, 'customer', ?, ?, 0, ?, ?)",
        [created.insertId, userId, message, nowSql(), nowSql()],
      );
      return created.insertId;
    });
    return { status: 201, data: { message: "Chat berhasil dibuat.", chat: await row<AnyRow>("SELECT * FROM chats WHERE id = ?", [chatId]) } };
  }

  const chatMessagesMatch = path.match(/^chats\/(\d+)\/messages$/);
  if (chatMessagesMatch) {
    const chatId = Number(chatMessagesMatch[1]);
    const chat = await row<AnyRow>("SELECT * FROM chats WHERE id = ? AND customer_id = ?", [chatId, userId]);
    if (!chat) throw new ApiError(403, "Unauthorized");
    if (ctx.method === "GET") {
      await execute("UPDATE chat_messages SET is_read = 1, updated_at = ? WHERE chat_id = ? AND sender_type = 'admin'", [nowSql(), chatId]);
      const messages = await rows<AnyRow>(`SELECT m.*, u.name AS sender_name, u.photo AS sender_photo FROM chat_messages m LEFT JOIN users u ON u.id = m.sender_id WHERE m.chat_id = ? ORDER BY m.created_at, m.id`, [chatId]);
      return { data: { chat, messages: messages.map((message) => ({ ...message, sender: message.sender_id ? { id: message.sender_id, name: message.sender_name, photo_url: publicUrl(message.sender_photo) } : null })) } };
    }
    if (ctx.method === "POST") {
      assert(chat.status === "open", "Chat sudah ditutup.");
      const message = text(body, "message");
      assert(message && message.length <= 10_000_000, "Pesan wajib diisi.");
      const result = await transaction(async (tx) => {
        const created = await tx.execute("INSERT INTO chat_messages (chat_id, sender_type, sender_id, message, is_read, created_at, updated_at) VALUES (?, 'customer', ?, ?, 0, ?, ?)", [chatId, userId, message, nowSql(), nowSql()]);
        await tx.execute("UPDATE chats SET last_message_at = ?, updated_at = ? WHERE id = ?", [nowSql(), nowSql(), chatId]);
        return created;
      });
      return { status: 201, data: { message: await row<AnyRow>("SELECT * FROM chat_messages WHERE id = ?", [result.insertId]) } };
    }
  }

  if (ctx.method === "GET" && path === "notifications") {
    const page = Math.max(1, asNumber(ctx.url.searchParams.get("page"), 1));
    const perPage = Math.min(50, Math.max(1, asNumber(ctx.url.searchParams.get("per_page"), 20)));
    const count = await row<AnyRow>("SELECT COUNT(*) AS total FROM user_notifications WHERE user_id = ?", [userId]);
    const notifications = await rows<AnyRow>(
      `SELECT n.id, n.read_at, n.created_at, a.id AS announcement_id, a.title, a.content, a.type, a.action_url
         FROM user_notifications n JOIN announcements a ON a.id = n.announcement_id
        WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
      [userId, perPage, (page - 1) * perPage],
    );
    const unread = await row<AnyRow>("SELECT COUNT(*) AS total FROM user_notifications WHERE user_id = ? AND read_at IS NULL", [userId]);
    return { data: { ...pagination(ctx.request.url, notifications, asNumber(count?.total), page, perPage), unread_count: asNumber(unread?.total) } };
  }

  const notificationMatch = path.match(/^notifications\/(\d+)\/read$/);
  if (ctx.method === "POST" && notificationMatch) {
    await execute("UPDATE user_notifications SET read_at = ?, updated_at = ? WHERE id = ? AND user_id = ?", [nowSql(), nowSql(), Number(notificationMatch[1]), userId]);
    return { data: { message: "Notifikasi ditandai sudah dibaca." } };
  }

  if (ctx.method === "POST" && path === "notifications/read-all") {
    await execute("UPDATE user_notifications SET read_at = ?, updated_at = ? WHERE user_id = ? AND read_at IS NULL", [nowSql(), nowSql(), userId]);
    return { data: { message: "Semua notifikasi ditandai sudah dibaca." } };
  }

  if (ctx.method === "POST" && path === "users/fcm-token") {
    assert(text(body, "fcm_token"), "FCM token wajib diisi.");
    await execute("UPDATE users SET fcm_token = ?, updated_at = ? WHERE id = ?", [text(body, "fcm_token"), nowSql(), userId]);
    return { data: { message: "FCM token berhasil diperbarui." } };
  }

  return null;
}
