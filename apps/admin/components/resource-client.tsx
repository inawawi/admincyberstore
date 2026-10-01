"use client";

import React from "react";
import { ResourceClientProps } from "./resources/common/types";
import { StockMovementsView } from "./resources/stock-movements/stock-movements-view";
import { OrdersView } from "./resources/orders/orders-view";
import { SupportChatView } from "./resources/chats/support-chat-view";
import { ProductReviewsView } from "./resources/reviews/product-reviews-view";
import { AnnouncementsView } from "./resources/announcements/announcements-view";
import { SettingsView } from "./resources/settings/settings-view";
import { GenericResourceView } from "./resources/generic/generic-resource-view";

// Re-export common types for consumers
export type { ResourceClientProps, ResourceClientProps as Props } from "./resources/common/types";

export function ResourceClient(props: ResourceClientProps) {
  const { meta } = props;

  if (meta.key === "stock-movements") {
    return (
      <StockMovementsView
        meta={meta}
        result={props.result}
        search={props.search}
        productId={props.productId}
        typeFilter={props.typeFilter}
      />
    );
  }

  if (meta.key === "orders") {
    return (
      <OrdersView
        meta={meta}
        result={props.result}
        search={props.search}
        status={props.status}
        cancelStatus={props.cancelStatus}
        orderId={props.orderId}
        initialOrderDetail={props.initialOrderDetail}
      />
    );
  }

  if (meta.key === "chats") {
    return (
      <SupportChatView
        meta={meta}
        result={props.result}
        search={props.search}
        chatId={props.chatId}
        initialChatDetail={props.initialChatDetail}
      />
    );
  }

  if (meta.key === "reviews") {
    return (
      <ProductReviewsView
        meta={meta}
        result={props.result}
        search={props.search}
        status={props.status}
        reviewId={props.reviewId}
        initialReviewDetail={props.initialReviewDetail}
      />
    );
  }

  if (meta.key === "announcements") {
    return (
      <AnnouncementsView
        meta={meta}
        result={props.result}
        search={props.search}
        status={props.status}
      />
    );
  }

  if (meta.key === "settings") {
    return (
      <SettingsView
        meta={meta}
        result={props.result}
      />
    );
  }

  return (
    <GenericResourceView
      meta={meta}
      result={props.result}
      search={props.search}
      status={props.status}
      productId={props.productId}
      typeFilter={props.typeFilter}
      currentUser={props.currentUser}
    />
  );
}

export default ResourceClient;
