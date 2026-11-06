import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import {
  DEFAULT_BACKGROUND,
  DEFAULT_QUALITY,
  ExportError,
  defaultOutputFormat,
  detectEncodable,
  downloadBlob,
  encodeCanvas,
  formatInfo,
  outputFileName,
  outputSize,
  renderCrop,
  type OutputFormat,
} from '@/lib/exportImage';
import { useEditorStore } from './editor';

export interface ExportResult {
  fileName: string;
  bytes: number;
}

/**
 * Einstellungen und Ablauf des Exports. Liest Bild, Transformation und Rahmen aus dem
 * Editor-Store; Social-Media-Presets setzen ihre Zielgröße als Vorschlag.
 */
export const useExportStore = defineStore('export', () => {
  const editor = useEditorStore();

  const encodable = ref<OutputFormat[]>(['png']);
  const format = ref<OutputFormat>('png');
  const quality = ref(DEFAULT_QUALITY);
  const resize = ref(false);
  const targetWidth = ref<number | null>(null);
  const background = ref(DEFAULT_BACKGROUND);
  const exporting = ref(false);

  const ready = detectEncodable().then((list) => {
    encodable.value = list;
    if (!list.includes(format.value)) format.value = 'png';
  });

  const info = computed(() => formatInfo(format.value));
  /** JPG kennt keine Transparenz: transparente Bereiche bekommen die Hintergrundfarbe. */
  const needsBackground = computed(() => !info.value.alpha);
  const size = computed(() => outputSize(editor.crop, resize.value ? targetWidth.value : null));

  // Neues Bild: Ausgabeformat wie die Quelle (falls kodierbar)
  watch(
    () => editor.image,
    async (image) => {
      if (!image) return;
      await ready;
      format.value = defaultOutputFormat(image.format, encodable.value);
    }
  );

  // Social-Media-Presets schlagen ihre Zielgröße vor; andere Presets heben das auf
  watch(
    () => editor.preset,
    (preset, previous) => {
      if (preset.target) {
        resize.value = true;
        targetWidth.value = preset.target.width;
      } else if (previous?.target) {
        resize.value = false;
      }
    }
  );

  function setResize(on: boolean) {
    resize.value = on;
    if (on && !targetWidth.value) targetWidth.value = editor.crop.width;
  }

  /** Zielhöhe setzen: die Breite folgt dem Seitenverhältnis des Rahmens. */
  function setTargetHeight(height: number) {
    const { width, height: cropHeight } = editor.crop;
    if (!cropHeight || !Number.isFinite(height) || height <= 0) return;
    targetWidth.value = Math.max(1, Math.round((height * width) / cropHeight));
  }

  function setTargetWidth(width: number) {
    if (!Number.isFinite(width) || width <= 0) return;
    targetWidth.value = Math.round(width);
  }

  /** Rendert, kodiert und lädt herunter. Wirft ExportError bei Problemen. */
  async function exportImage(suffix: string): Promise<ExportResult> {
    const image = editor.image;
    if (!image) throw new ExportError('encodeFailed');
    exporting.value = true;
    try {
      // Dem Browser Zeit geben, den Ladezustand zu zeichnen, bevor gerechnet wird
      await new Promise((resolve) => setTimeout(resolve, 0));
      const canvas = renderCrop({
        source: image.bitmap,
        transform: editor.transform,
        crop: editor.crop,
        size: size.value,
        background: needsBackground.value ? background.value : null,
      });
      const blob = await encodeCanvas(canvas, format.value, quality.value);
      canvas.width = 0; // Speicher sofort freigeben
      const fileName = outputFileName(image.name, suffix, format.value);
      downloadBlob(blob, fileName);
      return { fileName, bytes: blob.size };
    } finally {
      exporting.value = false;
    }
  }

  return {
    encodable,
    format,
    quality,
    resize,
    targetWidth,
    background,
    exporting,
    info,
    needsBackground,
    size,
    ready,
    setResize,
    setTargetWidth,
    setTargetHeight,
    exportImage,
  };
});
