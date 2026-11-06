import { describe, expect, it } from 'vitest';
import {
  HANDLES,
  MIN_CROP_SIZE,
  applyRatio,
  centeredRect,
  fitRatio,
  isUsableRect,
  moveRect,
  ratioLabel,
  ratioValueLabel,
  rectFromPoints,
  resizeRect,
  roundRect,
  type Rect,
  type Size,
} from '@/lib/geometry';

const IMG: Size = { width: 1000, height: 500 };
const inside = (r: Rect, b: Size = IMG) =>
  r.x >= 0 && r.y >= 0 && r.x + r.width <= b.width && r.y + r.height <= b.height;
const ratioOf = (r: Rect) => r.width / r.height;

describe('fitRatio / centeredRect', () => {
  it('passt das größte Rechteck im Seitenverhältnis ein', () => {
    expect(fitRatio(IMG, 1)).toEqual({ width: 500, height: 500 });
    expect(fitRatio(IMG, 4)).toEqual({ width: 1000, height: 250 });
  });

  it('zentriert ohne Verhältnis über das ganze Bild', () => {
    expect(centeredRect(IMG, null)).toEqual({ x: 0, y: 0, width: 1000, height: 500 });
  });

  it('zentriert ein Quadrat und berücksichtigt coverage', () => {
    expect(centeredRect(IMG, 1)).toEqual({ x: 250, y: 0, width: 500, height: 500 });
    expect(centeredRect(IMG, 1, 0.8)).toEqual({ x: 300, y: 50, width: 400, height: 400 });
  });
});

describe('roundRect', () => {
  it('rundet und schneidet an den Bildgrenzen ab', () => {
    expect(roundRect({ x: -3.4, y: 10.6, width: 2000, height: 10.2 }, IMG)).toEqual({
      x: 0,
      y: 11,
      width: 1000,
      height: 10,
    });
  });
});

describe('applyRatio', () => {
  it('hält Mitte und ungefähr die Fläche', () => {
    const r = applyRatio({ x: 400, y: 150, width: 200, height: 200 }, 4, IMG);
    expect(ratioOf(r)).toBeCloseTo(4, 1);
    expect(r.x + r.width / 2).toBeCloseTo(500, 0);
    expect(r.y + r.height / 2).toBeCloseTo(250, 0);
    expect(r.width * r.height).toBeCloseTo(40000, -3);
  });

  it('verkleinert und verschiebt in das Bild', () => {
    const r = applyRatio({ x: 900, y: 0, width: 100, height: 500 }, 1, IMG);
    expect(inside(r)).toBe(true);
    expect(r.width).toBe(r.height);
  });

  it('wird nie größer als das Bild erlaubt', () => {
    const r = applyRatio({ x: 0, y: 0, width: 1000, height: 500 }, 1 / 3, IMG);
    expect(r.height).toBe(500);
    expect(r.width).toBe(167);
  });
});

describe('moveRect', () => {
  const r: Rect = { x: 100, y: 100, width: 200, height: 100 };

  it('verschiebt', () => {
    expect(moveRect(r, 50, -20, IMG)).toEqual({ x: 150, y: 80, width: 200, height: 100 });
  });

  it('bleibt an den Rändern stehen, ohne die Größe zu ändern', () => {
    expect(moveRect(r, 5000, 5000, IMG)).toEqual({ x: 800, y: 400, width: 200, height: 100 });
    expect(moveRect(r, -5000, -5000, IMG)).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });
});

describe('resizeRect frei', () => {
  const r: Rect = { x: 100, y: 100, width: 200, height: 100 };

  it('Ecke SE wächst nach rechts unten, NW bleibt fest', () => {
    expect(resizeRect(r, 'se', 50, 30, IMG)).toEqual({ x: 100, y: 100, width: 250, height: 130 });
  });

  it('Ecke NW bewegt die linke obere Ecke, SE bleibt fest', () => {
    expect(resizeRect(r, 'nw', -50, -30, IMG)).toEqual({ x: 50, y: 70, width: 250, height: 130 });
  });

  it('Kante E ändert nur die Breite, Kante N nur oben', () => {
    expect(resizeRect(r, 'e', 40, 999, IMG)).toEqual({ x: 100, y: 100, width: 240, height: 100 });
    expect(resizeRect(r, 'n', 999, -20, IMG)).toEqual({ x: 100, y: 80, width: 200, height: 120 });
  });

  it('hält die Mindestgröße, ohne die Gegenkante zu verschieben', () => {
    const shrunk = resizeRect(r, 'w', 1000, 0, IMG);
    expect(shrunk.width).toBe(MIN_CROP_SIZE);
    expect(shrunk.x + shrunk.width).toBe(300);
  });

  it('bleibt im Bild', () => {
    for (const handle of HANDLES) {
      expect(inside(resizeRect(r, handle, 5000, 5000, IMG)), handle).toBe(true);
      expect(inside(resizeRect(r, handle, -5000, -5000, IMG)), handle).toBe(true);
    }
  });
});

