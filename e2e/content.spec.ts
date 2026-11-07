import { expect, test } from '@playwright/test';
import { collectPageErrors, prepare } from './helpers';

test('FAQ: Akkordeon und FAQPage-Daten nur auf der FAQ-Seite', async ({ page }) => {
  const errors = collectPageErrors(page);
  await prepare(page, 'de');
  await page.goto('./faq');
  const question = page.getByRole('button', { name: 'Funktionieren animierte GIFs?' });
  await expect(question).toHaveAttribute('aria-expanded', 'false');
  await question.click();
  await expect(page.getByText('Bei animierten GIFs wird das erste Bild verwendet.')).toBeVisible();
  await expect(page.locator('#faq-jsonld')).toHaveCount(1);

  await page
    .getByRole('navigation', { name: 'Bereiche des Bild-Zuschneiders' })
    .getByRole('link', { name: 'Anleitung' })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Anleitung');
  await expect(page.locator('#faq-jsonld')).toHaveCount(0);
  // WebApplication liegt statisch in index.html
  const app = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').first().textContent())!
  );
  expect(app['@type']).toBe('WebApplication');
  expect(errors).toEqual([]);
});

test('Startseite: SEO-Text mit Links, auf Englisch übersetzt', async ({ page }) => {
  await prepare(page, 'en');
  await page.goto('./');
  await expect(
    page.getByRole('heading', { level: 2, name: 'Crop images online – free and private' })
  ).toBeVisible();
  await page.getByRole('link', { name: 'FAQ' }).last().click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Frequently Asked Questions');
});
