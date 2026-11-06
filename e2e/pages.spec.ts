import { expect, test } from '@playwright/test';
import { collectPageErrors, prepare, type Locale, type Theme } from './helpers';

/**
 * Alle Routen aus src/router/index.ts mit ihrer H1 je Sprache.
 * Bis zur i18n (Schritt 3) sind die Texte in beiden Sprachen deutsch.
 */
const PAGES: ReadonlyArray<{ path: string; heading: Record<Locale, string> }> = [
  { path: './', heading: { de: 'Bild-Zuschneider', en: 'Bild-Zuschneider' } },
  { path: './guide', heading: { de: 'Anleitung', en: 'Anleitung' } },
  { path: './faq', heading: { de: 'Häufig gestellte Fragen', en: 'Häufig gestellte Fragen' } },
  {
    path: './about',
    heading: { de: 'Über den Bild-Zuschneider', en: 'Über den Bild-Zuschneider' },
  },
  { path: './gibt-es-nicht', heading: { de: '404', en: '404' } },
];

for (const { path, heading } of PAGES) {
  for (const locale of ['de', 'en'] as const) {
    for (const theme of ['light', 'dark'] as const satisfies readonly Theme[]) {
      test(`${path} · ${locale} · ${theme}`, async ({ page }) => {
        const errors = collectPageErrors(page);
        await prepare(page, locale, theme);
        await page.goto(path);

        await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading[locale]);
        expect(errors).toEqual([]);
      });
    }
  }
}

// Lighthouse heading-order: Überschriften springen nie um mehr als eine Ebene
for (const { path } of PAGES) {
  test(`${path} · Überschriften ohne Sprung`, async ({ page }) => {
    await prepare(page, 'de');
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const levels = await page
      .locator('#app :is(h1, h2, h3, h4, h5, h6)')
      .evaluateAll((els) =>
        els.filter((el) => el.checkVisibility()).map((el) => Number(el.tagName[1]))
      );
    // wie axe heading-order: die erste Überschrift darf jede Ebene haben
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i], `Ebenen: ${levels.join(' → ')}`).toBeLessThanOrEqual(levels[i - 1]! + 1);
    }
  });
}
