# JobOS Walkthrough Test — INTERNAL USE ONLY

Non-public Playwright walkthrough that records the full Maya E2E flow on the deployed
production URL at 1440x900 and saves both a video and named screenshots.

This suite is intentionally kept **outside** `/app/frontend` and `/app/backend` so it is
never served, imported, or referenced by the public JobOS app.

## Install (one-time, local machine)

```bash
cd /app/tests/walkthrough
npm install
npx playwright install chromium
```

## Run

```bash
# Default: run against the deployed production URL
npx playwright test

# Override the target URL (e.g., staging, preview, localhost)
BASE_URL=https://revenue-recovery-31.emergent.host npx playwright test
```

## Artifacts

After a run, `./artifacts/` contains:

- `walkthrough.webm` — full-run video at 1440x900 (Playwright default; convert to MP4 with `ffmpeg -i walkthrough.webm walkthrough.mp4`)
- `01_baseline_dashboard.png` — Dashboard baseline ($6,285 / 17 appts)
- `02_maya_detail.png` — Maya's Revenue Memory / opportunity detail
- `03_approval_center.png` — Approval Center queue
- `04_ledger_after_send.png` — Opportunity ledger after Approve + Send
- `05_dashboard_after.png` — Dashboard after simulated booking ($6,710 / 18 appts)
- `06_impact_report.png` — Impact Report

## What it validates

1. Fresh anonymous demo session created on production URL entry
2. Baseline Dashboard: $6,285 recovered / 17 appointments booked
3. Maya Thompson opportunity ($425 missed call) opens correctly
4. Approve and Send transitions the draft to Sent
5. Simulated appointment booked updates ledger, dashboard, and impact
6. Dashboard after: $6,710 recovered / 18 appointments booked
7. Impact Report reflects the same recorded values

## Safety

- Uses only public data-testid attributes present in the production build
- Does not depend on any hidden test route or private control
- Resets the visitor's own demo session via the standard `demo-reset` control at the end
- All values remain fictional per the Demo Mode disclaimer
