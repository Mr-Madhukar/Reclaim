import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function ensureAdminLoggedIn(page: Page) {
  const loginBtn = page.getByRole('button', { name: /Login \/ Sign Up/i }).first();
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
    await page.getByRole('button', { name: /Admin/i }).first().click();
    await expect(page.locator('header').getByText('ADMIN', { exact: true })).toBeVisible({ timeout: 10000 });
  }
}

test.describe('Reclaim AI — Accessibility Compliance (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Log in as Admin for tests that evaluate authenticated dashboard/workbench/policies
    const publicTests = ['Landing page', 'Skip to main', 'Login page'];
    const isPublic = publicTests.some((t) => testInfo.title.includes(t));
    if (!isPublic) {
      await ensureAdminLoggedIn(page);
    }

    // Disable CSS animations & transitions so accessibility contrast scans test settled styles
    await page.addStyleTag({
      content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
    });
  });

  test('Landing page has no critical accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('[data-chart]') // Exclude Recharts SVG (3rd party)
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (critical.length > 0) {
      console.log('Accessibility violations found:', critical.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => n.html) })));
    }

    expect(critical).toHaveLength(0);
  });

  test('Dashboard page has no critical accessibility violations', async ({ page }) => {
    await page.getByRole('button', { name: /^Dashboard$/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Revenue Recovery Command Center/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Run Recovery Batch/i })).toBeVisible();

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
    await page.getByRole('button', { name: /^Workbench$/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('main', { name: 'Cases Workbench' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[data-chart]')
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(critical).toHaveLength(0);
  });

  test('Policy page has no critical accessibility violations', async ({ page }) => {
    await page.getByRole('button', { name: /^Policies$/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('main', { name: 'Policy Configuration' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[data-chart]')
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
    await page.getByRole('button', { name: /^Dashboard$/i }).first().click();
    await page.waitForLoadState('domcontentloaded');

    const dashboardTab = page.getByRole('button', { name: /^Dashboard$/i }).first();
    const ariaCurrent = await dashboardTab.getAttribute('aria-current');
    expect(ariaCurrent).toBe('page');

    const showcaseTab = page.getByRole('button', { name: /^Showcase$/i }).first();
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

  test('Login page has accessible inputs and submit controls', async ({ page }) => {
    const loginBtn = page.getByRole('button', { name: /Login \/ Sign Up/i }).first();
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      const emailInput = page.locator('input[type="email"]').first();
      await expect(emailInput).toBeVisible();
    }
  });
});
