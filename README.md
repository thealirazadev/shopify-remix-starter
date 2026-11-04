# shopify-remix-starter

A production-minded boilerplate for building embedded Shopify admin apps with Remix and TypeScript. It ships a complete OAuth install flow, database-backed session storage, an embedded admin page built with Polaris and App Bridge that reads and writes shop data through the Admin GraphQL API, a webhook handler that includes the mandatory `app/uninstalled` topic, and a billing scaffold you can extend into a real pricing plan. Use it as the starting point for a new app so you skip the plumbing and go straight to features.

## Features

- OAuth install and re-authentication via `@shopify/shopify-app-remix`.
- Database-backed session storage using Prisma (SQLite in development, Postgres or MySQL in production).
- Embedded admin UI with Shopify Polaris and App Bridge, mounted inside Shopify Admin.
- A sample admin page that queries and mutates shop data through the Admin GraphQL API.
- Webhook handler with HMAC verification, including the mandatory `app/uninstalled` topic.
- Billing scaffold showing how to gate features behind a subscription.
- ESLint (Shopify config) and Prettier preconfigured.

## Tech stack

- Remix (Vite) + TypeScript
- `@shopify/shopify-app-remix` for auth, sessions, webhooks, and billing helpers
- `@shopify/polaris` and `@shopify/app-bridge-react` for the embedded UI
- Prisma ORM with SQLite (dev) and Postgres/MySQL (prod)
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
4. Generate the Prisma client and apply migrations: `npx prisma generate && npx prisma migrate deploy`.

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

Build and tests must pass before a feature is considered done. See `docs/testing.md` for the full strategy and exact commands.

## Project structure

```
app/            Remix routes, entry points, and shared server/client modules
  routes/       OAuth, embedded pages, webhook, and billing routes
  shopify.server.ts   Shopify app config, session storage, webhook registration
prisma/         Prisma schema and migrations
docs/           PRD, architecture, rules, design, API contracts, phases, testing, memory, launch checklist
.env.example    Environment variable template
```

## License

License: MIT
