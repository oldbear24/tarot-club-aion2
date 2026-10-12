import { expect, test } from '@playwright/test';

test('catalog restores combined URL filters, highlights safely and resets with keyboard', async ({ page }) => {
  await page.goto('reference/prehled/?q=HELLFIRE&category=tridy&kind=term#jak-hledat');
  const search = page.locator('[data-ref-search]');
  await expect(search).toBeEnabled();
  await expect(search).toHaveValue('HELLFIRE');
  await expect(page.locator('[data-ref-category]')).toHaveValue('tridy');
  await expect(page.locator('[data-ref-kind]')).toHaveValue('term');
  await expect(page.locator('[data-ref-results] li')).toHaveCount(4);
  await expect(page.locator('[data-ref-results] mark').first()).toHaveText(/Hellfire/i);
  const term = page.locator('[data-ref-results] a[href$="#ref-hellfire"]');
  const href = await term.getAttribute('href');
  expect(href).toContain('/tridy/sorcerer/#ref-hellfire');
  await term.click();
  await expect(page.locator('#ref-hellfire')).toBeVisible();
  await page.goBack();
  await expect(search).toBeEnabled();
  await expect(search).toHaveValue('HELLFIRE');
  await search.fill('<img src=x onerror=alert(1)>');
  await expect(page.locator('[data-ref-empty]')).toBeVisible();
  await expect(page.locator('[data-ref-results] img')).toHaveCount(0);
  await page.locator('[data-ref-reset]').focus();
  await page.keyboard.press('Enter');
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await expect(page.locator('[data-ref-results] li')).toHaveCount(60);
  expect(new URL(page.url()).search).toBe('');
  expect(new URL(page.url()).hash).toBe('#jak-hledat');
  await page.locator('[data-ref-more]').click();
  await expect(page.locator('[data-ref-results] li')).toHaveCount(120);
  await search.fill('herni penize');
  await expect(page.locator('[data-ref-results] a')).toContainText(['Kina']);
  await expect(page.locator('[data-ref-status]')).toHaveText('Zobrazeny 2 výsledky z 2.');
  await page.locator('[data-ref-category]').selectOption('ekonomika');
  await expect(page.locator('[data-ref-status]')).toHaveText('Zobrazen 1 výsledek z 1.');
  await expect(page).toHaveURL(/q=herni\+penize&category=ekonomika/);
  await page.reload();
  await expect(search).toHaveValue('herni penize');
  await expect(page.locator('[data-ref-category]')).toHaveValue('ekonomika');
});

test('fulltext finds article paragraphs, Czech diacritics and abbreviations', async ({ page }) => {
  await page.goto('reference/prehled/');
  await expect(page.locator('[data-ref-search]')).toBeEnabled();
  await page.locator('[data-ref-search]').fill('Soul Fuse');
  await page.locator('[data-ref-fulltext]').click();
  const input = page.locator('dialog .pagefind-ui__search-input');
  await expect(input).toBeVisible();
  await expect(input).toHaveValue('Soul Fuse');
  for (const query of ['Soul Fuse', 'přesnost', 'presnost', 'GS']) {
    await input.fill(query);
    await expect(page.locator('dialog .pagefind-ui__message')).toContainText(query);
    await expect(page.locator('dialog .pagefind-ui__result-link').first()).toBeVisible();
  }
  await page.keyboard.press('Escape');
  await expect(input).not.toBeVisible();
  await page.locator('[data-open-modal]').focus();
  await page.keyboard.press('Enter');
  await expect(input).toBeFocused();
});

test('navigation remains reachable, groups cover articles, and both themes fit viewport', async ({ page }, testInfo) => {
  await page.goto('');
  await expect(page.locator('.quick-links a')).toHaveCount(5);
  await expect(page.locator('.topic-grid details')).toHaveCount(8);
  expect(await page.locator('h1').count()).toBe(1);
  await page.goto('pruvodce/cp-postava/');
  if (testInfo.project.name.startsWith('mobile')) {
    const menu = page.getByRole('button', { name: 'Otevřít nebo zavřít menu' });
    await menu.click();
    await expect(page.locator('#starlight__sidebar')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#starlight__sidebar')).not.toBeVisible();
    await menu.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('#starlight__sidebar')).toBeVisible();
    await menu.click();
  } else {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('#starlight__sidebar')).toBeVisible();
    expect((await page.locator('header').boundingBox())?.y).toBe(0);
  }
  for (const theme of ['light', 'dark']) {
    if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'Otevřít nebo zavřít menu' }).click();
    await page.locator('starlight-theme-select select:visible').selectOption(theme);
    if (testInfo.project.name.startsWith('mobile')) await page.getByRole('button', { name: 'Otevřít nebo zavřít menu' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`article-${theme}.png`), fullPage: false });
  }
});

test('index failure has a recoverable state and no-script keeps authored navigation', async ({ page, browser }) => {
  await page.route('**/reference-index.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('reference/prehled/');
  await expect(page.locator('[data-ref-error]')).toBeVisible();
  await page.unroute('**/reference-index.json');
  await page.locator('[data-ref-retry]').click();
  await expect(page.locator('[data-ref-search]')).toBeEnabled();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto(page.url());
  await expect(staticPage.locator('noscript')).toBeVisible();
  await expect(staticPage.locator('.sl-markdown-content a[href$="/slovnik/"]').first()).toBeVisible();
  await context.close();
});