describe('resizeRect mit Seitenverhältnis', () => {
  const square: Rect = { x: 400, y: 150, width: 200, height: 200 };

  it.each(HANDLES)('Griff %s hält 1:1 und bleibt im Bild', (handle) => {
    for (const [dx, dy] of [
      [40, 25],
      [-40, -25],
      [3000, 3000],
      [-3000, -3000],
    ] as const) {
      const r = resizeRect(square, handle, dx, dy, IMG, 1);
      expect(Math.abs(r.width - r.height), `${handle} ${dx},${dy}`).toBeLessThanOrEqual(1);
      expect(inside(r), `${handle} ${dx},${dy}`).toBe(true);
      expect(r.width).toBeGreaterThanOrEqual(MIN_CROP_SIZE);
    }
  });

  it('Ecke SE hält die NW-Ecke fest', () => {
    const r = resizeRect(square, 'se', 100, 10, IMG, 1);
    expect(r).toMatchObject({ x: 400, y: 150, width: 300, height: 300 });
  });

  it('Kante E wächst symmetrisch in der Höhe', () => {
    const r = resizeRect(square, 'e', 50, 0, IMG, 1);
    expect(r).toEqual({ x: 400, y: 125, width: 250, height: 250 });
  });

  it('Kante S wird durch die Bildhöhe begrenzt', () => {
    const r = resizeRect(square, 's', 0, 1000, IMG, 1);
    expect(r.y + r.height).toBeLessThanOrEqual(500);
    expect(r.width).toBe(r.height);
  });

  it('hält 16:9 bei einer Ecke', () => {
    const wide: Rect = { x: 100, y: 100, width: 320, height: 180 };
    const r = resizeRect(wide, 'sw', -80, 5, IMG, 16 / 9);
    expect(ratioOf(r)).toBeCloseTo(16 / 9, 1);
    expect(r.x + r.width).toBe(420);
    expect(r.y).toBe(100);
  });
});

describe('rectFromPoints', () => {
  it('zieht in jede Richtung auf', () => {
    expect(rectFromPoints({ x: 100, y: 100 }, { x: 300, y: 200 }, IMG)).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    });
    expect(rectFromPoints({ x: 300, y: 200 }, { x: 100, y: 100 }, IMG)).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    });
  });

  it('begrenzt auf das Bild', () => {
    expect(rectFromPoints({ x: 900, y: 400 }, { x: 5000, y: 5000 }, IMG)).toEqual({
      x: 900,
      y: 400,
      width: 100,
      height: 100,
    });
  });

  it('hält ein Seitenverhältnis und die Bildgrenzen', () => {
    const r = rectFromPoints({ x: 800, y: 100 }, { x: 990, y: 120 }, IMG, 1);
    expect(r.width).toBe(r.height);
    expect(inside(r)).toBe(true);
    expect(r.x).toBe(800);
  });
});

describe('isUsableRect / ratioLabel', () => {
  it('erkennt zu kleine Rahmen', () => {
    expect(isUsableRect({ x: 0, y: 0, width: 9, height: 100 })).toBe(false);
    expect(isUsableRect({ x: 0, y: 0, width: 10, height: 10 })).toBe(true);
  });

  it.each([
    [{ width: 1920, height: 1080 }, '16:9'],
    [{ width: 500, height: 500 }, '1:1'],
    [{ width: 1080, height: 1350 }, '4:5'],
    [{ width: 1013, height: 777 }, '1.30:1'],
    [{ width: 0, height: 10 }, '–'],
  ])('%o → %s', (size, label) => {
    expect(ratioLabel(size)).toBe(label);
  });
});

describe('ratioValueLabel', () => {
  it.each([
    [16 / 9, '16:9'],
    [4 / 3, '4:3'],
    [9 / 16, '9:16'],
    [851 / 315, '27:10'],
    [1, '1:1'],
    [Math.PI, '22:7'],
    [0.0123, '0.01:1'],
  ])('%f → %s', (ratio, label) => {
    expect(ratioValueLabel(ratio)).toBe(label);
  });
});
