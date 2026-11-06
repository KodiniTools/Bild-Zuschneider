import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { i18n } from '@/i18n';
import StageToolbar from '@/components/cropper/StageToolbar.vue';
import TransformPanel from '@/components/cropper/TransformPanel.vue';
import CropOverlay from '@/components/cropper/CropOverlay.vue';
import { useEditorStore } from '@/stores/editor';

const global = { plugins: [i18n] };

function editorWithImage() {
  const editor = useEditorStore();
  editor.image = {
    bitmap: { width: 1000, height: 500, close: vi.fn() } as unknown as ImageBitmap,
    name: 'urlaub.jpg',
    format: 'jpeg',
    fileSize: 1,
    width: 1000,
    height: 500,
  };
  editor.resetCrop();
  return editor;
}

beforeEach(() => {
  setActivePinia(createPinia());
  i18n.global.locale.value = 'de';
});

describe('TransformPanel', () => {
  it('dreht und spiegelt über beschriftete Schaltflächen', async () => {
    const editor = editorWithImage();
    const wrapper = mount(TransformPanel, { global });
    await wrapper.get('[data-action="rotateRight"]').trigger('click');
    expect(editor.transform.quarter).toBe(1);
    await wrapper.get('[data-action="rotateLeft"]').trigger('click');
    expect(editor.transform.quarter).toBe(0);
    await wrapper.get('[data-action="flipHorizontal"]').trigger('click');
    expect(editor.transform.flipH).toBe(true);
    await wrapper.get('[data-action="flipVertical"]').trigger('click');
    expect(editor.transform.flipV).toBe(true);
    expect(wrapper.get('[data-action="flipVertical"]').attributes('aria-label')).toBe(
      'Senkrecht spiegeln'
    );
  });

  it('begradigt per Regler und schreibt beim Loslassen fest', async () => {
    const editor = editorWithImage();
    const wrapper = mount(TransformPanel, { global });
    const range = wrapper.get('input[type="range"]');
    await range.setValue('12.5');
    expect(editor.transform.angle).toBe(12.5);
    await range.trigger('change');
    expect(editor.canUndo).toBe(true);
  });

  it('setzt zurück und ist ohne Transformation gesperrt', async () => {
    const editor = editorWithImage();
    const wrapper = mount(TransformPanel, { global });
    const reset = () => wrapper.findAll('button').find((b) => b.text() === 'Drehen zurücksetzen')!;
    expect(reset().attributes('disabled')).toBeDefined();
    editor.rotate('right');
    await wrapper.vm.$nextTick();
    await reset().trigger('click');
    expect(editor.transform.quarter).toBe(0);
  });
});

describe('StageToolbar', () => {
  it('zeigt den Dateinamen und schaltet Rückgängig/Wiederholen frei', async () => {
    const editor = editorWithImage();
    const wrapper = mount(StageToolbar, { global });
    expect(wrapper.text()).toContain('urlaub.jpg');
    const undo = wrapper.get('[data-action="undo"]');
    const redo = wrapper.get('[data-action="redo"]');
    expect(undo.attributes('disabled')).toBeDefined();
    editor.rotate('right');
    await wrapper.vm.$nextTick();
    expect(undo.attributes('disabled')).toBeUndefined();
    expect(undo.attributes('title')).toBe('Rückgängig (Strg+Z)');
    await undo.trigger('click');
    expect(editor.transform.quarter).toBe(0);
    expect(redo.attributes('disabled')).toBeUndefined();
  });
});

describe('CropOverlay', () => {
  it('meldet commit nach Tastatur-Änderungen', async () => {
    const wrapper = mount(CropOverlay, {
      props: {
        crop: { x: 100, y: 50, width: 200, height: 100 },
        bounds: { width: 1000, height: 500 },
        ratio: null,
        scale: 0.5,
        showGrid: false,
      },
      global,
    });
    await wrapper.get('[data-testid="crop-frame"]').trigger('keydown', { key: 'ArrowLeft' });
    expect(wrapper.emitted('change')).toHaveLength(1);
    expect(wrapper.emitted('commit')).toHaveLength(1);
  });
});
