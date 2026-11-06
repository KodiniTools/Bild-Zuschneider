import { describe, expect, it } from 'vitest';
import { loadImageFile } from '@/lib/loadImage';

/** Echte Decodierung im Browser (createImageBitmap, SVG über <img>). */
async function pngFile(width: number, height: number, name = 'test.png'): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgb(0, 128, 255)';
  ctx.fillRect(0, 0, width, height);
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  return new File([blob], name, { type: 'image/png' });
}

describe('loadImageFile im Browser', () => {
  it('decodiert PNG mit Maßen und Pixeln', async () => {
    const image = await loadImageFile(await pngFile(64, 32));
    expect(image).toMatchObject({ width: 64, height: 32, format: 'png' });
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image.bitmap, 0, 0);
    expect(Array.from(ctx.getImageData(0, 0, 1, 1).data)).toEqual([0, 128, 255, 255]);
    image.bitmap.close();
  });

  it('erkennt das Format über die Endung, wenn der Typ fehlt', async () => {
    const png = await pngFile(8, 8);
    const image = await loadImageFile(new File([png], 'ohne-typ.png', { type: '' }));
    expect(image.format).toBe('png');
  });

  it('decodiert SVG mit eigener Größe', async () => {
    const svg = new File(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="red"/></svg>',
      ],
      'logo.svg',
      { type: 'image/svg+xml' }
    );
    const image = await loadImageFile(svg);
    expect(image).toMatchObject({ width: 120, height: 60, format: 'svg' });
  });

  it('meldet beschädigte Dateien als decodeFailed', async () => {
    const broken = new File([new Uint8Array([1, 2, 3, 4])], 'kaputt.jpg', { type: 'image/jpeg' });
    await expect(loadImageFile(broken)).rejects.toMatchObject({ code: 'decodeFailed' });
  });
});
