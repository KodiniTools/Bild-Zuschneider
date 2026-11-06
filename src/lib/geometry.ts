/**
 * Geometrie des Zuschnittrahmens – reine Funktionen, alle Werte in Bildpixeln.
 *
 * Fachliche Vorlage: Bildkonverter `useCrop.js` (Seitenverhältnis halten, Griffe,
 * Begrenzung). Hier ohne DOM und ohne Zustand, damit alles in happy-dom testbar ist.
 * Rechtecke sind immer normalisiert (width/height ≥ 0) und ganzzahlig, sobald sie
 * über `roundRect` laufen; Zwischenschritte rechnen mit Fließkomma.
 */

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Size {
  x: number;
  y: number;
}

/** Griffe des Rahmens: Kanten (n, e, s, w) und Ecken. */
export type Handle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export const HANDLES: readonly Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/** Kleinste Kantenlänge eines Ausschnitts in Bildpixeln. */
export const MIN_CROP_SIZE = 10;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Rundet auf ganze Pixel, ohne die Bildgrenzen zu verlassen. */
export function roundRect(rect: Rect, bounds: Size): Rect {
  const x = clamp(Math.round(rect.x), 0, bounds.width);
  const y = clamp(Math.round(rect.y), 0, bounds.height);
  return {
    x,
    y,
    width: clamp(Math.round(rect.width), 0, bounds.width - x),
    height: clamp(Math.round(rect.height), 0, bounds.height - y),
  };
}

/** Größtes Rechteck mit Seitenverhältnis `ratio` (Breite/Höhe), das in `size` passt. */
export function fitRatio(size: Size, ratio: number): Size {
  if (size.width / size.height > ratio) {
    return { width: size.height * ratio, height: size.height };
  }
  return { width: size.width, height: size.width / ratio };
}

/**
 * Zentrierter Rahmen über `coverage` (Anteil der größtmöglichen Fläche je Kante)
 * des Bildes; mit `ratio` im passenden Seitenverhältnis, sonst wie das Bild.
 */
export function centeredRect(bounds: Size, ratio: number | null, coverage = 1): Rect {
  const full = ratio ? fitRatio(bounds, ratio) : { ...bounds };
  const width = full.width * coverage;
  const height = full.height * coverage;
  return roundRect(
    { x: (bounds.width - width) / 2, y: (bounds.height - height) / 2, width, height },
    bounds
  );
}

/**
 * Passt einen Rahmen auf ein Seitenverhältnis an: gleiche Mitte, gleiche Fläche
 * soweit möglich, danach ins Bild verkleinert und verschoben.
 */
export function applyRatio(rect: Rect, ratio: number, bounds: Size): Rect {
  const area = Math.max(rect.width * rect.height, MIN_CROP_SIZE * MIN_CROP_SIZE);
  let width = Math.sqrt(area * ratio);
  let height = width / ratio;
  const max = fitRatio(bounds, ratio);
  if (width > max.width) {
    width = max.width;
    height = max.height;
  }
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const x = clamp(cx - width / 2, 0, bounds.width - width);
  const y = clamp(cy - height / 2, 0, bounds.height - height);
  return roundRect({ x, y, width, height }, bounds);
}

/** Verschiebt einen Rahmen um (dx, dy), ohne das Bild zu verlassen. Größe bleibt. */
export function moveRect(rect: Rect, dx: number, dy: number, bounds: Size): Rect {
  return roundRect(
    {
      ...rect,
      x: clamp(rect.x + dx, 0, bounds.width - rect.width),
      y: clamp(rect.y + dy, 0, bounds.height - rect.height),
    },
    bounds
  );
}

/**
 * Zieht einen Griff um (dx, dy). Die gegenüberliegende Kante bzw. Ecke bleibt fest.
 * Mit `ratio` bleibt das Seitenverhältnis erhalten (Kantengriffe skalieren um die
 * Mitte der anderen Achse). Ergebnis bleibt im Bild und ist mindestens `minSize` groß.
 */
