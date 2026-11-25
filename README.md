# shopify-remix-starter

A production-minded boilerplate for building embedded Shopify admin apps with Remix and TypeScript. It ships a complete OAuth install flow, database-backed session storage, an embedded admin page built with Polaris and App Bridge that reads products and renames them through the Admin GraphQL API, a webhook handler that includes the mandatory `app/uninstalled` topic, and a billing scaffold you can extend into a real pricing plan. Use it as the starting point for a new app so you skip the plumbing and go straight to features.

## Features

- OAuth install and re-authentication via `@shopify/shopify-app-remix`.
- Database-backed session storage using Prisma with SQLite. Prisma fixes the database provider in `prisma/schema.prisma` (`sqlite` here), so moving to PostgreSQL or MySQL means changing that provider and regenerating the migrations; changing `DATABASE_URL` alone does not switch engines.
- Embedded admin UI with Shopify Polaris and App Bridge, mounted inside Shopify Admin.
- A sample admin page that queries the first products through the Admin GraphQL API, renames a product with the `productUpdate` mutation, and saves an example per-shop setting in Prisma.
- Webhook handler with HMAC verification, including the mandatory `app/uninstalled` topic. Subscriptions are declared once, in `shopify.app.toml`.
- Billing scaffold showing how to gate features behind a subscription. Charges are test charges unless `NODE_ENV=production`; `BILLING_TEST=true` or `false` overrides that.
- ESLint (Shopify config) and Prettier preconfigured.

## Tech stack

- Remix (Vite) + TypeScript
- `@shopify/shopify-app-remix` for auth, sessions, webhooks, and billing helpers
- `@shopify/polaris` and `@shopify/app-bridge-react` for the embedded UI
- Prisma ORM with SQLite (see the provider note above)
- Shopify CLI for local development and tunneling
- Node runtime

## Prerequisites

- Node.js 18.20 or later (Node 20 LTS recommended)
- npm 10 or later
- A Shopify Partner account and a development store
- Shopify CLI installed (`npm install -g @shopify/cli@latest`)
- A configured app in the Shopify Partner Dashboard (API key and secret)

## Install

1. Clone the repository and change into it.
2. Copy the environment template: `cp .env.example .env`, then fill in real values (see `docs/architecture.md` for each variable).
3. Install dependencies: `npm install`.
4. Generate the Prisma client and apply migrations: `npx prisma migrate deploy`.

## Run (local development)

Start the app through the Shopify CLI so tunneling, environment injection, and app config sync are handled for you:

```
npm run dev
```

The CLI creates a tunnel, prints the preview URL, and opens the app installed on your development store. The first run walks you through selecting the Partner app and store.

## Test

```
npm run lint
npm run typecheck
npm run test
npm run build
```

CI runs the same checks on every push and pull request. See `docs/testing.md` for the full strategy and exact commands.

## Project structure

```
app/            Remix routes, entry points, and shared server/client modules
  routes/       OAuth, embedded pages, webhook, and billing routes
  shopify.server.ts   Shopify app config, session storage, billing plan
prisma/         Prisma schema and migrations
docs/           architecture, design, API contracts, testing, design decisions (decisions.md)
.env.example    Environment variable template
```

## License

License: MIT
