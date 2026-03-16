---
date: 2026-03-06T18:32:03Z
researcher: Oz
git_commit: d264ffdcdccd51ab98f4c2b73f7c995edffee4f2
branch: main
repository: hex2oklch
topic: "Visual testing framework setup for hex2oklch"
tags: [research, codebase, testing, visual-testing, playwright, vitest, browser]
status: complete
last_updated: 2026-03-06
last_updated_by: Oz
---

# Research: Visual testing framework setup for hex2oklch

**Date**: 2026-03-06T18:32:03Z
**Researcher**: Oz
**Git Commit**: d264ffdcdccd51ab98f4c2b73f7c995edffee4f2
**Branch**: main
**Repository**: hex2oklch

## Research Question
Set up a visual testing framework for the hex2oklch library. The goal is to run a CLI command that opens a browser with a basic page implementing the lib, with the ability to interact with or pause the test browser for element inspection. Similar to QUnit in Ember projects. Candidates: Cypress, Playwright, or alternatives.

## Summary
**Recommendation: Playwright** as a standalone E2E test tool, complementing the existing Vitest unit tests. Playwright is the best fit for this library because it provides exactly what's being asked for — a CLI that opens a headed browser, renders a test page, and offers interactive debugging via `page.pause()`, the Playwright Inspector, and UI Mode. It's lightweight to set up for a vanilla JS library (no framework adapters needed), and the project already has a Playwright MCP server configured in the dev environment.

**Alternative worth noting: Vitest 4.0 Browser Mode** — now stable, uses Playwright under the hood, and could keep the testing stack unified. However, it's oriented toward component testing with framework adapters (React, Vue, Svelte, Lit) and is heavier than what's needed for a simple "render a page and inspect it" workflow.

## Detailed Findings

### Current Testing Stack
- **Unit tests**: Vitest 3.x with `vitest run` — 14 tests across 4 describe blocks (`test/index.test.js`)
- **Linting**: ESLint 9 flat config
- **CI**: GitHub Actions (Node 22.x, 24.x)
- **Module format**: ESM-only (`"type": "module"`)
- **No existing browser/visual tests**

### Option 1: Playwright (Recommended)

#### Why Playwright
- **Simple CLI workflow**: `npx playwright test --headed` opens a visible browser. `npx playwright test --debug` opens the Playwright Inspector with step-through controls. `npx playwright test --ui` opens UI Mode with full trace walkthrough.
- **`page.pause()`**: Insert in any test to halt execution and interactively inspect the DOM, try selectors, view network, and manually interact with the page — exactly like pausing in QUnit/Ember.
- **No framework dependency**: hex2oklch is a vanilla JS utility. Playwright just needs a simple HTML file served locally — no React/Vue/Svelte adapters.
- **Lightweight addition**: Only needs `@playwright/test` as a devDependency. Browsers are installed separately via `npx playwright install chromium`.
- **MCP server**: The dev environment already has a Playwright MCP server configured for browser automation.
- **Modern debugging**: Trace Viewer for CI failures, `slowMo` option for visual follow-along, `--headed` for always-visible runs.

#### How It Would Work
1. Create a simple HTML test harness page (e.g. `e2e/index.html`) that imports hex2oklch and renders color swatches — background colors from the lib's `rgbString` output, foreground text from `yiq`.
2. Serve the page locally (Playwright can use a `webServer` config to spin up a dev server automatically before tests).
3. Write Playwright tests that navigate to the page, verify rendered colors, and optionally `page.pause()` for inspection.
4. Run via CLI:
   - `npx playwright test` — headless CI mode
   - `npx playwright test --headed` — see the browser
   - `npx playwright test --debug` — step through with Inspector
   - `npx playwright test --ui` — full UI Mode walkthrough

#### Setup Effort: Low
- Install: `npm install -D @playwright/test` + `npx playwright install chromium`
- Config: `playwright.config.js` (minimal — just point at the test dir and configure webServer)
- HTML harness: ~30 lines of HTML/JS
- Test file: ~20-40 lines per test file
- No changes to existing Vitest unit tests

#### Interactive Inspection Capabilities
- **`page.pause()`**: Halts execution, opens Playwright Inspector. You can inspect DOM, try selectors, view console, interact manually.
- **`--debug` flag**: Pauses before first step, provides step-through controls.
- **`--headed` flag**: Runs with visible browser window.
- **`--ui` flag**: Opens UI Mode — walk through each step, see DOM snapshots, network, console.
- **`slowMo` config option**: Slows down actions by N ms so you can visually follow along.
- **Chrome DevTools**: Available in headed mode; `page.pause()` gives you time to open and use them.

