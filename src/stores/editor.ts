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
import {
  IDENTITY,
  constrainToImage,
  fitInImage,
  flipHorizontal,
  flipVertical,
  rectFlippedH,
  rectFlippedV,
  rectRotatedLeft,
  rectRotatedRight,
  rotateLeft as turnLeft,
  rotateRight as turnRight,
  withAngle,
  workSize as transformedSize,
  type Transform,
} from '@/lib/transform';
import { useHistory } from '@/composables/useHistory';
import { logger } from '@/utils/logger';

/** Felder des Zuschnitts, die die Pixel-Eingaben setzen. */
export type CropField = keyof Rect;

/** Was Rückgängig/Wiederholen umfasst. */
interface Snapshot {
  crop: Rect;
  transform: Transform;
  presetId: string;
  orientation: Orientation;
}

const sameSnapshot = (a: Snapshot, b: Snapshot) =>
  a.presetId === b.presetId &&
  a.orientation === b.orientation &&
  (Object.keys(a.crop) as CropField[]).every((key) => a.crop[key] === b.crop[key]) &&
  (Object.keys(a.transform) as (keyof Transform)[]).every(
    (key) => a.transform[key] === b.transform[key]
  );

/** Anteil des Bildes, den ein neuer Rahmen mit festem Verhältnis abdeckt. */
const RATIO_COVERAGE = 0.9;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Zustand des Werkzeugs (Muster: Bildkonverter, Pinia-Setup-Store).
 *
 * Einzige Wahrheit ist der Zuschnitt in Pixeln der **Arbeitsfläche** (das gedrehte
 * und gespiegelte Bild, siehe src/lib/transform.ts); Stage und Overlay rechnen nur für
 * die Anzeige um. Der Rahmen liegt immer vollständig im begradigten Bild. Das
 * ImageBitmap liegt als markRaw in einer shallowRef, damit Vue es nicht reaktiv verpackt.
 *
 * Verlauf: Aktionen schreiben am Ende fest (`commit`); Zieh-Vorgänge ändern nur den
 * Rahmen (`setCrop`) und schreiben erst beim Loslassen fest.
 */
