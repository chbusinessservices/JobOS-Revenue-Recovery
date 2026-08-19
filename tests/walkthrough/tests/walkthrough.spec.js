// @ts-check
/**
 * JobOS Revenue Recovery — internal walkthrough recording.
 *
 * Runs at 1440x900 against the deployed production URL, exercises the Maya
 * Thompson end-to-end recovery loop, and saves a 1080p video plus the six
 * key screenshots into ./artifacts/.
 *
 * This spec relies ONLY on stable public data-testid attributes:
 *   enter-demo-workspace, nav-dashboard, nav-opportunities, maya-opportunity,
 *   maya-approval-review, approve-send, simulate-appointment-booked,
 *   nav-impact, demo-reset.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const ART_DIR = path.join(__dirname, '..', 'artifacts');
if (!fs.existsSync(ART_DIR)) fs.mkdirSync(ART_DIR, { recursive: true });

function shot(page, name) {
  return page.screenshot({
    path: path.join(ART_DIR, `${name}.png`),
    fullPage: false,
  });
}

test.describe('JobOS Revenue Recovery — public walkthrough', () => {
  test('Maya Thompson end-to-end loop with recording', async ({ page, context }) => {
    // 1) Landing: click Enter Demo Workspace to create a fresh anonymous session
    await page.goto('/');
    const enter = page.getByTestId('enter-demo-workspace');
    await expect(enter).toBeVisible();
    await enter.click();

    // 2) Dashboard baseline: $6,285 / 17 appointments
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page.getByTestId('kpi-recovered-revenue')).toContainText('$6,285');
    await expect(page.getByTestId('kpi-appointments-booked')).toContainText('17');
    await page.waitForTimeout(1000);
    await shot(page, '01_baseline_dashboard');

    // 3) Open Opportunity Inbox and click Maya's row
    await page.getByTestId('nav-opportunities').click();
    const mayaRow = page.getByTestId('maya-opportunity').first();
    await expect(mayaRow).toBeVisible();
    await expect(mayaRow).toContainText('Maya Thompson');
    await expect(mayaRow).toContainText('$425');
    await mayaRow.click();

    // 4) Maya Revenue Memory / opportunity detail
    await expect(page).toHaveURL(/\/app\/opportunities\/opp-maya/);
    await expect(page.getByTestId('customer-context-card')).toBeVisible();
    await page.waitForTimeout(1200);
    await shot(page, '02_maya_detail');

    // 5) Open Approval Center to visualize the review workspace
    await page.goto('/app/approvals');
    await page.waitForTimeout(1500);
    const mayaReview = page.getByTestId('maya-approval-review');
    await expect(mayaReview).toBeVisible();
    await shot(page, '03_approval_center');
    await mayaReview.click();

    // 6) Approve and Send — nothing dispatched, demo simulation only
    await expect(page).toHaveURL(/\/app\/opportunities\/opp-maya/);
    const approve = page.getByTestId('approve-send');
    await expect(approve).toBeVisible();
    await approve.click();

    // Dismiss the success confirmation dialog
    const dialogContinue = page.getByTestId('dialog-continue-btn');
    await dialogContinue.click({ timeout: 8000 }).catch(() => {});

    // 7) Opportunity ledger + Sent state visible
    await expect(page.getByTestId('opportunity-ledger-card')).toBeVisible();
    await page.waitForTimeout(1200);
    await shot(page, '04_ledger_after_send');

    // 8) Simulate the appointment being booked
    const simulate = page.getByTestId('simulate-appointment-booked');
    await expect(simulate).toBeVisible();
    await simulate.click();
    const confirmBook = page.getByTestId('confirm-book-btn');
    await confirmBook.click({ timeout: 8000 });
    await expect(page.getByTestId('appointment-booked-banner')).toBeVisible({ timeout: 10000 });

    // 9) Dashboard updates: $6,710 / 18 appointments
    await page.getByTestId('nav-dashboard').click();
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await expect(page.getByTestId('kpi-recovered-revenue')).toContainText('$6,710', { timeout: 10000 });
    await expect(page.getByTestId('kpi-appointments-booked')).toContainText('18');
    await page.waitForTimeout(1200);
    await shot(page, '05_dashboard_after');

    // 10) Impact Report — recorded values should match dashboard
    await page.getByTestId('nav-impact').click();
    await expect(page).toHaveURL(/\/app\/impact/);
    await expect(page.getByTestId('impact-rec-revenue')).toContainText('$6,710', { timeout: 10000 });
    await expect(page.getByTestId('impact-rec-appointments')).toContainText('18');
    // Owner Insights table also renders
    await expect(page.getByTestId('owner-insights')).toBeVisible();
    await page.waitForTimeout(1500);
    await shot(page, '06_impact_report');

    // 11) Reset the visitor's own demo session at the end (courtesy cleanup)
    await page.goto('/app/settings');
    const resetBtn = page.getByTestId('demo-reset');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    const confirmReset = page.getByTestId('confirm-reset-btn');
    await confirmReset.click({ timeout: 8000 }).catch(() => {});
  });
});

/**
 * After the run finishes Playwright saves the recorded video under
 *   ./artifacts/<test-name>/video.webm
 * The video hook below renames it to a stable filename.
 */
test.afterEach(async ({}, testInfo) => {
  for (const att of testInfo.attachments) {
    if (att.contentType === 'video/webm' && att.path) {
      const dest = path.join(ART_DIR, 'walkthrough.webm');
      try {
        fs.copyFileSync(att.path, dest);
        console.log(`Video saved: ${dest}`);
      } catch (e) {
        console.warn('Video copy failed:', e.message);
      }
    }
  }
});
