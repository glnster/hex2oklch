# HEX2OKLCH-1: Modernize hex2oklch Lib — Implementation Plan

## Overview
Modernize the hex2oklch library (formerly hex2rgb) from 2015-era tooling to current standards. Convert to ESM, replace Mocha/Chai with Vitest, migrate to ESLint flat config, replace Travis CI with GitHub Actions, and rename the package to `hex2oklch`. The existing hex→RGB+YIQ API is preserved as-is; OKLCH color space support is out of scope.

## Current State Analysis
- **Module format**: CommonJS (`var`, `module.exports`)
- **Package name**: `hex2rgb` in `package.json`, repo already renamed to `hex2oklch` on GitHub
- **Testing**: Mocha 2.x + Chai 2.x + Istanbul 0.3.x via Gulp
- **Linting**: `.eslintrc` (legacy JSON format)
- **CI**: Travis CI targeting Node 0.10–0.12
- **Build**: Gulp + Makefile
- **Package managers**: npm + Bower
- **Branch refs**: `master` in license URL (should be `main`)

### Key Discoveries:
- `index.js:21-68` — Single function, ~50 lines of core logic, CommonJS export
- `hex2rgb.js` — Near-identical Bower browser copy (no `module.exports`), obsolete
- `test/index.js:1-93` — 14 well-structured tests using `describe/it/expect` pattern
- `package.json:29` — License URL still references `/blob/master/`
- All 6 devDependencies are outdated (Gulp 3.x, Mocha 2.x, Chai 2.x, Istanbul 0.3.x)

## Desired End State
- ESM-only package named `hex2oklch` with `"type": "module"` in package.json
- Vitest for testing with built-in coverage
- ESLint flat config (`eslint.config.js`)
- GitHub Actions CI testing Node 22.x and 24.x
- All `master` branch references updated to `main`
- Function renamed from `hex2rgb` to `hex2oklch`
- No Bower, Gulp, Makefile, or Travis CI artifacts
- `npm test` and `npm run lint` work out of the box

### Verification:
- `npm test` runs Vitest and all 14 tests pass
- `npm run lint` runs ESLint with zero errors
- `node -e "import hex2oklch from './index.js'; console.log(hex2oklch('0033ff'))"` outputs correct result
- GitHub Actions CI passes on push

## What We're NOT Doing
- Adding OKLCH color space conversion (future tickets)
- Converting to TypeScript
- Publishing to npm (separate step after verification)
- Dual CJS/ESM packaging — ESM-only
- Deleting `origin/master` remote branch (manual step after confirming `main` is default)

## Implementation Approach
Work in 5 incremental phases. Each phase produces a testable state. Since this is a small library, phases are quick but kept separate for clean git history and easy review.

---

## Phase 1: Legacy Cleanup

### Overview
Remove all obsolete files that belong to Bower, Gulp, Travis CI, and the Makefile build chain. Clear generated coverage artifacts.

### Changes Required:

#### 1. Delete legacy files
**Files to remove**:
- `bower.json`
- `hex2rgb.js`
- `gulpfile.js`
- `Makefile`
- `.travis.yml`
- `.eslintrc`
- `coverage/` (entire directory)

#### 2. Update `.gitignore`
**File**: `.gitignore`
**Changes**: Add `coverage/` and `node_modules/` (already present but verify)

```gitignore
node_modules
coverage
```

### Success Criteria:

#### Automated Verification:
- All 7 files/directories listed above are removed from the working tree
- `.gitignore` contains `coverage` entry
- `git status` shows only expected deletions and modifications

#### Manual Verification:
- Confirm no other files were accidentally removed

---

## Phase 2: Core Modernization

### Overview
Rewrite `package.json` for the new identity and modern tooling. Convert `index.js` from CommonJS to ESM. Rename the exported function from `hex2rgb` to `hex2oklch`.

### Changes Required:

