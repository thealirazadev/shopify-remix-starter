// Pure mapping from webhook topic to the action it triggers. Kept separate
// from the route so the dispatch table is unit-testable without mocking
// Prisma or the Shopify webhook authenticator. Topics are added here as they
// are wired up in app/routes/webhooks.tsx.
export type WebhookAction = "delete-sessions" | "unhandled";

const TOPIC_ACTIONS: Record<string, WebhookAction> = {
  APP_UNINSTALLED: "delete-sessions",
};

export function actionForTopic(topic: string): WebhookAction {
  return TOPIC_ACTIONS[topic] ?? "unhandled";
}
