# JobOS Revenue Recovery — PRD

## Original problem statement
Polished desktop-first multi-tenant SaaS web application called "JobOS Revenue Recovery."
Core promise: "Every customer gets a next step." Primary user: owner/operations manager at a
local HVAC or home-service business (2–25 employees). Business problem: service businesses lose
revenue when missed calls, new web leads, open estimates, and inactive past customers do not
receive a timely, accountable follow-up. JobOS identifies those opportunities, recommends the
best next action, creates an AI-assisted draft, and requires owner approval before high-impact
messages are sent. Positioning: approval-controlled revenue-recovery operating system. Demo
uses fictional data for Northstar Heating & Air in Newark, New Jersey.

## User personas
- **Northstar owner / ops manager (primary)** — needs a triaged, ranked list of revenue
  opportunities, one-click approval workflow, and a clear audit trail.
- **Assigned technician / office admin (secondary)** — receives assigned follow-ups.

## Architecture
- **Frontend:** React 19 + React Router + Tailwind + Shadcn/UI + Recharts + Sonner. Manrope
  headings, Inter body, dark navy (#0A0F1C) surfaces with purple (#7C5CFC) and mint (#00E5A8)
  accents. Left navigation on desktop, mobile nav on small screens.
- **Backend:** FastAPI + Motor (MongoDB). All routes prefixed with `/api`. Anonymous demo
  sessions persisted in the `sessions` collection keyed by `session_id` (kept in browser
  localStorage). Reset restores canonical seed state.
- **AI drafting:** Hybrid. Every opportunity ships with an approved seeded draft and rationale.
  `POST /api/demo/{sid}/opportunities/{oid}/regenerate` calls Claude Sonnet 4.6 via
  `emergentintegrations` (Emergent Universal LLM Key) with strict JSON validation; falls back
  to the seeded draft on failure. AI may only classify, prioritize, draft, recommend, and
  explain — it cannot mark messages sent or book appointments.

## Core requirements (static)
- Persistent "Demo Mode — Fictional Data" badge in header + info modal.
- Immutable-looking audit timeline for every AI/owner action.
- Estimated / Modeled / Recorded metrics clearly labeled.
- Approval required for high-impact outbound messages; nothing marked Sent without owner click.
- Simulated booking updates ledger, dashboard, and impact report atomically.
- Workflow builder uses editable panels (no drag-and-drop), with pause toggle and Test button.
- Fictional data only, addresses like `maya.thompson@example.com`.

## What's been implemented (2026-08-18)
- Full backend API for demo sessions, dashboard, opportunities (list/detail/action/regenerate),
  approvals queue, workflow CRUD + test, impact report, audit log, reset.
- 8 pages: Landing, Revenue Pulse Dashboard, Opportunity Inbox (tabs/search/sort), Opportunity
  Detail (AI rationale, draft editor, approve/edit/reject/snooze/assign/pause/book), Customer
  Profile, Approval Center, Workflow Builder (3 templates × 8 fields + pause + test), Impact
  Report (Estimated/Modeled/Recorded + Methodology + Export), Settings (Reset + New session).
- Maya Thompson end-to-end flow validated (backend + frontend): Needs Approval → Sent →
  Appointment Booked → ledger/dashboard/impact update.
- Session persistence via MongoDB; per-browser session ID in localStorage.
- Hybrid AI drafting with strict JSON validation and seeded fallback.
- Responsive mobile layout with card-based inbox and horizontal mobile nav.

## Ship-day correctness fix (2026-08-18)
- Fixed a double-count in `compute_impact()`: the Impact Report added `Appointment Booked` opp values on top of the already-incremented `business.recorded_recovered_revenue`, so Dashboard and Impact would disagree after any booking. Impact now reads directly from the persisted business KPIs so Dashboard, Ledger, and Impact Report all show the same numbers ($6,285/17 baseline → $6,710/18 after Maya).
- Hardened `build_seed_state()` with `copy.deepcopy(BUSINESS)` so each new/reset session gets an isolated `business` dict (prevents any future cross-session mutation of the seed constant).

## Iteration 3 — code review remediation (2026-08-18) — tested 100%/100%
- SessionContext: replaced silent empty catch with a warn log; also distinguishes 5xx (keep existing session) from stale/404 (create fresh session) to avoid session churn during transient backend outages.
- OpportunityDetailPage / BatchApprovalCard: list keys now content-based (`fact-{i}-{slice}`, `criteria-{i}-{slice}`) instead of raw index — stable across reorders.
- CustomerProfilePage: `useMemo` moved above the early return (rules-of-hooks) and now depends on the stable `data` reference so the memo actually memoizes.

## Iteration 4 — stable walkthrough IDs + non-public Playwright suite (2026-08-18)
- Added / renamed stable `data-testid` attributes on the public walkthrough controls (no visual or behavior changes): `enter-demo-workspace`, `nav-dashboard`, `nav-opportunities`, `maya-opportunity` (attached to Maya's Review button on desktop and to the Maya inbox card on mobile so it is always the primary navigation trigger), `maya-approval-review`, `approve-send`, `simulate-appointment-booked`, `nav-impact`, `demo-reset`.
- Created `/app/tests/walkthrough/` — a non-public Playwright suite that runs at 1440x900 against the deployed production URL, records the full session to 1080p WebM, and saves 6 named screenshots (baseline dashboard, Maya detail, approval center, ledger after send, dashboard after, impact report). Lives outside `/app/frontend` and `/app/backend`, is not imported by the public app, has its own `package.json` + `.gitignore`.
- E2E flow with the new stable IDs verified live on the preview URL: Dashboard baseline `$6,285/17` → after Maya loop `$6,710/18` (dashboard and impact match).

## Iteration 2 additions (2026-08-18) — tested 100% backend + frontend
- **Snooze Options** with 5 modes (1h, Tomorrow 9AM, Next business day, Next week, Custom).
  Auto-wake when `snoozed_until` passes; audit adds `Snoozed` + `Snooze Ended` events.
  Snooze Queue tab in Opportunity Inbox; Approval Center excludes snoozed items.
- **Owner Insights "What's Working"** module on Impact Report — comparison table across
  the three workflows using demo-session data, single careful recommendation, disclaimer.
- **Batch Approval** for Repeat Revenue seasonal tune-up campaigns ONLY. Explicitly excludes
  missed calls, new leads, and high-value estimates. Review dialog shows recipient count,
  criteria, exclusions, preview + `Approve N Demo Drafts` confirmation.
- **Print-friendly report view** via `@media print` on `.jobos-print-area` +
  simulated `Exported ✓` state (real PDF deferred).

## Backlog (prioritized)
### P1 — polish and depth
- Real PDF export for Impact Report (currently simulated success).
- Per-opportunity assignment picker (currently defaults to "Ops Team").
- Deep-link email compose sheet for Email-channel drafts (subject + body split editor).
- Snooze duration picker (currently instant status change).
- Batch approval flow for campaign-eligible reactivations.

### P2 — nice-to-have
- Recharts area chart with mint-purple gradient for the trend widget.
- Session TTL / auto-expiry after 48 hours of inactivity.
- Per-workflow analytics drill-down (open rate, reply rate, conversion).
- CSV export of the audit timeline.
- Confetti / celebration animation on first Appointment Booked in a session.