#### 1. Rewrite `package.json`
**File**: `package.json`
**Changes**:
- Rename `name` from `hex2rgb` to `hex2oklch`
- Bump version to `3.0.0` (breaking: ESM-only, renamed package)
- Add `"type": "module"`
- Update `description` to reflect new name
- Update `keywords` to include `oklch`
- Update `repository.url` to `hex2oklch`
- Update `bugs.url` and `homepage` to `hex2oklch`
- Fix license URL: `master` → `main`
- Update `licenses` to modern `license` field (string, not array)
- Add `engines: { "node": ">=22" }`
- Replace all devDependencies with: `vitest`, `eslint`, `@eslint/js`, `globals`
- Update scripts: `test`, `test:coverage`, `lint`
- Remove `directories.test` (unnecessary)

Target `package.json`:
```json
{
  "name": "hex2oklch",
  "version": "3.0.0",
  "description": "Converts hex color to rgb and calculates appropriate corresponding foreground.",
  "type": "module",
  "main": "index.js",
  "exports": {
    ".": "./index.js"
  },
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint ."
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/glnster/hex2oklch.git"
  },
  "keywords": [
    "hex",
    "rgb",
    "oklch",
    "yiq",
    "convert",
    "hex to rgb",
    "contrast",
    "foreground"
  ],
  "author": "Glenn Cueto <glenncueto@gmail.com> (http://gcgrafix.com)",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/glnster/hex2oklch/issues"
  },
  "homepage": "https://github.com/glnster/hex2oklch",
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "eslint": "^9.0.0",
    "globals": "^15.0.0",
    "vitest": "^3.0.0"
  }
}
```

#### 2. Convert `index.js` to ESM
**File**: `index.js`
**Changes**:
- Replace `var hex2rgb = function(hex, options) {` with `const hex2oklch = function(hex, options) {`
- Convert `var` declarations to `const`/`let`
- Replace `module.exports = hex2rgb` with `export default hex2oklch`
- Update JSDoc header (name, URL)
- Update console.error message from `hex2rgb` to `hex2oklch`
- Remove `'use strict'` (ESM is strict by default)

### Success Criteria:

#### Automated Verification:
- `node -e "import hex2oklch from './index.js'; const r = hex2oklch('0033ff'); console.log(JSON.stringify(r));"` outputs `{"rgb":[0,51,255],"rgbString":"rgb(0, 51, 255)","yiq":"white"}`
- `package.json` is valid JSON with `"type": "module"`
- No `require()` or `module.exports` in `index.js`

#### Manual Verification:
- Review that the function logic is unchanged (only variable names and module syntax changed)

**Implementation Note**: After completing this phase, pause for manual confirmation before proceeding.

---

## Phase 3: Testing Migration

### Overview
Migrate the 14 existing Mocha/Chai tests to Vitest. All tests should pass with identical behavior.

### Changes Required:

#### 1. Install dependencies
Run `npm install` to install Vitest and other new devDependencies from Phase 2.

#### 2. Rewrite `test/index.js`
**File**: `test/index.js`
**Changes**:
- Replace CommonJS imports with ESM: `import { describe, it, expect } from 'vitest'`
- Replace `require('../index')` with `import hex2oklch from '../index.js'`
- Rename `hex2rgb` references to `hex2oklch` in test code
- Migrate Chai assertions to Vitest:
  - `.to.eql([...])` → `.toEqual([...])`
  - `.to.equal('...')` → `.toBe('...')`
  - `.to.throw(TypeError)` → `.toThrow(TypeError)` (wrapping pattern stays the same)
- Update test description strings from `hex2rgb` to `hex2oklch` where appropriate

