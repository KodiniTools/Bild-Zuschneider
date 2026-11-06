import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, imageFile, prepare, uploadImage } from './helpers';

/** Lädt herunter und liefert Dateiname und Inhalt. */
async function download(page: Page, button = 'Herunterladen') {
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: button }).click(),
  ]);
  return { name: file.suggestedFilename(), bytes: await readFile((await file.path())!) };
}

/** Breite und Höhe aus dem IHDR-Block einer PNG-Datei. */
const pngSize = (bytes: Buffer) => ({
  width: bytes.readUInt32BE(16),
  height: bytes.readUInt32BE(20),
});

test.describe('Export', () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page, 'de');
    await page.goto('./');
    await uploadImage(page, imageFile('foto.png', 800, 400));
    await expect(page.getByTestId('export-summary')).toHaveText('Ausgabe: 800 × 400 px · PNG');
  });

  test('lädt den Ausschnitt als PNG in Rahmengröße herunter', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.getByRole('button', { name: '1:1', exact: true }).click();
    const file = await download(page);
    expect(file.name).toBe('foto-zugeschnitten.png');
    expect(file.bytes.subarray(1, 4).toString()).toBe('PNG');
    expect(pngSize(file.bytes)).toEqual({ width: 400, height: 400 });
    await expect(page.getByText('foto-zugeschnitten.png gespeichert')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('gedreht und mit Social-Media-Zielgröße', async ({ page }) => {
    await page.getByRole('button', { name: 'Um 90° nach rechts drehen' }).click();
    await page.getByLabel('Social-Media-Format').selectOption('youtube-thumbnail');
    await expect(page.getByTestId('export-summary')).toContainText('1280 ×');
    const file = await download(page);
    const size = pngSize(file.bytes);
    expect(size.width).toBe(1280);
    expect(Math.abs(size.height - 720)).toBeLessThanOrEqual(1);
  });

  test('JPG mit Qualität und eigener Ausgabegröße', async ({ page }) => {
    await page.getByLabel('Dateiformat').selectOption('jpeg');
    await expect(page.locator('#export-quality')).toBeVisible();
    await expect(page.getByText('Hintergrund für transparente Bereiche')).toBeVisible();
    await page.getByRole('switch', { name: 'Ausgabegröße ändern' }).click();
    await page.locator('input[data-field="out-width"]').fill('200');
    await page.locator('input[data-field="out-width"]').press('Enter');
    await expect(page.locator('input[data-field="out-height"]')).toHaveValue('100');
    const file = await download(page);
    expect(file.name).toBe('foto-zugeschnitten.jpg');
    expect(file.bytes[0]).toBe(0xff);
    expect(file.bytes[1]).toBe(0xd8);
  });

  test('englischer Dateiname', async ({ page }) => {
    await page.goto('./?lang=en');
    await uploadImage(page, imageFile('photo.png', 300, 200));
    const file = await download(page, 'Download');
    expect(file.name).toBe('photo-cropped.png');
  });
});
