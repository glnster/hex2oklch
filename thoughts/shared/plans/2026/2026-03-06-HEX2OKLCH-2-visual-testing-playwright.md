# HEX2OKLCH-2: Visual Testing with Playwright — Implementation Plan

## Overview
Add Playwright-based visual testing to hex2oklch so developers can run a CLI command, open a browser with a page that exercises the library, and interactively inspect color output. Similar to the QUnit experience in Ember projects.

## Current State Analysis
- `src/index.js` — single default export `hex2oklch(hex, options)` returning `{ rgb, rgbString, yiq }`
- `test/index.test.js` — 14 Vitest unit tests (headless, no browser)
- `vitest.config.js` — Vitest v3 config
- `package.json` — ESM-only (`"type": "module"`), Node >= 22, devDeps: vitest, eslint
- No browser or visual tests exist

### Key Discoveries
- The lib is vanilla JS with zero runtime dependencies — no framework adapters needed
- ESM `export default` works natively in `<script type="module">` in modern browsers
- Node >= 22 is already required, so we can rely on modern Playwright features
- Playwright's `webServer` config can auto-serve static files before tests run

## Desired End State
After implementation:
1. `npm run test:visual` runs headless Playwright tests against a local HTML page (CI-friendly)
2. `npm run test:visual:ui` opens Playwright UI Mode — interactive test runner with browser, step-by-step replay, DOM snapshots (closest to QUnit)
3. `npm run test:visual:debug` opens headed browser + Playwright Inspector, paused at first step for manual inspection
4. The HTML test page renders a grid of color swatches using hex2oklch, with an interactive input to test custom hex values
5. Existing Vitest unit tests are completely unchanged

### Verification
- `npm test` still passes (Vitest, unchanged)
- `npm run test:visual` passes in headless mode
- `npm run test:visual:ui` opens the Playwright UI with the test page visible
- `npm run test:visual:debug` opens a headed browser, paused, with the color swatch page rendered

## What We're NOT Doing
- No visual regression screenshots (can add later)
- No changes to existing Vitest unit tests
- No CI workflow changes (Playwright tests are local-only for now)
- No Vitest 4 upgrade or Browser Mode
- No Cypress
- No TypeScript conversion
- No additional browsers (Chromium only)

## Implementation Approach
Add Playwright as a standalone E2E layer alongside Vitest. The HTML test harness is a static file served by `npx serve` via Playwright's `webServer` config. Tests live in `test/visual/` next to the existing `test/index.test.js`.

---

## Phase 1: Install & Configure Playwright

### Overview
Install Playwright, create config, and set up the static file server integration.

### Changes Required

#### 1. Install dependencies
```sh
npm install -D @playwright/test
npx playwright install chromium
```

This adds `@playwright/test` to devDependencies. Only Chromium is installed (not Firefox/WebKit) to keep it light.

#### 2. Create `playwright.config.js`
**File**: `playwright.config.js`

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3473',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npx serve . --listen 3473',
    port: 3473,
    reuseExistingServer: !process.env.CI,
  },
});
```

Key decisions:
- **Port 3473**: Arbitrary, avoids conflicts with common dev servers
- **`npx serve .`**: Serves the project root so the HTML page can import from `/src/index.js`. No extra devDependency needed — `npx` downloads `serve` on demand and caches it
- **`reuseExistingServer`**: Allows reusing a running server locally (faster iteration), but always starts fresh in CI
- **`testDir: './test/visual'`**: Keeps visual tests separate from Vitest unit tests
- **`trace: 'on-first-retry'`**: Captures traces only on retry for debugging without the overhead on every run

#### 3. Update `.gitignore`
**File**: `.gitignore`
Add Playwright artifacts:

```
playwright-report
test-results
```

#### 4. Update `eslint.config.js`
**File**: `eslint.config.js`
Add Playwright output dirs to ignores:

```js
{
  ignores: ['coverage/**', 'playwright-report/**', 'test-results/**'],
},
```

### Success Criteria

#### Automated Verification
- [x] `npm install` completes without errors
- [x] `npx playwright install chromium` completes
- [x] `npx serve . --listen 3473` starts and serves files at `http://localhost:3473/`
- [x] `npm run lint` passes (ESLint config updated)
- [x] `npm test` still passes (Vitest unchanged)

#### Manual Verification
- [ ] `playwright.config.js` exists at project root
- [ ] `.gitignore` includes `playwright-report` and `test-results`

---

## Phase 2: HTML Test Harness

### Overview
Create a standalone HTML page that imports hex2oklch and renders interactive color swatches.

### Changes Required

#### 1. Create `test/visual/index.html`
**File**: `test/visual/index.html`

A self-contained HTML page that:
- Imports hex2oklch via `<script type="module">` using absolute path `/src/index.js`
- Defines a curated set of hex colors covering key cases:
  - Dark colors (white foreground): `000000`, `0033ff`, `003366`, `330033`
  - Light colors (black foreground): `ffffff`, `ff88ee`, `ffcc00`, `99ff66`
  - Short hex: `03f`, `fc0`
  - Hash-prefixed: `#0033ff`
  - Invalid input: `00PS1E`
- Renders a grid of swatches where each swatch shows:
  - Background color from `rgbString`
  - Text color from `yiq` (black or white)
  - The hex input value
  - The computed `rgb`, `rgbString`, and `yiq` values
