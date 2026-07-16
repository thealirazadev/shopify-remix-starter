import { describe, expect, it } from "vitest";

import { apiError, newRequestId } from "./errors";

describe("apiError", () => {
  it("builds the consistent error shape", () => {
    const body = apiError("INVALID_INPUT", "Bad input.", "req_123");

    expect(body).toEqual({
      error: { code: "INVALID_INPUT", message: "Bad input.", requestId: "req_123" },
    });
  });
});

describe("newRequestId", () => {
  it("returns a req_-prefixed, non-empty id", () => {
    const id = newRequestId();

    expect(id.startsWith("req_")).toBe(true);
    expect(id.length).toBeGreaterThan(4);
  });

  it("returns unique ids across calls", () => {
    expect(newRequestId()).not.toBe(newRequestId());
  });
});
