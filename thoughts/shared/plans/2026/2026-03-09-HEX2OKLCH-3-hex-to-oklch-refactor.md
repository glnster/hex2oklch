# HEX2OKLCH-3: Hex to OKLCH Refactor — Implementation Plan

## Overview

Refactor the library so it converts hex to OKLCH (replacing RGB output) while keeping the YIQ-based foreground recommendation. The API becomes hex-to-OKLCH: return `oklch`, `oklchString`, and `yiq`. All conversion is implemented in-house using W3C CSS Color 4 formulas (no new dependencies). Documentation and tests are updated to reflect OKLCH.

## Current State Analysis

- **Core**: Single file `src/index.js` (~70 lines). Exports `hex2oklch(hex, options)`. Returns `{ rgb, rgbString, yiq }`. Converts hex → RGB; YIQ from RGB luminance.
- **Options**: `debug`, `rgbStringDefault`, `yiqDefault`.
- **Tests**: `test/index.test.js` — Vitest; asserts `rgb`, `rgbString`, `yiq`, options. `test/visual/index.html` uses `result.rgbString` for background and `result.rgb`/`result.rgbString` in swatch details. `test/visual/visual.spec.js` asserts computed `background-color` (e.g. `rgb(0, 51, 255)`).
- **Docs**: README and JSDoc describe hex-to-rgb; package.json description/keywords mention "hex to rgb".

### Key Discoveries

- `src/index.js:46-64` — Valid-hex branch: regex, RGB from hex, rgbString, YIQ from RGB; return `{ rgb, rgbString, yiq }`.
- `src/index.js:30-31` — Options include `rgbStringDefault`; to be replaced by `oklchStringDefault`.
- `test/visual/index.html:48-58` — `createSwatch` sets `backgroundColor = result.rgbString`, details show `result.rgb` and `result.rgbString`.
- `test/visual/visual.spec.js:14-22` — Assertions use `toHaveCSS('background-color', 'rgb(...)')`; after refactor browsers may still compute to `rgb()` when given `oklch()`, so assertions may remain valid or need to assert `oklchString` in DOM.
- Research: `thoughts/shared/research/2026/2026-03-09-HEX2OKLCH-3-hex-to-oklch-refactor.md` — Resolved: no deps; precision L% 2 decimals, C 4 decimals, H 2 decimals; YIQ derived from OKLCH via OKLCH→OKLAB→XYZ→linear sRGB→gamma sRGB→YIQ.

## Desired End State

- `hex2oklch(hex, options)` returns `{ oklch, oklchString, yiq }`. No `rgb` or `rgbString`.
- **oklch**: `{ L, C, H }` (L 0–1, C ≥ 0, H 0–360 degrees). Invalid hex default: `{ L: 1, C: 0, H: 0 }`.
- **oklchString**: CSS string e.g. `oklch(58.87% 0.2323 282.69)`. Invalid: `options.oklchStringDefault` or `'inherit'`.
- **yiq**: `'black'` or `'white'` from YIQ luminance of the OKLCH-derived sRGB (same pipeline as displayed color). Invalid: `options.yiqDefault` or `'inherit'`.
- **Options**: `oklchStringDefault` (replaces `rgbStringDefault`), `yiqDefault`, `debug`.
- README, JSDoc, and package.json describe hex-to-OKLCH. Unit tests assert `oklch`/`oklchString` and golden value for `#715BFF`. Visual page and Playwright tests use/assert OKLCH output.

### Verification

- `npm test` passes (all unit tests expect `oklch`/`oklchString` and optional golden `#715BFF`).
- `npm run test:visual` passes (swatches use `oklchString`; assertions updated for OKLCH).
- `node -e "import('./src/index.js').then(m=>console.log(m.default('715BFF')))"` shows `oklch`, `oklchString`, `yiq` and `oklchString` matches expected format.
- No new dependencies in package.json.

## What We're NOT Doing

