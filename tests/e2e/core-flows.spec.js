import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Prevent the first-visit tour overlay from intercepting clicks.
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

test.describe('Core flows', () => {
  async function openNavMenuIfNeeded(page) {
    const menuBtn = page.locator('.js-float-nav-menuBtn');
    if ((await menuBtn.count()) && (await menuBtn.isVisible())) {
      const expanded = await menuBtn.getAttribute('aria-expanded');
      if (expanded === 'false') {
        await menuBtn.click();
      }
    }
  }

  test('@smoke index loads and nav is present', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('.js-float-nav')).toBeVisible();
    await expect(page.locator('a.skip-link')).toHaveAttribute('href', '#main-content');
  });

  test('@smoke nav links route to pages', async ({ page }) => {
    await page.goto('/index.html');

    await openNavMenuIfNeeded(page);
    await page.getByRole('link', { name: '查預算' }).click();
    await expect(page).toHaveURL(/budget\.html$/);
    await expect(page.locator('body.page-budget')).toHaveCount(1);

    await openNavMenuIfNeeded(page);
    await page.getByRole('link', { name: '立委把關' }).click();
    await expect(page).toHaveURL(/legislators\.html$/);
    await expect(page.locator('body.page-legislators')).toHaveCount(1);

    await openNavMenuIfNeeded(page);
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
    // Pick a real plan ID from the JSON to make this deterministic across datasets.
    await page.goto('/budget.html');
    const planId = await page.evaluate(async () => {
      const res = await fetch('/data_page_a.json');
      if (!res.ok) return null;
      const rows = await res.json();
      const first = Array.isArray(rows) ? rows.find(r => String(r?.['計畫編號'] || '').trim()) : null;
      return first ? String(first['計畫編號']).trim() : null;
    });
    test.skip(!planId, 'No plan id found in data_page_a.json');

    await page.goto(`/budget.html?plan=${encodeURIComponent(planId)}`);
    const modal = page.locator('#unifiedModal');
    await expect(modal).toBeVisible();
  });

  test('@smoke legislators: ?name=王小明 opens detail modal (demo-mode compatible)', async ({ page }) => {
    // Pick a real legislator name from JSON to avoid coupling to demo-only data.
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
    const modal = page.locator('#detailModalC');
    await expect(modal).toBeVisible();
    await expect(page.locator('#detailModalC #mc-name')).not.toHaveText('');
  });

  test('@smoke other page loads static content', async ({ page }) => {
    await page.goto('/other.html');
    await expect(page.getByRole('heading', { name: '資料來源與誤差說明' })).toBeVisible();
  });
});