### Option 2: Vitest 4.0 Browser Mode

#### Overview
Vitest 4.0 (released Dec 2025) marked Browser Mode as stable. It runs Vitest tests in a real browser via Playwright (or WebDriverIO) instead of jsdom. It also added visual regression testing (`toMatchScreenshot`).

#### Pros
- Unified testing stack — same `vitest` runner for both unit and browser tests.
- Uses Playwright under the hood via `@vitest/browser-playwright`.
- Built-in visual regression with `toMatchScreenshot`.
- Playwright Traces integration for debugging.
- Familiar Vitest API — no new test syntax to learn.

#### Cons
- **Requires Vitest 4.x upgrade** — the project currently uses `vitest@^3.0.0`. Vitest 4 has breaking changes and a migration guide.
- **Oriented toward component frameworks** — designed for React/Vue/Svelte/Lit component mounting. For a vanilla JS lib, you'd still need to manually render HTML.
- **Heavier dependency footprint** — needs `@vitest/browser-playwright` (or `@vitest/browser-webdriverio`), pulls in additional packages.
- **No `page.pause()` equivalent in the same way** — debugging is via Vitest UI or Playwright Traces, not the interactive Inspector-style debugging Playwright offers standalone.
- **Less mature for this use case** — Browser Mode just went stable; the interactive debugging story is still evolving.

#### Verdict
Good for the future if/when the project upgrades to Vitest 4 and wants visual regression screenshots. Not the simplest path for "open a browser, render my lib, pause and inspect."

### Option 3: Cypress

#### Overview
Cypress is a well-known E2E and component testing tool with an interactive Test Runner that provides real-time reloading, time-travel debugging, and DOM snapshots.

#### Pros
- Interactive Test Runner with real-time reloading.
- Time-travel debugging — hover over commands to see DOM at each step.
- `cy.pause()` for halting execution.
- Good developer experience for front-end testing.

#### Cons
- **Heavier than Playwright** — larger dependency footprint, own Electron-based runner.
- **Chromium-only by default** — cross-browser support is limited compared to Playwright.
- **Component testing requires framework adapters** — not ideal for vanilla JS.
- **Separate test runner** from existing Vitest — adds another tool to the stack.
- **No existing integration** in the dev environment (unlike Playwright MCP).
- **Architecture constraints** — Cypress runs tests inside the browser, which has limitations for certain types of assertions and multi-tab scenarios.

#### Verdict
Viable but heavier and less aligned with this project's existing stack and dev environment.

## Recommendation Summary

**Go with Playwright.** It provides exactly the workflow requested:
1. `npx playwright test --debug` → opens a browser with the test page, pauses for inspection
2. `page.pause()` in tests → pause at any point, inspect elements, interact manually
3. Minimal setup — one devDependency, a simple HTML harness, small config
4. Complements (doesn't replace) the existing Vitest unit tests
5. Already has MCP server support in the dev environment

### Proposed Project Structure
```
hex2oklch/
├── e2e/
│   ├── fixtures/
│   │   └── index.html          # Test harness page rendering color swatches
│   └── visual.spec.js          # Playwright visual tests
├── playwright.config.js        # Playwright configuration
├── test/
│   └── index.test.js           # Existing Vitest unit tests (unchanged)
├── vitest.config.js            # Existing Vitest config (unchanged)
└── package.json                # Add @playwright/test devDep + scripts
```

### Proposed package.json Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:ui": "playwright test --ui",
    "lint": "eslint ."
  }
}
```

## Code References
- `package.json:1-45` — Current package config, devDependencies, scripts
- `vitest.config.js:1-9` — Current Vitest configuration
- `test/index.test.js:1-93` — Existing unit test suite (14 tests, Vitest)
- `src/index.js:1-69` — Library source (hex→RGB conversion + YIQ contrast)

## Historical Context (from thoughts/)
- `thoughts/shared/research/2026/2026-03-05-HEX2OKLCH-1-modernize-lib.md` — Prior research that established Vitest as the unit test framework, ESM-only module format, and GitHub Actions CI. The modernization was completed; this visual testing would be a new addition on top of that foundation.

## Open Questions
1. Should the HTML test harness be a static file or dynamically generated by the test?
2. How many color swatches to render — a curated set or exhaustive?
3. Should visual regression screenshots (Playwright's built-in screenshot comparison) be added from the start, or just interactive inspection?
4. Should CI run the Playwright tests too, or keep them local-only for now?
