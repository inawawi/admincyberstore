import type { ResourceMeta } from "@/types";

export interface ResourceClientProps {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>>; total: number; page: number; perPage: number; pages: number };
  search: string;
  status?: string;
  productId?: string;
  typeFilter?: string;
  cancelStatus?: string;
  orderId?: string;
  initialOrderDetail?: {
    order: Record<string, unknown>;
    items: Array<Record<string, unknown>>;
    payment: Record<string, unknown> | null;
  } | null;
  chatId?: string;
  initialChatDetail?: {
    chat: Record<string, unknown>;
    messages: Array<Record<string, unknown>>;
    customerOrders: Array<Record<string, unknown>>;
  } | null;
  reviewId?: string;
  initialReviewDetail?: {
    review: Record<string, unknown>;
    otherReviews: Array<Record<string, unknown>>;
    customerOrders: Array<Record<string, unknown>>;
  } | null;
  currentUser?: { id: number; role: string; name?: string; email?: string } | null;
}

export type Props = ResourceClientProps;

export type ColorOption = { value: string; label?: string; hex?: string; name?: string };

export type ParsedStockColor = { name: string; hex: string; stock?: number };