- Adding OKLCH alongside RGB (RGB is removed).
- Adding any npm color libraries; all conversion in-house.
- Changing YIQ semantics (still `'black'`/`'white'`/fallback).
- TypeScript or new files (logic stays in `src/index.js` unless we split helpers for clarity).

## Implementation Approach

Implement conversion pipelines in `src/index.js` (internal helpers or inline), then update return value and options, then tests and docs. Phases are ordered so each step is testable.

---

## Phase 1: Hex → OKLCH conversion and new return value

### Overview

Implement hex → sRGB (0–1) → linear sRGB → XYZ (D65) → OKLAB → OKLCH in-house. Return `oklch` and `oklchString` instead of `rgb` and `rgbString`. Invalid hex returns `oklch: { L: 1, C: 0, H: 0 }` and `oklchString` from option or `'inherit'`.

### Changes Required

#### 1. Conversion pipeline (in `src/index.js`)

- **Hex → sRGB (0–1)**: From current logic, after regex: R,G,B in 0–255 → divide by 255.
- **sRGB → linear sRGB**: W3C transfer. For each channel: if `v <= 0.04045` then `v/12.92`, else `((v+0.055)/1.055)^2.4`. Handle negative (extended transfer): use sign and abs, then reapply sign to result.
- **Linear sRGB → XYZ**: Use D65 matrix from W3C CSS Color 4. Example (exact rationals from spec):
  - `lin_sRGB_to_XYZ` M rows: `[ 506752/1228815, 87881/245763, 12673/70218 ]`, `[ 87098/409605, 175762/245763, 12673/175545 ]`, `[ 7918/409605, 87881/737289, 1001167/1053270 ]`.
