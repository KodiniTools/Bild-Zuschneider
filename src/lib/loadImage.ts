/**
 * Laden und Decodieren von Bildern – vollständig lokal im Browser.
 *
 * Rasterformate decodiert `createImageBitmap` (EXIF-Ausrichtung wird angewendet),
 * SVG läuft über ein <img>, weil `createImageBitmap` SVG-Blobs nicht annimmt.
 * HEIC/HEIF und TIFF kann Chrome nicht decodieren: Sie werden mit eigenem Fehlercode
 * abgewiesen (Entscheidung Schritt 0: Hinweis + Link zum Bildkonverter).
 */
import type { Size } from './geometry';

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'bmp' | 'ico' | 'svg';

export type LoadErrorCode =
  'heic' | 'tiff' | 'unsupported' | 'fileTooLarge' | 'tooManyPixels' | 'decodeFailed';

/** Fehler beim Laden; `code` wählt den Text in i18n (`load.errors.*`). */
export class LoadError extends Error {
  constructor(
    readonly code: LoadErrorCode,
    options?: { cause?: unknown }
  ) {
    super(code, options);
    this.name = 'LoadError';
  }
}

export interface LoadedImage extends Size {
  bitmap: ImageBitmap;
  name: string;
  format: ImageFormat;
  fileSize: number;
}

/** Größte Datei, die geladen wird (Speicher im Browser). */
export const MAX_FILE_BYTES = 100 * 1024 * 1024;
/**
 * Canvas-Grenzen in Chrome: Kantenlänge 32767 px, Fläche 268 MP (16384²). Größere
 * Bilder lassen sich weder anzeigen noch exportieren. Annahme laut Analyse-Doc; der
 * Browser-Test prüft, dass ein Bild an der Grenze noch funktioniert.
 */
export const MAX_EDGE = 32767;
export const MAX_PIXELS = 16384 * 16384;

const MIME_FORMATS: Record<string, ImageFormat> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/pjpeg': 'jpeg',
  'image/png': 'png',
  'image/apng': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/x-ms-bmp': 'bmp',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/svg+xml': 'svg',
};

const EXT_FORMATS: Record<string, ImageFormat> = {
  jpg: 'jpeg',
  jpeg: 'jpeg',
  jfif: 'jpeg',
  png: 'png',
  apng: 'png',
  webp: 'webp',
  avif: 'avif',
  gif: 'gif',
  bmp: 'bmp',
  ico: 'ico',
  svg: 'svg',
};

const HEIC = /^image\/hei[cf](-sequence)?$|\.(heic|heif)$/i;
const TIFF = /^image\/tiff?$|\.(tiff?)$/i;

/** Wert für das accept-Attribut des Datei-Inputs. */
export const ACCEPT = [
  ...new Set(Object.keys(MIME_FORMATS)),
  ...Object.keys(EXT_FORMATS).map((ext) => `.${ext}`),
].join(',');

const extension = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

/**
 * Format aus MIME-Typ, ersatzweise aus der Endung (manche Systeme liefern einen
 * leeren Typ). Wirft LoadError für HEIC/TIFF und alles Unbekannte.
 */
export function detectFormat(file: Pick<File, 'name' | 'type'>): ImageFormat {
  const type = file.type.toLowerCase();
  if (HEIC.test(type) || HEIC.test(file.name)) throw new LoadError('heic');
  if (TIFF.test(type) || TIFF.test(file.name)) throw new LoadError('tiff');
  const format = MIME_FORMATS[type] ?? EXT_FORMATS[extension(file.name)];
  if (!format) throw new LoadError('unsupported');
  return format;
}

/** Prüft die Pixelgröße gegen die Canvas-Grenzen des Browsers. */
export function assertDrawable(size: Size): void {
  if (size.width > MAX_EDGE || size.height > MAX_EDGE || size.width * size.height > MAX_PIXELS) {
    throw new LoadError('tooManyPixels');
  }
}

async function decodeSvg(file: Blob): Promise<ImageBitmap> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('SVG ohne Größe');
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Lädt eine Datei als ImageBitmap. Fehler immer als LoadError. */
export async function loadImageFile(file: File): Promise<LoadedImage> {
  const format = detectFormat(file);
  if (file.size > MAX_FILE_BYTES) throw new LoadError('fileTooLarge');

  let bitmap: ImageBitmap;
  try {
    bitmap =
      format === 'svg'
        ? await decodeSvg(file)
        : await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (cause) {
    throw new LoadError('decodeFailed', { cause });
  }

  try {
    assertDrawable(bitmap);
  } catch (error) {
    bitmap.close();
    throw error;
  }

  return {
    bitmap,
    name: file.name,
    format,
    fileSize: file.size,
    width: bitmap.width,
    height: bitmap.height,
  };
}
