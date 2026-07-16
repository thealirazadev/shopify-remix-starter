// Pure mapping from webhook topic to the action it triggers. Kept separate
// from the route so the dispatch table is unit-testable without mocking
// Prisma or the Shopify webhook authenticator.
export type WebhookAction =
  | "delete-sessions"
  | "update-scope"
  | "acknowledge-data-request"
  | "acknowledge-customer-redact"
  | "delete-shop-data"
  | "unhandled";

const TOPIC_ACTIONS: Record<string, WebhookAction> = {
  APP_UNINSTALLED: "delete-sessions",
  APP_SCOPES_UPDATE: "update-scope",
  CUSTOMERS_DATA_REQUEST: "acknowledge-data-request",
  CUSTOMERS_REDACT: "acknowledge-customer-redact",
  SHOP_REDACT: "delete-shop-data",
};

export function actionForTopic(topic: string): WebhookAction {
  return TOPIC_ACTIONS[topic] ?? "unhandled";
}
