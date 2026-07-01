import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  // Prevent the first-visit tour overlay from intercepting actions.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('tourDismissed:overview', '1');
      localStorage.setItem('tourAutoShown:overview', '1');
      localStorage.setItem('tourDismissed:budget', '1');
      localStorage.setItem('tourAutoShown:budget', '1');
      localStorage.setItem('tourDismissed:legislators', '1');
      localStorage.setItem('tourAutoShown:legislators', '1');
      localStorage.setItem('tourDismissed:other', '1');
      localStorage.setItem('tourAutoShown:other', '1');
    } catch {
      // ignore
    }
  });
});

async function expectNoSeriousA11yViolations(page, { include = null } = {}) {
  const builder = new AxeBuilder({ page });
  // Contrast is valuable but tends to be noisy/flaky in CI due to font rendering and subpixel rounding.
  // Keep this smoke focused on structural a11y regressions (labels, roles, focus, etc.).
  builder.disableRules(['color-contrast']);
  if (include) builder.include(include);
  const results = await builder.analyze();

  const seriousOrWorse = results.violations.filter(v =>
    ['serious', 'critical'].includes(String(v.impact || '').toLowerCase())
  );

  expect(
    seriousOrWorse,
    `Found serious/critical a11y violations:\n${JSON.stringify(seriousOrWorse, null, 2)}`
  ).toEqual([]);
}

test.describe('Accessibility smoke', () => {
  test('@a11y index page', async ({ page }) => {
    await page.goto('/index.html');
    await expectNoSeriousA11yViolations(page);
  });

  test('@a11y budget page + unified modal', async ({ page }) => {
    await page.goto('/budget.html?q=%E5%9C%8B%E9%98%B2');
    await expectNoSeriousA11yViolations(page);

    const firstResult = page.locator('#results-container-budget .project-block').first();
    await firstResult.click();
    await expect(page.locator('#unifiedModal')).toBeVisible();

    await expectNoSeriousA11yViolations(page, { include: '#unifiedModal' });
  });

  test('@a11y legislators page + detail modal', async ({ page }) => {
    await page.goto('/legislators.html');
    const name = await page.evaluate(async () => {
      const res = await fetch('/data_page_c.json');
      if (!res.ok) return null;
      const rows = await res.json();
      const first = Array.isArray(rows) ? rows.find(r => String(r?.['委員姓名'] || '').trim()) : null;
      return first ? String(first['委員姓名']).trim() : null;
    });
    test.skip(!name, 'No legislator name found in data_page_c.json');

    await page.goto(`/legislators.html?name=${encodeURIComponent(name)}&fallback=1`);
    await expect(page.locator('#detailModalC')).toBeVisible();
    await expectNoSeriousA11yViolations(page);
    await expectNoSeriousA11yViolations(page, { include: '#detailModalC' });
  });

  test('@a11y other page', async ({ page }) => {
    await page.goto('/other.html');
    await expectNoSeriousA11yViolations(page);
  });
});

