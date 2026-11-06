import { describe, expect, it } from 'vitest';
import type { Rect, Size } from '@/lib/geometry';
import {
  IDENTITY,
  MAX_ANGLE,
  constrainToImage,
  fitInImage,
  flipHorizontal,
  flipVertical,
  isIdentity,
  pointInImage,
  rectFlippedH,
  rectFlippedV,
  rectInImage,
  rectRotatedLeft,
  rectRotatedRight,
  rotateLeft,
  rotateRight,
  withAngle,
  workSize,
  type Transform,
} from '@/lib/transform';

const IMG: Size = { width: 400, height: 200 };

/**
 * Referenz zur Zeichenreihenfolge in drawTransformed:
 * Mitte(Arbeitsfläche) + R(angle) · F · R(quarter·90°) · (p − Mitte(Bild)).
 */
function mapPoint(p: { x: number; y: number }, t: Transform) {
  const work = workSize(IMG, t);
  let x = p.x - IMG.width / 2;
  let y = p.y - IMG.height / 2;
  const rot = (deg: number) => {
    const r = (deg * Math.PI) / 180;
    [x, y] = [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
  };
  rot(t.quarter * 90);
  x *= t.flipH ? -1 : 1;
  y *= t.flipV ? -1 : 1;
  rot(t.angle);
  return { x: x + work.width / 2, y: y + work.height / 2 };
}

const SAMPLES = [
  { x: 10, y: 20 },
  { x: 390, y: 5 },
  { x: 123, y: 180 },
];

/** Alle Kombinationen aus Viertel, Spiegelungen und einem Winkel. */
const TRANSFORMS: Transform[] = [0, 1, 2, 3].flatMap((quarter) =>
  [false, true].flatMap((flipH) =>
    [false, true].flatMap((flipV) =>
      [0, 12.5].map((angle) => ({ quarter: quarter as Transform['quarter'], flipH, flipV, angle }))
    )
  )
);

const close = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  expect(a.x).toBeCloseTo(b.x, 6);
  expect(a.y).toBeCloseTo(b.y, 6);
};

describe('Drehen und Spiegeln wirken auf das sichtbare Bild', () => {
  it.each(TRANSFORMS.map((t) => [JSON.stringify(t), t] as const))(
    'rechts drehen bei %s',
    (_, t) => {
      const before = workSize(IMG, t);
      for (const p of SAMPLES) {
        const v = mapPoint(p, t);
        // sichtbar 90° im Uhrzeigersinn: (x, y) → (H − y, x)
        close(mapPoint(p, rotateRight(t)), { x: before.height - v.y, y: v.x });
      }
    }
  );

  it.each(TRANSFORMS.map((t) => [JSON.stringify(t), t] as const))('links drehen bei %s', (_, t) => {
    const before = workSize(IMG, t);
    for (const p of SAMPLES) {
      const v = mapPoint(p, t);
      close(mapPoint(p, rotateLeft(t)), { x: v.y, y: before.width - v.x });
    }
  });

  it.each(TRANSFORMS.map((t) => [JSON.stringify(t), t] as const))('spiegeln bei %s', (_, t) => {
    const work = workSize(IMG, t);
    for (const p of SAMPLES) {
      const v = mapPoint(p, t);
      close(mapPoint(p, flipHorizontal(t)), { x: work.width - v.x, y: v.y });
      close(mapPoint(p, flipVertical(t)), { x: v.x, y: work.height - v.y });
    }
  });

  it('vier Rechtsdrehungen und doppeltes Spiegeln ergeben wieder das Original', () => {
    let t: Transform = { ...IDENTITY, angle: 7 };
    for (let i = 0; i < 4; i++) t = rotateRight(t);
    t = flipHorizontal(flipHorizontal(t));
    expect(t).toEqual({ ...IDENTITY, angle: 7 });
    expect(isIdentity(IDENTITY)).toBe(true);
    expect(isIdentity(rotateLeft(IDENTITY))).toBe(false);
  });
});

