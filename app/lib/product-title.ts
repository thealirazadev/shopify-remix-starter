// Pure input parsing and response mapping for the sample page's product title
// write (the UpdateProductTitle mutation). Kept out of the route so both halves
// are unit-testable without Shopify or a live store.
export const PRODUCT_TITLE_MAX_LENGTH = 255;

const PRODUCT_GID = /^gid:\/\/shopify\/Product\/\d+$/;

export type ProductTitleInput =
  { ok: true; id: string; title: string } | { ok: false; message: string };

export function parseProductTitleInput(rawId: string, rawTitle: string): ProductTitleInput {
  const id = rawId.trim();
  const title = rawTitle.trim();

  if (!PRODUCT_GID.test(id)) {
    return { ok: false, message: "Unknown product." };
  }

  if (title.length === 0) {
    return { ok: false, message: "Title is required." };
  }

  if (title.length > PRODUCT_TITLE_MAX_LENGTH) {
    return {
      ok: false,
      message: `Title must be ${PRODUCT_TITLE_MAX_LENGTH} characters or fewer.`,
    };
  }

  return { ok: true, id, title };
}

export interface ProductUserError {
  field: string[] | null;
  message: string;
}

export interface UpdateProductTitleResponse {
  data?: {
    productUpdate?: {
      product: { id: string; title: string } | null;
      userErrors: ProductUserError[];
    } | null;
  };
  errors?: { message: string }[];
}

export type ProductTitleOutcome =
  | { ok: true; product: { id: string; title: string } }
  | { ok: false; code: "INVALID_INPUT" | "UPSTREAM_ERROR"; message: string };

/**
 * Maps a productUpdate response to the outcome the page shows. A non-empty
 * userErrors array is an INVALID_INPUT carrying the first message; a response
 * with GraphQL errors or no product is an UPSTREAM_ERROR with a generic message.
 */
export function productTitleOutcome(body: UpdateProductTitleResponse): ProductTitleOutcome {
  const payload = body.data?.productUpdate;
  const userErrors = payload?.userErrors ?? [];

  if (userErrors.length > 0) {
    return { ok: false, code: "INVALID_INPUT", message: userErrors[0].message };
  }

  if (body.errors?.length || !payload?.product) {
    return {
      ok: false,
      code: "UPSTREAM_ERROR",
      message: "Could not update the product. Try again.",
    };
  }

  return { ok: true, product: payload.product };
}
