import { describe, expect, it } from "vitest";

import { isTestBilling } from "./billing-mode";

describe("isTestBilling", () => {
  it("uses test charges outside production", () => {
    expect(isTestBilling({})).toBe(true);
    expect(isTestBilling({ NODE_ENV: "development" })).toBe(true);
    expect(isTestBilling({ NODE_ENV: "test" })).toBe(true);
  });

  it("uses real charges in production", () => {
    expect(isTestBilling({ NODE_ENV: "production" })).toBe(false);
  });

  it("lets BILLING_TEST override the environment either way", () => {
    expect(isTestBilling({ NODE_ENV: "production", BILLING_TEST: "true" })).toBe(true);
    expect(isTestBilling({ NODE_ENV: "development", BILLING_TEST: "false" })).toBe(false);
  });

  it("ignores a BILLING_TEST value that is neither true nor false", () => {
    expect(isTestBilling({ NODE_ENV: "production", BILLING_TEST: "yes" })).toBe(false);
    expect(isTestBilling({ NODE_ENV: "development", BILLING_TEST: "" })).toBe(true);
  });
});
