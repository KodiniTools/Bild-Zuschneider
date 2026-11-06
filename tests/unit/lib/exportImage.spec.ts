import { beforeEach, describe, expect, it } from 'vitest';
import {
  OUTPUT_FORMATS,
  defaultOutputFormat,
  detectEncodable,
  formatBytes,
  formatInfo,
  outputFileName,
  outputSize,
  resetEncodableCache,
} from '@/lib/exportImage';

describe('Ausgabeformate', () => {
  it('kennt JPG, PNG, WebP, AVIF; nur JPG ohne Transparenz, nur PNG verlustfrei', () => {
    expect(OUTPUT_FORMATS.map((f) => f.id)).toEqual(['jpeg', 'png', 'webp', 'avif']);
    expect(OUTPUT_FORMATS.filter((f) => !f.alpha).map((f) => f.id)).toEqual(['jpeg']);
    expect(OUTPUT_FORMATS.filter((f) => !f.lossy).map((f) => f.id)).toEqual(['png']);
    expect(formatInfo('jpeg').extension).toBe('jpg');
  });

  it.each([
    ['jpeg', ['png', 'jpeg'], 'jpeg'],
    ['avif', ['png', 'jpeg', 'webp'], 'png'],
    ['gif', ['png', 'jpeg'], 'png'],
    ['svg', ['png'], 'png'],
    ['webp', ['png', 'webp'], 'webp'],
  ] as const)('Quelle %s mit %o → %s', (source, encodable, expected) => {
    expect(defaultOutputFormat(source, encodable)).toBe(expected);
  });
});

describe('outputSize', () => {
  const crop = { width: 1600, height: 900 };

  it('ohne Zielbreite die Rahmengröße', () => {
    expect(outputSize(crop, null)).toEqual(crop);
    expect(outputSize(crop, 0)).toEqual(crop);
  });

  it('mit Zielbreite im Seitenverhältnis des Rahmens', () => {
    expect(outputSize(crop, 1280)).toEqual({ width: 1280, height: 720 });
    expect(outputSize(crop, 3200)).toEqual({ width: 3200, height: 1800 });
    expect(outputSize({ width: 1000, height: 3 }, 10)).toEqual({ width: 10, height: 1 });
  });
});

describe('outputFileName', () => {
  it.each([
    ['urlaub.JPG', 'jpeg', 'urlaub-zugeschnitten.jpg'],
    ['foto.final.png', 'webp', 'foto.final-zugeschnitten.webp'],
    ['ohne-endung', 'png', 'ohne-endung-zugeschnitten.png'],
    ['a:b*c?.png', 'png', 'a-b-c-zugeschnitten.png'],
    ['.png', 'avif', 'bild-zugeschnitten.avif'],
  ] as const)('%s als %s → %s', (name, format, expected) => {
    expect(outputFileName(name, '-zugeschnitten', format)).toBe(expected);
  });
});

describe('formatBytes', () => {
  it.each([
    [512, 'de', '512 B'],
    [1536, 'de', '1,5 KB'],
    [842 * 1024, 'de', '842 KB'],
    [1.4 * 1024 * 1024, 'en', '1.4 MB'],
  ])('%i Bytes (%s) → %s', (bytes, locale, label) => {
    expect(formatBytes(bytes, locale)).toBe(label);
  });
});

describe('detectEncodable', () => {
  beforeEach(() => resetEncodableCache());

  it('liefert ohne kodierbaren Canvas (happy-dom) mindestens PNG', async () => {
    expect(await detectEncodable()).toContain('png');
  });
});
