import { defineStore } from 'pinia';
import { computed, markRaw, ref, shallowRef } from 'vue';
import { DEFAULT_PRESET_ID, findPreset, presetRatio, type Orientation } from '@/lib/aspectPresets';
import {
  MIN_CROP_SIZE,
  applyRatio,
  centeredRect,
  roundRect,
  type Rect,
  type Size,
} from '@/lib/geometry';
import { LoadError, loadImageFile, type LoadErrorCode, type LoadedImage } from '@/lib/loadImage';
import { logger } from '@/utils/logger';

/** Felder des Zuschnitts, die die Pixel-Eingaben setzen. */
export type CropField = keyof Rect;

/** Anteil des Bildes, den ein neuer Rahmen mit festem Verhältnis abdeckt. */
const RATIO_COVERAGE = 0.9;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Zustand des Werkzeugs (Muster: Bildkonverter, Pinia-Setup-Store).
 *
 * Einzige Wahrheit ist der Zuschnitt in **Bildpixeln**; Stage und Overlay rechnen
 * nur für die Anzeige um. Das ImageBitmap liegt als markRaw in einer shallowRef,
 * damit Vue es nicht reaktiv verpackt.
 */
export const useEditorStore = defineStore('editor', () => {
  const image = shallowRef<LoadedImage | null>(null);
  const crop = ref<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  const presetId = ref(DEFAULT_PRESET_ID);
  const orientation = ref<Orientation>('landscape');
  const showGrid = ref(true);
  const loading = ref(false);
  const error = ref<LoadErrorCode | null>(null);

  const imageSize = computed<Size>(() =>
    image.value ? { width: image.value.width, height: image.value.height } : { width: 0, height: 0 }
  );
  const preset = computed(() => findPreset(presetId.value));
  /** Wirksames Seitenverhältnis (Breite/Höhe) oder null für frei. */
  const ratio = computed(() =>
    image.value ? presetRatio(preset.value, orientation.value, imageSize.value) : null
  );
  const hasImage = computed(() => image.value !== null);

  /** Rahmen neu setzen: frei = ganzes Bild, sonst zentriert im Seitenverhältnis. */
  function resetCrop() {
    if (!image.value) return;
    crop.value = ratio.value
      ? centeredRect(imageSize.value, ratio.value, RATIO_COVERAGE)
      : centeredRect(imageSize.value, null);
  }

  /** Lädt eine Datei. Bei Fehlern bleibt ein vorher geladenes Bild erhalten. */
  async function loadFile(file: File): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const loaded = await loadImageFile(file);
      image.value?.bitmap.close();
      image.value = markRaw(loaded);
      resetCrop();
      return true;
    } catch (cause) {
      error.value = cause instanceof LoadError ? cause.code : 'decodeFailed';
      if (!(cause instanceof LoadError)) logger.error('Bild laden fehlgeschlagen:', cause);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** Übernimmt einen Rahmen aus Overlay/Interaktion (gerundet, im Bild). */
  function setCrop(rect: Rect) {
    crop.value = roundRect(rect, imageSize.value);
  }

  function setPreset(id: string) {
    presetId.value = findPreset(id).id;
    applyCurrentRatio();
  }

  function setOrientation(next: Orientation) {
    orientation.value = next;
    applyCurrentRatio();
  }

  function applyCurrentRatio() {
    if (!image.value || !ratio.value) return;
    crop.value = applyRatio(crop.value, ratio.value, imageSize.value);
  }

  /**
   * Setzt ein Feld aus den Pixel-Eingaben. Mit festem Verhältnis zieht Breite die
   * Höhe mit (und umgekehrt); alles bleibt im Bild, die Position weicht notfalls aus.
   */
  function setCropField(field: CropField, value: number) {
    if (!image.value || !Number.isFinite(value)) return;
    const bounds = imageSize.value;
    const next = { ...crop.value, [field]: Math.round(value) };
    const r = ratio.value;
    if (field === 'width' || field === 'height') {
      let width = Math.max(next.width, MIN_CROP_SIZE);
      let height = Math.max(next.height, MIN_CROP_SIZE);
      if (r && field === 'width') height = width / r;
      if (r && field === 'height') width = height * r;
      // In das Bild verkleinern; bei festem Verhältnis proportional
      const scale = Math.min(1, bounds.width / width, bounds.height / height);
      next.width = r ? width * scale : Math.min(width, bounds.width);
      next.height = r ? height * scale : Math.min(height, bounds.height);
    }
    next.x = clamp(next.x, 0, bounds.width - next.width);
    next.y = clamp(next.y, 0, bounds.height - next.height);
    crop.value = roundRect(next, bounds);
  }

  function toggleGrid() {
    showGrid.value = !showGrid.value;
  }

  /** Bild entfernen und Speicher freigeben. Preset und Raster bleiben. */
  function clear() {
    image.value?.bitmap.close();
    image.value = null;
    crop.value = { x: 0, y: 0, width: 0, height: 0 };
    error.value = null;
  }

  return {
    image,
    crop,
    presetId,
    orientation,
    showGrid,
    loading,
    error,
    imageSize,
    preset,
    ratio,
    hasImage,
    loadFile,
    resetCrop,
    setCrop,
    setPreset,
    setOrientation,
    setCropField,
    toggleGrid,
    clear,
  };
});
