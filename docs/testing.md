# Testing: shopify-remix-starter

## Strategy

The starter favors a small, reliable set of automated checks plus disciplined manual QA against a real development store. Shopify's OAuth, webhooks, and embedded framing are difficult to fully unit test, so the automated layer covers pure logic and contracts, while integration behavior is verified manually per the phase checklists.

### Automated
- **Type checking** — `tsc` catches integration mistakes at the boundary with the Shopify and Prisma types. Treated as a required gate.
- **Lint** — ESLint with the Shopify config enforces conventions and catches common React/Remix mistakes.
- **Unit tests** — Vitest for pure functions: input validation (label length, shop-domain parsing), the error-formatting helper, the webhook topic dispatch mapping, and any data transforms. Mock Prisma and the Shopify `admin` client at the boundary; do not hit the network.
- **Build** — `vite build` (via `remix vite:build`) must succeed; a broken build blocks the feature.

### Manual QA
- Follow the per-phase Manual test checklist and the Phase verification list in `docs/phases.md`.
- Use a Shopify development store and the Shopify CLI (`npm run dev`) for OAuth, embedding, and webhook testing.
- Use `npx prisma studio` to inspect `Session` and `ShopSetting` rows.
- Trigger webhooks with the Shopify CLI (`shopify app webhook trigger`) to exercise HMAC verification and topic handling, including `app/uninstalled`.
- Always test the unhappy paths listed in Phase verification: wrong input, empty forms, no network, duplicate submit, refresh mid-action, empty states, long inputs.

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

## Definition of "done" gate

A feature is not done until, on the feature branch:

- `npm run lint` passes with no errors.
- `npm run typecheck` passes.
- `npm run test` passes.
- `npm run build` succeeds.
- The feature's manual test checklist items in `docs/phases.md` are checked.

**Build and tests must pass before a feature is considered done.** Do not commit a feature that fails any of these gates.
