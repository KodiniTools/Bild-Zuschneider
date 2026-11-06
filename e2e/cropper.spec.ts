import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, imageFile, prepare, uploadImage } from './helpers';

const field = (page: Page, name: string) => page.locator(`input[data-field="${name}"]`);
const frame = (page: Page) => page.getByTestId('crop-frame');

test.describe('Laden und Zuschneiden', () => {
  test.beforeEach(async ({ page }) => {
    await prepare(page, 'de');
    await page.goto('./');
  });

  test('lädt ein Bild und setzt den Rahmen auf das ganze Bild', async ({ page }) => {
    const errors = collectPageErrors(page);
    await uploadImage(page, imageFile('foto.png', 800, 400));
    await expect(page.getByTestId('crop-canvas')).toBeVisible();
    await expect(field(page, 'width')).toHaveValue('800');
    await expect(field(page, 'height')).toHaveValue('400');
    await expect(frame(page)).toHaveAttribute('aria-label', 'Zuschnittrahmen: 800 × 400 px');
    await expect(page.getByText('Original 800 × 400 px')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('Presets setzen das Seitenverhältnis', async ({ page }) => {
    await uploadImage(page, imageFile('foto.png', 800, 400));
    await page.getByRole('button', { name: '1:1', exact: true }).click();
    // Wechsel hält die Fläche: größtes Quadrat im 800 × 400-Bild
    await expect(field(page, 'width')).toHaveValue('400');
    await expect(field(page, 'height')).toHaveValue('400');

    await page.getByRole('button', { name: '16:9' }).click();
    await page.getByRole('radio', { name: 'Hoch' }).click();
    const w = Number(await field(page, 'width').inputValue());
    const h = Number(await field(page, 'height').inputValue());
    expect(w / h).toBeCloseTo(9 / 16, 1);

    await page.getByLabel('Social-Media-Format').selectOption('youtube-thumbnail');
    await expect(page.getByText('Verhältnis 16:9')).toBeVisible();
  });

  test('Griff ziehen ändert die Größe, Tastatur verschiebt', async ({ page }) => {
    await uploadImage(page, imageFile('foto.png', 800, 400));
    await field(page, 'width').fill('400');
    await field(page, 'width').press('Enter');
    await expect(frame(page)).toHaveAttribute('aria-label', 'Zuschnittrahmen: 400 × 400 px');

    const handle = page.locator('[data-handle="se"]');
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x - 60, box.y - 60, { steps: 5 });
    await page.mouse.up();
    const width = Number(await field(page, 'width').inputValue());
    expect(width).toBeLessThan(400);

    await frame(page).focus();
    await page.keyboard.press('ArrowRight'); // 1 % von 800 px
    await expect(field(page, 'x')).toHaveValue('8');
    await page.keyboard.press('Shift+ArrowDown');
    await expect(field(page, 'height')).not.toHaveValue('400');
  });

  test('Rahmen neu aufziehen auf der Bildfläche', async ({ page }) => {
    await uploadImage(page, imageFile('foto.png', 800, 400));
    await field(page, 'width').fill('100');
    await field(page, 'width').press('Enter');
    const canvas = (await page.getByTestId('crop-canvas').boundingBox())!;
    // rechts unten außerhalb des kleinen Rahmens beginnen
    const start = { x: canvas.x + canvas.width * 0.6, y: canvas.y + canvas.height * 0.3 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + canvas.width * 0.2, start.y + canvas.height * 0.4, {
      steps: 5,
    });
    await page.mouse.up();
    const x = Number(await field(page, 'x').inputValue());
    expect(x).toBeGreaterThanOrEqual(470);
    expect(x).toBeLessThanOrEqual(490);
    expect(Number(await field(page, 'width').inputValue())).toBeGreaterThan(140);
  });

  test('HEIC zeigt einen Hinweis mit Link zum Bildkonverter', async ({ page }) => {
    await uploadImage(page, {
      name: 'IMG_0001.HEIC',
      mimeType: 'image/heic',
      buffer: Buffer.from('x'),
    });
    const alert = page.getByRole('alert');
    await expect(alert).toContainText('HEIC/HEIF-Bilder kann der Browser nicht öffnen');
    await expect(alert.getByRole('link', { name: 'Zum Bildkonverter' })).toHaveAttribute(
      'href',
      '/bildkonverter/'
    );
    await expect(page.getByTestId('crop-canvas')).toHaveCount(0);
  });

  test('„Anderes Bild“ ersetzt das Bild', async ({ page }) => {
    await uploadImage(page, imageFile('a.png', 800, 400));
    await expect(field(page, 'width')).toHaveValue('800');
    await uploadImage(page, imageFile('b.png', 300, 500));
    await expect(field(page, 'width')).toHaveValue('300');
    await expect(page.getByRole('button', { name: 'Anderes Bild' })).toBeVisible();
  });
});

test('Bedienung im schmalen Viewport (390 px)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, 'en');
  await page.goto('./');
  await uploadImage(page, imageFile('photo.png', 1200, 800));
  const canvas = (await page.getByTestId('crop-canvas').boundingBox())!;
  expect(canvas.width).toBeLessThanOrEqual(390);
  await expect(page.getByRole('heading', { name: 'Aspect ratio' })).toBeVisible();
  await page.getByRole('button', { name: 'Free' }).isVisible();
});
