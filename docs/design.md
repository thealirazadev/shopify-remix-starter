# Design: shopify-remix-starter

The embedded admin UI is built entirely with Shopify Polaris. This document defines how the UI looks and behaves. There is no custom visual design work: the app must feel native inside Shopify Admin.

## Design source: Polaris tokens, not a hand-rolled theme

- **Color, typography, and spacing all come from Polaris design tokens.** Do not define a custom color palette, font stack, or spacing scale. Do not hardcode hex values, pixel paddings, or font sizes in components.
- Wrap the app in Polaris `AppProvider` (with the appropriate locale) and import Polaris styles once at the root. All components inherit tokens from there.
- Layout uses Polaris primitives (`Page`, `Layout`, `Card`, `BlockStack`, `InlineStack`, `Box`) rather than custom flex/grid CSS.
- If a one-off spacing or color need arises, use the corresponding Polaris token, not a literal value. If no token fits, treat it as a design question and flag it rather than inventing a value.

## Screens and Polaris components

### Embedded layout (`app.tsx`)
Shared shell for all embedded routes.
- `AppProvider` (Polaris) for tokens and i18n.
- App Bridge `NavMenu` for top-level navigation between the sample page and the additional page.
- Renders the matched child route inside the frame.

### Sample admin page (`app._index.tsx`)
- `Page` with a title and an optional primary action.
- `Layout` with `Layout.Section` regions.
- `Card` containing shop data (for example shop name and a short product list rendered with `ResourceList` or `IndexTable`).
- A form built from `FormLayout`, `TextField`, and `Button` to edit the example `ShopSetting.label`.
- `Banner` for surfacing errors (tone `critical`) or success (tone `success`), or App Bridge `Toast` for transient success.
- `Text` for headings and body copy, using Polaris typography variants.

### Additional page (`app.additional.tsx`)
- `Page`, `Layout`, `Card`, `Text` demonstrating App Bridge navigation and a second route.
- No data mutation; exists to prove navigation and layout patterns.

### Login page (`auth.login/route.tsx`)
Non-embedded, shown only when starting OAuth outside Admin.
- `Page`, `Card`, `FormLayout`, `TextField` (shop domain), `Button` (submit).
- `Text` for instructions.

### Error and empty states
- Remix `ErrorBoundary` renders a Polaris `Page` + `Banner` (tone `critical`) with a friendly message and a way back.
- Empty data (no products, no setting yet) renders Polaris `EmptyState` with guidance, not a blank card.

## Component states

Every interactive component must define and handle these states:

- **Default** — Idle, data loaded.
- **Loading** — Use `Button` `loading` prop during submits and Polaris `SkeletonBodyText` / `SkeletonPage` while a loader is fetching. App Bridge `Loading` for full-page transitions where appropriate.
- **Disabled** — Buttons disabled while a submit is in flight or when required input is missing.
- **Error** — Field-level errors via `TextField` `error` prop; page-level errors via `Banner`.
- **Success** — `Banner` (tone `success`) or App Bridge `Toast`.
- **Empty** — `EmptyState` when a list or record has no data.

## Accessibility

- **Polaris + WCAG** — Rely on Polaris components, which meet WCAG 2.1 AA for color contrast, focus states, and semantics. Do not override focus outlines or reduce contrast.
- **Labels** — Every `TextField`, `Select`, and control has a visible, associated label. Never use placeholder text as the only label.
- **Keyboard** — All actions reachable and operable by keyboard; do not trap focus. Preserve Polaris default tab order.
- **Announcements** — Use `Banner` and `Toast` for status changes so assistive tech announces them; do not signal state with color alone.
- **App Bridge navigation** — Use App Bridge `NavMenu` and navigation APIs so route changes update the Admin URL and history correctly and remain accessible within the embedded frame. Do not use raw `<a>` links for cross-route embedded navigation that would break framing.
- **Headings** — Use Polaris `Text` heading variants in a logical order (one page title, then section headings) so the document outline is correct.
