## Unreleased
- Added billing data models (plans, subscriptions, entitlements) shared across server and client.
- Implemented Stripe-backed checkout, cancellation, and webhook handling via `/api/billing/*` routes.
- Introduced billing dashboard with entitlement-gated UI cards and protected premium actions.
- Documented new billing environment variables in `.env.example` and README.
