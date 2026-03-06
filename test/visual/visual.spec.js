import { test, expect } from '@playwright/test';

test.describe('hex2oklch visual tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/visual/index.html');
  });

  test('renders all color swatches', async ({ page }) => {
    const grid = page.getByTestId('swatch-grid');
    const swatches = grid.locator('.swatch');
    await expect(swatches).toHaveCount(12);
  });

  test('dark color has white foreground text', async ({ page }) => {
    const swatch = page.getByTestId('swatch-0033ff');
    await expect(swatch).toHaveCSS('background-color', 'rgb(0, 51, 255)');
    await expect(swatch).toHaveCSS('color', 'rgb(255, 255, 255)');
  });

  test('light color has black foreground text', async ({ page }) => {
    const swatch = page.getByTestId('swatch-ff88ee');
    await expect(swatch).toHaveCSS('color', 'rgb(0, 0, 0)');
  });

  test('invalid hex shows invalid styling', async ({ page }) => {
    const swatch = page.getByTestId('swatch-00PS1E');
    await expect(swatch).toHaveClass(/invalid/);
  });

  test('interactive input adds a new swatch', async ({ page }) => {
    const input = page.getByTestId('hex-input');
    const addBtn = page.getByTestId('add-btn');
    const grid = page.getByTestId('swatch-grid');

    await input.fill('ff6600');
    await addBtn.click();

    const swatches = grid.locator('.swatch');
    await expect(swatches).toHaveCount(13);

    const newSwatch = page.getByTestId('swatch-ff6600');
    await expect(newSwatch).toBeVisible();
    await expect(newSwatch).toHaveCSS('background-color', 'rgb(255, 102, 0)');
  });

  test('short hex expands correctly', async ({ page }) => {
    const swatch = page.getByTestId('swatch-03f');
    await expect(swatch).toHaveCSS('background-color', 'rgb(0, 51, 255)');
  });

  // ---------------------------------------------------------
  // Uncomment the line below to pause and inspect the page
  // during debug mode:  npm run test:visual:debug
  //
  // test('inspect page (debug helper)', async ({ page }) => {
  //   await page.pause();
  // });
  // ---------------------------------------------------------
});
