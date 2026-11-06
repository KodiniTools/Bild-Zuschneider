import { crc32, deflateSync } from 'node:zlib';
import type { Page } from '@playwright/test';

export type Locale = 'de' | 'en';
export type Theme = 'dark' | 'light';

/** Setzt Sprache und Theme vor dem ersten Skript der Seite (wie die SSI-Navigation). */
export async function prepare(page: Page, locale: Locale, theme: Theme = 'light'): Promise<void> {
  await page.addInitScript(
    ([l, t]) => {
      localStorage.setItem('locale', l);
      localStorage.setItem('theme', t);
    },
    [locale, theme] as const
  );
}

/**
 * Ressourcen, die nur auf dem Server existieren (Root-Favicon von kodinitools.com).
 * Lokal liefern Dev-Server und `vite preview` dafür 404.
 */
const SERVER_ONLY = [/\/favicon\.ico$/];

/**
 * Sammelt unbehandelte Seitenfehler und Konsolenfehler für eine abschließende Prüfung.
 * Ladefehler von Ressourcen, die nur auf dem Server liegen, zählen nicht.
 */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const url = message.location().url;
    if (SERVER_ONLY.some((pattern) => pattern.test(url))) return;
    errors.push(`console: ${message.text()} (${url})`);
  });
  return errors;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/**
 * Gültige RGB-PNG-Datei mit Farbmuster (Kopie aus dem Bildkonverter).
 */
export function png(width: number, height: number, range?: [number, number]): Buffer {
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) {
      const rgb = [(x * 7 + y * 13) % 256, (x * x + y * 3) % 256, (x * y) % 256];
      // optional in einen engeren Tonwertbereich stauchen (flaues Bild)
      row.set(
        range ? rgb.map((v) => Math.round(range[0] + (v * (range[1] - range[0])) / 255)) : rgb,
        1 + x * 3
      );
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // Bittiefe
  header[9] = 2; // Farbtyp RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export function imageFile(name: string, width = 120, height = 80, range?: [number, number]) {
  return { name, mimeType: 'image/png', buffer: png(width, height, range) };
}

/** Lädt ein Bild über das (versteckte) Datei-Input der Seite. */
export async function uploadImage(page: Page, file: ReturnType<typeof imageFile>) {
  await page.locator('input[type="file"]').setInputFiles(file);
}
