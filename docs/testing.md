# Testing: shopify-remix-starter

## Strategy

The starter favors a small, reliable set of automated checks plus disciplined manual QA against a real development store. Shopify's OAuth, webhooks, and embedded framing are difficult to fully unit test, so the automated layer covers pure logic and contracts, while integration behavior is verified manually against a development store.

### Automated
- **Type checking** — `tsc` catches integration mistakes at the boundary with the Shopify and Prisma types. Treated as a required gate.
- **Lint** — ESLint with the Shopify config enforces conventions and catches common React/Remix mistakes.
- **Unit tests**: Vitest for pure functions: label validation (`validate-label.test.ts`), the error-formatting helper (`errors.test.ts`), and the webhook topic dispatch mapping (`webhook-topics.test.ts`). Mock Prisma and the Shopify `admin` client at the boundary; do not hit the network.
- **Build** — `vite build` (via `remix vite:build`) must succeed; a broken build blocks the feature.

### Manual QA
- Use a Shopify development store and the Shopify CLI (`npm run dev`) for OAuth, embedding, and webhook testing.
- Use `npx prisma studio` to inspect `Session` and `ShopSetting` rows.
- Trigger webhooks with the Shopify CLI (`shopify app webhook trigger`) to exercise HMAC verification and topic handling, including `app/uninstalled`.
- Always test the unhappy paths: wrong input, empty forms, no network, duplicate submit, refresh mid-action, empty states, long inputs.
- Check install end to end: the OAuth round trip, embedded framing and NavMenu navigation, a `Session` row written, webhook deliveries (uninstall and the three compliance topics) returning 200 with the right cleanup, and the billing demo route with `BILLING_ENABLED=true` against a test charge.

## Exact commands

```
npm run lint        # ESLint (Shopify config)
npm run typecheck   # tsc --noEmit
npm run test        # Vitest, run once (CI mode)
npm run build       # remix vite:build
```

Database setup used by tests and local runs:

```
npx prisma generate         # regenerate client after schema changes
npx prisma migrate deploy   # apply committed migrations
```

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull request against `main`, on
Node 22:

1. `npm ci`
2. `npm run prisma:generate`
3. `npm run lint`
4. `npm run typecheck`
5. `npm test` (`vitest run`)
6. `npm run build`

No Shopify credentials are needed; the manual checks above stay outside CI. A change is ready to
merge when all of these pass.
