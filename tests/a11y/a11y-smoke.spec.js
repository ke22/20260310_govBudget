import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectNoSeriousA11yViolations(page, { include = null } = {}) {
  const builder = new AxeBuilder({ page });
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
    await page.goto('/legislators.html?name=%E7%8E%8B%E5%B0%8F%E6%98%8E&fallback=1');
    await expect(page.locator('#detailModalC')).toBeVisible();
    await expectNoSeriousA11yViolations(page);
    await expectNoSeriousA11yViolations(page, { include: '#detailModalC' });
  });

  test('@a11y other page', async ({ page }) => {
    await page.goto('/other.html');
    await expectNoSeriousA11yViolations(page);
  });
});

