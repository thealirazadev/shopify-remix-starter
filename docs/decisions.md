# Design decisions

## 1. Let the Shopify package own auth, sessions, and HMAC

OAuth, session token validation, and webhook signature checks all come from
`@shopify/shopify-app-remix`; nothing in the app hand-writes them. Every embedded loader and
action starts with `authenticate.admin(request)`, and the webhook route starts with
`authenticate.webhook(request)`, which rejects a bad signature before any app code runs. The app
opts into `unstable_newEmbeddedAuthStrategy`, the package's token-exchange install flow for
embedded apps. Sessions are stored through the official Prisma adapter, and the `Session` model
keeps the field names that adapter expects. These are the parts of a Shopify app that are easy
to get subtly wrong, so the starter's job is to wire them correctly and get out of the way.

## 2. Fail fast on missing configuration

`app/lib/env.server.ts` checks `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES`,
`SHOPIFY_APP_URL`, and `DATABASE_URL` when it is imported and throws one readable error naming
every missing variable. `shopify.server.ts` imports it on its first line, so the server refuses
to start instead of failing later inside OAuth with an opaque error. Because the check has
already run, the non-null assertions in the `shopifyApp()` config are safe.

## 3. Billing is a scaffold that never charges by default

The billing plan is always declared in the `shopifyApp()` config, even when billing is off.
Declaring it conditionally made the package's generic types collapse, so the plan stays in the
config and the decision lives in one place: `requireActiveSubscription` in
`app/lib/billing.server.ts` returns immediately unless `BILLING_ENABLED` is `"true"`. When
enabled it calls `billing.require` and redirects a shop without the plan to Shopify's managed
confirmation page. The demo route `app.billing-demo.tsx` shows the pattern. Whether a request is a
test charge comes from `isTestBilling` in `app/lib/billing-mode.ts`: test unless `NODE_ENV` is
`production`, with `BILLING_TEST=true` or `false` overriding either way. It used to be hard-coded
to `isTest: true`, which meant a deployed app could never charge. The starter installs on any
store without forcing a subscription.

## 4. One webhook endpoint with a pure dispatch table

Every topic posts to `/webhooks`. The route maps the topic to an action through `actionForTopic`
in `app/lib/webhook-topics.ts`, a plain lookup kept out of the route so it can be unit tested
without mocking Prisma or the authenticator. `app/uninstalled` deletes the shop's sessions,
`app/scopes_update` writes the new scope list onto stored sessions, `shop/redact` deletes the
shop's settings and sessions, and the customer compliance topics are acknowledged because the
starter stores no customer data. Unknown topics are logged and acknowledged with a 200. A
processing failure returns 500 so Shopify retries the delivery. Topics are subscribed once, in
`shopify.app.toml`. The config used to also register them per shop in `afterAuth`, which could
deliver each event twice, so that path was removed.

## 5. One error shape, and no stack traces for users

JSON errors use one shape, `{ error: { code, message, requestId } }`, built by `apiError` in
`app/lib/errors.ts` with a fixed set of codes. Expected failures are returned as data: the sample
page's loader catches an Admin API failure, logs it with the shop and request id, and renders a
Polaris `Banner` with a short message. Unexpected errors reach the root `ErrorBoundary`, which
renders a friendly Polaris page with only the status line, never the error object.

## 6. Structured logs from the start

`app/lib/logger.server.ts` writes one JSON line per event with `level`, `msg`, `time`, and any
fields such as `shop`, `requestId`, or `topic`. The lint config allows only `console.warn` and
`console.error`, so the logger routes info and warn lines through `console.warn` and errors
through `console.error`, and no other module calls `console` directly.

## 7. Validate input in a pure function on the server

The sample page's label is validated by `validateLabel` in `app/lib/validate-label.ts`: the
value is trimmed, must not be empty, and is capped at 100 characters. The action runs it before
any database write and returns a 400 with a field message on failure; client-side checks are a
convenience only. Keeping the rule outside the route makes it testable without Prisma or Shopify,
which is the pattern the starter is meant to show for real form handling.

## 8. Shared clients survive hot reload

`app/db.server.ts` stores the Prisma client on `global` outside production, so Vite's hot reload
in development reuses one client instead of opening a new connection on every reload.

## 9. ESLint flat config with explained overrides

`@shopify/eslint-plugin` 48 ships only flat configs, so the project uses `eslint.config.js` with
ESLint 8.57.1, which supports both formats, rather than changing either pinned version. A
leftover `--ext` flag from the old config style was rejected by flat config and has been removed
from the `lint` script. A few plugin defaults are turned off, each with its reason in the config:
the React-in-scope rules (the app uses the automatic JSX runtime), Shopify's internal i18n JSX
rules (the starter renders plain English), `import/extensions` (`.server.ts` is a Remix naming
convention), naming-convention (keys such as `v3_singleFetch` come from third-party APIs), and
the Node built-ins check (Node 18.20+ has stable `fetch`, `Request`, and `Response`).

## 10. GraphQL, Polaris, and pinned versions

New code reads shop data with the Admin GraphQL API only, pinned to API version 2025-01, and the
UI uses Polaris components and App Bridge navigation with no other UI framework. Dependencies are
pinned to exact versions with the lockfile committed. Vulnerable transitive packages are forced to
patched versions through `overrides`. `turbo-stream` is left at 2.4.1 on purpose: its patched
3.x line changes `decode` to return the value directly, which breaks Remix 2 single fetch, enabled
here through `v3_singleFetch`. The real fix is a move to React Router 7.
