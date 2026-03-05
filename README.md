hex2oklch
=========

Converts hex color to rgb and calculates appropriate corresponding foreground.

[![CI](https://github.com/glnster/hex2oklch/actions/workflows/ci.yml/badge.svg)](https://github.com/glnster/hex2oklch/actions/workflows/ci.yml) [![NPM](https://img.shields.io/npm/v/hex2oklch.svg)](https://www.npmjs.com/package/hex2oklch)


## Example

For a dark hex color, hex2oklch will give you the rgb equivalent. It will also calculate and return an appropriate contrasting foreground (either 'black' or 'white').

Here's hex2oklch in action. Note the black or white text color (foreground) based on the background color.

![example.png](example.png)

## Installation

```sh
npm install hex2oklch
```

## Usage

```js
import hex2oklch from 'hex2oklch';

const hex = '0033ff';
const shorthex = '03f';
const hashhex = '#0033ff';
const badhex = '00PS1E';

hex2oklch(hex).rgb;        // => [0, 51, 255]
hex2oklch(shorthex).rgb;   // => [0, 51, 255]
hex2oklch(hashhex).rgb;    // => [0, 51, 255]
hex2oklch(hex).rgbString;  // => 'rgb(0, 51, 255)'
hex2oklch(hex).yiq;        // => 'white'

// try with bad input and with options specified
hex2oklch(badhex, {debug: true, rgbStringDefault: '#e9e9e9'}).rgb;
// logs "(hex2oklch) 00PS1E: Expected 3 or 6 HEX-ONLY chars. Returning defaults."
// Returns rgb [255, 255, 255], rgbString '#e9e9e9'
// and yiq 'inherit' as fall-backs.
```

## API

### *hex2oklch( hex {String}, options {Object} )*

#### hex
A hex-only string of 3 or 6 characters. If the string has a # prefix, the # gets trimmed off.

#### {debug: true | false}

You can pass {debug: true} to enable errors logged to console.

#### {rgbStringDefault: "String e.g. transparent | black | #e9e9e9"}

You can specify a default string that `.rgbString` will return when hex input is invalid or yet to be calculated.

#### {yiqDefault: "String e.g. inherit | gray | #333"}

Similar to rgbStringDefault above.

#### .rgb
Returns an array in `[r, g, b]` format. If hex input is invalid or yet to be calculated `[255, 255, 255]` (white) is returned as a fallback.

#### .rgbString
Returns a string in `rgb(r, g, b)` format. If hex input is invalid or yet to be calculated, either `'inherit'` or your specified string value is returned as a fallback.

#### .yiq
Returns a string of either `'white'` or `'black'`. If hex input is invalid or yet to be calculated, either `'inherit'` or your specified string value is returned as a fallback.

## Tests

```sh
npm test
npm run test:coverage
```

## Contributing

No formal styleguide, but please maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

## Thanks
- Brian Suda for his article, [Calculating Color Contrast](http://24ways.org/2010/calculating-color-contrast/), on 24 ways.
- Brent Ertz for his node module article, [Creating and publishing a node.js module](https://quickleft.com/blog/creating-and-publishing-a-node-js-module/).


## Release History

- 3.0.0 - Renamed to hex2oklch, ESM-only, Vitest, ESLint flat config, GitHub Actions CI
- 2.2.0 - Minor description updates
- 2.0.0 - Returns [255, 255, 255], 'inherit', specified values as defaults/fallbacks
- 1.4.0 - Returns [0,0,0], 'rgb(0,0,0)' & 'white' as defaults/fallbacks
- 1.0.0 - Lock in release
- 0.8.0 - Add rgbString property
- 0.5.0 - Update descriptions
- 0.1.0 - Initial release
