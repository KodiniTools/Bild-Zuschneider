import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { useEditorStore } from '@/stores/editor';
import { useExportStore } from '@/stores/export';

vi.mock('@/lib/exportImage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/exportImage')>()),
  detectEncodable: () => Promise.resolve(['jpeg', 'png', 'webp']),
}));

function setup(format = 'jpeg') {
  setActivePinia(createPinia());
  const editor = useEditorStore();
  const exp = useExportStore();
  editor.image = {
    bitmap: { width: 1600, height: 900, close: vi.fn() } as unknown as ImageBitmap,
    name: 'foto.jpg',
    format: format as 'jpeg',
    fileSize: 1,
    width: 1600,
    height: 900,
  };
  editor.resetCrop();
  return { editor, exp };
}

const flush = async () => {
  await Promise.resolve();
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('Export-Store', () => {
  beforeEach(() => vi.clearAllMocks());

  it('übernimmt das Format der Quelle, wenn kodierbar, sonst PNG', async () => {
    const { exp } = setup('jpeg');
    await flush();
    expect(exp.format).toBe('jpeg');
    expect(exp.needsBackground).toBe(true);

    const other = setup('avif');
    await flush();
    expect(other.exp.format).toBe('png');
    expect(other.exp.needsBackground).toBe(false);
    expect(other.exp.encodable).toEqual(['jpeg', 'png', 'webp']);
  });

  it('Ausgabegröße folgt dem Rahmen, optional mit Zielbreite', async () => {
    const { editor, exp } = setup();
    expect(exp.size).toEqual({ width: 1600, height: 900 });
    exp.setResize(true);
    expect(exp.targetWidth).toBe(1600);
    exp.setTargetHeight(450);
    expect(exp.size).toEqual({ width: 800, height: 450 });
    editor.setCrop({ x: 0, y: 0, width: 400, height: 400 });
    expect(exp.size).toEqual({ width: 800, height: 800 });
    exp.setResize(false);
    expect(exp.size).toEqual({ width: 400, height: 400 });
  });

  it('Social-Media-Presets setzen ihre Zielgröße, andere heben das auf', async () => {
    const { editor, exp } = setup();
    editor.setPreset('youtube-thumbnail');
    await nextTick();
    expect(exp.resize).toBe(true);
    expect(exp.size.width).toBe(1280);
    expect(exp.size.height).toBeGreaterThanOrEqual(719);
    expect(exp.size.height).toBeLessThanOrEqual(721);
    editor.setPreset('1:1');
    await nextTick();
    expect(exp.resize).toBe(false);
  });

  it('ignoriert ungültige Zielmaße', () => {
    const { exp } = setup();
    exp.setResize(true);
    exp.setTargetWidth(Number.NaN);
    exp.setTargetHeight(-5);
    expect(exp.targetWidth).toBe(1600);
  });
});
