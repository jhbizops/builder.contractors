# 90-Day AEO Implementation Plan (ELYMENT Internal Products)

## Scope
- Products: Matrix, Startnote, Projeqt, Elyment IQ, Synq Contacts.
- Goal: improve AI-answer-engine citation share while protecting qualified traffic and conversion quality.
- Timebox: 90 days (3 phases of 30 days).

## PLAN

### What will be built
1. **AEO Content Contract** for citation-ready pages (answer-first blocks, schema baseline, freshness metadata).
2. **Citation Observability Pipeline** (tracked query set, answer-engine citation capture, overlap/velocity metrics).
3. **Zero-Click Mitigation Flows** (entity reinforcement, follow-up intent hooks, conversion paths optimized for branded return sessions).
4. **Governance Loop** (weekly triage, risk review, rollout checklist, rollback criteria).

### Key decisions made
- Prioritize **citability and grounding quality** over classic rank movement because answer engines synthesize from broader source types.
- Use **incremental changes on existing page templates** rather than a full CMS migration to reduce risk and speed delivery.
- Track both **citation KPIs** and **business KPIs** (assisted pipeline influence, conversion quality), not traffic alone.

### Explicit assumptions
- Existing public routes and structured-data components remain the primary publication surface.
- Teams can allocate at least one engineering and one content owner each sprint.
- No architecture-level rewrite is required during this 90-day window.

### Risks
- **Measurement ambiguity:** citation telemetry differs by platform and can drift without warning.
- **Over-optimization risk:** content may become repetitive if written only for extractability.
- **Traffic mix volatility:** informational sessions may decline while assisted conversions rise.
- **Operational overhead:** weekly answer sampling can become manual toil without automation.

### Rejected alternative
- **Alternative:** full SEO-to-AEO platform replacement in one quarter.
- **Rejected because:** high migration risk, longer lead time, and unnecessary disruption compared with incremental hardening of current stack.

## FILE TREE (proposed / changed)
- `docs/seo/aeo-90-day-implementation-plan.md` (new)
- `CHANGELOG.md` (updated unreleased docs entry)

## IMPLEMENTATION

### Phase 1 (Days 1-30): Foundation + Instrumentation
- Define canonical query clusters by product and intent (informational, evaluative, transactional).
- Create an answer-ready template standard:
  - direct answer summary (50-90 words),
  - facts table,
  - explicit “last reviewed” timestamp,
  - source/provenance block.
- Standardize JSON-LD for key page types and ensure canonical consistency.
- Build baseline dashboard:
  - citation share by domain and page,
  - overlap with top organic URLs,
  - zero-click proxy indicators.

**Exit criteria**
- 20 priority pages mapped and standardized.
- Weekly citation capture runs automatically.
- Baseline metrics frozen for comparison.

### Phase 2 (Days 31-60): Expansion + Quality Controls
- Expand citation-ready formatting to highest-impact routes and help center surfaces.
- Add freshness SLAs:
  - policy/process pages ≤ 30 days review window,
  - pricing/feature pages ≤ 14 days review window.
- Introduce content QA checks in CI for required metadata blocks and schema presence.
- Add internal linking focused on entity clarity and task completion paths.

**Exit criteria**
- 60+ priority pages upgraded.
- Freshness SLA alerts active.
- CI catches missing schema/metadata regressions before merge.

### Phase 3 (Days 61-90): Optimization + Governance
- Run weekly query experiments (prompt framing, comparison intents, long-tail operational intents).
- Tune pages for high-value citation contexts (decision support, implementation guidance, operational checklists).
- Establish governance cadence:
  - weekly AEO review,
  - monthly risk/performance checkpoint,
  - documented rollback procedure for negative conversion impact.
- Publish executive scorecard and next-quarter backlog.

**Exit criteria**
- Citation share trend positive across priority query set.
- No material regression in qualified conversions.
- Governance loop accepted by product and engineering leads.

## TESTS (Measurement + Quality)
- Citation telemetry validation (positive path): ingestion jobs parse and persist sampled citations.
- Citation telemetry validation (negative path): malformed payloads rejected with typed errors.
- Schema presence checks (positive path): required JSON-LD blocks present on targeted pages.
- Schema presence checks (negative path): CI fails when required metadata is absent.
- Routing/ownership checks: each high-priority page has assigned owner + freshness SLA.

## COMMANDS
- Install: `corepack enable && pnpm install --frozen-lockfile`
- Dev: `pnpm dev`
- Test: `pnpm test`
- Build: `pnpm build`
- Start: `pnpm start`
- Seed/Migrate (if needed): `pnpm drizzle:push`

## README / CHANGELOG
- Add a docs index link to this plan if a docs table of contents is introduced.
- Keep environment variable names identical across Replit and GitHub CI.
- Changelog entry included for internal visibility of strategy/workstream changes.

## RISKS & PERFORMANCE
- **Targets (initial):**
  - API p95 ≤ 250 ms for telemetry endpoints.
  - Client bundle impact ≤ +30 KB gzip for any instrumentation UI.
- **Hot paths:** public page render, schema injection, telemetry ingestion.
- **Mitigations:** cache derived metrics, keep extraction lightweight, and cap query-sampling volume per run.

## NOTES
- This plan intentionally separates ranking metrics from citation metrics to avoid false positives.
- Follow-up: implement product-specific query libraries and ownership matrix by team.
