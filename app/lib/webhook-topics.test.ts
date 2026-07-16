import { describe, expect, it } from "vitest";

import { actionForTopic } from "./webhook-topics";

describe("actionForTopic", () => {
  it("falls back to unhandled for any topic not yet wired up", () => {
    expect(actionForTopic("APP_UNINSTALLED")).toBe("unhandled");
    expect(actionForTopic("ORDERS_CREATE")).toBe("unhandled");
  });
});
