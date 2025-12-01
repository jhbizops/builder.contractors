## Unreleased
- Added database bootstrap on server start to create required tables when missing.
- Added billing data models (plans, subscriptions, entitlements) shared across server and client.
- Implemented Stripe-backed checkout, cancellation, and webhook handling via `/api/billing/*` routes.
- Introduced billing dashboard with entitlement-gated UI cards and protected premium actions.
- Documented new billing environment variables in `.env.example` and README.
- Memoised sales dashboard filters/stats, lazy-loaded the lead modal, and covered the helpers with tests to improve perceived responsiveness.
- Simplified signup by defaulting all new accounts to the shared industry role (no sales vs builder choice) while keeping admin provisioning intact.
