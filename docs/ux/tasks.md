# UX execution task backlog

This backlog turns the “perfect flow” UX plan into sequenced, testable tasks for Builder.Contractors. It assumes multi-tenant RBAC enforcement remains authoritative on the server and that UI gates are convenience-only.

## Outcomes and guardrails
- Make the next action obvious on every protected route.
- Standardise structure so users can transfer learning across roles.
- Reduce avoidable errors by surfacing permission and data requirements before mutation attempts.
- Keep scope minimal by layering reusable primitives before page rewrites.

## Epic 1 — Document the UX contract

### Task 1.1 — Define information architecture and role navigation
- **Scope**: Create `docs/ux/information-architecture.md` describing top-level nav, role/entitlement visibility rules, and canonical route labels.
- **Acceptance criteria**:
  - Documents every protected route under `/dashboard/*`.
  - Lists the required entitlement(s) for each route.
  - Identifies the default landing route per role.

### Task 1.2 — Define page templates and state standards
- **Scope**: Create `docs/ux/page-templates.md` defining the required page sections, CTA placement, and loading/empty/error states.
- **Acceptance criteria**:
  - A single template exists for “overview”, “list/detail”, and “settings”.
  - Each template specifies where the primary CTA goes.
  - Each template prescribes a standard empty state with a safe next action.

### Task 1.3 — Define core user flows
- **Scope**: Create `docs/ux/flows.md` for the Sales lead flow, Builder job flow, and Admin setup/billing/reporting flow.
- **Acceptance criteria**:
  - Each flow is expressed as numbered steps.
  - Each step includes the user intent and system response.
  - Each flow identifies failure states and how they are handled.

## Epic 2 — Build the shared app shell primitives

### Task 2.1 — Introduce a role-aware navigation model
- **Scope**: Add `client/src/lib/navigation.ts` that returns navigation sections based on role and entitlements.
- **Implementation notes**:
  - Accept a validated `role` and `entitlements` input.
  - Keep policy decisions in one place to reduce drift.
- **Acceptance criteria**:
  - All dashboard routes are defined in one typed config.
  - Hidden routes are fully excluded, not just disabled.
  - Route labels are consistent with the IA document.

### Task 2.2 — Implement `AppShell` layout
- **Scope**: Add `client/src/components/app-shell/AppShell.tsx` with sidebar, top bar, and content slot.
- **Acceptance criteria**:
  - Shell renders consistently across all protected routes.
  - Content area supports page-level scroll while keeping navigation stable.
  - Shell works for both desktop and small-screen layouts.

### Task 2.3 — Implement shell building blocks
- **Scope**:
  - `SidebarNav.tsx`
  - `TopBar.tsx`
  - `Breadcrumbs.tsx`
  - `CommandPalette.tsx`
- **Acceptance criteria**:
  - Sidebar uses the central navigation model.
  - Breadcrumbs reflect the current route label hierarchy.
  - Command palette supports route navigation without exposing hidden routes.
  - All interactive elements are keyboard accessible.

### Task 2.4 — Apply shell to protected routes
- **Scope**: Wrap protected pages so they render inside `AppShell` without rewriting their business logic.
- **Acceptance criteria**:
  - `/dashboard/*` routes render inside the shell.
  - Public pages (`/`, `/login`, `/register`, marketing pages) remain unchanged.
  - No role loses access to previously reachable routes.

## Epic 3 — Standardise page composition

### Task 3.1 — Create page layout primitives
- **Scope**:
  - `client/src/components/page/PageLayout.tsx`
  - `client/src/components/page/PageHeader.tsx`
- **Acceptance criteria**:
  - `PageHeader` supports title, description, primary CTA, and secondary actions.
  - `PageLayout` composes header, optional stats row, and main content.
  - Primitives are presentation-only and do not fetch data.

### Task 3.2 — Create state primitives
- **Scope**:
  - `client/src/components/states/LoadingState.tsx`
  - `client/src/components/states/EmptyState.tsx`
  - `client/src/components/states/ErrorState.tsx`
- **Acceptance criteria**:
  - Empty state requires a primary action.
  - Error state supports retry and safe fallback navigation.
  - Loading state avoids layout shift by matching page structure.

### Task 3.3 — Refactor dashboards to templates incrementally
- **Scope**: Update one dashboard at a time to use `PageLayout`, `PageHeader`, and state primitives.
- **Order**:
  1. Sales dashboard
  2. Builder dashboard
  3. Admin dashboard
- **Acceptance criteria**:
  - Each dashboard has one obvious primary CTA.
  - Stats and filters are consistently placed.
  - Permission failures are explained before mutation attempts.

## Epic 4 — Optimise the highest value flows

### Task 4.1 — Sales lead flow improvements
- **Scope**:
  - Make “Add lead” the primary CTA.
  - Ensure filters are explicit and resettable.
  - Ensure lead detail actions align to permissions.
- **Acceptance criteria**:
  - Users can add a lead in <= 2 clicks from `/dashboard/sales`.
  - Filters clearly show their active state.
  - Negative paths provide a specific, non-sensitive reason.

### Task 4.2 — Builder job flow improvements
- **Scope**:
  - Make “Post job” the primary CTA.
  - Clarify collaboration rules before assign/status actions.
  - Emphasise job lifecycle stages.
- **Acceptance criteria**:
  - Users can post a job in <= 2 clicks from `/dashboard/builder`.
  - Assignment controls reflect ownership/admin rules.
  - Status changes are gated with clear inline guidance.

### Task 4.3 — Admin setup and governance flow
- **Scope**:
  - Convert admin setup into a checklist with progress.
  - Make high-risk actions require explicit confirmation context.
- **Acceptance criteria**:
  - Admin setup communicates remaining required steps.
  - Destructive actions show tenant context and impact.
  - Billing/reporting links are discoverable without clutter.

## Epic 5 — Quality, safety, and regression protection

### Task 5.1 — Navigation and gating tests
- **Scope**: Add tests beside `navigation.ts` and shell components.
- **Acceptance criteria**:
  - Role-based nav visibility is fully covered for positive and negative cases.
  - Hidden routes do not appear in the command palette.
  - Tests do not require network access.

### Task 5.2 — Page template usage tests
- **Scope**: Add component tests verifying CTA presence and state behaviour.
- **Acceptance criteria**:
  - Empty states always render a primary action.
  - Error states provide retry affordances.
  - Coverage on changed lines is >= 80%.

### Task 5.3 — Performance verification checklist
- **Scope**: Document how to measure bundle impact and perceived load performance.
- **Acceptance criteria**:
  - Includes a bundle-size check step.
  - Identifies route-level lazy loading expectations.
  - Captures before/after metrics for the sales and builder dashboards.

## Suggested execution order
1. Epic 1 (contract) — prevents rework.
2. Epic 2 (shell) — creates the foundation.
3. Epic 3 (templates) — enforces consistency.
4. Epic 4 (flows) — improves outcomes.
5. Epic 5 (tests/perf) — prevents regressions.

## Definition of done
- Shell and page templates are in place and used by the dashboard routes.
- Each role’s default journey has a clear primary CTA and predictable layout.
- Navigation, gating, and page states are covered by automated tests.
- Documentation reflects the contract and flow decisions.
