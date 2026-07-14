# Product Requirements: shopify-remix-starter

## What we're building

A reusable boilerplate for embedded Shopify admin apps. It is not an end-user product; it is the starting codebase a developer clones to begin a new Shopify app. It provides the full auth and hosting plumbing that every embedded app needs, plus one worked example of reading and writing shop data, so the developer can delete the example and build real features on a foundation that already works.

## Target user

Developers (typically Shopify Partners or in-house engineers) who need to stand up a new embedded Shopify admin app quickly. They know TypeScript and React but do not want to reimplement OAuth, session storage, webhook verification, and billing from scratch each time. They value clear conventions and a codebase that passes lint, type checks, and build out of the box.

## Core features (prioritized)

### 1. OAuth install and session storage
The highest priority. An app that cannot install and hold a session is useless. The app must complete Shopify's OAuth flow, persist the resulting session in the database via Prisma, and re-authenticate transparently when a session expires or scopes change.

### 2. Embedded admin shell (Polaris + App Bridge)
The app must render inside Shopify Admin as an embedded app, using App Bridge for framing and navigation and Polaris for all UI. This is the container every feature screen lives in.

### 3. Sample admin page reading and writing shop data
One concrete page that loads shop data through an Admin GraphQL query and performs a mutation. It proves the Admin API wiring and serves as the copy-paste template for future pages.

### 4. Webhook handler including app/uninstalled
A single webhook entry point that verifies HMAC and dispatches by topic. It must handle `app/uninstalled` by cleaning up the shop's sessions, and the mandatory GDPR/compliance topics must be registered.

### 5. Billing scaffold
A minimal, clearly-marked scaffold showing how to check for an active subscription and redirect to a managed pricing/confirmation flow. It does not charge anyone by default; it demonstrates the pattern.

## Non-goals

- No real product feature beyond the sample page. This is a starter, not a finished app.
- No custom design system or hand-rolled theme. All UI comes from Polaris tokens and components.
- No storefront (Liquid theme, theme app extension) or checkout UI extensions.
- No multi-currency, tax, or fulfillment logic.
- No CI/CD pipeline, Docker images, or hosting-provider-specific config.
- No admin analytics dashboards or reporting.
- No support for non-embedded (standalone) app mode.

## Success criteria per core feature

### OAuth install and session storage
- Installing the app on a fresh development store completes OAuth without manual steps and lands on the embedded home page.
- A `Session` row exists in the database for the installed shop after install.
- Reloading the embedded app after the token would normally expire does not error; the session is refreshed transparently.

### Embedded admin shell
- The app renders inside Shopify Admin (embedded), not in a bare browser tab, with the Polaris frame visible.
- App Bridge navigation between at least two routes works and updates the Admin URL bar.

### Sample admin page
- The page loads and displays real data returned by an Admin GraphQL query (for example, shop name and a small list of products).
- Submitting the page's form runs an Admin GraphQL mutation and the change is visible in Shopify Admin after refresh.
- A GraphQL error surfaces to the user as a friendly Polaris banner, not a stack trace.

### Webhook handler
- A request with an invalid HMAC is rejected with HTTP 401 and logged.
- Uninstalling the app fires `app/uninstalled`; the handler deletes that shop's sessions.
- All required compliance webhooks are registered and return 200 for a valid signed request.

### Billing scaffold
- A shop without an active subscription is redirected to the billing/confirmation flow when it hits a gated route.
- A shop with an active subscription reaches the gated route.
- Billing behavior is toggleable via config so the starter installs without forcing a charge.