export const useEditorStore = defineStore('editor', () => {
  const image = shallowRef<LoadedImage | null>(null);
  const crop = ref<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  const presetId = ref(DEFAULT_PRESET_ID);
  const orientation = ref<Orientation>('landscape');
  const showGrid = ref(true);
  const loading = ref(false);
  const error = ref<LoadErrorCode | null>(null);
  const transform = ref<Transform>({ ...IDENTITY });
  const history = useHistory<Snapshot>(sameSnapshot);
  /**
   * Rahmen vor der ersten Begradigung. Aufeinanderfolgende Winkeländerungen passen
   * immer von ihm aus ein – zurück auf 0° hat der Rahmen wieder seine alte Größe.
   * Jede andere Aktion (und Rückgängig/Wiederholen) macht den aktuellen Rahmen zur Basis.
   */
  let angleBase: Rect | null = null;

  const imageSize = computed<Size>(() =>
    image.value ? { width: image.value.width, height: image.value.height } : { width: 0, height: 0 }
  );
  /** Arbeitsfläche: Bildgröße nach Vierteldrehungen (Grenzen des Zuschnitts). */
  const workSize = computed<Size>(() => transformedSize(imageSize.value, transform.value));
  const preset = computed(() => findPreset(presetId.value));
  /** Wirksames Seitenverhältnis (Breite/Höhe) oder null für frei. */
  const ratio = computed(() =>
    image.value ? presetRatio(preset.value, orientation.value, workSize.value) : null
  );

  const snapshot = (): Snapshot => ({
    crop: { ...crop.value },
    transform: { ...transform.value },
    presetId: presetId.value,
    orientation: orientation.value,
  });

  /** Schreibt den aktuellen Zustand in den Verlauf (Ende einer Aktion). */
  function commit() {
    angleBase = null;
    history.commit(snapshot());
  }

  /** Rahmen auf das begradigte Bild begrenzen (automatischer Zoom). */
  function fitted(rect: Rect): Rect {
    return fitInImage(rect, workSize.value, transform.value.angle);
  }
  const hasImage = computed(() => image.value !== null);

  /** Rahmen neu setzen: frei = ganzes Bild, sonst zentriert im Seitenverhältnis. */
  function resetCrop() {
    if (!image.value) return;
    crop.value = fitted(
      ratio.value
        ? centeredRect(workSize.value, ratio.value, RATIO_COVERAGE)
        : centeredRect(workSize.value, null)
    );
    commit();
  }

  /** Lädt eine Datei. Bei Fehlern bleibt ein vorher geladenes Bild erhalten. */
  async function loadFile(file: File): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const loaded = await loadImageFile(file);
      image.value?.bitmap.close();
      image.value = markRaw(loaded);
      transform.value = { ...IDENTITY };
      resetCrop();
      history.reset(snapshot());
      return true;
    } catch (cause) {
      error.value = cause instanceof LoadError ? cause.code : 'decodeFailed';
      if (!(cause instanceof LoadError)) logger.error('Bild laden fehlgeschlagen:', cause);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Übernimmt einen Rahmen aus Overlay/Interaktion (gerundet, im begradigten Bild).
   * Schreibt nicht fest – das macht der Aufrufer am Ende des Zieh-Vorgangs.
   */
  function setCrop(rect: Rect) {
    crop.value = constrainToImage(rect, crop.value, workSize.value, transform.value.angle);
  }

  function setPreset(id: string) {
    presetId.value = findPreset(id).id;
    applyCurrentRatio();
    commit();
  }

  function setOrientation(next: Orientation) {
    orientation.value = next;
    applyCurrentRatio();
    commit();
  }

  function applyCurrentRatio() {
    if (!image.value || !ratio.value) return;
    crop.value = fitted(applyRatio(crop.value, ratio.value, workSize.value));
  }

  /**
   * Setzt ein Feld aus den Pixel-Eingaben. Mit festem Verhältnis zieht Breite die
   * Höhe mit (und umgekehrt); alles bleibt im Bild, die Position weicht notfalls aus.
   */
  function setCropField(field: CropField, value: number) {
    if (!image.value || !Number.isFinite(value)) return;
    const bounds = workSize.value;
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
    crop.value = fitted(roundRect(next, bounds));
    commit();
  }

  // ── Transform ──────────────────────────────────────────────────

  /**
   * Nach einer Vierteldrehung passt ein festes Verhältnis nicht mehr (16:9 → 9:16):
   * Presets mit Hoch/Quer wechseln die Ausrichtung, feste Formate werden neu angelegt.
   */
  function afterQuarterTurn() {
    if (!ratio.value) return;
    if (preset.value.fixedOrientation) applyCurrentRatio();
    else orientation.value = orientation.value === 'landscape' ? 'portrait' : 'landscape';
  }

  function rotate(direction: 'left' | 'right') {
    if (!image.value) return;
    const before = workSize.value;
    transform.value =
      direction === 'right' ? turnRight(transform.value) : turnLeft(transform.value);
    const turned =
      direction === 'right'
        ? rectRotatedRight(crop.value, before)
        : rectRotatedLeft(crop.value, before);
    crop.value = fitted(turned);
    afterQuarterTurn();
    commit();
  }

  function flip(axis: 'horizontal' | 'vertical') {
    if (!image.value) return;
    const work = workSize.value;
    if (axis === 'horizontal') {
      transform.value = flipHorizontal(transform.value);
      crop.value = fitted(rectFlippedH(crop.value, work));
    } else {
      transform.value = flipVertical(transform.value);
      crop.value = fitted(rectFlippedV(crop.value, work));
    }
    commit();
  }

  /** Begradigen (live beim Ziehen des Reglers); `commitAngle` schreibt beim Loslassen fest. */
  function setAngle(angle: number) {
    if (!image.value) return;
    angleBase ??= { ...crop.value };
    transform.value = withAngle(transform.value, angle);
    crop.value = fitted(angleBase);
  }

  /** Schreibt eine Begradigung fest, ohne die Basis zu verwerfen. */
  function commitAngle() {
    history.commit(snapshot());
  }

  function resetTransform() {
    if (!image.value) return;
    const wasTurned = transform.value.quarter % 2 === 1;
    transform.value = { ...IDENTITY };
    if (wasTurned) afterQuarterTurn();
    resetCrop();
  }

  // ── Verlauf ────────────────────────────────────────────────────

  function restore(state: Snapshot | null) {
    if (!state) return;
    angleBase = null;
    transform.value = { ...state.transform };
    presetId.value = state.presetId;
    orientation.value = state.orientation;
    crop.value = { ...state.crop };
  }

  function undo() {
    restore(history.undo());
  }

  function redo() {
    restore(history.redo());
  }

  function toggleGrid() {
    showGrid.value = !showGrid.value;
  }

  /** Bild entfernen und Speicher freigeben. Preset und Raster bleiben. */
  function clear() {
    image.value?.bitmap.close();
    image.value = null;
    crop.value = { x: 0, y: 0, width: 0, height: 0 };
    transform.value = { ...IDENTITY };
    error.value = null;
    history.reset(snapshot());
  }

  return {
    image,
    crop,
    presetId,
    orientation,
    showGrid,
    loading,
    error,
    transform,
    imageSize,
    workSize,
    preset,
    ratio,
    hasImage,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    loadFile,
    resetCrop,
    setCrop,
    setPreset,
    setOrientation,
    setCropField,
    rotate,
    flip,
    setAngle,
    commitAngle,
    resetTransform,
    commit,
    undo,
    redo,
    toggleGrid,
    clear,
  };
});
