import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { LoadError, type LoadedImage } from '@/lib/loadImage';
import { useEditorStore } from '@/stores/editor';

const loadImageFile = vi.hoisted(() => vi.fn());
vi.mock('@/lib/loadImage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/loadImage')>()),
  loadImageFile,
}));

function loaded(width: number, height: number): LoadedImage {
  return {
    bitmap: { width, height, close: vi.fn() } as unknown as ImageBitmap,
    name: 'bild.png',
    format: 'png',
    fileSize: 100,
    width,
    height,
  };
}

const file = new File([''], 'bild.png', { type: 'image/png' });

describe('Editor-Store', () => {
  let editor: ReturnType<typeof useEditorStore>;

  beforeEach(async () => {
    setActivePinia(createPinia());
    editor = useEditorStore();
    loadImageFile.mockReset().mockResolvedValue(loaded(1000, 500));
    await editor.loadFile(file);
  });

  it('lädt ein Bild und setzt den Rahmen frei auf das ganze Bild', () => {
    expect(editor.hasImage).toBe(true);
    expect(editor.imageSize).toEqual({ width: 1000, height: 500 });
    expect(editor.crop).toEqual({ x: 0, y: 0, width: 1000, height: 500 });
    expect(editor.loading).toBe(false);
  });

  it('setzt bei festem Verhältnis einen zentrierten Rahmen', () => {
    editor.setPreset('1:1');
    expect(editor.crop.width).toBe(editor.crop.height);
    expect(editor.crop.x + editor.crop.width / 2).toBeCloseTo(500, 0);
    editor.resetCrop();
    expect(editor.crop).toEqual({ x: 275, y: 25, width: 450, height: 450 });
  });

  it('dreht das Verhältnis mit der Ausrichtung', () => {
    editor.setPreset('16:9');
    expect(editor.ratio).toBeCloseTo(16 / 9);
    editor.setOrientation('portrait');
    expect(editor.ratio).toBeCloseTo(9 / 16);
    expect(editor.crop.width / editor.crop.height).toBeCloseTo(9 / 16, 1);
  });

  it('fällt bei unbekanntem Preset auf frei zurück', () => {
    editor.setPreset('gibt-es-nicht');
    expect(editor.presetId).toBe('free');
    expect(editor.ratio).toBeNull();
  });

  it('übernimmt Pixelwerte und hält das Verhältnis', () => {
    editor.setPreset('1:1');
    editor.setCropField('width', 200);
    expect(editor.crop).toMatchObject({ width: 200, height: 200 });
    editor.setCropField('height', 5000);
    expect(editor.crop).toMatchObject({ width: 500, height: 500, y: 0 });
  });

  it('hält Felder im Bild, frei und ohne Verhältnis', () => {
    editor.setCrop({ x: 0, y: 0, width: 200, height: 100 });
    editor.setCropField('x', 5000);
    expect(editor.crop.x).toBe(800);
    editor.setCropField('width', 400);
    expect(editor.crop).toMatchObject({ x: 600, width: 400, height: 100 });
    editor.setCropField('height', 3);
    expect(editor.crop.height).toBe(10);
    editor.setCropField('y', Number.NaN);
    expect(editor.crop.y).toBe(0);
  });

  it('meldet Ladefehler und behält das vorige Bild', async () => {
    const previous = editor.image;
    loadImageFile.mockRejectedValueOnce(new LoadError('heic'));
    expect(await editor.loadFile(file)).toBe(false);
    expect(editor.error).toBe('heic');
    expect(editor.image).toBe(previous);
  });

  it('gibt beim Ersetzen und Leeren den Speicher frei', async () => {
    const first = editor.image!;
    loadImageFile.mockResolvedValueOnce(loaded(200, 100));
    await editor.loadFile(file);
    expect(first.bitmap.close).toHaveBeenCalled();
    const second = editor.image!;
    editor.clear();
    expect(second.bitmap.close).toHaveBeenCalled();
    expect(editor.hasImage).toBe(false);
  });

  it('schaltet das Raster', () => {
    expect(editor.showGrid).toBe(true);
    editor.toggleGrid();
    expect(editor.showGrid).toBe(false);
  });
});

