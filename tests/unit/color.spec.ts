import { describe, it, expect } from 'vitest';
import {
  clamp,
  normalizeHue,
  normalizeHex,
  isValidHex,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  hexToHsl,
  hslToHex,
  setHslChannel,
  hslTrackGradients,
  HSL_RANGES,
  type HslChannel,
} from '@/utils/color';

describe('color.ts – clamp / normalizeHue', () => {
  it('clamps numbers and falls back to min for garbage', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp('7', 0, 10)).toBe(7);
    expect(clamp('abc', 0, 10)).toBe(0);
    expect(clamp(NaN, 3, 10)).toBe(3);
  });

  it('wraps hue into [0, 360)', () => {
    expect(normalizeHue(0)).toBe(0);
    expect(normalizeHue(360)).toBe(0);
    expect(normalizeHue(-30)).toBe(330);
    expect(normalizeHue(725)).toBe(5);
    expect(normalizeHue('x')).toBe(0);
  });
});

describe('color.ts – normalizeHex / isValidHex', () => {
  it('normalizes all supported hex spellings to #rrggbb', () => {
    expect(normalizeHex('#FF8800')).toBe('#ff8800');
    expect(normalizeHex('ff8800')).toBe('#ff8800');
    expect(normalizeHex('#f80')).toBe('#ff8800');
    expect(normalizeHex('f80')).toBe('#ff8800');
    expect(normalizeHex('#f80f')).toBe('#ff8800'); // #rgba → alpha verworfen
    expect(normalizeHex('#ff880080')).toBe('#ff8800'); // #rrggbbaa → alpha verworfen
    expect(normalizeHex('  #AbCdEf  ')).toBe('#abcdef');
  });

  it('parses rgb()/rgba() strings', () => {
    expect(normalizeHex('rgb(255, 136, 0)')).toBe('#ff8800');
    expect(normalizeHex('rgba(255, 136, 0, 0.5)')).toBe('#ff8800');
    expect(normalizeHex('rgb(100% 50% 0%)')).toBe('#ff8000');
    expect(normalizeHex('rgb(300, 0, 0)')).toBe('#ff0000');
  });

  it('rejects invalid input', () => {
    expect(normalizeHex('')).toBeNull();
    expect(normalizeHex('#ff')).toBeNull();
    expect(normalizeHex('#ff88000')).toBeNull();
    expect(normalizeHex('#gg0000')).toBeNull();
    expect(normalizeHex('red')).toBeNull();
    expect(normalizeHex(null)).toBeNull();
    expect(normalizeHex(123)).toBeNull();
    expect(isValidHex('#123456')).toBe(true);
    expect(isValidHex('nope')).toBe(false);
  });
});

describe('color.ts – RGB ↔ HEX', () => {
  it('converts both directions', () => {
    expect(hexToRgb('#ff8800')).toEqual({ r: 255, g: 136, b: 0 });
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('nope')).toBeNull();
    expect(rgbToHex(255, 136, 0)).toBe('#ff8800');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(256, -1, 12.6)).toBe('#ff000d');
  });
});

describe('color.ts – HSL', () => {
  it('converts primary colors to the expected HSL', () => {
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
    expect(hexToHsl('#00ff00')).toEqual({ h: 120, s: 100, l: 50 });
    expect(hexToHsl('#0000ff')).toEqual({ h: 240, s: 100, l: 50 });
    expect(hexToHsl('#ffffff')).toEqual({ h: 0, s: 0, l: 100 });
    expect(hexToHsl('#000000')).toEqual({ h: 0, s: 0, l: 0 });
    expect(hexToHsl('#808080')!.h).toBe(0);
    expect(hexToHsl('#808080')!.s).toBe(0);
    expect(hexToHsl('#808080')!.l).toBeCloseTo(50.2, 1);
    expect(hexToHsl('invalid')).toBeNull();
  });

  it('converts HSL back to hex (with clamping and hue wrapping)', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000');
    expect(hslToHex(360, 100, 50)).toBe('#ff0000');
    expect(hslToHex(-120, 100, 50)).toBe('#0000ff');
    expect(hslToHex(120, 100, 50)).toBe('#00ff00');
    expect(hslToHex(0, 0, 100)).toBe('#ffffff');
    expect(hslToHex(200, 150, -10)).toBe('#000000');
    expect(hslToRgb(30, 100, 50)).toEqual({ r: 255, g: 128, b: 0 });
    expect(rgbToHsl(255, 128, 0).h).toBeCloseTo(30.1, 1);
  });

  it('round-trips hex → hsl → hex losslessly across the RGB cube', () => {
    const step = 15;
    for (let r = 0; r <= 255; r += step) {
      for (let g = 0; g <= 255; g += step) {
        for (let b = 0; b <= 255; b += step) {
          const hex = rgbToHex(r, g, b);
          const { h, s, l } = hexToHsl(hex)!;
          expect(hslToHex(h, s, l)).toBe(hex);
        }
      }
    }
  });

  it('setHslChannel clamps into the channel range and returns a new object', () => {
    const base = { h: 10, s: 20, l: 30 };
    expect(setHslChannel(base, 'h', 400)).toEqual({ h: 360, s: 20, l: 30 });
    expect(setHslChannel(base, 's', -5)).toEqual({ h: 10, s: 0, l: 30 });
    expect(setHslChannel(base, 'l', '55')).toEqual({ h: 10, s: 20, l: 55 });
    expect(setHslChannel(base, 'x' as HslChannel, 1)).toEqual(base);
    expect(setHslChannel(base, 'h', 1)).not.toBe(base);
    expect(HSL_RANGES.h.max).toBe(360);
  });

  it('builds track gradients from the current state', () => {
    const g = hslTrackGradients({ h: 120.4, s: 50, l: 50 });
    expect(g.h).toContain('linear-gradient');
    expect(g.s).toBe('linear-gradient(to right, hsl(120 0% 50%), hsl(120 100% 50%))');
    expect(g.l).toBe('linear-gradient(to right, #000, hsl(120 50% 50%), #fff)');
  });
});
