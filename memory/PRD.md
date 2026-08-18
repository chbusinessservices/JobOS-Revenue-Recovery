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

## What's been implemented (2026-02-18)
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
