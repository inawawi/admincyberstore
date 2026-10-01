import type { RowDataPacket } from "mysql2";
import { row, rows } from "@/lib/db";
import { ApiError, pagination } from "@/lib/http";
import { hydrateProducts } from "@/lib/api/serializers";
import { asNumber, publicUrl } from "@/lib/utils";
import { findCityId, shippingCost } from "@/lib/shipping";
import type { ApiContext, HandledResult } from "@/lib/api/types";
import { catalogCache } from "@/lib/cache";

async function settingsMap() {
  const values = await rows<RowDataPacket & { key: string; value: string | null }>("SELECT `key`, value FROM settings");
  return Object.fromEntries(values.map((entry) => [entry.key, entry.value]));
}

const SYNONYMS_MAP: Record<string, string[]> = {
  baju: ["baju", "kaos", "pakaian", "t-shirt", "tshirt", "polo", "jersey", "kemeja", "almamater"],
  kaos: ["kaos", "baju", "t-shirt", "tshirt", "polo", "jersey", "pakaian"],
  pakaian: ["pakaian", "baju", "kaos", "polo"],
  jaket: ["jaket", "jacket", "varsity", "hoodie", "bomber", "outerwear", "sweater", "almamater"],
  hoodie: ["hoodie", "jaket", "jacket", "varsity", "sweater"],
  varsity: ["varsity", "jaket", "jacket"],
  botol: ["botol", "tumbler", "minum", "thermos", "mug", "gelas"],
  tumbler: ["tumbler", "botol", "minum", "thermos", "mug"],
  minum: ["minum", "botol", "tumbler", "mug", "gelas"],
  topi: ["topi", "hat", "cap", "snapback", "baseball", "bucket"],
  snapback: ["snapback", "topi"],
  bantal: ["bantal", "cushion", "sofa"],
  tas: ["tas", "pouch", "tote", "totebag", "handbag", "ransel", "backpack"],
  pouch: ["pouch", "handbag", "totebag"],
  totebag: ["totebag", "tote", "tas"],
  maba: ["maba", "ormik", "semot", "pmb", "mahasiswa baru"],
  ormik: ["ormik", "semot", "maba", "pmb"],
  semot: ["semot", "ormik", "maba", "pmb"],
};

const BRAND_TERMS = new Set(["ubsi", "bsi", "cyber", "store", "cyberstore"]);

