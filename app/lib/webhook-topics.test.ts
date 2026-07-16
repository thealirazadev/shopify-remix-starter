import { describe, expect, it } from "vitest";

import { actionForTopic } from "./webhook-topics";

describe("actionForTopic", () => {
  it("maps app/uninstalled to session deletion", () => {
    expect(actionForTopic("APP_UNINSTALLED")).toBe("delete-sessions");
  });

  it("falls back to unhandled for a topic not yet wired up", () => {
    expect(actionForTopic("ORDERS_CREATE")).toBe("unhandled");
  });
});
