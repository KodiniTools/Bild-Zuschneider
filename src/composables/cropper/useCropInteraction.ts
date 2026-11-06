import { ref, type Ref } from 'vue';
import {
  isUsableRect,
  moveRect,
  rectFromPoints,
  resizeRect,
  type Handle,
  type Rect,
  type Size,
} from '@/lib/geometry';
import type { DragMode } from './types';

export interface CropInteractionOptions {
  /** Aktueller Rahmen in Bildpixeln */
  crop: Ref<Rect>;
  bounds: Ref<Size>;
  ratio: Ref<number | null>;
  /** Anzeigepixel je Bildpixel */
  scale: Ref<number>;
  /** Fläche, auf die sich Zeigerkoordinaten beziehen (Overlay = Bildfläche) */
  surface: Ref<HTMLElement | null>;
  onChange: (rect: Rect) => void;
}

interface DragState {
  mode: DragMode;
  pointerId: number;
  startX: number;
  startY: number;
  startRect: Rect;
  /** Startpunkt in Bildpixeln (nur beim Aufziehen) */
  origin: { x: number; y: number };
}

/** Schrittweite der Tastatur: 1 % der längeren Bildkante, mindestens 1 px. */
export function keyboardStep(bounds: Size, large: boolean): number {
  const step = Math.max(1, Math.round(Math.max(bounds.width, bounds.height) / 100));
  return large ? step * 10 : step;
}

/**
 * Zeiger- und Tastaturbedienung des Zuschnittrahmens (Muster: Bildkonverter
 * `useCrop.js`, hier ohne DOM-Zeichnung). Rechnet Anzeige- in Bildpixel um und
 * überlässt die Geometrie `src/lib/geometry.ts`.
 */
export function useCropInteraction(options: CropInteractionOptions) {
  const { crop, bounds, ratio, scale, surface, onChange } = options;
  const dragging = ref<DragMode | null>(null);
  let drag: DragState | null = null;

  function toImagePoint(event: PointerEvent) {
    const rect = surface.value?.getBoundingClientRect();
    return {
      x: Math.round((event.clientX - (rect?.left ?? 0)) / scale.value),
      y: Math.round((event.clientY - (rect?.top ?? 0)) / scale.value),
    };
  }

  function rectFor(event: PointerEvent): Rect {
    if (!drag) return crop.value;
    const dx = (event.clientX - drag.startX) / scale.value;
    const dy = (event.clientY - drag.startY) / scale.value;
    if (drag.mode === 'move') return moveRect(drag.startRect, dx, dy, bounds.value);
    if (drag.mode === 'create') {
      return rectFromPoints(drag.origin, toImagePoint(event), bounds.value, ratio.value);
    }
    return resizeRect(drag.startRect, drag.mode, dx, dy, bounds.value, ratio.value);
  }

  function onPointerDown(event: PointerEvent, mode: DragMode) {
    if (event.button !== 0 || drag) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement | null;
    target?.setPointerCapture?.(event.pointerId);
    drag = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRect: { ...crop.value },
      origin: mode === 'create' ? toImagePoint(event) : { x: 0, y: 0 },
    };
    dragging.value = mode;
  }

  function onPointerMove(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const next = rectFor(event);
    // Beim Aufziehen erst übernehmen, wenn der Rahmen brauchbar groß ist
    if (drag.mode !== 'create' || isUsableRect(next)) onChange(next);
  }

  function onPointerUp(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    (event.currentTarget as HTMLElement | null)?.releasePointerCapture?.(event.pointerId);
    drag = null;
    dragging.value = null;
  }

  /**
   * Pfeiltasten verschieben, mit Umschalt ändern sie die Größe (rechte/untere Kante).
   * Alt verkleinert den Schritt auf 1 px, Strg/Cmd vergrößert ihn auf 10 %.
   */
  function onKeyDown(event: KeyboardEvent): boolean {
    const dir = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!dir) return false;
    event.preventDefault();
    const step = event.altKey ? 1 : keyboardStep(bounds.value, event.ctrlKey || event.metaKey);
    const [dx, dy] = [dir[0]! * step, dir[1]! * step];
    if (event.shiftKey) {
      const handle: Handle = dx !== 0 ? 'e' : 's';
      onChange(resizeRect(crop.value, handle, dx, dy, bounds.value, ratio.value));
    } else {
      onChange(moveRect(crop.value, dx, dy, bounds.value));
    }
    return true;
  }

  return { dragging, onPointerDown, onPointerMove, onPointerUp, onKeyDown };
}
