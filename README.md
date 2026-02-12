# Builder Contractors

Internal dashboards for Builder.Contractors covering sales, builder, admin, and billing experiences.

## UX backlog
- UX execution tasks and sequencing live in `docs/ux/tasks.md`.

## Setup
- Install dependencies: `pnpm install`
- Run dev server: `pnpm dev`
- Run tests: `pnpm test`
- Type/lint: `pnpm typecheck && pnpm lint`
- First bootstraps the database schema on server start if tables are missing.

## Environment variables
Copy `.env.example` to `.env` and set:
- `DATABASE_URL` for Postgres access
- `SESSION_SECRET` for Express sessions
- `RELEASE_DATE` (YYYY-MM-DD) for sitemap lastmod generation
- Stripe billing keys: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`, `STRIPE_WEBHOOK_SECRET`


## SEO and GEO
- Public crawler endpoints: `/sitemap.xml`, `/robots.txt`, `/llms.txt`, and `/llms-full.txt`.
- Marketing pages inject canonical, hreflang alternates, social metadata, and crawler directives (`robots`, `googlebot`, `bingbot`) via `HeadManager`.
- Home page publishes expanded JSON-LD for `Organization`, `WebSite`, `WebPage`, and `Service` entities to improve search and AI retrieval context.

## Billing flows
- Plans and quotas are stored in `shared/schema.ts` and seeded on server start.
- Server endpoints: `/api/billing/plans`, `/api/billing/subscription`, `/api/billing/checkout`, `/api/billing/cancel`, `/api/billing/webhook`.
- React billing page lives at `/dashboard/billing` with upgrade/downgrade/cancel actions and entitlement-aware UI gates.

## Jobs API
- Endpoints: `/api/jobs` for create/list, `/api/jobs/:id` for updates, `/api/jobs/:id/status` for transitions, `/api/jobs/:id/assign` for owner/admin assignment, `/api/jobs/:id/claim` for self-claiming unassigned jobs, and `/api/jobs/:id/activity` for history.
- Activity updates: `/api/jobs/:id/activity` now supports POST for collaboration requests/comments with optional attachment metadata; activity logs return the details payload alongside timestamps.
- Statuses: `open`, `in_progress`, `completed`, `on_hold`, `cancelled`.
- Authorization: owners/admins can mutate; assignees can transition status; only approved builders/admins can create, assign, or claim jobs; anyone authenticated can list/claim open unassigned jobs when approved.
- UI: `/dashboard/jobs` surfaces a Job Board with trade/region/status filters, claim and collaboration requests, and a shared job poster modal; the Builder dashboard adds My jobs/Shared with me tabs for assignment, status control, and file/comment threads.

## Leads & Services API
- Leads endpoints: `/api/leads` (list/create), `/api/leads/:id` (update/delete), `/api/leads/:id/comments` (list/add), `/api/leads/:id/activity` (list/add).
- Services endpoints: `/api/services` (list/create) and `/api/services/:id` (update).
- All endpoints are authenticated and validated with Zod; React Query clients optimistically update UI and refetch after mutations.

## Ads & Insights API
- Ads endpoints: `/api/ads` (create), `/api/ads/:id/status` (status updates), `/api/ads/:id/reviews` (admin review submissions).
- Delivery endpoint: `/api/ads/delivery` (GET) returns eligible creatives for the authenticated user based on role, trade, region, caps, and approval status.
- Insights endpoint: `/api/ads/insights` (GET) returns k-anonymized counts grouped by trade and region (no precise locations or user identifiers).
- Response shape:
  ```json
  {
    "minimumCount": 5,
    "insights": [
      {
        "trade": "plumbing",
        "region": "NSW",
        "count": 12
      }
    ]
  }
  ```

## Authentication
- Login and registration are protected with per-IP and per-email rate limits; repeated failures return generic errors with `Retry-After` guidance and valid credentials reset the failed-attempt counter.

## Performance
- Sales dashboard filtering and stats are memoised to keep list interactions responsive, and the lead detail modal loads lazily to reduce the initial bundle.
- Lead file uploads support drag-and-drop with inline validation/virus scanning and image/PDF previews to keep attachment workflows quick and safe.
