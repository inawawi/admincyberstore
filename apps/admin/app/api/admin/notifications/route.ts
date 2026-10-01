import { currentAdmin } from "@/lib/auth";
import { row, rows, execute } from "@/lib/db";
import { encryptOrderId } from "@/lib/id-cipher";
import { clearAdminSearchCache } from "@/lib/cache";
import type { RowDataPacket } from "mysql2/promise";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CountRow extends RowDataPacket {
  total: number;
}

interface ChatNotifRow extends RowDataPacket {
  chat_id: number;
  customer_id: number | null;
  customer_name: string | null;
  customer_photo: string | null;
  message_id: number;
  message: string;
  created_at: string;
  is_read: number;
}

interface ReviewNotifRow extends RowDataPacket {
  id: number;
  rating: number;
  comment: string | null;
  reply: string | null;
  is_read: number;
  created_at: string;
  product_name: string | null;
  product_slug: string | null;
  product_photo: string | null;
  user_name: string | null;
  user_photo: string | null;
}

interface OrderNotifRow extends RowDataPacket {
  id: number;
  invoice_number: string;
  grand_total: number;
  status: string;
  cancel_request_status: string | null;
  cancel_request_reason: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  customer_photo: string | null;
}

export async function GET() {
  const admin = await currentAdmin();
  if (!admin) {
    return Response.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    const [unreadChatsRow, unreadReviewsRow, pendingOrdersRow, pendingCancelRequestsRow] = await Promise.all([
      row<CountRow>("SELECT COUNT(*) AS total FROM chat_messages WHERE sender_type = 'customer' AND is_read = 0"),
      row<CountRow>("SELECT COUNT(*) AS total FROM product_reviews WHERE is_read = 0"),
      row<CountRow>("SELECT COUNT(*) AS total FROM orders WHERE status IN ('pending_payment', 'paid')"),
      row<CountRow>("SELECT COUNT(*) AS total FROM orders WHERE cancel_request_status = 'pending'"),
    ]);

    const [recentChats, recentReviews, recentOrders] = await Promise.all([
      rows<ChatNotifRow>(
        `SELECT c.id AS chat_id, c.customer_id, u.name AS customer_name, u.photo AS customer_photo,
                m.id AS message_id, m.message, m.created_at, m.is_read
         FROM chat_messages m
         JOIN chats c ON c.id = m.chat_id
         LEFT JOIN users u ON u.id = c.customer_id
         WHERE m.sender_type = 'customer'
         ORDER BY m.created_at DESC, m.id DESC
         LIMIT 6`
      ),
      rows<ReviewNotifRow>(
        `SELECT pr.id, pr.rating, pr.comment, pr.reply, pr.is_read, pr.created_at,
                p.name AS product_name, p.slug AS product_slug, p.main_photo AS product_photo,
                u.name AS user_name, u.photo AS user_photo
         FROM product_reviews pr
         JOIN products p ON p.id = pr.product_id
         LEFT JOIN users u ON u.id = pr.user_id
         ORDER BY pr.created_at DESC, pr.id DESC
         LIMIT 6`
      ),
      rows<OrderNotifRow>(
        `SELECT o.id, o.invoice_number, o.grand_total, o.status, o.cancel_request_status, o.cancel_request_reason, o.created_at, o.updated_at,
                u.name AS customer_name, u.photo AS customer_photo
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
         WHERE o.status IN ('pending_payment', 'paid') OR o.cancel_request_status IN ('pending', 'refund_processing')
         ORDER BY (o.cancel_request_status = 'pending') DESC, (o.cancel_request_status = 'refund_processing') DESC, o.updated_at DESC
         LIMIT 8`
      ),
    ]);

    const unreadChats = Number(unreadChatsRow?.total || 0);
    const unreadReviews = Number(unreadReviewsRow?.total || 0);
    const pendingOrders = Number(pendingOrdersRow?.total || 0);
    const pendingCancelRequests = Number(pendingCancelRequestsRow?.total || 0);
    const totalUnread = unreadChats + unreadReviews + pendingCancelRequests;

    const formattedOrders = recentOrders.map((o) => ({
      ...o,
      encrypted_id: encryptOrderId(o.id),
    }));

    return Response.json({
      unreadChats,
      unreadReviews,
      pendingOrders,
      pendingCancelRequests,
      totalUnread,
      recentChats,
      recentReviews,
      recentOrders: formattedOrders,
    });
  } catch (error: any) {
    return Response.json(
      { message: error?.message || "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await currentAdmin();
  if (!admin) {
    return Response.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const type = body?.type;

    if (type === "chats") {
      await execute("UPDATE chat_messages SET is_read = 1 WHERE sender_type = 'customer' AND is_read = 0");
      clearAdminSearchCache("chats");
    } else if (type === "reviews") {
      await execute("UPDATE product_reviews SET is_read = 1 WHERE is_read = 0");
      clearAdminSearchCache("reviews");
    } else {
      // Mark all as read
      await execute("UPDATE chat_messages SET is_read = 1 WHERE sender_type = 'customer' AND is_read = 0");
      await execute("UPDATE product_reviews SET is_read = 1 WHERE is_read = 0");
      clearAdminSearchCache("chats");
      clearAdminSearchCache("reviews");
    }

    return Response.json({ success: true, message: "Notifikasi berhasil ditandai telah dibaca." });
  } catch (error: any) {
    return Response.json(
      { message: error?.message || "Gagal memperbarui notifikasi." },
      { status: 500 }
    );
  }
}
