import { test, expect } from '@playwright/test';

test.describe('Core flows', () => {
  test('@smoke index loads and nav is present', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('.js-float-nav')).toBeVisible();
    await expect(page.locator('a.skip-link')).toHaveAttribute('href', '#main-content');
  });

  test('@smoke nav links route to pages', async ({ page }) => {
    await page.goto('/index.html');

    await page.getByRole('link', { name: '查預算' }).click();
    await expect(page).toHaveURL(/budget\.html$/);
    await expect(page.locator('body.page-budget')).toHaveCount(1);

    await page.getByRole('link', { name: '立委把關' }).click();
    await expect(page).toHaveURL(/legislators\.html$/);
    await expect(page.locator('body.page-legislators')).toHaveCount(1);

    await page.getByRole('link', { name: '更多資訊' }).click();
    await expect(page).toHaveURL(/other\.html$/);
    await expect(page.locator('body.page-other')).toHaveCount(1);
  });

  test('nav search from index routes to budget.html?q=', async ({ page }) => {
    await page.goto('/index.html');

    await page.locator('.js-nav-search-toggle').click();
    const input = page.locator('.js-nav-search-input');
    await input.fill('國防');

    await page.locator('.js-nav-search').dispatchEvent('submit');
    await expect(page).toHaveURL(/budget\.html\?q=/);
  });

  test('@smoke budget.html?q= auto-runs search and renders results', async ({ page }) => {
    await page.goto('/budget.html?q=%E5%9C%8B%E9%98%B2');

    // Search results are rendered into this container.
    const results = page.locator('#results-container-budget');
    await expect(results).toBeVisible();

    // Either real data or demo mode; both should produce non-empty results for 國防.
    await expect(results).not.toContainText('請輸入關鍵字開始搜尋');
    await expect(results).not.toContainText('查無資料');
  });

  test('budget: clicking a result opens unifiedModal', async ({ page }) => {
    await page.goto('/budget.html?q=%E5%9C%8B%E9%98%B2');

    const firstResult = page.locator('#results-container-budget .project-block').first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    const modal = page.locator('#unifiedModal');
    await expect(modal).toBeVisible();
    await expect(page.locator('#unifiedModal .js-u-title')).not.toHaveText('');
  });

  test('@smoke budget: ?plan=TEST001 opens modal (demo-mode compatible)', async ({ page }) => {
    await page.goto('/budget.html?plan=TEST001');
    const modal = page.locator('#unifiedModal');
    await expect(modal).toBeVisible();
  });

  test('@smoke legislators: ?name=王小明 opens detail modal (demo-mode compatible)', async ({ page }) => {
    await page.goto('/legislators.html?name=%E7%8E%8B%E5%B0%8F%E6%98%8E&fallback=1');
    const modal = page.locator('#detailModalC');
    await expect(modal).toBeVisible();
    await expect(page.locator('#detailModalC #mc-name')).not.toHaveText('');
  });

  test('@smoke other page loads static content', async ({ page }) => {
    await page.goto('/other.html');
    await expect(page.getByRole('heading', { name: '資料來源與誤差說明' })).toBeVisible();
  });
});

