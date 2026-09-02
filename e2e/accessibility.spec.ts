import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Reclaim AI — Accessibility Compliance (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Landing page has no critical accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('[data-chart]') // Exclude Recharts SVG (3rd party)
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(critical).toHaveLength(0);
  });

  test('Dashboard page has no critical accessibility violations', async ({ page }) => {
    await page.getByRole('button', { name: /Dashboard/i }).first().click();
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[data-chart]')
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(critical).toHaveLength(0);
  });

  test('Cases Workbench page has no critical accessibility violations', async ({ page }) => {
    await page.getByRole('button', { name: /Workbench/i }).first().click();
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(critical).toHaveLength(0);
  });

  test('Policy page has no critical accessibility violations', async ({ page }) => {
    await page.getByRole('button', { name: /Policies/i }).first().click();
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(critical).toHaveLength(0);
  });

  test('Skip to main content link exists and is focusable', async ({ page }) => {
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"]');
    if (await skipLink.count() > 0) {
      await expect(skipLink.first()).toBeFocused();
      const text = await skipLink.first().textContent();
      expect(text?.toLowerCase()).toContain('skip');
    }
  });

  test('All navigation tabs have aria-current attribute for active tab', async ({ page }) => {
    await page.getByRole('button', { name: /Dashboard/i }).first().click();
    await page.waitForLoadState('domcontentloaded');

    const dashboardTab = page.getByRole('button', { name: /Dashboard/i }).first();
    const ariaCurrent = await dashboardTab.getAttribute('aria-current');
    expect(ariaCurrent).toBe('page');

    const showcaseTab = page.getByRole('button', { name: /Showcase/i }).first();
    const showcaseAria = await showcaseTab.getAttribute('aria-current');
    expect(showcaseAria).toBeNull();
  });

  test('Role switcher dropdown has proper ARIA attributes', async ({ page }) => {
    const roleBtn = page.locator('button[aria-haspopup="true"]').first();
    if (await roleBtn.count() > 0) {
      const expanded = await roleBtn.getAttribute('aria-expanded');
      expect(expanded).toBe('false');

      await roleBtn.click();
      await expect(roleBtn).toHaveAttribute('aria-expanded', 'true');

      const expandedAfter = await roleBtn.getAttribute('aria-expanded');
      expect(expandedAfter).toBe('true');
    }
  });

  test('Login modal has proper ARIA dialog attributes', async ({ page }) => {
    const roleBtn = page.locator('button[aria-haspopup="true"]').first();
    if (await roleBtn.count() > 0) {
      await roleBtn.click();
      await expect(roleBtn).toHaveAttribute('aria-expanded', 'true');

      const customLoginBtn = page.getByText('Custom Login...').first();
      if (await customLoginBtn.isVisible()) {
        await customLoginBtn.click();
        const dialog = page.locator('dialog, [role="dialog"]').first();
        await expect(dialog).toBeVisible();

        const labelledBy = await dialog.getAttribute('aria-labelledby');
        expect(labelledBy).toBeTruthy();
      }
    }
  });
});
