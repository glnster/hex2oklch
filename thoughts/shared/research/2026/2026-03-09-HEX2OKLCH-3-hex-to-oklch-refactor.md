---
date: 2026-03-09T00:00:00-08:00
researcher: Cursor
git_commit: 21484039cbdd966d367f8894e84e6209f446ebee
branch: hex2oklch3-refactor-conversion-oklch
repository: hex2oklch
topic: "HEX2OKLCH-3 refactor: replace RGB with OKLCH, keep foreground (yiq)"
tags: [research, codebase, hex2oklch, hex, oklch, yiq, foreground]
status: complete
last_updated: 2026-03-09
last_updated_by: Cursor
last_updated_note: "Incorporated clarification (replace RGB with OKLCH; update docs and tests) and resolved open questions (no deps, exact precision, OKLCH field names). YIQ calculation updated: derive from OKLCH via linear sRGB → gamma sRGB → YIQ matrix for consistency and accessibility."
---

# Research: HEX2OKLCH-3 — Hex to OKLCH Refactor (Keep Foreground)

**Date**: 2026-03-09  
**Researcher**: Cursor  
**Git Commit**: 21484039cbdd966d367f8894e84e6209f446ebee  
**Branch**: hex2oklch3-refactor-conversion-oklch  
**Repository**: hex2oklch  

## Research Question

Refactor the library so that it converts colors from hex into OKLCH (e.g. for hex `#715BFF` return something like `oklch(58.87% 0.2323 282.69)`), while still keeping the foreground color calculation and output functionality.

## Clarification (refactor scope)

- **Replace** the current functionality of returning RGB with OKLCH; do not add OKLCH alongside RGB. The library becomes hex-to-OKLCH, not hex-to-rgb.
- Update any existing documentation that describes the library as hex-to-rgb so it describes hex-to-OKLCH.
- Update or replace tests that expect RGB-based outputs so they expect OKLCH-based outputs.

## Summary

The codebase has a single core module, `src/index.js`, which exports one function `hex2oklch(hex, options)`. It currently converts hex to RGB (array and string), and computes a YIQ-based foreground recommendation (`yiq`: `'black'` or `'white'`). There is no OKLCH conversion today. To support the refactor:

- **Replace RGB with OKLCH**: Implement hex → sRGB → linear RGB → XYZ → OKLAB → OKLCH in-house (no dependencies). Return `oklch` (object `{ L, C, H }`) and `oklchString` (CSS string e.g. `oklch(58.87% 0.2323 282.69)`). Remove `rgb` and `rgbString` from the API.
- **Keep foreground**: Retain `yiq` and its semantics. Compute YIQ from the OKLCH output (not from raw hex/RGB): convert OKLCH → OKLAB → XYZ → linear sRGB → gamma-corrected sRGB, then apply the YIQ luminance formula to R, G, B. This keeps the contrast decision aligned with the displayed background (OKLCH) and is appropriate for accessibility; OKLCH L is perceptual lightness while C and H are chrominance.
- **Options**: Rename to reflect OKLCH: `oklchStringDefault` (replacing `rgbStringDefault`), keep `yiqDefault` and `debug`.
- **Documentation**: Update README, JSDoc, and any other copy that says hex-to-rgb to hex-to-OKLCH.
- **Tests**: Replace unit tests that assert `rgb` / `rgbString` with tests that assert `oklch` / `oklchString`. Update or replace visual test page and Playwright tests that rely on RGB output (e.g. swatch background and assertions).

## Detailed Findings

### 1. Core entry and API — `src/index.js`

- **Location**: `src/index.js` (single file, ~70 lines).
- **Export**: `export default hex2oklch` — one function.
- **Signature**: `hex2oklch(hex, options)`  
  - `hex`: string, 3 or 6 hex-only characters; leading `#` is stripped.  
  - `options`: optional object with `debug` (boolean), `rgbStringDefault` (string), `yiqDefault` (string). After refactor: `oklchStringDefault` (replaces `rgbStringDefault`), `yiqDefault`, `debug`.

**Current behavior:**

1. **Validation**: If `hex` is not a string, throws `TypeError`. Leading `#` is removed. 3-char hex is expanded to 6 (e.g. `03f` → `0033ff`). Valid format is 6 hex chars via regex `/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i`.
2. **RGB**: On valid hex, RGB is computed from the 6-char string. The code uses `parseInt(cleanHex, 16)` where `cleanHex` is the regex exec result; in practice the first component is the full match so parsing works. RGB components are `[num >> 16, (num >> 8) & 255, num & 255]`. Default for invalid hex: `[255, 255, 255]`.
3. **rgbString**: `'rgb(R, G, B)'` when valid; when invalid, `options.rgbStringDefault` or `'inherit'`.
4. **YIQ (foreground)**: Only when hex is valid: `yiq = (R*299 + G*587 + B*114) / 1000`; if `yiq >= 128 || isNaN(yiq)` then `yiqres = 'black'`, else `yiqres = 'white'`. When invalid: `options.yiqDefault` or `'inherit'`.
5. **Return value**: `{ rgb, rgbString, yiq }`. No OKLCH fields exist today.

