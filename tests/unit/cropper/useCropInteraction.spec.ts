import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { keyboardStep, useCropInteraction } from '@/composables/cropper/useCropInteraction';
import type { Rect } from '@/lib/geometry';

function setup(ratio: number | null = null) {
  const crop = ref<Rect>({ x: 100, y: 100, width: 200, height: 100 });
  const surface = document.createElement('div');
  surface.getBoundingClientRect = () => ({ left: 10, top: 20 }) as DOMRect;
  const onChange = vi.fn((rect: Rect) => (crop.value = rect));
  const api = useCropInteraction({
    crop,
    bounds: ref({ width: 1000, height: 500 }),
    ratio: ref(ratio),
    scale: ref(0.5), // 1 Anzeigepixel = 2 Bildpixel
    surface: ref(surface),
    onChange,
  });
  return { crop, onChange, ...api };
}

const pointer = (_type: string, clientX: number, clientY: number, extra = {}) =>
  ({
    clientX,
    clientY,
    pointerId: 1,
    button: 0,
    currentTarget: null,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...extra,
  }) as unknown as PointerEvent;

const key = (k: string, mods: Partial<KeyboardEvent> = {}) =>
  ({ key: k, preventDefault: vi.fn(), ...mods }) as unknown as KeyboardEvent;

describe('useCropInteraction', () => {
  it('verschiebt per Zeiger in Bildpixeln', () => {
    const { crop, onPointerDown, onPointerMove, onPointerUp, dragging } = setup();
    onPointerDown(pointer('pointerdown', 50, 50), 'move');
    expect(dragging.value).toBe('move');
    onPointerMove(pointer('pointermove', 60, 45));
    expect(crop.value).toMatchObject({ x: 120, y: 90 });
    onPointerUp(pointer('pointerup', 60, 45));
    expect(dragging.value).toBeNull();
  });

  it('zieht einen Griff', () => {
    const { crop, onPointerDown, onPointerMove } = setup();
    onPointerDown(pointer('pointerdown', 0, 0), 'se');
    onPointerMove(pointer('pointermove', 25, 10));
    expect(crop.value).toEqual({ x: 100, y: 100, width: 250, height: 120 });
  });

  it('zieht einen neuen Rahmen auf, aber erst ab Mindestgröße', () => {
    const { crop, onChange, onPointerDown, onPointerMove } = setup();
    // Start bei Anzeige (10+50, 20+25) → Bild (100, 50)
    onPointerDown(pointer('pointerdown', 60, 45), 'create');
    onPointerMove(pointer('pointermove', 62, 46));
    expect(onChange).not.toHaveBeenCalled();
    // Ende bei Anzeige (210, 95) → Bild (400, 150)
    onPointerMove(pointer('pointermove', 210, 95));
    expect(crop.value).toEqual({ x: 100, y: 50, width: 300, height: 100 });
  });

  it('ignoriert andere Maustasten und fremde Zeiger', () => {
    const { onChange, onPointerDown, onPointerMove } = setup();
    onPointerDown(pointer('pointerdown', 0, 0, { button: 2 }), 'move');
    onPointerMove(pointer('pointermove', 50, 50));
    onPointerDown(pointer('pointerdown', 0, 0), 'move');
    onPointerMove(pointer('pointermove', 50, 50, { pointerId: 2 }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Pfeiltasten verschieben um 1 % der längeren Kante, Umschalt ändert die Größe', () => {
    const { crop, onKeyDown } = setup();
    expect(keyboardStep({ width: 1000, height: 500 }, false)).toBe(10);
    expect(onKeyDown(key('ArrowRight'))).toBe(true);
    expect(crop.value).toMatchObject({ x: 110, width: 200 });
    onKeyDown(key('ArrowDown', { shiftKey: true }));
    expect(crop.value).toMatchObject({ y: 100, height: 110 });
    onKeyDown(key('ArrowLeft', { altKey: true }));
    expect(crop.value.x).toBe(109);
    expect(onKeyDown(key('Enter'))).toBe(false);
  });

  it('hält beim Vergrößern per Tastatur das Verhältnis', () => {
    const { crop, onKeyDown } = setup(2);
    onKeyDown(key('ArrowRight', { shiftKey: true }));
    expect(crop.value.width / crop.value.height).toBeCloseTo(2, 1);
  });
});
