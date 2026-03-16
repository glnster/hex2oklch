---
date: 2026-03-05T15:49:51-05:00
researcher: Oz
git_commit: 57aa4f8ac8e9459e75cc6902bc376af9e0d594ff
branch: main
repository: hex2oklch
topic: "HEX2OKLCH-1 - Modernize hex2oklch lib tech stack"
tags: [research, codebase, modernization, hex2oklch, tooling]
status: complete
last_updated: 2026-03-05
last_updated_by: Oz
---

# Research: HEX2OKLCH-1 - Modernize hex2oklch lib tech stack

**Date**: 2026-03-05T15:49:51-05:00
**Researcher**: Oz
**Git Commit**: 57aa4f8ac8e9459e75cc6902bc376af9e0d594ff
**Branch**: main
**Repository**: hex2oklch

## Research Question
Plan to modernize this lib. Research updating this lib to use modern tech stack: yarn or bun (keep npm, remove bower), modern testing framework, rename from hex2rgb to hex2oklch, update branch name references from master to main.

## Summary
The hex2oklch library (formerly hex2rgb) is a small utility that converts hex color strings to RGB and calculates contrast-appropriate foreground colors (black/white) via YIQ. The codebase is circa 2015 and uses entirely legacy tooling: CommonJS modules, Bower, Gulp, Mocha/Chai/Istanbul, legacy ESLint config (.eslintrc), Travis CI targeting Node 0.10–0.12, and references the old `master` branch throughout. Modernization requires updating nearly every supporting file while the core logic (~50 lines) remains relatively straightforward to migrate.

## Detailed Findings

### Core Library Logic
- **`index.js`** (line 1–70): The main Node.js entry point. Exports a single function `hex2rgb(hex, options)` via `module.exports`. Accepts a hex string (3 or 6 chars, optional `#` prefix), validates input, converts to RGB array, generates `rgb()` string, and computes YIQ-based foreground contrast (black/white). ~50 lines of logic.
- **`hex2rgb.js`** (line 1–68): Near-identical copy of `index.js` but **without** `module.exports` — this was the Bower/browser entry point where `hex2rgb` was a global. This file becomes obsolete once Bower is removed.
- Options supported: `debug` (boolean), `rgbStringDefault` (string fallback), `yiqDefault` (string fallback).
- Returns: `{ rgb: [r,g,b], rgbString: 'rgb(r,g,b)', yiq: 'black'|'white' }`.

### Package Configuration
- **`package.json`**: Package name is `hex2rgb`, version `2.2.0`. Repository URL already updated to `hex2oklch.git`. Contains 6 devDependencies (all outdated): `chai@^2.2.0`, `gulp@^3.8.11`, `gulp-istanbul@^0.8.1`, `gulp-mocha@^2.0.1`, `istanbul@^0.3.13`, `mocha@^2.2.4`. Scripts only has `"test": "make test"`. License URL still references `/blob/master/`.
- **`bower.json`**: Declares `hex2rgb.js` as main entry. Lists ignore patterns for non-browser files. This entire file should be removed.

### Build and Test Tooling
- **`gulpfile.js`**: Single `test` task that runs Mocha tests through gulp-istanbul for coverage. This is replaced entirely by Vitest's built-in coverage.
- **`Makefile`**: Just runs `./node_modules/.bin/mocha --reporter spec`. Obsolete once test script is updated in package.json.
- **`test/index.js`**: 14 test cases across 4 describe blocks (`#rgb`, `#rgbString`, `#yiq`, `#options`). Uses Chai `expect` assertions. Tests cover: valid hex (3 and 6 char), hash prefix stripping, invalid hex defaults, rgbStringDefault/yiqDefault options, debug logging. Well-structured and straightforward to migrate.

### Linting
- **`.eslintrc`**: Legacy JSON format. Sets `browser: true, node: true` environments, custom rules for quotes (single), eol-last, no-mixed-requires, no-underscore-dangle, no-unused-vars. Declares `hex2rgb` global (for Bower). Needs migration to ESLint flat config (`eslint.config.js`).

### CI/CD
- **`.travis.yml`**: Travis CI config targeting Node.js 0.10, 0.11, 0.12. Travis CI's free tier for open source is defunct. Should be replaced with GitHub Actions targeting modern Node.js LTS versions (20, 22).

### Git State
- Local branch: `main`
- Remote branches: `origin/main`, `origin/master` (both point to same commit)
- Remote: `https://github.com/glnster/hex2oklch.git`
- Latest commit: `57aa4f8` (tag: v2.2.0) "2.2.0"
- The `master` remote branch still exists and should eventually be deleted after migration.

### Naming
- Package is still named `hex2rgb` in `package.json`, `bower.json`, all source files, test files, README, and license URL.
- Repository has already been renamed to `hex2oklch` on GitHub (confirmed by remote URL).
- The library function name `hex2rgb` is used as a variable/function name throughout — this will need updating to `hex2oklch` as the capability expands.

## Code References
- `index.js:21-68` — Main library function (CommonJS export)
- `hex2rgb.js:21-68` — Bower browser-global copy (no export)
- `test/index.js:1-93` — Full test suite (Mocha/Chai, 14 tests)
- `package.json:1-44` — Package config with outdated deps and master branch ref
- `bower.json:1-37` — Bower config (to be removed)
- `gulpfile.js:1-15` — Gulp test+coverage task (to be removed)
- `.eslintrc:1-16` — Legacy ESLint config
- `.travis.yml:1-3` — Travis CI config (to be removed)
- `Makefile:1-4` — Make test target (to be removed)
- `README.md:1-120` — Full documentation with Bower references, old badge URLs

