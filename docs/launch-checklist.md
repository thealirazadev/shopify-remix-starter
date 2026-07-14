# Launch Checklist: shopify-remix-starter

Work through before shipping to production. Nothing here should be assumed done.

## Environment and configuration
- [ ] Production environment variables set (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES`, `SHOPIFY_APP_URL`, `DATABASE_URL`).
- [ ] `SHOPIFY_APP_URL` points to the real production domain, not a tunnel.
- [ ] Production `DATABASE_URL` uses Postgres or MySQL, not SQLite.
- [ ] Secrets stored in the host's secret manager, not committed anywhere.
- [ ] Debug/verbose logging disabled in production; log level set appropriately.

## Reliability and errors
- [ ] Error tracking configured (a monitoring/error service receives server errors).
- [ ] Loading states present on all data fetches and submits (skeletons, button spinners).
- [ ] Friendly 404 page in place.
- [ ] Friendly 500 / error boundary page in place; no stack traces shown to users.
- [ ] Structured logs verified in production (include `shop` and `requestId`).

## UI and accessibility
- [ ] Mobile layout checked in Shopify Admin mobile app / narrow viewport.
- [ ] Embedded rendering verified inside Shopify Admin (framing, App Bridge navigation, URL updates).
- [ ] Empty states verified for lists and unset records.
- [ ] Keyboard navigation and focus order verified on key screens.

## Shopify-specific
- [ ] All webhooks registered and reachable in production, including `app/uninstalled`.
- [ ] Compliance webhooks (`customers/data_request`, `customers/redact`, `shop/redact`) registered and returning 200.
- [ ] Webhook HMAC verification confirmed against production requests.
- [ ] Billing flow tested end to end (charge created, approved, gated route reachable; decline handled).
- [ ] App scopes in `shopify.app.toml` and `SCOPES` match what the app actually uses; no unused scopes requested.
- [ ] `app/uninstalled` cleanup verified (sessions removed on uninstall).
- [ ] App URLs and redirect/callback URLs in the Partner Dashboard match production.

## Data
- [ ] Production database migrated with `prisma migrate deploy`.
- [ ] Database backups configured.
