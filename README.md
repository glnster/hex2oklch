hex2oklch
=========

Converts hex color to OKLCH and calculates appropriate corresponding foreground.


## Example

For a dark hex color, hex2oklch will give you the OKLCH equivalent (e.g. `oklch(58.87% 0.2323 282.69)`). It will also calculate and return an appropriate contrasting foreground (either 'black' or 'white').

Here's hex2oklch in action. Note the black or white text color (foreground) based on the background color.

![example.png](example.png)

## Installation

```sh
npm install github:glnster/hex2oklch
```

## Usage

```js
import hex2oklch from 'hex2oklch';

const hex = '0033ff';
const shorthex = '03f';
const hashhex = '#0033ff';
const badhex = '00PS1E';

hex2oklch(hex).oklch;        // => { L: 0.26..., C: 0.24..., H: 264.05... }
hex2oklch(shorthex).oklch;   // => same L,C,H as 0033ff
hex2oklch(hashhex).oklch;    // => same
hex2oklch(hex).oklchString; // => 'oklch(26.45% 0.2432 264.05)' (example)
hex2oklch(hex).yiq;         // => 'white'

// try with bad input and with options specified
hex2oklch(badhex, { debug: true, oklchStringDefault: '#e9e9e9' });
// logs "(hex2oklch) 00PS1E: Expected 3 or 6 HEX-ONLY chars. Returning defaults."
// Returns oklch { L: 1, C: 0, H: 0 }, oklchString '#e9e9e9'
// and yiq 'inherit' as fall-backs.
```

## API

### *hex2oklch( hex {String}, options {Object} )*

#### hex
A hex-only string of 3 or 6 characters. If the string has a # prefix, the # gets trimmed off.

#### {debug: true | false}

You can pass {debug: true} to enable errors logged to console.

#### {oklchStringDefault: "String e.g. transparent | black | #e9e9e9"}

You can specify a default string that `.oklchString` will return when hex input is invalid or yet to be calculated.

#### {yiqDefault: "String e.g. inherit | gray | #333"}

Similar to oklchStringDefault above.

#### .oklch
Returns an object `{ L, C, H }`. L is in [0, 1], C ≥ 0, H in [0, 360] degrees (or 0 when achromatic). If hex input is invalid or yet to be calculated, `{ L: 1, C: 0, H: 0 }` is returned as a fallback.

#### .oklchString
Returns a string in `oklch(L% C H)` format (e.g. `oklch(58.87% 0.2323 282.69)`). If hex input is invalid or yet to be calculated, either `'inherit'` or your specified string value is returned as a fallback.

#### .yiq
Returns a string of either `'white'` or `'black'`. If hex input is invalid or yet to be calculated, either `'inherit'` or your specified string value is returned as a fallback.

## Tests

```sh
# Unit tests (Vitest)
npm test
npm run test:coverage

# Visual tests (Playwright) — opens a browser with color swatches
npm run test:visual           # headless
npm run test:visual:ui        # interactive UI mode (like QUnit)
npm run test:visual:debug     # headed browser + Inspector, paused
```

Visual tests serve an HTML page that renders color swatches using the library, then verify foreground/background colors in a real browser. Use `test:visual:ui` for an interactive test runner or `test:visual:debug` to pause and inspect elements.

## Contributing

No formal styleguide, but please maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

## Thanks
- Brian Suda for his article, [Calculating Color Contrast](http://24ways.org/2010/calculating-color-contrast/), on 24 ways.
- Brent Ertz for his node module article, [Creating and publishing a node.js module](https://quickleft.com/blog/creating-and-publishing-a-node-js-module/).


## Release History

- 4.0.0 - Hex to OKLCH; replace RGB with OKLCH; YIQ derived from OKLCH; `oklchStringDefault` option
- 3.0.0 - Renamed to hex2oklch, ESM-only, Vitest, ESLint flat config, GitHub Actions CI
- 2.2.0 - Minor description updates
- 2.0.0 - Returns [255, 255, 255], 'inherit', specified values as defaults/fallbacks
- 1.4.0 - Returns [0,0,0], 'rgb(0,0,0)' & 'white' as defaults/fallbacks
- 1.0.0 - Lock in release
- 0.8.0 - Add rgbString property
- 0.5.0 - Update descriptions
- 0.1.0 - Initial release
