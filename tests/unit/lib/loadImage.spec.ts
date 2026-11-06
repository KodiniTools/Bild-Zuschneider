import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ACCEPT,
  LoadError,
  MAX_FILE_BYTES,
  MAX_PIXELS,
  assertDrawable,
  detectFormat,
  loadImageFile,
} from '@/lib/loadImage';

function file(name: string, type: string, size = 10): File {
  const f = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error instanceof LoadError ? error.code : String(error);
  }
  return null;
};

describe('detectFormat', () => {
  it.each([
    ['a.jpg', 'image/jpeg', 'jpeg'],
    ['a.png', 'image/png', 'png'],
    ['a.webp', 'image/webp', 'webp'],
    ['a.avif', 'image/avif', 'avif'],
    ['a.gif', 'image/gif', 'gif'],
    ['a.bmp', 'image/bmp', 'bmp'],
    ['a.ico', 'image/x-icon', 'ico'],
    ['a.svg', 'image/svg+xml', 'svg'],
    ['FOTO.JPEG', '', 'jpeg'],
    ['bild.webp', 'application/octet-stream', 'webp'],
  ])('%s (%s) → %s', (name, type, format) => {
    expect(detectFormat({ name, type })).toBe(format);
  });

  it.each([
    ['IMG_1.HEIC', 'image/heic', 'heic'],
    ['IMG_1.heif', '', 'heic'],
    ['scan.tif', 'image/tiff', 'tiff'],
    ['scan.tiff', '', 'tiff'],
    ['notes.txt', 'text/plain', 'unsupported'],
    ['ohne-endung', '', 'unsupported'],
  ])('%s (%s) → Fehler %s', (name, type, code) => {
    expect(codeOf(() => detectFormat({ name, type }))).toBe(code);
  });

  it('akzeptiert im Datei-Dialog MIME-Typen und Endungen, aber kein HEIC/TIFF', () => {
    expect(ACCEPT).toContain('image/png');
    expect(ACCEPT).toContain('.jpg');
    expect(ACCEPT).not.toMatch(/heic|tif/);
  });
});

describe('assertDrawable', () => {
  it('lässt Bilder bis zur Canvas-Grenze zu', () => {
    expect(codeOf(() => assertDrawable({ width: 16384, height: 16384 }))).toBeNull();
  });

  it('weist zu große Flächen und Kanten ab', () => {
    expect(MAX_PIXELS).toBe(16384 * 16384);
    expect(codeOf(() => assertDrawable({ width: 16385, height: 16384 }))).toBe('tooManyPixels');
    expect(codeOf(() => assertDrawable({ width: 40000, height: 10 }))).toBe('tooManyPixels');
  });
});

describe('loadImageFile', () => {
  afterEach(() => vi.unstubAllGlobals());

  const bitmap = (width: number, height: number) => ({ width, height, close: vi.fn() });

  it('decodiert mit EXIF-Ausrichtung und liefert Maße und Format', async () => {
    const decode = vi.fn().mockResolvedValue(bitmap(640, 480));
    vi.stubGlobal('createImageBitmap', decode);
    const result = await loadImageFile(file('a.png', 'image/png', 1234));
    expect(decode).toHaveBeenCalledWith(expect.any(File), { imageOrientation: 'from-image' });
    expect(result).toMatchObject({ name: 'a.png', format: 'png', width: 640, height: 480 });
    expect(result.fileSize).toBe(1234);
  });

  it('weist zu große Dateien ab, ohne zu decodieren', async () => {
    const decode = vi.fn();
    vi.stubGlobal('createImageBitmap', decode);
    await expect(
      loadImageFile(file('a.png', 'image/png', MAX_FILE_BYTES + 1))
    ).rejects.toMatchObject({ code: 'fileTooLarge' });
    expect(decode).not.toHaveBeenCalled();
  });

  it('meldet Decodierfehler als decodeFailed', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('kaputt')));
    await expect(loadImageFile(file('a.jpg', 'image/jpeg'))).rejects.toMatchObject({
      code: 'decodeFailed',
    });
  });

  it('gibt zu große Bitmaps wieder frei', async () => {
    const big = bitmap(40000, 10);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(big));
    await expect(loadImageFile(file('a.png', 'image/png'))).rejects.toMatchObject({
      code: 'tooManyPixels',
    });
    expect(big.close).toHaveBeenCalled();
  });
});
