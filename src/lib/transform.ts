/**
 * Drehen, Spiegeln und Begradigen – reine Funktionen.
 *
 * Modell: Die Arbeitsfläche ist das *ausgerichtete* Bild (W × H, bei ungeraden
 * Vierteldrehungen sind Breite und Höhe getauscht). Ein Bildpunkt p landet auf
 *
 *     Mitte + R(Begradigung) · F(Spiegelung) · R(Vierteldrehung) · (p − Bildmitte)
 *
 * So spiegeln die Schaltflächen immer das, was man sieht, und der Begradigungsregler
 * dreht in Bildschirmrichtung: Beim Spiegeln wechselt der Winkel sein Vorzeichen,
 * beim Drehen mit genau einer Spiegelung läuft die Vierteldrehung rückwärts.
 * Der Zuschnitt liegt in Koordinaten der Arbeitsfläche und muss vollständig im
 * begradigten Bild liegen (keine leeren Ecken).
 */
import { MIN_CROP_SIZE, roundRect, type Rect, type Size } from './geometry';

export interface Transform {
  /** Vierteldrehungen im Uhrzeigersinn, 0–3 */
  quarter: 0 | 1 | 2 | 3;
  flipH: boolean;
  flipV: boolean;
  /** Begradigung in Grad, −45 … 45, positiv = im Uhrzeigersinn */
  angle: number;
}

export const IDENTITY: Readonly<Transform> = { quarter: 0, flipH: false, flipV: false, angle: 0 };
export const MAX_ANGLE = 45;

/** Toleranz in Pixeln, damit ganzzahlig gerundete Rahmen nicht als „außerhalb“ gelten. */
const EPSILON = 0.75;

const toQuarter = (n: number) => (((n % 4) + 4) % 4) as Transform['quarter'];
const singleFlip = (t: Transform) => t.flipH !== t.flipV;

export function isIdentity(t: Transform): boolean {
  return t.quarter === 0 && !t.flipH && !t.flipV && t.angle === 0;
}

/**
 * Größe der Arbeitsfläche (ausgerichtetes Bild). Liest width/height ausdrücklich:
 * Bei ImageBitmap sind das Getter des Prototyps, ein Spread (`{ ...bitmap }`) wäre leer.
 */
export function workSize(image: Size, t: Transform): Size {
  const { width, height } = image;
  return t.quarter % 2 === 1 ? { width: height, height: width } : { width, height };
}

/** Sichtbar um 90° im Uhrzeigersinn drehen. */
export function rotateRight(t: Transform): Transform {
  return { ...t, quarter: toQuarter(t.quarter + (singleFlip(t) ? -1 : 1)) };
}

/** Sichtbar um 90° gegen den Uhrzeigersinn drehen. */
export function rotateLeft(t: Transform): Transform {
  return { ...t, quarter: toQuarter(t.quarter + (singleFlip(t) ? 1 : -1)) };
}

/** Sichtbar waagerecht spiegeln (links ↔ rechts). */
export function flipHorizontal(t: Transform): Transform {
  return { ...t, flipH: !t.flipH, angle: t.angle === 0 ? 0 : -t.angle };
}

/** Sichtbar senkrecht spiegeln (oben ↔ unten). */
export function flipVertical(t: Transform): Transform {
  return { ...t, flipV: !t.flipV, angle: t.angle === 0 ? 0 : -t.angle };
}

export function withAngle(t: Transform, angle: number): Transform {
  const clamped = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, angle));
  return { ...t, angle: Math.round(clamped * 10) / 10 };
}

// ── Rahmen mitdrehen ───────────────────────────────────────────────

/** Rahmen einer Arbeitsfläche `work` nach sichtbarer Drehung um 90° rechts. */
export function rectRotatedRight(r: Rect, work: Size): Rect {
  return { x: work.height - r.y - r.height, y: r.x, width: r.height, height: r.width };
}

export function rectRotatedLeft(r: Rect, work: Size): Rect {
  return { x: r.y, y: work.width - r.x - r.width, width: r.height, height: r.width };
}

export function rectFlippedH(r: Rect, work: Size): Rect {
  return { ...r, x: work.width - r.x - r.width };
}

export function rectFlippedV(r: Rect, work: Size): Rect {
  return { ...r, y: work.height - r.y - r.height };
}

// ── Rahmen im begradigten Bild halten ─────────────────────────────

/** Liegt ein Punkt der Arbeitsfläche im um `angle` gedrehten Bild? */
export function pointInImage(x: number, y: number, work: Size, angle: number): boolean {
  const rad = (-angle * Math.PI) / 180;
  const cx = work.width / 2;
  const cy = work.height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const ix = dx * Math.cos(rad) - dy * Math.sin(rad) + cx;
  const iy = dx * Math.sin(rad) + dy * Math.cos(rad) + cy;
  return (
    ix >= -EPSILON && iy >= -EPSILON && ix <= work.width + EPSILON && iy <= work.height + EPSILON
  );
}

