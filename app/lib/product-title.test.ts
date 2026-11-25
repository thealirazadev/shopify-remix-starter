import { describe, expect, it } from "vitest";

import {
  PRODUCT_TITLE_MAX_LENGTH,
  parseProductTitleInput,
  productTitleOutcome,
} from "./product-title";

const ID = "gid://shopify/Product/42";

describe("parseProductTitleInput", () => {
  it("accepts a product id and a trimmed title", () => {
    expect(parseProductTitleInput(` ${ID} `, "  New title  ")).toEqual({
      ok: true,
      id: ID,
      title: "New title",
    });
  });

  it("rejects anything that is not a product id", () => {
    for (const id of [
      "",
      "42",
      "gid://shopify/Order/42",
      `${ID}/extra`,
      "gid://shopify/Product/",
    ]) {
      expect(parseProductTitleInput(id, "Title")).toEqual({
        ok: false,
        message: "Unknown product.",
      });
    }
  });

  it("rejects an empty or whitespace title", () => {
    expect(parseProductTitleInput(ID, "   ")).toEqual({ ok: false, message: "Title is required." });
  });

  it("caps the title length", () => {
    expect(parseProductTitleInput(ID, "a".repeat(PRODUCT_TITLE_MAX_LENGTH)).ok).toBe(true);

    const tooLong = parseProductTitleInput(ID, "a".repeat(PRODUCT_TITLE_MAX_LENGTH + 1));

    expect(tooLong.ok).toBe(false);
    expect(tooLong.ok ? "" : tooLong.message).toContain(String(PRODUCT_TITLE_MAX_LENGTH));
  });
});

describe("productTitleOutcome", () => {
  it("returns the updated product", () => {
    expect(
      productTitleOutcome({
        data: { productUpdate: { product: { id: ID, title: "New title" }, userErrors: [] } },
      }),
    ).toEqual({ ok: true, product: { id: ID, title: "New title" } });
  });

  it("surfaces the first user error as invalid input", () => {
    expect(
      productTitleOutcome({
        data: {
          productUpdate: {
            product: null,
            userErrors: [
              { field: ["title"], message: "Title is too long" },
              { field: ["id"], message: "Product does not exist" },
            ],
          },
        },
      }),
    ).toEqual({ ok: false, code: "INVALID_INPUT", message: "Title is too long" });
  });

  it("treats GraphQL errors or a missing product as an upstream error", () => {
    const upstream = {
      ok: false,
      code: "UPSTREAM_ERROR",
      message: "Could not update the product. Try again.",
    };

    expect(productTitleOutcome({ errors: [{ message: "Throttled" }] })).toEqual(upstream);
    expect(productTitleOutcome({ data: { productUpdate: null } })).toEqual(upstream);
    expect(
      productTitleOutcome({ data: { productUpdate: { product: null, userErrors: [] } } }),
    ).toEqual(upstream);
  });
});
