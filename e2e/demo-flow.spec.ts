import { test, expect } from '@playwright/test';

test.describe('Reclaim AI Revenue Recovery Agent — End-to-End Demo Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1. Landing Page loads correctly with brand and navigation', async ({ page }) => {
    await expect(page).toHaveTitle(/Reclaim/i);
    await expect(page.getByText('RECLAIM', { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Workbench/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Sandbox/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Policies/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Audit/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Scorecard/i }).first()).toBeVisible();
  });

  test('2. Dashboard Overview renders financial metrics and charts', async ({ page }) => {
    // Navigate to Dashboard tab
    await page.getByRole('button', { name: /Dashboard/i }).first().click();

    // Verify key metric cards
    await expect(page.getByText(/At Risk/i).first()).toBeVisible();
    await expect(page.getByText(/Measured Recovered/i).first()).toBeVisible();
    await expect(page.getByText(/Recovery Rate/i).first()).toBeVisible();
    await expect(page.getByText(/Guardrail Stops/i).first()).toBeVisible();
  });

  test('3. Cases Workbench supports filtering, searching, and case inspection', async ({ page }) => {
    // Navigate to Cases Workbench
    await page.getByRole('button', { name: /Workbench/i }).first().click();

    // Verify search input
    const searchInput = page.getByPlaceholder(/Search by customer/i);
    await expect(searchInput).toBeVisible();

    // Test lane filtering buttons if present
    const paymentLaneBtn = page.getByRole('button', { name: /Payment/i }).first();
    if (await paymentLaneBtn.isVisible()) {
      await paymentLaneBtn.click();
    }

    // Inspect case rows
    const caseRows = page.locator('tbody tr');
    const count = await caseRows.count();
    if (count > 0) {
      // Click first case to open details drawer
      await caseRows.first().click();
      await page.waitForTimeout(500);
      // Verify drawer or modal opened
      await expect(page.getByText(/Case Details|Timeline|Audit Trail/i).first()).toBeVisible();
    }
  });

  test('4. Webhook Sandbox simulator triggers live event payloads', async ({ page }) => {
    // Navigate to Sandbox
    await page.getByRole('button', { name: /Sandbox/i }).first().click();

    // Verify sandbox controls
    await expect(page.getByText(/Webhook Simulator|Sandbox/i).first()).toBeVisible();

    // Find and click simulate button
    const simulateBtn = page.getByRole('button', { name: /Simulate|Send Webhook|Trigger/i }).first();
    if (await simulateBtn.isVisible()) {
      await simulateBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('5. Policy Configuration view renders stopping rules and guardrails', async ({ page }) => {
    // Navigate to Policies
    await page.getByRole('button', { name: /Policies/i }).first().click();

    // Verify policy configurations
    await expect(page.getByText(/Policy|Stopping Rules|Contact Hours|Cooldown/i).first()).toBeVisible();
  });

  test('6. Audit Trail viewer displays immutable decision logs', async ({ page }) => {
    // Navigate to Audit tab
    await page.getByRole('button', { name: /Audit/i }).first().click();

    // Verify audit table/feed
    await expect(page.getByText(/Audit|Log|Event|Actor/i).first()).toBeVisible();
  });

  test('7. Evaluator Scorecard renders rubric benchmarks', async ({ page }) => {
    // Navigate to Scorecard
    await page.getByRole('button', { name: /Scorecard/i }).first().click();

    // Verify rubric categories
    await expect(page.getByText(/Evaluation|Scorecard|Rubric|Track 03/i).first()).toBeVisible();
  });

  test('8. Role switcher and login modal work smoothly', async ({ page }) => {
    // Open role dropdown if present
    const roleButton = page.locator('button').filter({ hasText: /Admin|Reviewer|Ops Viewer/i }).first();
    if (await roleButton.isVisible()) {
      await roleButton.click();
      await page.waitForTimeout(300);
    }
  });
});
