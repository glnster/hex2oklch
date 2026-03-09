/**
 * hex2oklch
 * https://github.com/glnster/hex2oklch
 *
 * Copyright (c) 2026 Glenn Cueto
 * Licensed under the MIT license.
 *
 * Converts hex color to OKLCH. Calculates corresponding foreground.
 *
 * @param {string} hex - The hex color to be converted. Can be 3 or 6 HEX-ONLY chars.
 * @param {Object} [options] - Optional options object.
 * @param {boolean} [options.debug=false] - Log invalid hex to console when true.
 * @param {string} [options.oklchStringDefault='inherit'] - Default oklchString when hex is invalid.
 * @param {string} [options.yiqDefault='inherit'] - Default yiq when hex is invalid.
 * @return {{ oklch: { L: number, C: number, H: number }, oklchString: string, yiq: string }}
 *   oklch - { L, C, H }; L in [0,1], C >= 0, H in [0,360] (or NaN when C ≈ 0). Invalid hex: { L: 1, C: 0, H: 0 }.
 *   oklchString - CSS string e.g. 'oklch(58.87% 0.2323 282.69)'. Invalid: options.oklchStringDefault or 'inherit'.
 *   yiq - 'black' or 'white' as foreground against the hex. Invalid: options.yiqDefault or 'inherit'.
 */

const hex2oklch = function (hex, options) {
  if (typeof hex !== 'string') {
    throw new TypeError('Expected a string');
  }

  hex = hex.replace(/^#/, '');

  options = options || {};
  options.debug = (typeof options.debug === 'boolean') ? options.debug : false;
  options.oklchStringDefault = (typeof options.oklchStringDefault === 'string') ? options.oklchStringDefault : 'inherit';
  options.yiqDefault = (typeof options.yiqDefault === 'string') ? options.yiqDefault : 'inherit';

  const defaultOklch = { L: 1, C: 0, H: 0 };
  let oklch = defaultOklch;
  let oklchString = options.oklchStringDefault;
  let yiqres = options.yiqDefault;

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const cleanHex = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (cleanHex !== null) {
    const r8 = parseInt(cleanHex[1], 16);
    const g8 = parseInt(cleanHex[2], 16);
    const b8 = parseInt(cleanHex[3], 16);
    const r = r8 / 255;
    const g = g8 / 255;
    const b = b8 / 255;

    oklch = sRGBToOklch(r, g, b);
    oklchString = formatOklchString(oklch);
    const rgb = oklchToSRGB(oklch);
    const Y = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
    yiqres = (Y >= 128 || Number.isNaN(Y)) ? 'black' : 'white';
  } else if (options.debug === true) {
    console.error('(hex2oklch) ' + hex + ': Expected 3 or 6 HEX-ONLY chars. Returning defaults.');
  }

  return {
    oklch,
    oklchString,
    yiq: yiqres
  };
};

// --- sRGB (0–1) → OKLCH (L 0–1, C ≥ 0, H 0–360 or NaN) ---

function linearizeSRGB(v) {
  const abs = Math.abs(v);
  const lin = abs <= 0.04045 ? abs / 12.92 : Math.pow((abs + 0.055) / 1.055, 2.4);
  return v < 0 ? -lin : lin;
}

// D65 linear sRGB to XYZ (W3C CSS Color 4 rationals)
const LIN_SRGB_TO_XYZ = [
  [506752 / 1228815, 87881 / 245763, 12673 / 70218],
  [87098 / 409605, 175762 / 245763, 12673 / 175545],
  [7918 / 409605, 87881 / 737289, 1001167 / 1053270]
];

// XYZ to linear LMS (W3C OKLAB)
const XYZ_TO_LMS = [
  [0.8189330101, 0.3618667424, -0.1288597137],
  [0.0329845436, 0.9293118715, 0.0361456387],
  [0.0482003018, 0.2643662691, 0.6338517070]
];

// LMS' (after cbrt) to L,a,b (W3C OKLAB)
const LMS_TO_LAB = [
  [0.2104542553, 0.7936177850, -0.0040720468],
  [1.9779984951, -2.4285922050, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.8086757660]
];

function mul3(M, x, y, z) {
  return [
    M[0][0] * x + M[0][1] * y + M[0][2] * z,
    M[1][0] * x + M[1][1] * y + M[1][2] * z,
    M[2][0] * x + M[2][1] * y + M[2][2] * z
  ];
}

function sRGBToOklch(r, g, b) {
  const lr = linearizeSRGB(r);
  const lg = linearizeSRGB(g);
  const lb = linearizeSRGB(b);
  const [x, y, z] = mul3(LIN_SRGB_TO_XYZ, lr, lg, lb);
  const [l, m, s] = mul3(XYZ_TO_LMS, x, y, z);
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const [L, a, bLab] = mul3(LMS_TO_LAB, l_, m_, s_);
  const C = Math.sqrt(a * a + bLab * bLab);
  const H = C <= 1e-10 ? 0 : (Math.atan2(bLab, a) * 180 / Math.PI + 360) % 360;
  return { L, C, H };
}

function formatOklchString(oklch) {
  const Lpct = (oklch.L * 100).toFixed(2) + '%';
  const C = oklch.C.toFixed(4);
  const H = (Number.isNaN(oklch.H) ? 0 : oklch.H).toFixed(2);
  return `oklch(${Lpct} ${C} ${H})`;
}

// --- OKLCH → sRGB (0–255) for YIQ ---

// L,a,b to LMS' (inverse of LMS_TO_LAB)
const LAB_TO_LMS = [
  [1.0, 0.3963377774, 0.2158037573],
  [1.0, -0.1055613458, -0.0638541728],
  [1.0, -0.0894841775, -1.2914855480]
];

// LMS to XYZ (inverse of XYZ_TO_LMS)
const LMS_TO_XYZ = [
  [1.2270138511, -0.5577999803, 0.2812561489],
  [-0.0405801784, 1.1122568696, -0.0716766787],
  [-0.0763812845, -0.4214819784, 1.5861632204]
];

// XYZ to linear sRGB (W3C)
const XYZ_TO_LIN_SRGB = [
  [12831 / 3959, -329 / 214, -1974 / 3959],
  [-851781 / 878410, 1648619 / 878410, 36519 / 878410],
  [705 / 12673, -2585 / 12673, 705 / 667]
];

function oklchToSRGB(oklch) {
  const L = oklch.L;
  const a = oklch.C * Math.cos(oklch.H * Math.PI / 180);
  const b = oklch.C * Math.sin(oklch.H * Math.PI / 180);
  const [l_, m_, s_] = mul3(LAB_TO_LMS, L, a, b);
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  const [x, y, z] = mul3(LMS_TO_XYZ, l, m, s);
  const [lr, lg, lb] = mul3(XYZ_TO_LIN_SRGB, x, y, z);

  function delinearize(v) {
    const abs = Math.abs(v);
    const gam = abs <= 0.0031308 ? 12.92 * abs : (Math.sign(v) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
    return gam;
  }

  let r = delinearize(lr);
  let g = delinearize(lg);
  let bOut = delinearize(lb);
  r = Math.round(Math.max(0, Math.min(1, r)) * 255);
  g = Math.round(Math.max(0, Math.min(1, g)) * 255);
  bOut = Math.round(Math.max(0, Math.min(1, bOut)) * 255);
  return [r, g, bOut];
}

export default hex2oklch;
