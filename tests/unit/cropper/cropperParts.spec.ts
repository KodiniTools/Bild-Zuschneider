import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { i18n } from '@/i18n';
import AspectPanel from '@/components/cropper/AspectPanel.vue';
import CropOverlay from '@/components/cropper/CropOverlay.vue';
import CropSizePanel from '@/components/cropper/CropSizePanel.vue';
import ImageDropzone from '@/components/cropper/ImageDropzone.vue';
import LoadErrorCallout from '@/components/cropper/LoadErrorCallout.vue';
import { useEditorStore } from '@/stores/editor';

const global = { plugins: [i18n] };

function editorWithImage(width = 1000, height = 500) {
  const editor = useEditorStore();
  editor.image = {
    bitmap: { width, height, close: vi.fn() } as unknown as ImageBitmap,
    name: 'bild.png',
    format: 'png',
    fileSize: 1,
    width,
    height,
  };
  editor.resetCrop();
  return editor;
}

beforeEach(() => {
  setActivePinia(createPinia());
  i18n.global.locale.value = 'de';
});

describe('AspectPanel', () => {
  it('markiert das aktive Grundformat und wechselt per Klick', async () => {
    const editor = editorWithImage();
    const wrapper = mount(AspectPanel, { global });
    expect(wrapper.get('[data-preset="free"]').attributes('aria-pressed')).toBe('true');
    await wrapper.get('[data-preset="1:1"]').trigger('click');
    expect(editor.presetId).toBe('1:1');
    expect(wrapper.get('[data-preset="1:1"]').attributes('aria-pressed')).toBe('true');
    expect(editor.crop.width).toBe(editor.crop.height);
  });

  it('wählt Social-Media-Formate im Select, „keins“ setzt frei', async () => {
    const editor = editorWithImage();
    const wrapper = mount(AspectPanel, { global });
    await wrapper.get('select').setValue('youtube-thumbnail');
    expect(editor.presetId).toBe('youtube-thumbnail');
    await wrapper.get('select').setValue('');
    expect(editor.presetId).toBe('free');
  });

  it('sperrt Hoch/Quer für Formate mit fester Ausrichtung', async () => {
    const editor = editorWithImage();
    editor.setPreset('16:9');
    const wrapper = mount(AspectPanel, { global });
    const portrait = wrapper.get('[role="radio"][data-value="portrait"]');
    expect(portrait.attributes('disabled')).toBeUndefined();
    await portrait.trigger('click');
    expect(editor.orientation).toBe('portrait');
    editor.setPreset('1:1');
    await nextTick();
    expect(portrait.attributes('disabled')).toBeDefined();
  });
});

describe('CropSizePanel', () => {
  it('zeigt die Werte des Rahmens und übernimmt Eingaben bei Enter', async () => {
    const editor = editorWithImage();
    const wrapper = mount(CropSizePanel, { global });
    const width = wrapper.get('input[data-field="width"]');
    expect((width.element as HTMLInputElement).value).toBe('1000');
    (width.element as HTMLInputElement).value = '640';
    await width.trigger('input');
    expect(editor.crop.width).toBe(1000); // Tippen allein übernimmt nichts
    await width.trigger('keydown', { key: 'Enter' });
    expect(editor.crop.width).toBe(640);
    expect(wrapper.text()).toContain('Verhältnis 32:25');
    expect(wrapper.text()).toContain('Original 1000 × 500 px');
  });

  it('stellt ungültige Eingaben wieder her', async () => {
    const editor = editorWithImage();
    const wrapper = mount(CropSizePanel, { global });
    const x = wrapper.get('input[data-field="x"]');
    await x.setValue('abc');
    await x.trigger('change');
    expect((x.element as HTMLInputElement).value).toBe('0');
    expect(editor.crop.x).toBe(0);
  });

  it('schaltet das Raster und setzt den Rahmen zurück', async () => {
    const editor = editorWithImage();
    editor.setCrop({ x: 10, y: 10, width: 100, height: 100 });
    const wrapper = mount(CropSizePanel, { global });
    await wrapper.get('[role="switch"]').trigger('click');
    expect(editor.showGrid).toBe(false);
    await wrapper.get('button.ui-button').trigger('click');
    expect(editor.crop).toEqual({ x: 0, y: 0, width: 1000, height: 500 });
  });
});

describe('CropOverlay', () => {
  const props = {
    crop: { x: 100, y: 50, width: 200, height: 100 },
    bounds: { width: 1000, height: 500 },
    ratio: null,
    scale: 0.5,
    showGrid: true,
  };

  it('positioniert den Rahmen in Anzeigepixeln mit acht Griffen und Raster', () => {
    const wrapper = mount(CropOverlay, { props, global });
    const frame = wrapper.get('[data-testid="crop-frame"]');
    expect(frame.attributes('style')).toContain('left: 50px');
    expect(frame.attributes('style')).toContain('width: 100px');
    expect(wrapper.findAll('[data-handle]')).toHaveLength(8);
    expect(wrapper.findAll('.crop-overlay__line')).toHaveLength(4);
    expect(frame.attributes('aria-label')).toBe('Zuschnittrahmen: 200 × 100 px');
    expect(wrapper.text()).toContain('200 × 100');
  });

  it('meldet Tastatur-Änderungen als change', async () => {
    const wrapper = mount(CropOverlay, { props: { ...props, showGrid: false }, global });
    expect(wrapper.find('.crop-overlay__grid').exists()).toBe(false);
    await wrapper.get('[data-testid="crop-frame"]').trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.emitted('change')![0]![0]).toMatchObject({ x: 110, y: 50 });
  });
});

describe('ImageDropzone / LoadErrorCallout', () => {
  it('meldet abgelegte Dateien und hebt die Fläche beim Ziehen hervor', async () => {
    const wrapper = mount(ImageDropzone, { props: { loading: false }, global });
    const file = new File([''], 'a.png', { type: 'image/png' });
    await wrapper.trigger('dragenter');
    expect(wrapper.classes()).toContain('image-dropzone--over');
    await wrapper.trigger('drop', { dataTransfer: { files: [file] } });
    expect(wrapper.emitted('file')![0]![0]).toBe(file);
    expect(wrapper.classes()).not.toContain('image-dropzone--over');
  });

  it('zeigt beim Laden einen Spinner und sperrt die Auswahl', () => {
    const wrapper = mount(ImageDropzone, { props: { loading: true }, global });
    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Bild wird geladen');
  });

  it('verweist bei HEIC auf den Bildkonverter, sonst nicht', () => {
    const heic = mount(LoadErrorCallout, { props: { code: 'heic' }, global });
    expect(heic.get('a').attributes('href')).toBe('/bildkonverter/');
    const large = mount(LoadErrorCallout, { props: { code: 'fileTooLarge' }, global });
    expect(large.find('a').exists()).toBe(false);
    expect(large.text()).toContain('größer als 100 MB');
  });
});