export async function handleCatalog(ctx: ApiContext): Promise<HandledResult | null> {
  const path = ctx.segments.join("/");

  if (ctx.method === "GET" && path === "categories") {
    const cacheKey = "categories";
    const cached = catalogCache.get<unknown>(cacheKey);
    if (cached) return { data: cached };

    const categories = await rows<RowDataPacket & Record<string, unknown>>(
      "SELECT * FROM categories WHERE is_active = 1 ORDER BY name",
    );
    const result = { categories: categories.map((category) => ({ ...category, is_active: Boolean(category.is_active) })) };
    catalogCache.set(cacheKey, result, 5 * 60 * 1000); // Cache kategori 5 menit
    return { data: result };
  }

  if (ctx.method === "GET" && path === "products") {
    const cacheKey = `products:${ctx.url.search || "all"}`;
    const cached = catalogCache.get<unknown>(cacheKey);
    if (cached) {
      return { data: cached };
    }

    const page = Math.max(1, asNumber(ctx.url.searchParams.get("page"), 1));
    const perPage = Math.min(100, Math.max(1, asNumber(ctx.url.searchParams.get("per_page"), 12)));
    const where = ["p.is_active = 1"];
    const params: unknown[] = [];
    const category = ctx.url.searchParams.get("category_id");
    const search = ctx.url.searchParams.get("search");

    if (category) {
      where.push("p.category_id = ?");
      params.push(category);
    }

    if (search && search.trim()) {
      const rawTokens = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const nonBrandTokens = rawTokens.filter((t) => !BRAND_TERMS.has(t));
      const tokens = nonBrandTokens.length > 0 ? nonBrandTokens : rawTokens;

      for (const token of tokens) {
        const synonyms = Array.from(new Set([token, ...(SYNONYMS_MAP[token] || [])]));
        const tokenClauses: string[] = [];
        for (const syn of synonyms) {
          tokenClauses.push("(p.name LIKE ? OR c.name LIKE ? OR p.description LIKE ?)");
          params.push(`%${syn}%`, `%${syn}%`, `%${syn}%`);
        }
        where.push(`(${tokenClauses.join(" OR ")})`);
      }
    }

    for (const key of ["is_recommended", "is_event_maba"]) {
      if (ctx.url.searchParams.has(key)) {
        where.push(`p.${key} = ?`);
        params.push(["1", "true"].includes(ctx.url.searchParams.get(key) || "") ? 1 : 0);
      }
    }

    const count = await row<RowDataPacket & { total: number }>(
      `SELECT COUNT(DISTINCT p.id) AS total FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where.join(" AND ")}`,
      params,
    );

    const products = await rows<RowDataPacket & Record<string, unknown>>(
      `SELECT p.* FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where.join(" AND ")} ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`,
      [...params, perPage, (page - 1) * perPage],
    );

    const result = pagination(ctx.request.url, await hydrateProducts(products), count?.total || 0, page, perPage);
    catalogCache.set(cacheKey, result); // Cache hasil list/search 3 menit
    return { data: result };
  }

  const productMatch = path.match(/^products\/([^/]+)$/);
  if (ctx.method === "GET" && productMatch) {
    const key = decodeURIComponent(productMatch[1]);
    const cacheKey = `product:${key}`;
    const cached = catalogCache.get<unknown>(cacheKey);
    if (cached) return { data: cached };

    const product = await row<RowDataPacket & Record<string, unknown>>(
      /^\d+$/.test(key)
        ? "SELECT * FROM products WHERE id = ? AND is_active = 1 LIMIT 1"
        : "SELECT * FROM products WHERE slug = ? AND is_active = 1 LIMIT 1",
      [key],
    );
    if (!product) throw new ApiError(404, "Produk tidak ditemukan.");
    const hydrated = await hydrateProducts([product]);
    const result = { product: hydrated[0] };
    catalogCache.set(cacheKey, result);
    return { data: result };
  }

  const reviewsMatch = path.match(/^products\/([^/]+)\/reviews$/);
  if (ctx.method === "GET" && reviewsMatch) {
    const key = decodeURIComponent(reviewsMatch[1]);
    const product = await row<RowDataPacket & { id: number }>(
      /^\d+$/.test(key) ? "SELECT id FROM products WHERE id = ?" : "SELECT id FROM products WHERE slug = ?",
      [key],
    );
    if (!product) throw new ApiError(404, "Produk tidak ditemukan.");
    const reviews = await rows<RowDataPacket & Record<string, unknown>>(
      `SELECT r.*, u.name AS user_name, u.photo AS user_photo
         FROM product_reviews r JOIN users u ON u.id = r.user_id
        WHERE r.product_id = ? ORDER BY r.created_at DESC`,
      [product.id],
    );
    const replies = reviews.length ? await rows<RowDataPacket & Record<string, unknown>>(
      `SELECT rr.*, u.name AS user_name, u.role AS user_role
         FROM product_review_replies rr JOIN users u ON u.id = rr.user_id
        WHERE rr.product_review_id IN (${reviews.map(() => "?").join(",")}) ORDER BY rr.created_at`,
      reviews.map((review) => review.id),
    ) : [];
    return { data: reviews.map((review) => ({
      ...review,
      photos: review.photo ? (() => { try { const parsed = JSON.parse(String(review.photo)); return Array.isArray(parsed) ? parsed : [review.photo]; } catch { return [review.photo]; } })() : [],
      user: { id: review.user_id, name: review.user_name, photo: review.user_photo, photo_url: publicUrl(review.user_photo) },
      replies: replies.filter((reply) => Number(reply.product_review_id) === Number(review.id)),
    })) };
  }

  const reviewEligibilityMatch = path.match(/^products\/([^/]+)\/review-eligibility$/);
  if (ctx.method === "GET" && reviewEligibilityMatch) {
    const key = decodeURIComponent(reviewEligibilityMatch[1]);
    const product = await row<RowDataPacket & { id: number }>(
      /^\d+$/.test(key) ? "SELECT id FROM products WHERE id = ?" : "SELECT id FROM products WHERE slug = ?",
      [key],
    );
    if (!product) throw new ApiError(404, "Produk tidak ditemukan.");

    const userId = Number(ctx.user?.id);
    if (!userId) {
      return {
        data: {
          can_review: false,
          has_purchased: false,
          reason: "unauthenticated",
          message: "Silakan masuk ke akun untuk memberikan ulasan.",
        },
      };
    }

    // Check if user already reviewed this product
    const existingReview = await row<RowDataPacket & { id: number }>(
      "SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ? LIMIT 1",
      [product.id, userId],
    );
    if (existingReview) {
      return {
        data: {
          can_review: false,
          has_purchased: true,
          has_reviewed: true,
          reason: "already_reviewed",
          message: "Anda sudah memberikan ulasan untuk produk ini.",
        },
      };
    }

    // Check orders containing this product
    const userOrders = await rows<RowDataPacket & { order_id: number; status: string }>(
      `SELECT o.id AS order_id, o.status
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = ? AND oi.product_id = ?
        ORDER BY o.id DESC`,
      [userId, product.id],
    );

    if (!userOrders.length) {
      return {
        data: {
          can_review: false,
          has_purchased: false,
          has_reviewed: false,
          reason: "not_purchased",
          message: "Hanya pembeli yang telah membeli produk ini yang dapat memberikan penilaian.",
        },
      };
    }

    // Check if there is any completed or arrived order
    const completedOrder = userOrders.find((o) => o.status === "completed" || o.status === "arrived");
    if (completedOrder) {
      return {
        data: {
          can_review: true,
          has_purchased: true,
          has_reviewed: false,
          order_id: completedOrder.order_id,
          order_status: completedOrder.status,
          message: "Anda dapat memberikan penilaian untuk produk ini.",
        },
      };
    }

    // Otherwise, order exists but not arrived/completed yet
    const latestOrder = userOrders[0];
    return {
      data: {
        can_review: false,
        has_purchased: true,
        has_reviewed: false,
        reason: "not_arrived",
        order_id: latestOrder.order_id,
        order_status: latestOrder.status,
        message: "Paket sedang dalam perjalanan / belum tiba di tujuan.",
      },
    };
  }

  if (ctx.method === "GET" && path === "expeditions") {
    const expeditions = await rows<RowDataPacket & Record<string, unknown>>(
      "SELECT * FROM expeditions WHERE is_active = 1 ORDER BY name",
    );
    let city: string | null = null;
    const addressId = ctx.url.searchParams.get("address_id");
    if (addressId) {
      const address = await row<RowDataPacket & { city: string }>("SELECT city FROM customer_addresses WHERE id = ?", [addressId]);
      city = address?.city || null;
    } else if (ctx.user) {
      const address = await row<RowDataPacket & { city: string }>("SELECT city FROM customer_addresses WHERE user_id = ? AND is_default = 1 LIMIT 1", [ctx.user.id]);
      city = address?.city || null;
    }
    const destination = findCityId(city);
    const settings = await settingsMap();
    const quantity = Math.max(1, asNumber(ctx.url.searchParams.get("quantity"), 1));
    const output = await Promise.all(expeditions.map(async (expedition) => {
      let cost = asNumber(expedition.base_cost) + Math.max(0, quantity - 1) * 1000;
      let etd = `${expedition.estimated_days} hari`;
      if (destination) {
        const courier = expedition.code === "sicepat" ? "jne" : String(expedition.code).replace(/_reg$/, "");
        const remote = await shippingCost({ origin: settings.store_city_id || 152, destination, weight: quantity * 1000, courier, service: expedition.code === "pos" ? "Pos Kilat Khusus" : "REG" });
        if (remote) { cost = expedition.code === "sicepat" ? Math.max(8000, remote.value - 2000) : remote.value; etd = remote.etd || etd; }
      }
      return { ...expedition, base_cost: cost, cost, etd, is_active: Boolean(expedition.is_active) };
    }));
    return { data: { expeditions: output } };
  }

  if (ctx.method === "GET" && path === "banners") {
    const banners = await rows<RowDataPacket & Record<string, unknown>>(
      "SELECT * FROM banners ORDER BY `order`, id",
    );
    return { data: { banners: banners.map((banner) => ({ ...banner, image_url: publicUrl(banner.image_path) })) } };
  }

  if (ctx.method === "GET" && ["about", "help", "store-info"].includes(path)) {
    const setting = await settingsMap();
    if (path === "about") return { data: {
      title: setting.about_title || "Tentang Cyber Store",
      content: setting.about_content || "Cyber Store adalah toko resmi merchandise kampus.",
      vision: setting.about_vision || "Menjadi pusat kebutuhan merchandise kampus yang terpercaya.",
      mission: setting.about_mission || "Memberikan produk berkualitas dan layanan terbaik.",
    } };
    if (path === "help") return { data: {
      title: "Pusat Bantuan",
      whatsapp: setting.store_whatsapp || setting.store_phone || "",
      email: setting.store_email || "support@bsi.ac.id",
      faqs: [
        { question: "Bagaimana cara memesan?", answer: "Pilih produk, masukkan ke keranjang, tentukan alamat dan ekspedisi, lalu lanjutkan pembayaran." },
        { question: "Bagaimana melacak pesanan?", answer: "Buka detail pesanan untuk melihat status dan riwayat pengiriman." },
      ],
    } };
    return { data: {
      name: setting.store_name || "UBSI Cyber Store",
      store_name: setting.store_name || "UBSI Cyber Store",
      address: setting.store_address || "Jl. Kramat Raya No.98, Jakarta Pusat",
      phone: setting.store_phone || "(021) 7867868",
      whatsapp: setting.store_whatsapp || setting.store_phone || "",
      email: setting.store_email || "support@bsi.ac.id",
      logo: publicUrl(setting.store_logo),
      store_logo: publicUrl(setting.store_logo),
      city_id: setting.store_city_id || 152,
      city_name: setting.store_city_name || "Jakarta Pusat",
      event_maba_title: setting.event_maba_title || "RESMI KEGIATAN MAHASISWA BARU 2026",
      event_maba_description: setting.event_maba_description || "",
      announcement: {
        is_active: setting.top_announcement_active !== "0",
        text: setting.top_announcement_text || "PROMO SPESIAL MAHASISWA BARU 2026! Dapatkan Diskon Hingga 50% Menggunakan Kode: <strong>MABA2026</strong>",
        bg_color: setting.top_announcement_bg || "",
        text_color: setting.top_announcement_color || "",
        badge: setting.top_announcement_badge || "BSI Cyber Store Official",
        info: setting.top_announcement_info || "Garansi Resmi 100%",
        link: setting.top_announcement_link || "",
      },
    } };
  }

  if (ctx.method === "GET" && path === "announcements") {
    const page = Math.max(1, asNumber(ctx.url.searchParams.get("page"), 1));
    const perPage = Math.min(50, Math.max(1, asNumber(ctx.url.searchParams.get("per_page"), 12)));
    const search = ctx.url.searchParams.get("search");
    const type = ctx.url.searchParams.get("type");

    // Filter out internal system order notifications
    const where: string[] = ["a.title NOT LIKE '%Pesanan Dibatalkan%' AND a.title NOT LIKE '%#INV-%'"];
    const params: unknown[] = [];

    if (search) {
      where.push("(a.title LIKE ? OR a.content LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type && type !== "all") {
      where.push("a.type = ?");
      params.push(type);
    }

    const count = await row<RowDataPacket & { total: number }>(
      `SELECT COUNT(*) AS total FROM announcements a WHERE ${where.join(" AND ")}`,
      params
    );

    const announcements = await rows<RowDataPacket & Record<string, unknown>>(
      `SELECT a.* FROM announcements a WHERE ${where.join(" AND ")} ORDER BY a.created_at DESC, a.id DESC LIMIT ? OFFSET ?`,
      [...params, perPage, (page - 1) * perPage]
    );

    return {
      data: {
        ...pagination(ctx.request.url, announcements, count?.total || 0, page, perPage),
        announcements,
      },
    };
  }

  const announcementMatch = path.match(/^announcements\/(\d+)$/);
  if (ctx.method === "GET" && announcementMatch) {
    const id = Number(announcementMatch[1]);
    const item = await row<RowDataPacket & Record<string, unknown>>(
      "SELECT * FROM announcements WHERE id = ? LIMIT 1",
      [id]
    );
    if (!item) throw new ApiError(404, "Pengumuman tidak ditemukan.");
    return { data: { announcement: item } };
  }

  return null;
}
