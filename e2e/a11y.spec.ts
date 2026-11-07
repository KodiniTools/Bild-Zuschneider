import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { imageFile, prepare, uploadImage, type Locale, type Theme } from './helpers';

/**
 * Barrierefreiheit mit axe (dieselbe Engine wie die Lighthouse-Kategorie
 * Accessibility), auch für Zustände, die Lighthouse nicht erreicht: Werkzeug mit
 * geladenem Bild, Fehlermeldung, offene FAQ-Antworten – je Sprache und Theme.
 */
async function violations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  return result.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`
  );
}

const ROUTES = ['./', './guide', './faq', './about', './gibt-es-nicht'];

for (const theme of ['light', 'dark'] as const satisfies readonly Theme[]) {
  for (const locale of ['de', 'en'] as const satisfies readonly Locale[]) {
    test(`Seiten ohne axe-Befunde · ${locale} · ${theme}`, async ({ page }) => {
      await prepare(page, locale, theme);
      for (const route of ROUTES) {
        await page.goto(route);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await violations(page), route).toEqual([]);
      }
    });

    test(`Werkzeug mit Bild ohne axe-Befunde · ${locale} · ${theme}`, async ({ page }) => {
      await prepare(page, locale, theme);
      await page.goto('./');
      await uploadImage(page, imageFile('foto.png', 800, 400));
      await page.getByTestId('crop-canvas').waitFor();
      await page.locator('[data-preset="16:9"]').click();
      expect(await violations(page)).toEqual([]);
    });
  }
}

test('Fehlermeldung beim Laden ohne axe-Befunde', async ({ page }) => {
  await prepare(page, 'de', 'dark');
  await page.goto('./');
  await uploadImage(page, { name: 'scan.tiff', mimeType: 'image/tiff', buffer: Buffer.from('x') });
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await violations(page)).toEqual([]);
});
