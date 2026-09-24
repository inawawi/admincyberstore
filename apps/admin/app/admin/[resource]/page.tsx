import { notFound } from "next/navigation";
import { ResourceClient } from "@/components/resource-client";
import { getChatDetail, getOrderDetail, getReviewDetail, getResourceMeta, listResource, resourceOrder } from "@/lib/admin-resources";
import { currentAdmin, publicUser } from "@/lib/auth";
import { encryptOrderId, decryptOrderId } from "@/lib/id-cipher";

export const dynamic = "force-dynamic";

export default async function ResourcePage({ params, searchParams }: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{
    search?: string;
    status?: string;
    product_id?: string;
    type?: string;
    cancel_status?: string;
    order_id?: string;
    chat_id?: string;
    review_id?: string;
    page?: string;
  }>;
}) {
  const { resource } = await params;
  if (!resourceOrder.includes(resource)) notFound();
  const query = await searchParams;
  const [meta, result, initialOrderDetail, initialChatDetail, initialReviewDetail, currentUser] = await Promise.all([
    getResourceMeta(resource),
    listResource(resource, {
      search: query.search,
      status: query.status,
      productId: query.product_id,
      type: query.type,
      cancelStatus: query.cancel_status,
      page: Number(query.page || 1),
      perPage: 15,
    }),
    resource === "orders" && query.order_id
      ? getOrderDetail(query.order_id)
      : Promise.resolve(null),
    resource === "chats" && query.chat_id
      ? getChatDetail(Number(query.chat_id))
      : Promise.resolve(null),
    resource === "reviews" && query.review_id
      ? getReviewDetail(Number(query.review_id))
      : Promise.resolve(null),
    currentAdmin(),
  ]);

  const canonicalOrderId = initialOrderDetail?.order?.encrypted_id
    ? String(initialOrderDetail.order.encrypted_id)
    : query.order_id
      ? (decryptOrderId(query.order_id) ? encryptOrderId(decryptOrderId(query.order_id)!) : query.order_id)
      : "";

  return (
    <ResourceClient
      meta={meta}
      result={result}
      search={query.search || ""}
      status={query.status || ""}
      productId={query.product_id || ""}
      typeFilter={query.type || ""}
      cancelStatus={query.cancel_status || ""}
      orderId={canonicalOrderId}
      initialOrderDetail={initialOrderDetail}
      chatId={query.chat_id || ""}
      initialChatDetail={initialChatDetail}
      reviewId={query.review_id || ""}
      initialReviewDetail={initialReviewDetail}
      currentUser={currentUser ? (publicUser(currentUser) as any) : null}
    />
  );
}