- **XYZ → OKLAB**: W3C matrices. XYZ→LMS (XYZtoLMS 3×3), then LMS → cube root per channel, then LMStoOKLab 3×3. Use coefficients from [W3C CSS Color 4 § OKLAB](https://www.w3.org/TR/css-color-4/#ok-lab) (e.g. XYZtoLMS, LMStoOKLab).
- **OKLAB → OKLCH**: L = L; C = sqrt(a²+b²); H = atan2(b,a) in degrees, normalized to 0–360; if C ≤ ε, H = NaN (or 0). Store L in 0–1; C, H as numbers.
- **oklchString**: Format `oklch(L% C H)` with L as percentage two decimals (e.g. `58.87%`), C four decimals (e.g. `0.2323`), H two decimals (e.g. `282.69`). Example: `#715BFF` → `oklch(58.87% 0.2323 282.69)`.

#### 2. Replace RGB with OKLCH in return and options

- Remove `rgb` and `rgbString` from the return object. Add `oklch` and `oklchString`.
- Replace option `rgbStringDefault` with `oklchStringDefault` (default `'inherit'`, same type check as before).
- Invalid hex: set `oklch = { L: 1, C: 0, H: 0 }`; `oklchString = options.oklchStringDefault` or `'inherit'`.

#### 3. JSDoc

- Update `@param` for options: document `oklchStringDefault` instead of `rgbStringDefault`.
- Update `@return`: document `oklch` (object `{ L, C, H }`), `oklchString` (string), `yiq` (unchanged).

### Success Criteria

#### Automated Verification

- [x] Unit tests updated in Phase 4 (can be done in same PR; if phased, temporarily skip or relax tests that still expect `rgb`/`rgbString` until Phase 4).
- [x] For a quick check: `node -e "import('./src/index.js').then(m=>{const r=m.default('715BFF'); console.log(r.oklchString)})"` prints `oklch(58.87% 0.2323 282.69)` (or equivalent within rounding).
- [x] `npm run lint` passes.

#### Manual Verification

- [ ] Invalid hex returns `oklch: { L: 1, C: 0, H: 0 }` and `oklchString` from `oklchStringDefault` or `'inherit'`.
- [x] No use of `rgb` or `rgbString` in return value.

**Implementation Note**: After Phase 1, unit tests will fail until Phase 4 updates expectations. Proceed to Phase 2 and 3, then Phase 4, so that by end of Phase 4 all tests pass.

---

## Phase 2: YIQ from OKLCH

### Overview

Compute YIQ (foreground) from the OKLCH result so contrast is based on the same color the user sees. Pipeline: OKLCH → OKLAB → XYZ → linear sRGB → gamma sRGB (R,G,B 0–255) → Y = (299*R+587*G+114*B)/1000; if Y ≥ 128 or NaN then `yiq = 'black'`, else `yiq = 'white'`. Only when hex is valid.

### Changes Required

#### 1. Inverse conversion (in `src/index.js`)

- **OKLCH → OKLAB**: L unchanged; a = C*cos(H°); b = C*sin(H°) (H in degrees).
- **OKLAB → XYZ**: W3C OKLab_to_XYZ (OKLabtoLMS 3×3, then cube each LMS channel, then LMStoXYZ 3×3). Use coefficients from [W3C CSS Color 4](https://www.w3.org/TR/css-color-4/#ok-lab).
- **XYZ → linear sRGB**: W3C XYZ_to_lin_sRGB matrix.
- **Linear sRGB → gamma sRGB**: W3C extended transfer. If `|v| <= 0.0031308` then `12.92*v`, else `sign * (1.055 * |v|^(1/2.4) - 0.055)`. Scale result to 0–255 (multiply by 255, clamp if needed).
- **YIQ luminance**: Y = (R*299 + G*587 + B*114) / 1000; threshold Y ≥ 128 → `'black'`, else `'white'`. Match current behavior for edge/NaN.

#### 2. Remove YIQ from RGB

- Delete the old YIQ calculation that used RGB directly. Use the new pipeline only when hex is valid and OKLCH was computed.

### Success Criteria

#### Automated Verification

- [x] Unit tests for `yiq`: dark hex → `'white'`, light hex → `'black'`, invalid → `'inherit'` (Phase 4).
- [x] `npm run lint` passes.

#### Manual Verification

- [ ] For `#0033ff` (dark blue), `yiq` is `'white'`.
- [ ] For `#ff88ee` (light pink), `yiq` is `'black'`.
- [ ] Visual test page (after Phase 5) shows correct text color on swatches.

**Implementation Note**: Phases 2 and 3 can be implemented together with Phase 1 in one edit to `src/index.js` if preferred; the plan keeps them separate for clarity.

---

## Phase 3: Options and invalid-hex defaults

### Overview

Ensure options object supports `oklchStringDefault`, `yiqDefault`, and `debug`. No `rgbStringDefault`. Default for invalid hex: `oklch` `{ L: 1, C: 0, H: 0 }`, `oklchString` from `oklchStringDefault` or `'inherit'`, `yiq` from `yiqDefault` or `'inherit'`.

### Changes Required

- In `src/index.js`: options parsing already updated in Phase 1. Verify `options.oklchStringDefault` is used for invalid hex and that non-string falls back to `'inherit'`.
- Add unit tests in Phase 4 for `oklchStringDefault` (replace former `rgbStringDefault` tests).

### Success Criteria

- [ ] Same as Phase 1/2; covered by Phase 4 option tests.

---

## Phase 4: Unit tests

### Overview

Replace all assertions on `rgb` and `rgbString` with `oklch` and `oklchString`. Add golden test for `#715BFF`. Replace `rgbStringDefault` option tests with `oklchStringDefault`. Keep YIQ and `yiqDefault`/`debug` tests.

### Changes Required

#### 1. `test/index.test.js`

- **#rgb** → **#oklch**: Assert `oklch` object shape and values. For `0033ff` / `03f`: expect `oklch` to match computed OKLCH (or snapshot). For `000000`: `oklch` ≈ `{ L: 0, C: 0, H: 0 }` (or appropriate H). For invalid: `oklch` to equal `{ L: 1, C: 0, H: 0 }`.
- **#rgbString** → **#oklchString**: Valid hex e.g. `0033ff` → `oklchString` matches pattern `oklch(...% ... ...)`. Invalid → `'inherit'`. Add test: `hex2oklch('715BFF').oklchString` equals `'oklch(58.87% 0.2323 282.69)'` (or within rounding).
- **#yiq**: Keep existing cases (dark → white, light → black, invalid → inherit).
- **#options**: Replace `rgbStringDefault` tests with `oklchStringDefault` (invalid hex → `oklchString` equals option or `'inherit'`; non-string option → `'inherit'`). Keep `yiqDefault` and `debug` tests (update `debug` expect to use `oklch` if needed).

### Success Criteria

#### Automated Verification

- [x] `npm test` passes.
- [ ] `npm run test:coverage` passes; coverage remains acceptable.

#### Manual Verification

- [x] No references to `rgb` or `rgbString` in tests.

---

## Phase 5: Visual test page

### Overview

Use `result.oklchString` for swatch background and display `oklch` / `oklchString` in swatch details instead of `rgb` / `rgbString`. Keep `result.yiq` for text color.

### Changes Required

#### 1. `test/visual/index.html`

- In `createSwatch`: set `swatch.style.backgroundColor = result.oklchString` (instead of `result.rgbString`). Keep `swatch.style.color = result.yiq`.
- In swatch details HTML: replace `rgb: [${result.rgb.join(', ')}]` and `rgbString: ${result.rgbString}` with `oklch: L=${result.oklch.L}, C=${result.oklch.C}, H=${result.oklch.H}` (or formatted) and `oklchString: ${result.oklchString}`.
- Ensure invalid swatches still use `result.yiq === 'inherit'` and do not set background to a color (or keep current invalid styling).

### Success Criteria

#### Automated Verification

- [x] Page loads without errors; script uses `result.oklchString` and `result.oklch`.
- [ ] Playwright tests (Phase 6) pass.

#### Manual Verification

- [ ] Swatch background renders with OKLCH (browser shows correct color).
- [ ] Details show OKLCH values and string.
- [ ] Foreground text remains black/white per YIQ.

---

## Phase 6: Playwright visual tests

### Overview

Update assertions so they remain valid when background is set via `oklchString`. Browsers may still compute `background-color` to `rgb(...)` when the applied value is `oklch(...)`; if so, keep asserting computed style. Alternatively assert presence of `oklchString` in DOM or specific `oklch(...)` in style/content.

### Changes Required

#### 1. `test/visual/visual.spec.js`

- **Swatch count**: No change.
- **Dark color white foreground**: Keep or update assertion. If computed style stays `rgb(0, 51, 255)` for `oklch(...)` equivalent to blue, keep `toHaveCSS('background-color', 'rgb(0, 51, 255)')`. If browser reports in different form, assert that the swatch has white text and that background is the expected color (e.g. by data attribute or content).
- **Light color black foreground**: Same idea; ensure black text on light swatch.
- **Invalid hex**: No change (`.invalid` class).
- **Interactive add**: New swatch `ff6600` — assert background (computed or `oklchString` in DOM) and visibility.
- **Short hex**: Swatch `03f` — assert background matches same OKLCH as `0033ff` (or computed rgb if equivalent).

### Success Criteria

#### Automated Verification

- [x] `npm run test:visual` passes. (Requires `npx playwright install`; assertions accept either rgb() or oklch() computed style.)

#### Manual Verification

- [x] No flakiness; assertions match actual rendered behavior.

---

## Phase 7: Documentation and package metadata

### Overview

Update README, JSDoc (remaining in `src/index.js`), and package.json to describe hex-to-OKLCH and new API/options.

### Changes Required

#### 1. README.md

- Replace "Converts hex color to rgb" with hex-to-OKLCH description. Example: "Converts hex color to OKLCH and calculates appropriate foreground."
- **Example / Usage**: Replace all `.rgb` and `.rgbString` examples with `.oklch` and `.oklchString`. Example output: `oklch(58.87% 0.2323 282.69)` for a sample hex.
- **API**: Document `hex2oklch(hex, options)`, `oklch` (object `{ L, C, H }`), `oklchString` (string), `yiq`. Options: `oklchStringDefault`, `yiqDefault`, `debug`. Remove `rgb`/`rgbString`/`rgbStringDefault`.
- **Release history**: Add entry for this refactor (e.g. 4.0.0 — Hex to OKLCH; replace RGB with OKLCH; YIQ from OKLCH; `oklchStringDefault`).

#### 2. JSDoc in `src/index.js`

- Already updated in Phase 1; verify top-level description says "Converts hex color to OKLCH" and params/returns are correct.

#### 3. package.json

- **description**: "Converts hex color to OKLCH and calculates appropriate corresponding foreground."
- **keywords**: Replace "hex to rgb" with "hex to oklch" or similar; keep "hex", "oklch", "yiq", "convert", "contrast", "foreground".

### Success Criteria

#### Automated Verification

- [x] `npm run lint` still passes.
- [x] No broken links or outdated code blocks in README.

#### Manual Verification

- [ ] README accurately describes API and examples.
- [x] package.json description/keywords reflect OKLCH.

---

## Testing Strategy

### Unit tests

- **oklch**: Valid 6- and 3-char hex; black; invalid → default `{ L: 1, C: 0, H: 0 }`; hash stripped.
- **oklchString**: Valid → format `oklch(L% C H)` with correct precision; invalid → `'inherit'` or `oklchStringDefault`. Golden: `#715BFF` → `oklch(58.87% 0.2323 282.69)`.
- **yiq**: Dark → `'white'`, light → `'black'`, invalid → `'inherit'` or `yiqDefault`.
- **options**: `oklchStringDefault`, `yiqDefault`, `debug` (no `rgbStringDefault`).
- **TypeError**: Non-string hex throws.

### Integration / visual

- Visual page: swatches use `oklchString` and show OKLCH details; YIQ text color correct.
- Playwright: swatch count; dark/light foreground; invalid styling; add swatch; short hex.

### Manual

- Spot-check a few hex values in browser and compare with known OKLCH (e.g. devtools or external tool).
- Confirm README examples run and match documented output.

---

## Performance Considerations

- All work is in-memory; no I/O. Conversion is a small fixed number of steps. No caching required for current scope.
- If needed later, internal helpers can be shared between hex→OKLCH and OKLCH→sRGB for YIQ to avoid duplication.

---

## Migration Notes

- **Breaking**: Consumers using `rgb` or `rgbString` must switch to `oklch` and `oklchString`. Bump major version (e.g. 4.0.0).
- **Options**: Replace `rgbStringDefault` with `oklchStringDefault` in caller code.
- No data migration; this is API-only.

---

## References

- Research: `thoughts/shared/research/2026/2026-03-09-HEX2OKLCH-3-hex-to-oklch-refactor.md`
- W3C CSS Color 4 — OKLAB/OKLCH: https://www.w3.org/TR/css-color-4/#ok-lab
- W3C CSS Color 4 — sRGB/XYZ matrices and transfer: same spec (lin_sRGB, gam_sRGB, lin_sRGB_to_XYZ, XYZ_to_lin_sRGB)
- Current implementation: `src/index.js` (full file)
- Unit tests: `test/index.test.js`
- Visual: `test/visual/index.html`, `test/visual/visual.spec.js`
- Previous plans: `thoughts/shared/plans/2026/2026-03-05-HEX2OKLCH-1-modernize-lib.md`, `2026-03-06-HEX2OKLCH-2-visual-testing-playwright.md`
