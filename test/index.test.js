import { describe, it, expect } from 'vitest';
import hex2oklch from '../src/index.js';

describe('#oklch', function () {
  it('returns oklch object from hex input 0033ff', function () {
    const result = hex2oklch('0033ff');
    expect(result.oklch).toHaveProperty('L');
    expect(result.oklch).toHaveProperty('C');
    expect(result.oklch).toHaveProperty('H');
    expect(typeof result.oklch.L).toBe('number');
    expect(typeof result.oklch.C).toBe('number');
    expect(typeof result.oklch.H).toBe('number');
    expect(result.oklch.L).toBeGreaterThanOrEqual(0);
    expect(result.oklch.L).toBeLessThanOrEqual(1);
    expect(result.oklch.C).toBeGreaterThanOrEqual(0);
  });

  it('returns same oklch from hex 03f (short form)', function () {
    const full = hex2oklch('0033ff').oklch;
    const short = hex2oklch('03f').oklch;
    expect(short.L).toBeCloseTo(full.L, 10);
    expect(short.C).toBeCloseTo(full.C, 10);
    expect(short.H).toBeCloseTo(full.H, 10);
  });

  it('returns L≈0, C=0 for black 000000', function () {
    const result = hex2oklch('000000');
    expect(result.oklch.L).toBeCloseTo(0, 5);
    expect(result.oklch.C).toBeCloseTo(0, 5);
  });

  it('throws a TypeError for null input', function () {
    expect(function () {
      hex2oklch();
    }).toThrow(TypeError);
  });

  it('removes a # prepended from input', function () {
    const withHash = hex2oklch('#0033ff').oklch;
    const without = hex2oklch('0033ff').oklch;
    expect(withHash.L).toBeCloseTo(without.L, 10);
    expect(withHash.C).toBeCloseTo(without.C, 10);
    expect(withHash.H).toBeCloseTo(without.H, 10);
  });

  it('returns default { L: 1, C: 0, H: 0 } for non-hex (invalid) input', function () {
    expect(hex2oklch('00PS1E').oklch).toEqual({ L: 1, C: 0, H: 0 });
  });
});

describe('#oklchString', function () {
  it('returns oklch(...) string from hex input 0033ff', function () {
    const str = hex2oklch('0033ff').oklchString;
    expect(str).toMatch(/^oklch\([\d.]+% [\d.]+ [\d.]+\)$/);
  });

  it('returns \'inherit\' from invalid input', function () {
    expect(hex2oklch('00PS1E').oklchString).toBe('inherit');
  });

  it('golden: 715BFF → oklch(58.87% 0.2323 282.69) or equivalent rounding', function () {
    const str = hex2oklch('715BFF').oklchString;
    expect(str).toMatch(/^oklch\(58\.87% 0\.232[34] 282\.69\)$/);
  });
});

describe('#yiq', function () {
  it('returns white for dark hex 0033ff', function () {
    expect(hex2oklch('0033ff').yiq).toBe('white');
  });

  it('returns black for light hex ff88ee', function () {
    expect(hex2oklch('ff88ee').yiq).toBe('black');
  });

  it('returns \'inherit\' for non-hex (invalid) input', function () {
    expect(hex2oklch('00PS1E').yiq).toBe('inherit');
  });
});

describe('#options', function () {
  describe('\n    #oklchStringDefault: set as oklchString fallback when hex is invalid', function () {
    it('oklchString returns "#e9e9e9" as fallback when {oklchStringDefault: "#e9e9e9"}', function () {
      expect(hex2oklch('', { oklchStringDefault: '#e9e9e9' }).oklchString).toBe('#e9e9e9');
    });

    it('oklchString returns "black" as fallback when {oklchStringDefault: "black"}', function () {
      expect(hex2oklch('', { oklchStringDefault: 'black' }).oklchString).toBe('black');
    });

    it('oklchString returns "inherit" as fallback when {oklchStringDefault} value is not a string', function () {
      expect(hex2oklch('', { oklchStringDefault: 111222 }).oklchString).toBe('inherit');
    });
  });

  describe('\n    #yiqDefault: set as yiq fallback when hex is invalid', function () {
    it('yiq returns "#333333" as fallback when {yiqDefault: "#333333"}', function () {
      expect(hex2oklch('', { yiqDefault: '#333333' }).yiq).toBe('#333333');
    });

    it('yiq returns "white" as fallback when {yiqDefault: "white"}', function () {
      expect(hex2oklch('', { yiqDefault: 'white' }).yiq).toBe('white');
    });

    it('yiq returns "inherit" as fallback when {yiqDefault} value is not a string', function () {
      expect(hex2oklch('', { yiqDefault: [111, 222] }).yiq).toBe('inherit');
    });
  });

  describe('\n    #debug', function () {
    it('returns defaults when {debug: true} and invalid hex', function () {
      expect(hex2oklch('00PS1E', { debug: true }).oklch).toEqual({ L: 1, C: 0, H: 0 });
    });
  });
});