**Refactor direction:** Replace `rgb` and `rgbString` with `oklch` and `oklchString`. Keep `yiq`. Return value becomes `{ oklch, oklchString, yiq }`. Options: `oklchStringDefault` (replacing `rgbStringDefault`), `yiqDefault`, `debug`. Invalid-hex default for color: e.g. `oklch: { L: 1, C: 0, H: 0 }`, `oklchString`: `options.oklchStringDefault` or `'inherit'`.

### 2. Foreground (yiq) usage

- **Current calculation**: In `src/index.js` (lines 53–54), foreground is derived from RGB using the YIQ luminance formula: `(R*299 + G*587 + B*114) / 1000`; threshold ≥ 128 → `'black'`, else `'white'`.
- **Refactor: derive YIQ from OKLCH**. Now that the background color output is OKLCH (not RGB), the foreground contrast decision should be based on the same color the user sees. To calculate YIQ from OKLCH:
  1. Convert **OKLCH → OKLAB** (inverse of OKLAB→OKLCH: L unchanged; a = C·cos(H°); b = C·sin(H°)).
  2. Convert **OKLAB → XYZ** (inverse of XYZ→OKLAB; W3C CSS Color 4).
  3. Convert **XYZ → linear sRGB** (inverse of linear sRGB→XYZ).
  4. Convert **linear sRGB → gamma-corrected sRGB** to obtain R, G, B (e.g. 0–255).
  5. Apply the **YIQ matrix** to R, G, B. For luminance (used for contrast): **Y = 0.299·R + 0.587·G + 0.114·B** (with R, G, B in 0–255, so Y = (299·R + 587·G + 114·B) / 1000). Threshold Y ≥ 128 → `'black'`, else `'white'`.
- **Accessibility rationale**: OKLCH lightness (L) corresponds closely to perceptual brightness; C and H determine chrominance. Converting OKLCH back to sRGB and applying the standard YIQ luminance formula ensures the foreground recommendation matches the displayed OKLCH background and remains useful for accessibility.
- **Consumers** (to be updated):
  - **Visual test page** (`test/visual/index.html`): Currently uses `result.rgbString` for background and `result.yiq` for text. Update to use `result.oklchString` for background; keep `result.yiq` for text. Update swatch details to show `oklch` / `oklchString` instead of `rgb` / `rgbString`.
  - **Playwright tests** (`test/visual/visual.spec.js`): Currently assert computed `background-color` and `color`. Update assertions as needed when background is set via `oklchString` (e.g. assert on oklchString in DOM or accept computed style).

### 3. Unit tests — `test/index.test.js`

- **Location**: `test/index.test.js`; imports `hex2oklch` from `../src/index.js`.
- **Structure**: Vitest `describe`/`it`/`expect`. Currently covers:
  - `#rgb`: valid 6- and 3-char hex, black, null → TypeError, hash stripping, invalid → `[255,255,255]`.
  - `#rgbString`: valid → `'rgb(0, 51, 255)'`, invalid → `'inherit'`.
  - `#yiq`: dark hex → `'white'`, light hex → `'black'`, invalid → `'inherit'`.
  - `#options`: `rgbStringDefault`, `yiqDefault`, `debug`.
- **Refactor impact**: Replace tests that assert `rgb` and `rgbString` with tests that assert `oklch` and `oklchString`. Keep `#yiq` and foreground-related option tests. Replace `#options` cases for `rgbStringDefault` with `oklchStringDefault`. Add at least one test for exact output (e.g. `#715BFF` → `oklch(58.87% 0.2323 282.69)`).

### 4. Visual test page — `test/visual/index.html`

- **Purpose**: Renders a grid of swatches from a fixed list plus user-added hex. Each swatch currently shows hex, `rgb`, `rgbString`, and `yiq`.
- **Data flow**: `hex2oklch(hex)` → `result`; background = `result.rgbString`, color = `result.yiq`; invalid = `result.yiq === 'inherit'`.
- **Refactor impact**: Use `result.oklchString` for background; keep `result.yiq` for text. Replace swatch details with `oklch` (L, C, H) and `oklchString` instead of `rgb` / `rgbString`.

### 5. Playwright visual tests — `test/visual/visual.spec.js`

