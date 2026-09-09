import type { RowDataPacket } from "mysql2";
import { rows } from "@/lib/db";
import { publicUrl, safeJson } from "@/lib/utils";

export function serializeUser<T extends Record<string, unknown>>(value: T) {
  const user: Record<string, unknown> = { ...value };
  delete user.password;
  delete user.remember_token;
  delete user.otp_code;
  delete user.otp_expires_at;
  for (const key of [
    "is_active",
    "push_notifications_enabled",
    "email_notifications_enabled",
    "biometric_login_enabled",
  ]) {
    if (key in user) user[key] = Boolean(user[key]);
  }
  if (user.photo) user.photo_url = publicUrl(user.photo);
  return safeJson(user);
}

export function serializeProduct<T extends Record<string, unknown>>(value: T) {
  const product: Record<string, unknown> = { ...value };
  for (const key of ["sizes", "colors", "size_guide"]) {
    if (typeof product[key] === "string") {
      try {
        product[key] = JSON.parse(product[key] as string);
      } catch {
        product[key] = null;
      }
    }
  }
  for (const key of ["is_active", "is_recommended", "is_event_maba"]) {
    if (key in product) product[key] = Boolean(product[key]);
  }
  if (product.main_photo) product.main_photo_url = publicUrl(product.main_photo);
  if (product.size_chart) product.size_chart_url = publicUrl(product.size_chart);
  if (Array.isArray(product.images)) {
    product.images = product.images.map((image) => {
      const output = { ...(image as Record<string, unknown>) };
      output.image_url = publicUrl(output.image);
      return output;
    });
  }
  return safeJson(product);
}

export async function hydrateProducts<T extends RowDataPacket>(products: T[]) {
  if (!products.length) return [];
  const ids = products.map((product) => Number(product.id));
  const placeholders = ids.map(() => "?").join(",");
  const images = await rows<RowDataPacket & Record<string, unknown>>(
    `SELECT * FROM product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order, id`,
    ids,
  );
  const categories = await rows<RowDataPacket & Record<string, unknown>>(
    `SELECT c.* FROM categories c WHERE c.id IN (${placeholders})`,
    products.map((product) => Number(product.category_id)),
  );
  return products.map((product) => serializeProduct({
    ...product,
    category: categories.find((category) => Number(category.id) === Number(product.category_id)) || null,
    images: images.filter((image) => Number(image.product_id) === Number(product.id)),
  }));
}

export async function hydrateCart(userId: number) {
  const carts = await rows<RowDataPacket & Record<string, unknown>>(
    "SELECT * FROM carts WHERE user_id = ? LIMIT 1",
    [userId],
  );
  const cart = carts[0];
  if (!cart) return null;
  const items = await rows<RowDataPacket & Record<string, unknown>>(
    `SELECT ci.*, p.name AS product_name, p.slug AS product_slug, p.price,
            p.stock, p.main_photo, p.is_active AS product_is_active,
            c.id AS category_id, c.name AS category_name, c.slug AS category_slug
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN categories c ON c.id = p.category_id
      WHERE ci.cart_id = ? ORDER BY ci.created_at DESC`,
    [cart.id],
  );
  return {
    ...cart,
    items: items.map((item) => ({
      id: item.id,
      cart_id: item.cart_id,
      product_id: item.product_id,
      size: item.size,
      color: item.color,
      nim: item.nim,
      quantity: item.quantity,
      created_at: item.created_at,
      updated_at: item.updated_at,
      product: serializeProduct({
        id: item.product_id,
        name: item.product_name,
        slug: item.product_slug,
        price: item.price,
        stock: item.stock,
        main_photo: item.main_photo,
        is_active: item.product_is_active,
        category: item.category_id ? {
          id: item.category_id,
          name: item.category_name,
          slug: item.category_slug,
        } : null,
      }),
    })),
  };
}

export async function hydrateOrder(orderId: number) {
  const orders = await rows<RowDataPacket & Record<string, unknown>>(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email,
            a.label AS address_label, a.receiver_name, a.phone AS address_phone,
            a.address, a.notes AS address_notes, a.province, a.city, a.district,
            a.village, a.postal_code, a.latitude, a.longitude,
            e.name AS expedition_name, e.code AS expedition_code,
            e.service AS expedition_service, e.estimated_days
       FROM orders o
       JOIN users u ON u.id = o.user_id
       JOIN customer_addresses a ON a.id = o.customer_address_id
       JOIN expeditions e ON e.id = o.expedition_id
      WHERE o.id = ? LIMIT 1`,
    [orderId],
  );
  const order = orders[0];
  if (!order) return null;
  const [items, payments, trackings] = await Promise.all([
    rows<RowDataPacket & Record<string, unknown>>(
      `SELECT oi.*, p.slug, p.main_photo, p.stock
         FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ? ORDER BY oi.id`,
      [orderId],
    ),
    rows<RowDataPacket & Record<string, unknown>>(
      "SELECT * FROM payments WHERE order_id = ? LIMIT 1",
      [orderId],
    ),
    rows<RowDataPacket & Record<string, unknown>>(
      "SELECT * FROM order_trackings WHERE order_id = ? ORDER BY created_at DESC, id DESC",
      [orderId],
    ),
  ]);
  return safeJson({
    id: order.id,
    invoice_number: order.invoice_number,
    user_id: order.user_id,
    customer_address_id: order.customer_address_id,
    expedition_id: order.expedition_id,
    subtotal: order.subtotal,
    shipping_cost: order.shipping_cost,
    grand_total: order.grand_total,
    status: order.status,
    cancel_request_status: order.cancel_request_status,
    cancel_request_reason: order.cancel_request_reason,
    resi_number: order.resi_number,
    note: order.note,
    created_at: order.created_at,
    updated_at: order.updated_at,
    user: { id: order.user_id, name: order.customer_name, email: order.customer_email },
    address: {
      id: order.customer_address_id,
      label: order.address_label,
      receiver_name: order.receiver_name,
      phone: order.address_phone,
      address: order.address,
      notes: order.address_notes,
      province: order.province,
      city: order.city,
      district: order.district,
      village: order.village,
      postal_code: order.postal_code,
      latitude: order.latitude,
      longitude: order.longitude,
    },
    expedition: {
      id: order.expedition_id,
      name: order.expedition_name,
      code: order.expedition_code,
      service: order.expedition_service,
      estimated_days: order.estimated_days,
    },
    items: items.map((item) => ({
      ...item,
      is_reviewed: false,
      product: item.product_id ? serializeProduct({
        id: item.product_id,
        name: item.product_name,
        slug: item.slug,
        main_photo: item.main_photo,
        stock: item.stock,
      }) : null,
    })),
    payment: payments[0] || null,
    trackings: trackings.map((tracking) => ({
      ...tracking,
      proof_photo_url: publicUrl(tracking.proof_photo),
    })),
  });
}
