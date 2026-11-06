import { beforeEach, describe, expect, it } from 'vitest';
import {
  ExportError,
  detectEncodable,
  encodeCanvas,
  renderCrop,
  resetEncodableCache,
} from '@/lib/exportImage';
import { IDENTITY, rotateRight, withAngle } from '@/lib/transform';

/** 4 × 2-Quelle: links Rot, rechts Blau (je 2 × 2), rechts oben transparent. */
async function source(): Promise<ImageBitmap> {
  const data = new ImageData(4, 2);
  for (let y = 0; y < 2; y++)
    for (let x = 0; x < 4; x++) {
      const color = x < 2 ? [255, 0, 0, 255] : x === 3 && y === 0 ? [0, 0, 0, 0] : [0, 0, 255, 255];
      data.data.set(color, (y * 4 + x) * 4);
    }
  return createImageBitmap(data);
}

const pixel = (canvas: HTMLCanvasElement, x: number, y: number) =>
  Array.from(canvas.getContext('2d')!.getImageData(x, y, 1, 1).data);

describe('renderCrop', () => {
  it('schneidet genau den Rahmen aus', async () => {
    const canvas = renderCrop({
      source: await source(),
      transform: IDENTITY,
      crop: { x: 2, y: 1, width: 2, height: 1 },
      size: { width: 2, height: 1 },
      background: null,
    });
    expect([canvas.width, canvas.height]).toEqual([2, 1]);
    expect(pixel(canvas, 0, 0)).toEqual([0, 0, 255, 255]);
    expect(pixel(canvas, 1, 0)).toEqual([0, 0, 255, 255]);
  });

  it('füllt transparente Bereiche mit der Hintergrundfarbe', async () => {
    const canvas = renderCrop({
      source: await source(),
      transform: IDENTITY,
      crop: { x: 3, y: 0, width: 1, height: 1 },
      size: { width: 1, height: 1 },
      background: '#00ff00',
    });
    expect(pixel(canvas, 0, 0)).toEqual([0, 255, 0, 255]);
  });

  it('dreht vor dem Ausschneiden (Arbeitsfläche 2 × 4)', async () => {
    // rechts gedreht: oben die linke Bildhälfte (Rot), unten die rechte (Blau)
    const canvas = renderCrop({
      source: await source(),
      transform: rotateRight(IDENTITY),
      crop: { x: 0, y: 0, width: 2, height: 2 },
      size: { width: 2, height: 2 },
      background: null,
    });
    expect(pixel(canvas, 0, 0)).toEqual([255, 0, 0, 255]);
  });

  it('skaliert auf die Ausgabegröße', async () => {
    const canvas = renderCrop({
      source: await source(),
      transform: IDENTITY,
      crop: { x: 0, y: 0, width: 4, height: 2 },
      size: { width: 40, height: 20 },
      background: null,
    });
    expect([canvas.width, canvas.height]).toEqual([40, 20]);
    // Glättung mischt an Farbgrenzen: deshalb nur die vorherrschende Farbe prüfen
    const [r1, , b1] = pixel(canvas, 5, 10);
    const [r2, , b2, a2] = pixel(canvas, 33, 18);
    expect(r1).toBeGreaterThan(230);
    expect(b1).toBeLessThan(25);
    expect(b2).toBeGreaterThan(230);
    expect(r2).toBeLessThan(25);
    expect(a2).toBe(255);
  });

  it('weist Ausgaben über dem Canvas-Limit ab', async () => {
    expect(() =>
      renderCrop({
        source: { width: 1, height: 1 } as unknown as ImageBitmap,
        transform: withAngle(IDENTITY, 0),
        crop: { x: 0, y: 0, width: 1, height: 1 },
        size: { width: 40000, height: 10 },
        background: null,
      })
    ).toThrow(ExportError);
  });
});

describe('Kodierung', () => {
  beforeEach(() => resetEncodableCache());

  it('erkennt mindestens PNG, JPG und WebP in Chromium', async () => {
    const list = await detectEncodable();
    expect(list).toEqual(expect.arrayContaining(['png', 'jpeg', 'webp']));
  });

  it.each(['png', 'jpeg', 'webp'] as const)('kodiert %s mit dem richtigen Typ', async (format) => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const blob = await encodeCanvas(canvas, format, 0.8);
    expect(blob.type).toBe(`image/${format}`);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('Qualität wirkt bei JPG auf die Dateigröße', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    for (let i = 0; i < 128; i++) {
      ctx.fillStyle = `hsl(${i * 3}, 80%, 50%)`;
      ctx.fillRect(i, 0, 1, 128);
    }
    const low = await encodeCanvas(canvas, 'jpeg', 0.2);
    const high = await encodeCanvas(canvas, 'jpeg', 0.95);
    expect(high.size).toBeGreaterThan(low.size);
  });

  it('AVIF: Erkennung und Kodierung stimmen überein', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const supported = (await detectEncodable()).includes('avif');
    if (supported) {
      expect((await encodeCanvas(canvas, 'avif', 0.5)).type).toBe('image/avif');
    } else {
      await expect(encodeCanvas(canvas, 'avif', 0.5)).rejects.toMatchObject({
        code: 'formatUnsupported',
      });
    }
  });
});
