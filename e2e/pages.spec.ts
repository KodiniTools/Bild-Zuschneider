import { expect, test } from '@playwright/test';
import { collectPageErrors, prepare, type Locale, type Theme } from './helpers';

/** Alle Routen aus src/router/index.ts mit ihrer H1 je Sprache. */
const PAGES: ReadonlyArray<{ path: string; heading: Record<Locale, string> }> = [
  { path: './', heading: { de: 'Bild-Zuschneider', en: 'Image Cropper' } },
  { path: './guide', heading: { de: 'Anleitung', en: 'Guide' } },
  { path: './faq', heading: { de: 'Häufig gestellte Fragen', en: 'Frequently Asked Questions' } },
  { path: './about', heading: { de: 'Über den Bild-Zuschneider', en: 'About Image Cropper' } },
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
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        expect(errors).toEqual([]);
      });
    }
  }
}

test('?lang=en hat Vorrang vor der gespeicherten Sprache', async ({ page }) => {
  await prepare(page, 'de');
  await page.goto('./faq?lang=en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Frequently Asked Questions');
  await expect(page).toHaveTitle('Frequently Asked Questions (FAQ) – Image Cropper | KodiniTools');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://kodinitools.com/bild-zuschneider/faq?lang=en'
  );
});

test('setzt Canonical, hreflang und noindex pro Route', async ({ page }) => {
  await prepare(page, 'de');
  await page.goto('./about');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://kodinitools.com/bild-zuschneider/about'
  );
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href',
    'https://kodinitools.com/bild-zuschneider/about?lang=en'
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');

  await page.goto('./gibt-es-nicht');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('folgt Sprach- und Themewechsel der globalen Navigation', async ({ page }) => {
  await prepare(page, 'de', 'light');
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bild-Zuschneider');

  // nav.html meldet Sprachwechsel per Event und Themewechsel über html[data-theme]
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: 'en' } }));
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Image Cropper');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(/Image Cropper \| KodiniTools$/);
  await expect
    .poll(() =>
      page.evaluate(() => [localStorage.getItem('locale'), localStorage.getItem('theme')])
    )
    .toEqual(['en', 'dark']);
});

test('Kopfzeile führt zu allen Bereichen und markiert den aktiven', async ({ page }) => {
  await prepare(page, 'de');
  await page.goto('./');
  const nav = page.getByRole('navigation', { name: 'Bereiche des Bild-Zuschneiders' });
  await nav.getByRole('link', { name: 'FAQ' }).click();
  await expect(page).toHaveURL(/\/bild-zuschneider\/faq$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Häufig gestellte Fragen');
  await expect(nav.getByRole('link', { name: 'FAQ' })).toHaveAttribute('aria-current', 'page');
});

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