describe('Rahmen drehen mit', () => {
  const r: Rect = { x: 10, y: 20, width: 100, height: 50 };
  const corners = (q: Rect) => [
    { x: q.x, y: q.y },
    { x: q.x + q.width, y: q.y + q.height },
  ];

  it('rechts/links: Ecken folgen der sichtbaren Drehung', () => {
    const work = { width: 400, height: 200 };
    const right = rectRotatedRight(r, work);
    expect(right).toEqual({ x: 130, y: 10, width: 50, height: 100 });
    expect(rectRotatedLeft(right, { width: 200, height: 400 })).toEqual(r);
    // Ecke (x, y) → (H − y, x) liegt auf einer Ecke des neuen Rahmens
    const mapped = corners(r).map((c) => ({ x: work.height - c.y, y: c.x }));
    expect(mapped).toContainEqual({ x: right.x + right.width, y: right.y });
  });

  it('spiegeln an der Mitte der Arbeitsfläche', () => {
    expect(rectFlippedH(r, IMG)).toEqual({ ...r, x: 290 });
    expect(rectFlippedV(r, IMG)).toEqual({ ...r, y: 130 });
  });
});

describe('Arbeitsfläche und Winkel', () => {
  it('tauscht Breite und Höhe bei ungeraden Vierteln', () => {
    expect(workSize(IMG, { ...IDENTITY, quarter: 1 })).toEqual({ width: 200, height: 400 });
    expect(workSize(IMG, { ...IDENTITY, quarter: 2 })).toEqual(IMG);
  });

  it('begrenzt und rundet den Winkel', () => {
    expect(withAngle(IDENTITY, 99).angle).toBe(MAX_ANGLE);
    expect(withAngle(IDENTITY, -99).angle).toBe(-MAX_ANGLE);
    expect(withAngle(IDENTITY, 3.14159).angle).toBe(3.1);
  });
});

describe('Rahmen im begradigten Bild', () => {
  const full: Rect = { x: 0, y: 0, width: 400, height: 200 };

  it('ohne Winkel liegt die ganze Fläche im Bild, mit Winkel die Ecken nicht', () => {
    expect(rectInImage(full, IMG, 0)).toBe(true);
    expect(rectInImage(full, IMG, 10)).toBe(false);
    expect(pointInImage(200, 100, IMG, 45)).toBe(true);
    expect(pointInImage(0, 0, IMG, 10)).toBe(false);
  });

  it.each([5, -5, 20, 45, -45])('Auto-Zoom bei %i° hält Mitte und Verhältnis', (angle) => {
    const fitted = fitInImage(full, IMG, angle);
    expect(rectInImage(fitted, IMG, angle)).toBe(true);
    expect(fitted.width / fitted.height).toBeCloseTo(2, 1);
    expect(fitted.x + fitted.width / 2).toBeCloseTo(200, 0);
    expect(fitted.width).toBeLessThan(400);
  });

  it('Auto-Zoom rückt einen Rahmen in der Ecke zur Mitte', () => {
    const corner: Rect = { x: 0, y: 0, width: 40, height: 40 };
    const fitted = fitInImage(corner, IMG, 30);
    expect(rectInImage(fitted, IMG, 30)).toBe(true);
    expect(fitted.width).toBeGreaterThanOrEqual(38); // rückt nach innen statt zu schrumpfen
  });

  it('Verschieben stoppt am Rand des begradigten Bildes', () => {
    const from: Rect = { x: 150, y: 60, width: 100, height: 80 };
    expect(rectInImage(from, IMG, 10)).toBe(true);
    const moved = constrainToImage({ ...from, x: 400 }, from, IMG, 10);
    expect(rectInImage(moved, IMG, 10)).toBe(true);
    expect(moved.x).toBeGreaterThan(from.x);
    expect(moved.x).toBeLessThan(300);
    expect(moved.width).toBeGreaterThanOrEqual(98);
  });

  it('übernimmt gültige Ziele unverändert', () => {
    const from: Rect = { x: 150, y: 60, width: 100, height: 80 };
    const target = { ...from, x: 160 };
    expect(constrainToImage(target, from, IMG, 10)).toEqual(target);
    expect(constrainToImage(full, from, IMG, 0)).toEqual(full);
  });
});
