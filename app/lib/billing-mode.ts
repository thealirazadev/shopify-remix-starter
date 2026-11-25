// Whether billing requests are test charges. Pure so it is unit-testable
// without importing the Shopify config.
//
// BILLING_TEST=true or BILLING_TEST=false decides explicitly. Without it,
// charges are test charges everywhere except NODE_ENV=production, so a
// development or staging install never bills a real merchant by accident.
export function isTestBilling(env: Record<string, string | undefined> = process.env): boolean {
  if (env.BILLING_TEST === "true") {
    return true;
  }

  if (env.BILLING_TEST === "false") {
    return false;
  }

  return env.NODE_ENV !== "production";
}
