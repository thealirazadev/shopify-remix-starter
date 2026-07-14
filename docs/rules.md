# Engineering Rules: shopify-remix-starter

These rules are binding for anyone working in this repository. When a rule and a request conflict, follow the rule and flag the conflict.

## Conventions

### Preferred libraries and patterns
- Use `@shopify/shopify-app-remix` for all auth, session, webhook, and billing work. Do not hand-write OAuth, HMAC checks, or session token validation.
- Use `authenticate.admin(request)` at the top of every embedded loader and action to get an authenticated `admin` client and `session`.
- Use the Admin GraphQL API (`admin.graphql(...)`) for shop data. Avoid the REST client; new code is GraphQL-only.
- Use Prisma for all database access through the shared client in `app/db.server.ts`. Never instantiate `PrismaClient` ad hoc.
- Use Polaris components for all UI. Do not add another component or CSS framework.
- Use App Bridge (`@shopify/app-bridge-react`) for navigation, toasts, and pickers inside the embedded app.

### What to avoid
- No REST Admin API calls in new code.
- No direct `fetch` to Shopify endpoints that a package helper already covers.
- No global client-side state library (Redux, Zustand, etc.); Remix loaders/actions hold state.
- No hand-rolled theme, custom colors, or inline style objects that bypass Polaris tokens.
- No `any` types to silence the compiler; model the real shape.

### Naming
- **Route files** — Follow Remix flat-route conventions. Embedded routes live under the `app.*` prefix (`app._index.tsx`, `app.additional.tsx`). Auth routes use `auth.$.tsx` and `auth.login`. The webhook route is `webhooks.tsx`.
- **Server-only modules** — Suffix `.server.ts` (for example `db.server.ts`, `shopify.server.ts`, `logger.server.ts`) so they never reach the client bundle.
- **Files** — kebab-case for non-route modules (`logger.server.ts`), route files follow Remix conventions.
- **Functions and variables** — `camelCase`. Booleans read as predicates (`isEmbedded`, `hasActivePayment`).
- **React components** — `PascalCase`, one primary component per file, filename matches the component or route.
- **Prisma models** — `PascalCase` singular (`Session`, `ShopSetting`); fields `camelCase`.
- **Types and interfaces** — `PascalCase`; do not prefix interfaces with `I`.

### Commit format
- Conventional Commits with a short imperative subject: `type(scope): subject`.
- Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`.
- Example: `feat(webhooks): verify HMAC and dispatch by topic`.
- **ONE COMMIT PER FEATURE.** Each feature or task is its own commit. Never batch multiple features into one commit. See `docs/phases.md` for the ordered commit list per phase.

### Dependencies and migrations
- Pin exact dependency versions (no `^` or `~`) in `package.json`, and commit `package-lock.json` in the same commit that changes dependencies.
- Do not add, upgrade, or remove a dependency without approval (see Boundaries).
- **Prisma migration rule:** schema changes happen only through `npx prisma migrate dev --name <change>`. Never edit the database by hand and never edit a migration that has already been applied or committed. If a migration was wrong, create a new migration that corrects it.

## Error handling and logging

- Every external call (Admin GraphQL, database, billing, webhook processing) must handle failure explicitly. No unguarded awaits on network or DB calls.
- Distinguish user-facing errors from logs. Users see a short, friendly message in a Polaris `Banner` or toast. Detailed context (request id, shop, topic, error stack) goes only to the logs.
- Never render a stack trace or raw error object to the user. Map unexpected errors to a generic message.
- Use one consistent error format everywhere (see `app/lib/errors.ts` and the shape in `docs/api-contracts.md`): `{ error: { code, message, requestId } }` for JSON responses.
- Structured logging from day one via `app/lib/logger.server.ts`: log JSON lines with at least `level`, `msg`, `shop` (when known), and `requestId`. No `console.log` in committed code.
- Loaders and actions catch expected errors and return typed data with an error field; unexpected errors bubble to the Remix `ErrorBoundary`, which renders a friendly Polaris page.

## Security

- No hardcoded secrets. All secrets come from environment variables loaded from `.env` (never committed). `.env.example` documents every variable with a dummy value.
- Verify HMAC on every webhook. Rely on `authenticate.webhook(request)` from the Shopify package; reject invalid signatures with 401 and log the attempt.
- Validate session tokens on every embedded request via `authenticate.admin(request)`. Never trust `shop` or `host` query params without going through the authenticator.
- Validate all input server-side in actions before use: required fields present, expected types, length limits. Never rely on client validation alone.
- **Protected routes and access:**
  - `app.*` routes require a valid Admin session token; unauthenticated requests are redirected into OAuth.
  - `webhooks.tsx` requires a valid HMAC; it is not user-facing and has no session.
  - `auth.$.tsx` and `auth.login` are public (they start OAuth) but perform their own state/nonce checks through the package.
  - Billing-gated routes additionally require an active subscription; document which routes are gated in code comments and in `docs/api-contracts.md`.

## Simplicity (YAGNI / KISS)

- Build only what a phase requires. Do not add abstraction for hypothetical future features.
- The sample page and example model exist to be replaced; keep them minimal.
- Prefer the framework's built-in solution over a custom one. If Remix or the Shopify package already does it, use that.
- No premature generalization: no plugin systems, no config-driven UI, no speculative interfaces.

## Code style

- Comments are sparse and explain *why*, not *what*. Delete commented-out code.
- Docstrings are concise: one line on non-obvious exported functions describing purpose and important side effects.
- No emoji anywhere in code, comments, commits, or docs.
- No mention of AI tools, assistants, or authorship attribution anywhere in the codebase or history.
- Run Prettier and ESLint (Shopify config) before committing; committed code is formatted and lint-clean.
- Conventional Commits as described above.

## Boundaries

- No wholesale delete or rewrite of working code. Make focused, reviewable changes.
- Do not change `docs/PRD.md` or `docs/architecture.md` without explicitly flagging the change and getting approval first.
- No new dependency (or version bump) without approval; propose it, state why, and wait.
- When a requirement is ambiguous, ask before implementing. Do not guess at product behavior.
- Stop after two failed attempts to fix the same problem; report what was tried and the current state instead of continuing to churn.
- Classify every requested change as: **current phase** (do it now), **new phase** (plan it in `docs/phases.md`), or **backlog** (record it in the phases Backlog). Do not silently expand the current phase's scope.
