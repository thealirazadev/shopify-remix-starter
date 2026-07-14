# API Contracts: shopify-remix-starter

This documents every route the app exposes, the webhooks it consumes, and the Admin GraphQL operations the sample page runs. Authentication for embedded routes is via Shopify **session token** (JWT issued by App Bridge), validated by `authenticate.admin(request)`. Webhooks authenticate via **HMAC**, validated by `authenticate.webhook(request)`.

## Consistent error format

All JSON error responses (loaders/actions returning errors, webhook failures, billing errors) use one shape:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Label must be 100 characters or fewer.",
    "requestId": "req_9f2c1a"
  }
}
```

- `code` — stable machine-readable string (`UNAUTHENTICATED`, `INVALID_INPUT`, `NOT_FOUND`, `UPSTREAM_ERROR`, `INTERNAL`).
- `message` — short, friendly, safe to show a user. Never contains a stack trace or secret.
- `requestId` — correlates the user-facing error with the detailed server log line.

Detailed diagnostics (stack, GraphQL `userErrors`, upstream status) are logged via `logger.server.ts`, never returned.

## OAuth routes

### `GET|POST /auth/*` — `auth.$.tsx`
Catch-all that begins and completes OAuth. Delegates entirely to `shopify.authenticate` / the login helper.
- **Auth:** none required (this is where auth is established). The package validates OAuth `state`/nonce.
- **Behavior:** Begins OAuth for a shop, redirects to Shopify's consent screen, receives the callback, exchanges the code for an access token, and persists the session via Prisma session storage.
- **Success:** Redirects into the embedded app (`/app`).
- **Failure:** Redirects back to `/auth/login` with an error, or returns the consistent error format for non-redirect failures.

### `GET|POST /auth/login` — `auth.login/route.tsx`
Non-embedded shop-domain entry form for starting OAuth manually.
- **Auth:** none.
- **Input (POST):** `shop` (myshopify domain). Validated server-side; invalid domains return the form with a field error.
- **Success:** Redirects into OAuth for the given shop.

## Webhook route

### `POST /webhooks` — `webhooks.tsx`
Single endpoint for all webhook topics.
- **Auth:** HMAC via `authenticate.webhook(request)`. Invalid HMAC returns `401` and is logged; no body processing occurs.
- **Dispatch:** Switch on the verified `topic`. Unknown topics return `200` (acknowledged, no-op) and are logged at `warn`.
- **Response:** Always `200` on success within the timeout; failures that should be retried return `500`.

Registered topics:

| Topic | Purpose | Handler action |
| --- | --- | --- |
| `APP_UNINSTALLED` (`app/uninstalled`) | Shop removed the app. | Delete all `Session` rows for the shop; log the uninstall. |
| `APP_SCOPES_UPDATE` (`app/scopes_update`) | Granted scopes changed. | Update the stored session scope. |
| `CUSTOMERS_DATA_REQUEST` (`customers/data_request`) | GDPR data request. | Log and acknowledge; no PII stored by default. |
| `CUSTOMERS_REDACT` (`customers/redact`) | GDPR delete customer. | Log and acknowledge; delete any customer-linked data if present. |
| `SHOP_REDACT` (`shop/redact`) | GDPR delete shop, 48h after uninstall. | Delete any remaining shop data (`ShopSetting`, sessions). |

### Example payload — `app/uninstalled`

Headers (subset):
```
X-Shopify-Topic: app/uninstalled
X-Shopify-Hmac-Sha256: <base64 hmac>
X-Shopify-Shop-Domain: example-shop.myshopify.com
X-Shopify-Webhook-Id: 1a2b3c4d-0000-0000-0000-000000000000
```
Body:
```json
{
  "id": 954889,
  "name": "Example Shop",
  "myshopify_domain": "example-shop.myshopify.com",
  "domain": "example-shop.com"
}
```

### Example payload — `customers/redact`
```json
{
  "shop_id": 954889,
  "shop_domain": "example-shop.myshopify.com",
  "customer": { "id": 191167, "email": "buyer@example.com" },
  "orders_to_redact": [299938, 280263]
}
```

## Embedded route loaders and actions (sample admin page)

### `app.tsx` — embedded layout
- **loader:** Calls `authenticate.admin(request)`. On failure the package redirects into OAuth. Returns `apiKey` (from `SHOPIFY_API_KEY`) for App Bridge and nav data.
- **Auth:** session token required.

### `app._index.tsx` — sample page

**loader**
- **Auth:** `authenticate.admin(request)`.
- **Reads:** shop name and first products via the `ShopAndProducts` query; the shop's `ShopSetting.label` from Prisma (empty string if none).
- **Returns:**
```json
{
  "shopName": "Example Shop",
  "products": [{ "id": "gid://shopify/Product/1", "title": "Widget", "status": "ACTIVE" }],
  "label": "current label value"
}
```
- **Error:** GraphQL/DB failure returns `{ "error": { "code": "UPSTREAM_ERROR", "message": "Could not load shop data. Try again.", "requestId": "..." } }` and the page shows a `Banner`.

**action** (form submit to update the example setting)
- **Auth:** `authenticate.admin(request)`.
- **Input:** `label` (string). Server-side validation: required, trimmed length 1–100. Invalid input returns `{ "error": { "code": "INVALID_INPUT", "message": "...", "requestId": "..." } }` and the field shows an error.
- **Writes:** Upserts `ShopSetting` for the shop (Prisma). Optionally runs the `UpdateProductTitle` mutation to demonstrate an Admin write.
- **Success:** Returns `{ "ok": true, "label": "..." }`; UI shows a success `Banner` or App Bridge `Toast`.

### `app.additional.tsx`
- **loader:** `authenticate.admin(request)` only; returns static/demo content. Demonstrates App Bridge navigation.

## Admin GraphQL operations used by the sample page

### Query: `ShopAndProducts` (loader read)
```graphql
query ShopAndProducts($first: Int!) {
  shop {
    name
    myshopifyDomain
  }
  products(first: $first) {
    edges {
      node {
        id
        title
        status
      }
    }
  }
}
```
Variables: `{ "first": 5 }`.

### Mutation: `UpdateProductTitle` (action write, optional demo)
```graphql
mutation UpdateProductTitle($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      title
    }
    userErrors {
      field
      message
    }
  }
}
```
Variables: `{ "input": { "id": "gid://shopify/Product/1", "title": "New title" } }`.
- Always inspect `userErrors`. A non-empty `userErrors` array is mapped to the consistent error format with `code: "INVALID_INPUT"` and the first message surfaced to the user; full array logged.

## Billing (gated routes)
- Gated routes call the billing helper (`billing.require` / `billing.check`) after `authenticate.admin`.
- A shop without an active subscription is redirected to Shopify's managed confirmation URL. On approval Shopify redirects back and the check passes.
- Billing is config-toggleable so the starter installs without forcing a charge. Which routes are gated is stated in code comments and here; by default none are hard-gated in the starter (the scaffold shows the pattern on a demo route).