- Provides an input field + button for testing custom hex values on the fly
- Uses `data-testid` attributes on key elements for Playwright selectors

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>hex2oklch Visual Test</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; padding: 2rem; background: #f5f5f5; }
    h1 { margin-bottom: 1rem; }
    .controls { margin-bottom: 1.5rem; display: flex; gap: 0.5rem; align-items: center; }
    .controls input { padding: 0.5rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 4px; width: 200px; }
    .controls button { padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer; border: 1px solid #999; border-radius: 4px; background: #fff; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .swatch { border-radius: 8px; padding: 1.25rem; min-height: 120px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid rgba(0,0,0,0.1); }
    .swatch .hex { font-size: 1.25rem; font-weight: 700; }
    .swatch .details { font-size: 0.75rem; font-family: monospace; opacity: 0.85; line-height: 1.6; }
    .swatch.invalid { background: repeating-linear-gradient(45deg, #fdd, #fdd 10px, #fee 10px, #fee 20px); color: #900; }
  </style>
</head>
<body>
  <h1>hex2oklch Visual Test</h1>
  <div class="controls">
    <input type="text" id="hex-input" placeholder="Enter hex (e.g. ff6600)" data-testid="hex-input" />
    <button id="add-btn" data-testid="add-btn">Add Swatch</button>
  </div>
  <div class="grid" id="swatch-grid" data-testid="swatch-grid"></div>

  <script type="module">
    import hex2oklch from '/src/index.js';

    const testColors = [
      '000000', '0033ff', '003366', '330033',
      'ffffff', 'ff88ee', 'ffcc00', '99ff66',
      '03f', 'fc0',
      '#0033ff',
      '00PS1E',
    ];

    const grid = document.getElementById('swatch-grid');

    function createSwatch(hex) {
      const result = hex2oklch(hex);
      const isInvalid = result.yiq === 'inherit';
      const swatch = document.createElement('div');
      swatch.className = `swatch${isInvalid ? ' invalid' : ''}`;
      swatch.setAttribute('data-testid', `swatch-${hex.replace('#', '')}`);

      if (!isInvalid) {
        swatch.style.backgroundColor = result.rgbString;
        swatch.style.color = result.yiq;
      }

      swatch.innerHTML = `
        <div class="hex">${hex}</div>
        <div class="details">
          rgb: [${result.rgb.join(', ')}]<br>
          rgbString: ${result.rgbString}<br>
          yiq: ${result.yiq}
        </div>
      `;
      return swatch;
    }

    // Render initial swatches
    testColors.forEach(hex => grid.appendChild(createSwatch(hex)));

    // Interactive input
    const input = document.getElementById('hex-input');
    const addBtn = document.getElementById('add-btn');

    addBtn.addEventListener('click', () => {
      const hex = input.value.trim();
      if (hex) {
        grid.insertBefore(createSwatch(hex), grid.firstChild);
        input.value = '';
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });
  </script>
</body>
</html>
```

### Success Criteria

#### Automated Verification
- [x] File exists: `test/visual/index.html`
- [x] `npx serve . --listen 3473` serves the page at `http://localhost:3473/test/visual/index.html`

#### Manual Verification
- [ ] Open `http://localhost:3473/test/visual/index.html` in a browser
- [ ] 12 color swatches render in a grid
- [ ] Dark colors show white text, light colors show black text
- [ ] Invalid hex (`00PS1E`) shows distinct invalid styling
- [ ] Typing a hex value in the input and clicking "Add Swatch" prepends a new swatch
- [ ] No console errors

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that the HTML page renders correctly before proceeding.

---

## Phase 3: Playwright Tests & npm Scripts

### Overview
Create the Playwright test spec and add npm scripts for all three run modes (headless, UI, debug).

### Changes Required

#### 1. Create `test/visual/visual.spec.js`
**File**: `test/visual/visual.spec.js`

```js
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
```

#### 2. Add npm scripts to `package.json`
**File**: `package.json`
Add to `"scripts"`:

```json
"test:visual": "playwright test",
"test:visual:ui": "playwright test --ui",
"test:visual:debug": "playwright test --debug"
```

### Success Criteria

#### Automated Verification
- [x] `npm run test:visual` passes (all 6 tests green, headless)
- [x] `npm test` still passes (Vitest unchanged)
- [x] `npm run lint` passes

#### Manual Verification
- [ ] `npm run test:visual:ui` opens Playwright UI Mode showing the test list and a browser panel with the color swatch page
- [ ] `npm run test:visual:debug` opens a headed Chromium browser + Playwright Inspector, paused at first step
- [ ] In debug mode, stepping through tests shows the color swatch page in the browser
- [ ] In UI mode, clicking a test shows the browser rendering and step-by-step replay

---

## Testing Strategy

### Existing Unit Tests (unchanged)
- `npm test` — Vitest, 14 tests covering rgb, rgbString, yiq, options, error handling

### New Visual Tests
- `npm run test:visual` — Playwright, headless, verifies:
  - All swatches render
  - Dark colors → white foreground
  - Light colors → black foreground
  - Invalid hex → invalid styling
  - Interactive input → new swatch added
  - Short hex → correct expansion
- 6 test cases covering the key visual behaviors

### Interactive Inspection
- `npm run test:visual:ui` — Playwright UI Mode for QUnit-like experience
- `npm run test:visual:debug` — Playwright Inspector for step-through debugging with `page.pause()`

## Performance Considerations
- Chromium-only keeps install size small (~200MB browser binary, cached)
- `npx serve` starts in <1 second
- 6 visual tests should complete in <5 seconds headless
- `reuseExistingServer` avoids restarting the server between runs locally

## References
- Related research: `thoughts/shared/research/2026/2026-03-06-visual-testing-framework.md`
- Prior modernization: `thoughts/shared/research/2026/2026-03-05-HEX2OKLCH-1-modernize-lib.md`
- Library source: `src/index.js:21-66`
- Existing tests: `test/index.test.js:1-93`
- Playwright docs — webServer config: https://playwright.dev/docs/test-webserver
- Playwright docs — debugging: https://playwright.dev/docs/debug