export function resizeRect(
  rect: Rect,
  handle: Handle,
  dx: number,
  dy: number,
  bounds: Size,
  ratio: number | null = null,
  minSize = MIN_CROP_SIZE
): Rect {
  const west = handle.includes('w');
  const east = handle.includes('e');
  const north = handle.includes('n');
  const south = handle.includes('s');

  // Feste Gegenkante (Anker) und Ausdehnung in Zugrichtung
  const anchorX = west ? rect.x + rect.width : rect.x;
  const anchorY = north ? rect.y + rect.height : rect.y;
  const maxW = west ? anchorX : bounds.width - anchorX;
  const maxH = north ? anchorY : bounds.height - anchorY;
  const min = Math.min(minSize, bounds.width, bounds.height);

  let width = rect.width + (east ? dx : west ? -dx : 0);
  let height = rect.height + (south ? dy : north ? -dy : 0);

  if (ratio) {
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    const horizontalOnly = !north && !south;
    const verticalOnly = !west && !east;
    // Führende Achse: die gezogene; bei Ecken die mit der größeren relativen Änderung
    // Über die Gegenkante hinaus gezogen: auf null begrenzen, die Mindestgröße folgt unten
    width = Math.max(0, width);
    height = Math.max(0, height);
    if (verticalOnly || (!horizontalOnly && height / rect.height > width / rect.width)) {
      width = height * ratio;
    } else {
      height = width / ratio;
    }
    // Mindestgröße im Seitenverhältnis (beide Kanten ≥ min)
    const minW = Math.max(min, min * ratio);
    if (width < minW) {
      width = minW;
      height = minW / ratio;
    }
    // Grenzen der freien Achse: Kantengriffe wachsen symmetrisch um die Mitte
    const limitW = verticalOnly ? 2 * Math.min(centerX, bounds.width - centerX) : maxW;
    const limitH = horizontalOnly ? 2 * Math.min(centerY, bounds.height - centerY) : maxH;
    const scale = Math.min(1, limitW / width, limitH / height);
    width *= scale;
    height *= scale;

    const x = verticalOnly ? centerX - width / 2 : west ? anchorX - width : anchorX;
    const y = horizontalOnly ? centerY - height / 2 : north ? anchorY - height : anchorY;
    return roundRect(
      {
        x: clamp(x, 0, bounds.width - width),
        y: clamp(y, 0, bounds.height - height),
        width,
        height,
      },
      bounds
    );
  }

  width = clamp(width, min, maxW);
  height = clamp(height, min, maxH);
  return roundRect(
    {
      x: west ? anchorX - width : east ? anchorX : rect.x,
      y: north ? anchorY - height : south ? anchorY : rect.y,
      width: west || east ? width : rect.width,
      height: north || south ? height : rect.height,
    },
    bounds
  );
}

/**
 * Neuer Rahmen aus zwei Punkten (Aufziehen mit der Maus). Mit `ratio` bestimmt die
 * längere Bewegungsachse die Größe; der Startpunkt bleibt eine Ecke.
 */
export function rectFromPoints(
  start: { x: number; y: number },
  end: { x: number; y: number },
  bounds: Size,
  ratio: number | null = null
): Rect {
  const ex = clamp(end.x, 0, bounds.width);
  const ey = clamp(end.y, 0, bounds.height);
  let width = Math.abs(ex - start.x);
  let height = Math.abs(ey - start.y);
  const dirX = ex < start.x ? -1 : 1;
  const dirY = ey < start.y ? -1 : 1;

  if (ratio) {
    if (width / ratio > height) height = width / ratio;
    else width = height * ratio;
    const maxW = dirX < 0 ? start.x : bounds.width - start.x;
    const maxH = dirY < 0 ? start.y : bounds.height - start.y;
    const scale = Math.min(1, maxW / width || 0, maxH / height || 0);
    width *= scale;
    height *= scale;
  }

  return roundRect(
    {
      x: dirX < 0 ? start.x - width : start.x,
      y: dirY < 0 ? start.y - height : start.y,
      width,
      height,
    },
    bounds
  );
}

/** Ist der Rahmen groß genug, um als Ausschnitt zu gelten? */
export function isUsableRect(rect: Rect, minSize = MIN_CROP_SIZE): boolean {
  return rect.width >= minSize && rect.height >= minSize;
}

/**
 * Seitenverhältnis als Text: gekürzt, wenn es kurz bleibt (1920×1080 → „16:9“),
 * sonst als Dezimalzahl zu 1 (1013×777 → „1.30:1“).
 */
export function ratioLabel(size: Size): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const w = Math.round(size.width);
  const h = Math.round(size.height);
  if (!w || !h) return '–';
  const d = gcd(w, h);
  if (w / d <= 32 && h / d <= 32) return `${w / d}:${h / d}`;
  return `${(w / h).toFixed(2)}:1`;
}

/**
 * Seitenverhältnis-Wert als Text: kurzer Bruch, wenn einer bis 32:32 auf 0,1 %
 * passt (1.7778 → „16:9“), sonst Dezimalzahl zu 1. Für feste Verhältnisse, deren
 * gerundete Pixelmaße kein exakter Bruch mehr sind (1067 × 800 bei 4:3).
 */
export function ratioValueLabel(ratio: number): string {
  for (let h = 1; h <= 32; h++) {
    const w = Math.round(ratio * h);
    if (w >= 1 && w <= 32 && Math.abs(w / h - ratio) / ratio < 0.001) return `${w}:${h}`;
  }
  return `${ratio.toFixed(2)}:1`;
}
