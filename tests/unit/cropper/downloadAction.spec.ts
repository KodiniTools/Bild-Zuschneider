import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { i18n } from '@/i18n';
import CropSidebar from '@/components/cropper/CropSidebar.vue';
import DownloadAction from '@/components/cropper/DownloadAction.vue';
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
  await flushPromises();
  return { editor, exp };
}

beforeEach(() => {
  i18n.global.locale.value = 'de';
  window.$toast = toast;
  vi.clearAllMocks();
});

describe('DownloadAction', () => {
  it('zeigt die Ausgabe und markiert Vergrößerung', async () => {
    const { exp } = await setup();
    const wrapper = mount(DownloadAction, { global });
    expect(wrapper.get('[data-testid="export-summary"]').text()).toBe(
      'Ausgabe: 1600 × 900 px · PNG'
    );
    exp.setResize(true);
    exp.setTargetWidth(3200);
    await flushPromises();
    expect(wrapper.text()).toContain('vergrößert');
  });

  it('meldet Erfolg mit Dateiname und Größe', async () => {
    const { exp } = await setup();
    const wrapper = mount(DownloadAction, { global });
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
    const { exp } = await setup();
    const wrapper = mount(DownloadAction, { global });
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

describe('CropSidebar', () => {
  it('trennt Scrollbereich (Panels) und Fuß mit der einen Primäraktion', async () => {
    await setup();
    const wrapper = mount(CropSidebar, { global });
    expect(wrapper.get('aside').attributes('aria-label')).toBe('Einstellungen');
    const scroll = wrapper.get('[data-testid="sidebar-scroll"]');
    expect(scroll.findAll('.crop-sidebar__panel')).toHaveLength(4);
    expect(scroll.find('.ui-button--primary').exists()).toBe(false);
    expect(wrapper.findAll('.ui-button--primary')).toHaveLength(1);
    expect(wrapper.get('.crop-sidebar__footer .ui-button--primary').text()).toContain(
      'Herunterladen'
    );
  });
});