## Architecture Documentation

### Current Module System
The library uses CommonJS (`var`, `module.exports`). The Bower entry (`hex2rgb.js`) omits the export, making the function a browser global. Modern approach would be ESM (`export default`) with `"type": "module"` in package.json. Since this is a small utility lib, a single ESM entry point is sufficient — no need for dual CJS/ESM packaging unless backward compat is required.

### Current Dependency Chain
```
npm test → make test → mocha --reporter spec
gulp test → gulp-istanbul → gulp-mocha → mocha (with coverage)
```
Modern replacement:
```
npm test → vitest run
npm run test:coverage → vitest run --coverage
```

### Files to Remove
- `bower.json` — Bower is dead
- `hex2rgb.js` — Bower browser entry
- `gulpfile.js` — Gulp build tool
- `Makefile` — Make wrapper for mocha
- `.travis.yml` — Travis CI
- `.eslintrc` — Legacy ESLint config format
- `coverage/` — Generated coverage (add to .gitignore)

### Files to Create
- `eslint.config.js` — ESLint flat config
- `.github/workflows/ci.yml` — GitHub Actions CI
- `vitest.config.js` — Vitest configuration (optional, can inline in package.json)

### Files to Modify
- `package.json` — Rename, update deps, scripts, branch refs, add `"type": "module"`
- `index.js` — Convert to ESM export
- `test/index.js` — Migrate from Mocha/Chai to Vitest
- `.gitignore` — Add `coverage/`
- `README.md` — Update installation, usage, badges, remove Bower references
- `LICENSE-MIT` — Update year/name if desired

## Modernization Research: Testing Framework

### Recommendation: Vitest
Vitest is the strongest choice for this project:
- **Zero-config** for simple JS projects — no Vite dependency required for non-Vite projects
- **Jest-compatible API** (`describe`, `it`, `expect`) — migration from Mocha/Chai is near-trivial since the test syntax is almost identical
- **Built-in coverage** via v8 or istanbul — eliminates need for gulp-istanbul, separate istanbul package
- **Native ESM support** — aligns with modernizing to ESM modules
- **Fast** — uses Vite's transform pipeline, though speed is less critical for a small lib
- Tests can be migrated almost 1:1: replace `require('chai').expect` with `import { expect } from 'vitest'` and Chai's `.to.eql()` with Vitest's `.toEqual()`, `.to.equal()` stays the same.

### Migration Effort: Low
The existing 14 tests use `describe/it/expect` pattern which maps directly to Vitest. The main changes:
1. Replace `var expect = require('chai').expect` → `import { describe, it, expect } from 'vitest'`
2. Replace `var hex2rgb = require('../index')` → `import hex2oklch from '../index.js'`
3. Chai's `.to.eql()` → Vitest's `.toEqual()` (deep equality)
4. Chai's `.to.equal()` → Vitest's `.toBe()` (strict equality)
5. Chai's `.to.throw(TypeError)` → Vitest's `.toThrow(TypeError)` (stays similar with `expect(() => ...).toThrow()`)

## Modernization Research: Package Manager

### Recommendation: Keep npm
Per the user's request, keep npm and remove Bower. npm is already the package manager in use. No migration needed for the package manager itself. Just:
1. Delete `bower.json`
2. Remove Bower references from README.md
3. Remove the Bower badge from README.md

### Optional: Add yarn or bun support
The user mentioned yarn or bun as options. For a small published utility lib, npm is sufficient. Adding yarn or bun is a personal/workspace preference and doesn't require changes to the library itself — any consumer can install via their preferred manager. No lockfile is typically committed for published libraries.

## Modernization Research: Linting

### Recommendation: ESLint Flat Config
ESLint 9+ uses flat config (`eslint.config.js`) exclusively. The legacy `.eslintrc` format is deprecated. For this small lib:
- Use `@eslint/js` recommended config as base
- Remove the `hex2rgb` global (no longer needed without Bower)
- Set `sourceType: "module"` for ESM
- Minimal rules: existing ones (single quotes, etc.) can be carried forward

## Modernization Research: CI/CD

### Recommendation: GitHub Actions
Travis CI free tier is no longer available for open source. GitHub Actions is the standard replacement:
- Test matrix: Node.js 20.x, 22.x (current LTS versions)
- Run: `npm ci` → `npm test`
- Optionally: lint step, coverage upload

## Branch References
`package.json` line 29 references `/blob/master/LICENSE-MIT`. This should be updated to `/blob/main/LICENSE-MIT`. The remote still has both `origin/master` and `origin/main` — the `master` branch can be deleted once `main` is confirmed as default on GitHub.

## Resolved Decisions
1. **Scope**: Preserve existing hex→RGB+YIQ API as-is (just rename). OKLCH color space support will come in future tickets.
2. **npm package name**: `hex2oklch` is available on npm. The old `hex2rgb` package is a separate existing package — leave it untouched, no deprecation. This is a new lib.
3. **Module format**: ESM-only (`"type": "module"`). ESM is the modern standard and the most widely adopted direction for new packages.
4. **Language**: Plain JavaScript only. No TypeScript conversion.
5. **Node.js version**: Target current LTS. As of March 2026, Node 24.x is Active LTS ('Krypton') and Node 22.x is Maintenance LTS. CI matrix: Node 22.x, 24.x. Set `engines` to `>=22`.
