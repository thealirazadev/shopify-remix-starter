import { BILLING_ENABLED, DEMO_BILLING_PLAN, authenticate } from "~/shopify.server";

type AdminContext = Awaited<ReturnType<typeof authenticate.admin>>;
type Billing = AdminContext["billing"];

// Config-toggleable billing gate. When BILLING_ENABLED is false (the
// default) every route passes through with no charge, so the starter
// installs without forcing a subscription. Flip the env var and this
// redirects shops without an active subscription to the managed
// confirmation URL.
export async function requireActiveSubscription(billing: Billing): Promise<void> {
  if (!BILLING_ENABLED) {
    return;
  }

  await billing.require({
    plans: [DEMO_BILLING_PLAN],
    isTest: true,
    onFailure: async () => billing.request({ plan: DEMO_BILLING_PLAN, isTest: true }),
  });
}
