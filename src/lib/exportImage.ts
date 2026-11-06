/**
 * Export des Ausschnitts: rendern in voller Auflösung, kodieren, herunterladen.
 *
 * Gerendert wird mit derselben Funktion wie die Vorschau (`drawTransformed`), nur mit
 * `origin` auf der Rahmen-Ecke. Metadaten (EXIF, GPS) gehen dabei verloren – gewollt
 * (Datenschutz). Kodiert wird mit `canvas.toBlob`; ob ein Format geht, prüft
 * `detectEncodable` (Chrome liefert für nicht unterstützte Typen still PNG).
 */
import type { Rect, Size } from './geometry';
import { LoadError, assertDrawable } from './loadImage';
import { drawTransformed, type Transform } from './transform';

export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif';

export interface OutputFormatInfo {
  id: OutputFormat;
  mime: string;
  extension: string;
  label: string;
  /** Verlustbehaftet: Qualitätsregler zeigen */
  lossy: boolean;
  /** Transparenz möglich; sonst wird mit der Hintergrundfarbe gefüllt */
  alpha: boolean;
}

export const OUTPUT_FORMATS: readonly OutputFormatInfo[] = [
  { id: 'jpeg', mime: 'image/jpeg', extension: 'jpg', label: 'JPG', lossy: true, alpha: false },
  { id: 'png', mime: 'image/png', extension: 'png', label: 'PNG', lossy: false, alpha: true },
  { id: 'webp', mime: 'image/webp', extension: 'webp', label: 'WebP', lossy: true, alpha: true },
  { id: 'avif', mime: 'image/avif', extension: 'avif', label: 'AVIF', lossy: true, alpha: true },
];

export const DEFAULT_QUALITY = 0.92;
export const DEFAULT_BACKGROUND = '#ffffff';

export function formatInfo(id: OutputFormat): OutputFormatInfo {
  return OUTPUT_FORMATS.find((format) => format.id === id) ?? OUTPUT_FORMATS[1]!;
}

/** Ausgabeformat passend zur Quelle: gleiches Format, wenn kodierbar, sonst PNG. */
export function defaultOutputFormat(
  sourceFormat: string,
  encodable: readonly OutputFormat[]
): OutputFormat {
  const same = OUTPUT_FORMATS.find((f) => f.id === sourceFormat);
  return same && encodable.includes(same.id) ? same.id : 'png';
}

export class ExportError extends Error {
  constructor(
    readonly code: 'tooManyPixels' | 'encodeFailed' | 'formatUnsupported',
    options?: { cause?: unknown }
  ) {
    super(code, options);
    this.name = 'ExportError';
  }
}

function toBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

let encodableCache: Promise<OutputFormat[]> | null = null;

/**
 * Welche Ausgabeformate kann dieser Browser kodieren? Probiert ein 2 × 2-Canvas je
 * Format und vergleicht den gelieferten Typ. Ergebnis wird einmal ermittelt.
 */
export function detectEncodable(): Promise<OutputFormat[]> {
  encodableCache ??= (async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const result: OutputFormat[] = [];
    for (const format of OUTPUT_FORMATS) {
      try {
        const blob = await toBlob(canvas, format.mime, 0.5);
        if (blob?.type === format.mime) result.push(format.id);
      } catch {
        // Format nicht verfügbar
      }
    }
    // PNG muss jeder Browser können; auch wenn die Probe scheitert (z. B. ohne Canvas)
    return result.includes('png') ? result : ['png', ...result];
  })();
  return encodableCache;
}

/** Nur für Tests: Erkennung neu laufen lassen. */
export function resetEncodableCache(): void {
  encodableCache = null;
}

/**
 * Ausgabegröße: ohne Zielbreite die Rahmengröße, sonst die Zielbreite mit dem
 * Seitenverhältnis des Rahmens (Höhe folgt). Mindestens 1 × 1.
 */
export function outputSize(crop: Size, targetWidth: number | null): Size {
  if (!targetWidth || targetWidth <= 0 || !crop.width || !crop.height) {
    return { width: Math.max(1, crop.width), height: Math.max(1, crop.height) };
  }
  const width = Math.max(1, Math.round(targetWidth));
  return { width, height: Math.max(1, Math.round((width * crop.height) / crop.width)) };
}

export interface RenderOptions {
  source: CanvasImageSource & Size;
  transform: Transform;
  crop: Rect;
  size: Size;
  /** Füllfarbe unter dem Bild; null = transparent */
  background: string | null;
}

/** Rendert den Ausschnitt in ein neues Canvas der Ausgabegröße. */
export function renderCrop({
  source,
  transform,
  crop,
  size,
  background,
}: RenderOptions): HTMLCanvasElement {
  try {
    assertDrawable(size);
  } catch (error) {
    if (error instanceof LoadError) throw new ExportError('tooManyPixels', { cause: error });
    throw error;
  }
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ExportError('tooManyPixels');
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size.width, size.height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(size.width / crop.width, size.height / crop.height);
  drawTransformed(ctx, source, transform, { scale: 1, origin: { x: crop.x, y: crop.y } });
  return canvas;
}

/** Kodiert ein Canvas; prüft, dass wirklich das gewünschte Format herauskommt. */
export async function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number
): Promise<Blob> {
  const info = formatInfo(format);
  let blob: Blob | null;
  try {
    blob = await toBlob(canvas, info.mime, info.lossy ? quality : undefined);
  } catch (cause) {
    throw new ExportError('encodeFailed', { cause });
  }
  if (!blob) throw new ExportError('encodeFailed');
  if (blob.type !== info.mime) throw new ExportError('formatUnsupported');
  return blob;
}

/**
 * Dateiname der Ausgabe: Name ohne Endung + Zusatz + neue Endung; leere oder nur aus
 * Sonderzeichen bestehende Namen werden zu „bild“.
 */
export function outputFileName(sourceName: string, suffix: string, format: OutputFormat): string {
  const base = sourceName
    .replace(/\.[^./\\]+$/, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/^[-\s]+|[-\s]+$/g, '');
  return `${base || 'bild'}${suffix}.${formatInfo(format).extension}`;
}

/** Startet den Download eines Blobs im Browser. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Erst nach dem Klick freigeben; Safari braucht etwas Zeit
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Lesbare Dateigröße: „842 KB“, „1,4 MB“ (Zahlformat der Sprache). */
export function formatBytes(bytes: number, locale: string): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toLocaleString(locale, { maximumFractionDigits: digits })} ${units[unit]}`;
}
