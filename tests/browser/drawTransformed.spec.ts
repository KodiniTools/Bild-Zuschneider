import { describe, expect, it } from 'vitest';
import {
  IDENTITY,
  drawTransformed,
  flipHorizontal,
  flipVertical,
  rotateLeft,
  rotateRight,
  workSize,
  type Transform,
} from '@/lib/transform';

/**
 * Echter Canvas: 2 × 1-Bild (links Rot, rechts Blau) bzw. 2 × 2 mit vier Farben.
 * Prüft, dass drawTransformed genau das zeichnet, was die Rahmen-Abbildungen in
 * transform.ts annehmen (sichtbares Drehen/Spiegeln).
 */
const RED = [255, 0, 0, 255];
const BLUE = [0, 0, 255, 255];
const GREEN = [0, 255, 0, 255];
const YELLOW = [255, 255, 0, 255];

async function source(colors: number[][][]): Promise<ImageBitmap> {
  const h = colors.length;
  const w = colors[0]!.length;
  const data = new ImageData(w, h);
  colors.flat().forEach((c, i) => data.data.set(c, i * 4));
  return createImageBitmap(data);
}

function render(
  bitmap: ImageBitmap,
  t: Transform,
  origin?: { x: number; y: number },
  size?: { width: number; height: number }
) {
  const work = size ?? workSize(bitmap, t);
  const canvas = document.createElement('canvas');
  canvas.width = work.width;
  canvas.height = work.height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  drawTransformed(ctx, bitmap, t, { scale: 1, origin });
  const px = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data);
  return { canvas, px };
}

describe('drawTransformed', () => {
  it('ohne Transformation zeichnet es das Original', async () => {
    const { px } = render(await source([[RED, BLUE]]), IDENTITY);
    expect(px(0, 0)).toEqual(RED);
    expect(px(1, 0)).toEqual(BLUE);
  });

  it('rechts drehen: links wird oben', async () => {
    const { canvas, px } = render(await source([[RED, BLUE]]), rotateRight(IDENTITY));
    expect([canvas.width, canvas.height]).toEqual([1, 2]);
    expect(px(0, 0)).toEqual(RED);
    expect(px(0, 1)).toEqual(BLUE);
  });

  it('links drehen: rechts wird oben', async () => {
    const { px } = render(await source([[RED, BLUE]]), rotateLeft(IDENTITY));
    expect(px(0, 0)).toEqual(BLUE);
    expect(px(0, 1)).toEqual(RED);
  });

  it('spiegeln nach dem Drehen wirkt auf das sichtbare Bild', async () => {
    // 2 × 2: oben Rot Blau, unten Grün Gelb
    const bitmap = await source([
      [RED, BLUE],
      [GREEN, YELLOW],
    ]);
    const turned = rotateRight(IDENTITY); // sichtbar: oben Grün Rot, unten Gelb Blau
    const t1 = render(bitmap, turned);
    expect([t1.px(0, 0), t1.px(1, 0)]).toEqual([GREEN, RED]);
    const flipped = render(bitmap, flipHorizontal(turned)); // oben Rot Grün
    expect([flipped.px(0, 0), flipped.px(1, 0)]).toEqual([RED, GREEN]);
    const vflip = render(bitmap, flipVertical(turned)); // oben Gelb Blau
    expect([vflip.px(0, 0), vflip.px(1, 0)]).toEqual([YELLOW, BLUE]);
    // danach rechts drehen: linke Spalte (oben Rot, unten Blau) wird von unten nach oben
    // zur oberen Zeile → oben Blau Rot
    const again = render(bitmap, rotateRight(flipHorizontal(turned)));
    expect([again.px(0, 0), again.px(1, 0)]).toEqual([BLUE, RED]);
  });

  it('verschiebt mit origin auf den Ausschnitt (Export)', async () => {
    const { px } = render(
      await source([[RED, BLUE]]),
      IDENTITY,
      { x: 1, y: 0 },
      { width: 1, height: 1 }
    );
    expect(px(0, 0)).toEqual(BLUE);
  });
});
