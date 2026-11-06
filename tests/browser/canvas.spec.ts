import { describe, expect, it } from 'vitest';

/**
 * Prüft, dass der Browser-Modus mit echtem Canvas läuft. Grundlage für die
 * Export-Tests ab Schritt 6 (Kodierung über canvas.toBlob).
 */
function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.9));
}

describe('Canvas im echten Browser', () => {
  it('zeichnet Pixel und liest sie zurück', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 2;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgb(255, 0, 0)';
    ctx.fillRect(0, 0, 2, 2);
    expect(Array.from(ctx.getImageData(0, 0, 1, 1).data)).toEqual([255, 0, 0, 255]);
    expect(Array.from(ctx.getImageData(3, 0, 1, 1).data)).toEqual([0, 0, 0, 0]);
  });

  it.each(['image/png', 'image/jpeg', 'image/webp'])('kodiert %s', async (type) => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const blob = await toBlob(canvas, type);
    expect(blob?.type).toBe(type);
    expect(blob!.size).toBeGreaterThan(0);
  });
});