- **Location**: `test/visual/visual.spec.js`; navigates to `/test/visual/index.html`.
- **Assertions**: Swatch count; dark swatch background + white text; light swatch black text; invalid hex has `.invalid`; interactive add; short hex expansion. Currently assert computed `background-color` (e.g. `rgb(0, 51, 255)`).
- **Refactor impact**: Update assertions that expect RGB-based background to work with OKLCH (e.g. assert on `oklchString` in the page content, or keep asserting computed color if the browser still resolves to rgb). Keep foreground (color: white/black) assertions.

### 6. Package and docs

- **package.json**: `main`/`exports` point to `./src/index.js`; no color/OKLCH dependencies. Description and keywords should be updated from hex-to-rgb to hex-to-OKLCH.
- **README.md**: Currently describes hex → rgb and foreground. Update to describe hex → OKLCH; replace all `.rgb` / `.rgbString` examples with `.oklch` / `.oklchString`; document `oklchStringDefault`; update API section and release history.

## Code References

| Path | Lines | Description |
|------|--------|-------------|
| `src/index.js` | 1–69 | Full `hex2oklch` implementation: hex parsing, RGB, rgbString, YIQ foreground, options, return object |
| `src/index.js` | 46–54 | Valid hex branch: regex, RGB from hex, rgbString, YIQ formula and `yiqres` |
| `test/index.test.js` | 1–91 | Unit tests for rgb, rgbString, yiq, options |
| `test/visual/index.html` | 41–61 | `createSwatch`: uses `result.rgbString`, `result.yiq`, `result.rgb` |
| `test/visual/visual.spec.js` | 14–22 | Foreground assertions (dark → white, light → black) |

## Architecture Documentation

- **Single-function API**: All conversion and foreground logic lives in `hex2oklch` in `src/index.js`. Refactor: compute hex → sRGB → linear → XYZ → OKLAB → OKLCH; return `oklch`, `oklchString`, `yiq`. For YIQ: derive from OKLCH (OKLCH → OKLAB → XYZ → linear sRGB → gamma sRGB → YIQ luminance on R,G,B); do not derive YIQ from the initial hex→RGB parse, so the contrast decision is based on the same OKLCH color that is output.
- **Invalid input**: One code path for invalid hex. After refactor: default `oklch` e.g. `{ L: 1, C: 0, H: 0 }`; `oklchString` = `options.oklchStringDefault` or `'inherit'`; `yiq` = `options.yiqDefault` or `'inherit'`; optional `debug` log unchanged.
- **Options**: Replace `rgbStringDefault` with `oklchStringDefault`; keep `yiqDefault` and `debug`.
- **No dependencies**: Conversion must be implemented in-house. Use W3C CSS Color 4 formulas: hex → sRGB (0–1) → linear sRGB → XYZ (D65) → OKLAB → OKLCH. No external color libraries.

## Historical Context (from thoughts/)

- `thoughts/shared/plans/2026/2026-03-05-HEX2OKLCH-1-modernize-lib.md` — Modernization plan (ESM, Vitest, rename to hex2oklch). Explicitly left OKLCH for future tickets. Confirms current API is hex → RGB + foreground (yiq).
- `thoughts/shared/plans/2026/2026-03-06-HEX2OKLCH-2-visual-testing-playwright.md` — Visual testing with Playwright; tests rely on `rgbString` and `yiq` for swatches and contrast.

## Related Research

- `thoughts/shared/research/2026/2026-03-05-HEX2OKLCH-1-modernize-lib.md`
- `thoughts/shared/research/2026/2026-03-06-visual-testing-framework.md`

## Resolved Decisions (from clarification and open questions)

1. **No dependencies**: Use pure in-house conversions only. Implement hex → sRGB → linear → XYZ → OKLAB → OKLCH using W3C CSS Color 4 coefficients; no npm color libraries.
2. **Exact rounding/precision**: Use fixed precision for the CSS `oklchString`: L as percentage with 2 decimal places (e.g. `58.87%`), C with 4 decimal places (e.g. `0.2323`), H with 2 decimal places (e.g. `282.69`). Example: `oklch(58.87% 0.2323 282.69)`.
3. **Naming**: Return fields are `oklch` (object `{ L, C, H }`) and `oklchString` (string `oklch(L% C H)`). Option is `oklchStringDefault` (replacing `rgbStringDefault`). Keep `yiq` and `yiqDefault` as-is.
4. **YIQ from OKLCH**: Compute foreground (yiq) from the OKLCH result, not from hex/RGB. Pipeline: OKLCH → OKLAB → XYZ → linear sRGB → gamma-corrected sRGB → YIQ luminance (Y = 0.299·R + 0.587·G + 0.114·B, R/G/B 0–255; threshold Y ≥ 128 → black, else white). This aligns the contrast decision with the displayed OKLCH background and supports accessibility; OKLCH L is perceptual lightness, C and H are chrominance.
