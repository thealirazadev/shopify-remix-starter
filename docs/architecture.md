# Architecture: shopify-remix-starter

## App flow

The end-to-end lifecycle of the app:

1. **Install / OAuth** — A merchant opens the app from the Partner preview link or the App Store listing. `@shopify/shopify-app-remix` handles the OAuth handshake: it redirects to Shopify's authorization screen, receives the callback, exchanges the code for an access token, and stores a session.
2. **Session storage** — The session (shop domain, access token, scopes, expiry) is written to the database through the Prisma session storage adapter. Subsequent requests read this session to authenticate Admin API calls.
3. **Embedded app** — After install, the app loads inside Shopify Admin as an embedded app. App Bridge frames it; Polaris provides the UI. Every embedded route authenticates the incoming request with `authenticate.admin(request)`, which validates the session token (JWT) issued by App Bridge.
4. **Admin API** — Authenticated loaders and actions call the Admin GraphQL API using the session's access token to read and write shop data.
5. **Webhooks** — Shopify sends webhooks (topic + HMAC-signed body) to the app's webhook route. The handler verifies the HMAC, then dispatches by topic. `app/uninstalled` triggers session cleanup. Compliance topics are handled for App Store eligibility.
6. **Billing** — Gated routes check for an active subscription via the billing helper. Shops without one are sent to a managed confirmation URL; on approval Shopify redirects back and the check passes.

## Folder and file tree

```
shopify-remix-starter/
  app/
    entry.server.tsx            Remix server entry (adds security headers for embedding)
    root.tsx                    App Bridge + Polaris AppProvider setup
    routes/
      _index/
        route.tsx               Landing/redirect route (non-embedded entry)
      app.tsx                   Embedded layout: authenticate.admin, Polaris frame, nav
      app._index.tsx            Sample admin page (loader query + action mutation)
      app.additional.tsx        Second embedded route (demonstrates App Bridge nav)
      auth.$.tsx                OAuth begin/callback catch-all (shopify.authenticate)
      auth.login/
        route.tsx               Login form for non-embedded OAuth start
      webhooks.tsx              Single webhook endpoint: HMAC verify + topic dispatch
    shopify.server.ts           shopifyApp() config: API keys, scopes, session storage,
                                webhook registration, billing config
    db.server.ts                Prisma client singleton
    lib/
      logger.server.ts          Structured logger (JSON lines)
      errors.ts                 Shared error shape + helpers
  prisma/
    schema.prisma               Session model + ShopSetting example model
    migrations/                 Generated migrations (never hand-edited)
    dev.sqlite                  Local dev database (gitignored)
  docs/                         Planning and handoff documentation
  public/                       Static assets
  .env.example                  Environment variable template
  package.json
  package-lock.json             Committed lockfile (pinned versions)
  tsconfig.json
  vite.config.ts
  shopify.app.toml              Shopify CLI app config (scopes, URLs, webhooks)
  .eslintrc.cjs                 ESLint with Shopify config
  .prettierrc                   Prettier config
```

## Tech stack with rationale

- **Remix (Vite) + TypeScript** — Remix's loader/action model maps cleanly to Shopify's request-per-page auth. `@shopify/shopify-app-remix` is built for it. Vite gives fast dev and is the current Shopify template default. TypeScript catches integration mistakes early.
- **@shopify/shopify-app-remix** — Official adapter. Handles OAuth, session token validation, webhook registration and verification, and billing. Avoids reimplementing security-critical code.
- **@shopify/polaris** — Shopify's design system. Using it keeps the app visually consistent with Admin and satisfies App Store review expectations. No custom theme.
- **@shopify/app-bridge-react** — Required to run embedded: framing, navigation, resource pickers, and session token issuance.
- **Prisma + SQLite/Postgres** — Prisma's session storage adapter is first-class in the Shopify Remix package. SQLite keeps local dev zero-setup; the same schema runs on Postgres/MySQL in production by swapping `DATABASE_URL`.
- **Shopify CLI** — Manages tunneling, environment injection, and `shopify.app.toml` sync during local dev, so contributors do not configure ngrok by hand.
- **Node runtime** — Broad hosting support and the runtime the Shopify packages target.

## Data model (Prisma)

```prisma
// Session is required by the Prisma session storage adapter. Fields match the
// adapter's expected shape; do not rename them.
model Session {
  id            String    @id
  shop          String
  state         String
  isOnline      Boolean   @default(false)
  scope         String?
  expires       DateTime?
  accessToken   String
  userId        BigInt?
  firstName     String?
  lastName      String?
  email         String?
  accountOwner  Boolean   @default(false)
  locale        String?
  collaborator  Boolean?  @default(false)
  emailVerified Boolean?  @default(false)
}

// Small example model demonstrating a per-shop settings record read and written
// by the sample admin page. Delete or replace when building a real app.
model ShopSetting {
  id        String   @id @default(cuid())
  shop      String   @unique
  label     String   @default("")
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())
}
```

## Where state lives

- **Session/auth state** — Database (`Session` table) via Prisma. This is the source of truth for access tokens and scopes. There is no in-memory session cache.
- **App/feature state** — Database (`ShopSetting` and future models), keyed by shop domain.
- **UI/request state** — Held in Remix loaders/actions per request; the client holds only transient form state. No client-side global store is introduced.
- **Config** — Environment variables (see below) and `shopify.app.toml` for CLI-managed app settings.
- **Shop data of record** — Lives in Shopify, accessed on demand through the Admin GraphQL API; not mirrored locally except where a feature explicitly needs it.

## External dependencies

- **Shopify Admin GraphQL API** — Primary data source for shop, products, and mutations.
- **Shopify OAuth + billing endpoints** — Handled through `@shopify/shopify-app-remix`.
- **Shopify CLI tunneling service** — Local development only.
- **Database** — SQLite locally; a managed Postgres or MySQL instance in production.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `SHOPIFY_API_KEY` | App Client ID from the Partner Dashboard. Public; used by App Bridge and OAuth. |
| `SHOPIFY_API_SECRET` | App Client Secret. Secret; used to verify HMAC and exchange OAuth codes. |
| `SCOPES` | Comma-separated access scopes requested at install (for example `read_products,write_products`). |
| `SHOPIFY_APP_URL` | Public HTTPS base URL of the app (tunnel URL in dev, real domain in prod). Used to build OAuth and webhook callback URLs. |
| `DATABASE_URL` | Prisma connection string. SQLite file locally; Postgres/MySQL URL in production. |

All five are documented with dummy values in `.env.example`. The app must fail fast with a clear error at startup if any required variable is missing.