/** Liegt der ganze Rahmen im begradigten Bild? */
export function rectInImage(r: Rect, work: Size, angle: number): boolean {
  return (
    pointInImage(r.x, r.y, work, angle) &&
    pointInImage(r.x + r.width, r.y, work, angle) &&
    pointInImage(r.x, r.y + r.height, work, angle) &&
    pointInImage(r.x + r.width, r.y + r.height, work, angle)
  );
}

/** Größtes t ∈ [0, 1] mit `valid(t)`, vorausgesetzt `valid(0)` (Bisektion). */
function largestValid(valid: (t: number) => boolean, steps = 24): number {
  if (valid(1)) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < steps; i++) {
    const mid = (lo + hi) / 2;
    if (valid(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

function scaleAbout(r: Rect, k: number, cx: number, cy: number): Rect {
  return {
    x: cx - (r.width * k) / 2,
    y: cy - (r.height * k) / 2,
    width: r.width * k,
    height: r.height * k,
  };
}

/**
 * Automatischer Zoom: bringt einen Rahmen ins begradigte Bild, Seitenverhältnis
 * bleibt. Die Mitte rückt in Zehntel-Schritten Richtung Bildmitte; genommen wird
 * die kleinste Verschiebung, bei der der Rahmen seine Größe behält, sonst die mit
 * dem größten Rahmen (bei Gleichstand die kleinere Verschiebung). Ein Rahmen über
 * dem ganzen Bild zoomt so um die Bildmitte, ein Rahmen in der Ecke rückt nach innen.
 */
export function fitInImage(r: Rect, work: Size, angle: number): Rect {
  const bounded = roundRect(r, work);
  if (angle === 0 || rectInImage(bounded, work, angle)) return bounded;

  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  const mx = work.width / 2;
  const my = work.height / 2;
  let best = { k: -1, x: mx, y: my };
  for (let step = 0; step <= 10; step++) {
    const s = step / 10;
    const x = cx + (mx - cx) * s;
    const y = cy + (my - cy) * s;
    if (!pointInImage(x, y, work, angle)) continue;
    const k = largestValid((scale) => rectInImage(scaleAbout(r, scale, x, y), work, angle));
    if (k > best.k + 1e-3) best = { k, x, y };
    if (k >= 1) break;
  }
  return shrinkToFit(scaleAbout(r, Math.max(best.k, 0), best.x, best.y), work, angle);
}

/** Rundet nach innen, bis der ganzzahlige Rahmen sicher im Bild liegt. */
function shrinkToFit(r: Rect, work: Size, angle: number): Rect {
  let candidate = roundRect(r, work);
  for (let i = 0; i < 8 && !rectInImage(candidate, work, angle); i++) {
    const inset = i + 1;
    candidate = roundRect(
      {
        x: r.x + inset,
        y: r.y + (inset * r.height) / r.width,
        width: Math.max(1, r.width - 2 * inset),
        height: Math.max(1, r.height - (2 * inset * r.height) / r.width),
      },
      work
    );
  }
  return candidate;
}

/**
 * Übernimmt einen Zielrahmen aus einer Interaktion. Ragt er aus dem begradigten
 * Bild, wird zwischen dem bisherigen (gültigen) Rahmen und dem Ziel so weit wie
 * möglich gegangen; so stoppt Verschieben und Ziehen am Bildrand. Lineare
 * Interpolation erhält ein gemeinsames Seitenverhältnis.
 */
export function constrainToImage(target: Rect, from: Rect, work: Size, angle: number): Rect {
  const bounded = roundRect(target, work);
  if (angle === 0 || rectInImage(bounded, work, angle)) return bounded;
  if (!rectInImage(from, work, angle) || from.width < MIN_CROP_SIZE) {
    return fitInImage(target, work, angle);
  }
  const lerp = (t: number): Rect => ({
    x: from.x + (target.x - from.x) * t,
    y: from.y + (target.y - from.y) * t,
    width: from.width + (target.width - from.width) * t,
    height: from.height + (target.height - from.height) * t,
  });
  const t = largestValid((s) => rectInImage(lerp(s), work, angle));
  return shrinkToFit(lerp(t), work, angle);
}

// ── Zeichnen ───────────────────────────────────────────────────────

/**
 * Zeichnet das transformierte Bild so in `ctx`, dass der Ursprung von `ctx` auf
 * dem Punkt `origin` der Arbeitsfläche liegt, in `scale` Pixeln je Bildpixel.
 * Vorschau: origin (0, 0), scale = Anzeige; Export: origin = Rahmen-Ecke.
 */
export function drawTransformed(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  source: CanvasImageSource & Size,
  t: Transform,
  options: { scale: number; origin?: { x: number; y: number } }
): void {
  const { scale } = options;
  const origin = options.origin ?? { x: 0, y: 0 };
  const work = workSize(source, t);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(work.width / 2 - origin.x, work.height / 2 - origin.y);
  ctx.rotate((t.angle * Math.PI) / 180);
  ctx.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1);
  ctx.rotate((t.quarter * Math.PI) / 2);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  ctx.restore();
}