#### 3. Add Vitest config (optional)
**File**: `vitest.config.js`
**Changes**: Minimal config, only if needed. Vitest works zero-config for this project, but a config file makes coverage settings explicit:

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
    },
  },
});
```

### Success Criteria:

#### Automated Verification:
- `npm test` exits 0 with all 14 tests passing
- `npm run test:coverage` generates coverage report
- No Mocha/Chai imports remain in test files

#### Manual Verification:
- Review test output to confirm all 14 test descriptions match the original suite

**Implementation Note**: After completing this phase, pause for manual confirmation that test output looks correct before proceeding.

---

## Phase 4: Tooling

### Overview
Add ESLint flat config and GitHub Actions CI workflow.

### Changes Required:

#### 1. Create ESLint flat config
**File**: `eslint.config.js`
**Changes**: New file with ESLint 9 flat config format.

```javascript
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      quotes: ['error', 'single'],
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: ['coverage/**'],
  },
];
```

#### 2. Create GitHub Actions CI
**File**: `.github/workflows/ci.yml`
**Changes**: New workflow that runs tests and lint on push/PR.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [22.x, 24.x]

    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

### Success Criteria:

#### Automated Verification:
- `npm run lint` exits 0 with no errors on `index.js` and `test/index.js`
- `eslint.config.js` is valid and loads without errors
- `.github/workflows/ci.yml` is valid YAML

#### Manual Verification:
- After push, confirm GitHub Actions workflow runs and passes

---

## Phase 5: Documentation

### Overview
Rewrite README.md for the new `hex2oklch` identity. Remove all Bower references, update badges, update usage examples.

### Changes Required:

#### 1. Rewrite `README.md`
**File**: `README.md`
**Changes**:
- Rename title from `hex2rgb` to `hex2oklch`
- Remove Bower badge and installation section
- Update Travis CI badge to GitHub Actions badge
- Remove CodeClimate badge (or update if still used)
- Update all code examples: `hex2rgb` → `hex2oklch`, `require()` → `import`
- Update npm install command: `npm install hex2oklch`
- Remove "Using Bower" section entirely
- Update "Using NodeJS" section to show ESM imports
- Update API section: function name `hex2oklch`
- Update test instructions
- Remove `gulp test` reference
- Update release history with v3.0.0 entry

### Success Criteria:

#### Automated Verification:
- No occurrences of `hex2rgb` in README.md (except possibly in release history noting the rename)
- No occurrences of `bower` in README.md
- No occurrences of `require(` in README.md usage examples
- No occurrences of `travis` in README.md

#### Manual Verification:
- README renders correctly on GitHub
- Code examples are accurate and copy-pasteable

---

## Testing Strategy

### Unit Tests (14 existing, migrated to Vitest):
- Valid 6-char hex → correct RGB array
- Valid 3-char shorthand hex → correct RGB array
- Black hex `000000` → `[0, 0, 0]`
- Null/undefined input → TypeError
- Hash-prefixed hex → strips `#` and converts
- Invalid hex → default `[255, 255, 255]`
- Valid hex → correct `rgb()` string
- Invalid hex → `'inherit'` rgbString default
- Dark hex → `'white'` YIQ foreground
- Light hex → `'black'` YIQ foreground
- Invalid hex → `'inherit'` YIQ default
- Custom `rgbStringDefault` option
- Custom `yiqDefault` option
- Non-string option values → fallback to defaults
- Debug mode → console error for invalid hex

### No integration tests needed — this is a pure function library with no external dependencies.

## Performance Considerations
None. This is a ~50-line pure function. No performance-sensitive changes in this modernization.

## Migration Notes
- This is a **new package** (`hex2oklch`), not an update to the existing `hex2rgb` npm package
- Version starts at `3.0.0` to signal breaking changes from the original hex2rgb API (ESM-only, renamed)
- The `origin/master` remote branch can be deleted after confirming `main` is the GitHub default

## References
- Research: `thoughts/shared/research/2026/2026-03-05-HEX2OKLCH-1-modernize-lib.md`
- Original source: `index.js` (commit `57aa4f8`, tag v2.2.0)
- Vitest docs: https://vitest.dev/
- ESLint flat config: https://eslint.org/docs/latest/use/configure/configuration-files
