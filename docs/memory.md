# Project Memory: shopify-remix-starter

Running log of what is done, what is in flight, and decisions worth remembering. Keep entries short and dated. Newest first within each section.

## Completed

- 2026-07-15 — Planning documentation created (README, PRD, architecture, rules, design, API contracts, phases, testing, memory, launch checklist, `.env.example`).

## In progress

- _(none yet)_

## Decisions log

- 2026-07-15 — Admin API access is GraphQL-only in new code; the REST client is not used.
- 2026-07-15 — All UI uses Polaris tokens and components; no custom theme or CSS framework.
- 2026-07-15 — Session storage uses Prisma; SQLite in development, Postgres/MySQL in production via `DATABASE_URL`.
- 2026-07-15 — Billing ships as a config-toggleable scaffold so the starter installs without forcing a charge.
- 2026-07-15 — Dependency versions are pinned exactly and the lockfile is committed with any dependency change.
