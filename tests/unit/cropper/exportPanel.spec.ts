import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { i18n } from '@/i18n';
import ExportPanel from '@/components/cropper/ExportPanel.vue';
import { ExportError } from '@/lib/exportImage';
import { useEditorStore } from '@/stores/editor';
import { useExportStore } from '@/stores/export';

vi.mock('@/lib/exportImage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/exportImage')>()),
  detectEncodable: () => Promise.resolve(['jpeg', 'png', 'webp']),
}));

const global = { plugins: [i18n] };
const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };

async function setup() {
  setActivePinia(createPinia());
  const editor = useEditorStore();
  editor.image = {
    bitmap: { width: 1600, height: 900, close: vi.fn() } as unknown as ImageBitmap,
    name: 'foto.png',
    format: 'png',
    fileSize: 1,
    width: 1600,
    height: 900,
  };
  editor.resetCrop();
  const exp = useExportStore();
  const wrapper = mount(ExportPanel, { global });
  await flushPromises();
  return { editor, exp, wrapper };
}

beforeEach(() => {
  i18n.global.locale.value = 'de';
  window.$toast = toast;
  vi.clearAllMocks();
});

describe('ExportPanel', () => {
  it('sperrt nicht kodierbare Formate und zeigt die Ausgabe', async () => {
    const { wrapper } = await setup();
    const avif = wrapper.get('option[value="avif"]');
    expect(avif.attributes('disabled')).toBeDefined();
    expect(avif.text()).toBe('AVIF (in diesem Browser nicht verfügbar)');
    expect(wrapper.get('[data-testid="export-summary"]').text()).toBe(
      'Ausgabe: 1600 × 900 px · PNG'
    );
  });

  it('Qualität und Hintergrund nur dort, wo sie wirken', async () => {
    const { exp, wrapper } = await setup();
    expect(wrapper.find('#export-quality').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Hintergrund');
    exp.format = 'jpeg';
    await flushPromises();
    expect(wrapper.find('#export-quality').exists()).toBe(true);
    expect(wrapper.text()).toContain('Hintergrund für transparente Bereiche');
    exp.format = 'webp';
    await flushPromises();
    expect(wrapper.text()).not.toContain('Hintergrund');
  });

  it('Ausgabegröße: Höhe folgt der Breite, Vergrößerung wird angezeigt', async () => {
    const { wrapper } = await setup();
    await wrapper.get('[role="switch"]').trigger('click');
    const width = wrapper.get('input[data-field="out-width"]');
    await width.setValue('3200');
    await width.trigger('keydown', { key: 'Enter' });
    expect((wrapper.get('input[data-field="out-height"]').element as HTMLInputElement).value).toBe(
      '1800'
    );
    expect(wrapper.text()).toContain('vergrößert');
  });

  it('meldet Erfolg mit Dateiname und Größe', async () => {
    const { exp, wrapper } = await setup();
    vi.spyOn(exp, 'exportImage').mockResolvedValue({
      fileName: 'foto-zugeschnitten.png',
      bytes: 2048,
    });
    await wrapper.get('button.ui-button--primary').trigger('click');
    await flushPromises();
    expect(exp.exportImage).toHaveBeenCalledWith('-zugeschnitten');
    expect(toast.success).toHaveBeenCalledWith('foto-zugeschnitten.png gespeichert (2 KB)');
  });

  it('meldet Fehler verständlich', async () => {
    const { exp, wrapper } = await setup();
    vi.spyOn(exp, 'exportImage').mockRejectedValue(new ExportError('tooManyPixels'));
    await wrapper.get('button.ui-button--primary').trigger('click');
    await flushPromises();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('zu groß für den Browser'),
      null,
      6000
    );
  });
});
