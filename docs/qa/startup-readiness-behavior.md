# Startup and readiness behavior

## Boot sequence

The HTTP process now starts with minimal synchronous boot work:

1. Construct Express middleware and route bindings.
2. Start the HTTP listener.
3. Run startup dependencies in the background with retry/backoff.

This keeps process liveness independent from transient external failures.

## Health endpoints

- `GET /healthz` is **liveness only** and always fast (`200`, `{ status: "live" }`).
- `GET /healthz/ready` reports dependency-level readiness and returns:
  - `200` when all **critical** dependencies are healthy.
  - `503` when one or more critical dependencies are still pending or errored.

## Dependency policy (degrade vs block)

### Blocking readiness

- `database` (critical)
  - Work: schema/bootstrap checks and DB probe.
  - Effect when failing: readiness is `not_ready` (`503`), but process stays alive.

### Degraded but non-blocking

- `stripe` (non-critical)
  - Effect when failing: billing features can degrade, readiness may still be `ready` if critical dependencies pass.
- `billing_plan_sync` (non-critical)
  - Effect when failing: plan synchronization is retried in background with exponential backoff.

## Retry/backoff behavior

Background startup jobs are idempotent and started once per process. On failure they emit structured JSON logs with:

- `event`
- `job`
- `attempt`
- `critical`
- `retryInMs`
- `error`
- `timestamp`

Retries use exponential backoff with per-job base/max delay configuration.
