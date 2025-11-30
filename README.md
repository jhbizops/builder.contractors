# Builder Contractors

Internal dashboards for Builder.Contractors covering sales, builder, admin, and billing experiences.

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
- Stripe billing keys: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`, `STRIPE_WEBHOOK_SECRET`

## Billing flows
- Plans and quotas are stored in `shared/schema.ts` and seeded on server start.
- Server endpoints: `/api/billing/plans`, `/api/billing/subscription`, `/api/billing/checkout`, `/api/billing/cancel`, `/api/billing/webhook`.
- React billing page lives at `/dashboard/billing` with upgrade/downgrade/cancel actions and entitlement-aware UI gates.
