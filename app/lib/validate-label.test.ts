import { describe, expect, it } from "vitest";

import { LABEL_MAX_LENGTH, validateLabel } from "./validate-label";

describe("validateLabel", () => {
  it("rejects an empty label", () => {
    expect(validateLabel("").valid).toBe(false);
    expect(validateLabel("   ").valid).toBe(false);
  });

  it("rejects a label longer than the max length", () => {
    const result = validateLabel("a".repeat(LABEL_MAX_LENGTH + 1));

    expect(result.valid).toBe(false);
    expect(result.message).toContain(String(LABEL_MAX_LENGTH));
  });

  it("accepts a label within bounds", () => {
    expect(validateLabel("Widget").valid).toBe(true);
  });

  it("accepts a label at exactly the max length", () => {
    expect(validateLabel("a".repeat(LABEL_MAX_LENGTH)).valid).toBe(true);
  });
});
