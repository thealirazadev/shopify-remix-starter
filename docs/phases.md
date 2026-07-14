# Phases: shopify-remix-starter

Phases are ordered smallest-useful-shippable first. Do not start a phase until the previous one's Definition of done is met and its commits are landed. One commit per feature/task, in the order listed.

---

## Phase 1: Project skeleton and OAuth install

Stand up the Remix app, database, and a working OAuth install that persists a session.

### Definition of done
- `npm install`, `npm run typecheck`, `npm run lint`, and `npm run build` all succeed.
- App boots via `npm run dev` (Shopify CLI) and installs on a development store.
- OAuth completes and a `Session` row is written to the database.
- Missing required env vars cause a clear startup error.

### Manual test checklist
- [ ] Copy `.env.example` to `.env`, fill values, and start `npm run dev`.
- [ ] Install the app on a fresh dev store; OAuth completes without manual steps.
- [ ] Confirm a `Session` row exists for the shop (`npx prisma studio`).
- [ ] Remove a required env var and confirm startup fails with a readable message.

### Commits
1. `build: scaffold remix vite app with typescript config`
2. `chore: add eslint (shopify config) and prettier`
3. `feat(db): add prisma schema with session model and client singleton`
4. `feat(auth): configure shopify app remix with prisma session storage`
5. `feat(auth): add oauth begin/callback routes`
6. `chore: fail fast on missing required env vars`

---

## Phase 2: Embedded app shell

Render inside Shopify Admin with Polaris and App Bridge, with working navigation.

### Definition of done
- The app renders embedded in Shopify Admin with the Polaris frame.
- App Bridge navigation works between at least two routes and updates the Admin URL.
- Every `app.*` route authenticates via `authenticate.admin`.

### Manual test checklist
- [ ] Open the app from Admin; it renders embedded (not a bare tab).
- [ ] Navigate between the index and additional pages via the nav menu.
- [ ] Confirm the Admin URL bar updates on navigation.
- [ ] Hit an `app.*` route while logged out; confirm redirect into OAuth.

### Commits
1. `feat(app): add app bridge and polaris app provider at root`
2. `feat(app): add embedded layout route with authenticate.admin`
3. `feat(app): add nav menu and additional demo route`

---

## Phase 3: Sample admin page (Admin GraphQL read/write)

A real page that reads shop data and performs a mutation, with error and empty states.

### Definition of done
- The page loads shop name and products via the `ShopAndProducts` query.
- Submitting the form upserts `ShopSetting` and (optionally) runs `UpdateProductTitle`.
- Errors render as a Polaris `Banner`; empty data renders `EmptyState`.
- Input is validated server-side.

### Manual test checklist
- [ ] Page shows shop name and a product list.
- [ ] Submit a valid label; success banner/toast appears and value persists after refresh.
- [ ] Submit an empty label; a field-level error appears, nothing is saved.
- [ ] Simulate a GraphQL failure; a friendly banner appears, no stack trace.
- [ ] Store with no products shows an `EmptyState`.

### Commits
1. `feat(db): add shopsetting model migration`
2. `feat(app): load shop and products via admin graphql`
3. `feat(app): add label form action with server-side validation`
4. `feat(app): add error banner and empty states`

---

## Phase 4: Webhooks (including app/uninstalled)

Single verified webhook endpoint that cleans up on uninstall and satisfies compliance topics.

### Definition of done
- `/webhooks` verifies HMAC and dispatches by topic.
- `app/uninstalled` deletes the shop's sessions.
- Compliance topics are registered and respond 200 to valid signed requests.
- Invalid HMAC returns 401 and is logged.

### Manual test checklist
- [ ] Uninstall the app; confirm `app/uninstalled` fires and sessions are deleted.
- [ ] Send a request with a bad HMAC; confirm 401 and a log line.
- [ ] Trigger a compliance webhook (via CLI); confirm 200.
- [ ] Reinstall and confirm a fresh session is created.

### Commits
1. `feat(webhooks): add endpoint with hmac verification and topic dispatch`
2. `feat(webhooks): handle app/uninstalled by clearing sessions`
3. `feat(webhooks): register compliance topics`

---

## Phase 5: Billing scaffold and structured logging/errors

Demonstrate subscription gating and finalize logging and the consistent error format.

### Definition of done
- A demo gated route redirects shops without an active subscription to the managed confirmation URL and lets subscribed shops through.
- Billing is toggleable via config so install does not force a charge.
- `logger.server.ts` emits structured JSON lines; no `console.log` remains.
- All JSON errors use the consistent error format.

### Manual test checklist
- [ ] Visit the gated demo route without a subscription; confirm redirect to confirmation.
- [ ] Approve the (test) charge; confirm the route becomes reachable.
- [ ] Toggle billing off in config; confirm the route is reachable without a charge.
- [ ] Inspect logs; confirm structured lines with `shop` and `requestId`.

### Commits
1. `feat(logging): add structured logger and shared error format`
2. `feat(billing): add config-toggleable billing check helper`
3. `feat(billing): add demo gated route using the billing check`

---

## Phase verification

Run after every phase before marking it done.

- [ ] `npm run dev` starts the app with no errors.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` all pass.
- [ ] Browser console and server logs are free of errors and warnings introduced by the phase.
- [ ] Unhappy paths:
  - [ ] Wrong input (invalid shop domain, out-of-range label) is rejected with a friendly message.
  - [ ] Empty forms submit nothing and show field errors.
  - [ ] No network / upstream failure surfaces a friendly banner, not a crash.
  - [ ] Duplicate submit (double-click) does not double-write; the button disables while in flight.
  - [ ] Refresh mid-action leaves data consistent (no partial write).
- [ ] Empty states render for no products and no saved setting.
- [ ] Long inputs (max-length label, long shop names) render without breaking layout and are truncated or wrapped by Polaris.

## Backlog

_(empty — record out-of-scope requests here with a one-line description and date)_