describe('Editor-Store: Drehen, Spiegeln, Begradigen, Verlauf', () => {
  let editor: ReturnType<typeof useEditorStore>;

  beforeEach(async () => {
    setActivePinia(createPinia());
    editor = useEditorStore();
    loadImageFile.mockReset().mockResolvedValue(loaded(1000, 500));
    await editor.loadFile(file);
    editor.setCrop({ x: 100, y: 50, width: 200, height: 100 });
    editor.commit();
  });

  it('dreht Arbeitsfläche und Rahmen mit', () => {
    editor.rotate('right');
    expect(editor.workSize).toEqual({ width: 500, height: 1000 });
    expect(editor.crop).toEqual({ x: 350, y: 100, width: 100, height: 200 });
    editor.rotate('left');
    expect(editor.crop).toEqual({ x: 100, y: 50, width: 200, height: 100 });
  });

  it('spiegelt den Rahmen an der Mitte', () => {
    editor.flip('horizontal');
    expect(editor.transform.flipH).toBe(true);
    expect(editor.crop.x).toBe(700);
    editor.flip('vertical');
    expect(editor.crop.y).toBe(350);
  });

  it('wechselt bei Hoch/Quer-Presets nach dem Drehen die Ausrichtung', () => {
    editor.setPreset('16:9');
    editor.rotate('right');
    expect(editor.orientation).toBe('portrait');
    expect(editor.crop.width / editor.crop.height).toBeCloseTo(9 / 16, 1);
  });

  it('legt feste Formate nach dem Drehen neu an', () => {
    editor.setPreset('youtube-thumbnail');
    editor.rotate('left');
    expect(editor.orientation).toBe('landscape');
    expect(editor.crop.width / editor.crop.height).toBeCloseTo(16 / 9, 1);
  });

  it('Begradigen verkleinert den Rahmen, zurück auf 0° stellt ihn wieder her', () => {
    editor.resetCrop(); // ganzes Bild
    editor.setAngle(10);
    expect(editor.crop.width).toBeLessThan(1000);
    expect(editor.transform.angle).toBe(10);
    editor.setAngle(0);
    expect(editor.crop).toEqual({ x: 0, y: 0, width: 1000, height: 500 });
  });

  it('Ziehen bleibt bei Begradigung im Bild', () => {
    editor.setAngle(10);
    editor.commitAngle();
    editor.setCrop({ ...editor.crop, x: 2000 });
    expect(editor.crop.x + editor.crop.width).toBeLessThan(1000);
  });

  it('Rückgängig und Wiederholen über Aktionen hinweg', () => {
    editor.rotate('right');
    editor.setPreset('1:1');
    editor.setAngle(5);
    editor.commitAngle();
    expect(editor.canUndo).toBe(true);
    editor.undo();
    expect(editor.transform.angle).toBe(0);
    editor.undo();
    expect(editor.presetId).toBe('free');
    editor.undo();
    expect(editor.transform.quarter).toBe(0);
    expect(editor.crop).toEqual({ x: 100, y: 50, width: 200, height: 100 });
    editor.redo();
    expect(editor.transform.quarter).toBe(1);
    expect(editor.canRedo).toBe(true);
  });

  it('Zieh-Vorgänge zählen erst beim Festschreiben', () => {
    editor.setCrop({ x: 0, y: 0, width: 300, height: 300 });
    editor.setCrop({ x: 10, y: 0, width: 300, height: 300 });
    editor.commit();
    editor.undo();
    expect(editor.crop).toEqual({ x: 100, y: 50, width: 200, height: 100 });
    expect(editor.canUndo).toBe(true); // Setzen vor dem Test bleibt im Verlauf
  });

  it('ein neues Bild setzt Transformation und Verlauf zurück', async () => {
    editor.rotate('right');
    await editor.loadFile(file);
    expect(editor.transform).toEqual({ quarter: 0, flipH: false, flipV: false, angle: 0 });
    expect(editor.canUndo).toBe(false);
  });

  it('Drehen zurücksetzen stellt die Ausgangslage her', () => {
    editor.setPreset('16:9');
    editor.rotate('right');
    editor.setAngle(3);
    editor.resetTransform();
    expect(editor.transform.quarter).toBe(0);
    expect(editor.transform.angle).toBe(0);
    expect(editor.orientation).toBe('landscape');
    expect(editor.crop.width / editor.crop.height).toBeCloseTo(16 / 9, 1);
  });
});

describe('Editor-Store: Basis der Begradigung', () => {
  it('bleibt über mehrere festgeschriebene Winkel erhalten, andere Aktionen setzen sie neu', async () => {
    setActivePinia(createPinia());
    const editor = useEditorStore();
    loadImageFile.mockReset().mockResolvedValue(loaded(1000, 500));
    await editor.loadFile(file);
    editor.setAngle(10);
    editor.commitAngle();
    editor.setAngle(20);
    editor.commitAngle();
    editor.setAngle(0);
    editor.commitAngle();
    expect(editor.crop).toEqual({ x: 0, y: 0, width: 1000, height: 500 });

    editor.setAngle(15);
    editor.commitAngle();
    const shrunk = { ...editor.crop };
    editor.setPreset('free'); // andere Aktion: aktueller Rahmen wird Basis
    editor.setAngle(0);
    expect(editor.crop).toEqual(shrunk);
  });
});
