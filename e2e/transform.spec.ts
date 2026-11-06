import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, imageFile, prepare, uploadImage } from './helpers';

const field = (page: Page, name: string) => page.locator(`input[data-field="${name}"]`);
const values = async (page: Page) =>
  Promise.all(['x', 'y', 'width', 'height'].map((n) => field(page, n).inputValue()));

/** Regler wie ein Nutzer bewegen: input (live) und change (loslassen). */
async function setStraighten(page: Page, value: number) {
  await page.locator('#straighten').evaluate((el, v) => {
    const input = el as HTMLInputElement;
    input.value = String(v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

test.describe('Drehen, Spiegeln, Begradigen, Verlauf', () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page, 'de');
    await page.goto('./');
    await uploadImage(page, imageFile('foto.png', 800, 400));
    await expect(field(page, 'width')).toHaveValue('800');
  });

  test('90° drehen tauscht die Arbeitsfläche, Spiegeln behält sie', async ({ page }) => {
    const errors = collectPageErrors(page);
    const canvas = page.getByTestId('crop-canvas');
    const before = (await canvas.boundingBox())!;
    await page.getByRole('button', { name: 'Um 90° nach rechts drehen' }).click();
    await expect(field(page, 'width')).toHaveValue('400');
    await expect(field(page, 'height')).toHaveValue('800');
    const after = (await canvas.boundingBox())!;
    expect(after.height).toBeGreaterThan(after.width);
    expect(before.width).toBeGreaterThan(before.height);
    await expect(page.getByText('Original 800 × 400 px')).toBeVisible();

    await page.getByRole('button', { name: 'Waagerecht spiegeln' }).click();
    await expect(field(page, 'width')).toHaveValue('400');
    expect(errors).toEqual([]);
  });

  test('Begradigen verkleinert den Rahmen und zurück auf 0° stellt ihn her', async ({ page }) => {
    await setStraighten(page, 10);
    const width = Number(await field(page, 'width').inputValue());
    expect(width).toBeLessThan(800);
    expect(width).toBeGreaterThan(500);
    await page.getByRole('button', { name: 'Zurücksetzen' }).first().click();
    await expect(field(page, 'width')).toHaveValue('800');
  });

  test('Rückgängig/Wiederholen per Schaltfläche und Tastenkürzel', async ({ page }) => {
    const start = await values(page);
    const undo = page.getByRole('button', { name: 'Rückgängig' });
    await expect(undo).toBeDisabled();

    await page.getByRole('button', { name: '1:1', exact: true }).click();
    await page.getByRole('button', { name: 'Um 90° nach links drehen' }).click();
    await expect(field(page, 'height')).toHaveValue('400');
    const turned = await values(page);

    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+z');
    expect(await values(page)).toEqual(start);
    await expect(undo).toBeDisabled();

    await page.keyboard.press('Control+Shift+z');
    await page.getByRole('button', { name: 'Wiederholen' }).click();
    expect(await values(page)).toEqual(turned);
  });

  test('Strg+Z im Eingabefeld bleibt beim Feld', async ({ page }) => {
    await page.getByRole('button', { name: '1:1', exact: true }).click();
    await field(page, 'width').fill('123');
    await field(page, 'width').press('Control+z');
    await expect(page.locator('[data-preset="1:1"]')).toHaveAttribute('aria-pressed', 'true');
  });
});
