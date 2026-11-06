import { describe, expect, it } from 'vitest';
import { useHistory } from '@/composables/useHistory';

describe('useHistory', () => {
  const make = (limit?: number) => useHistory<number>((a, b) => a === b, limit);

  it('legt nur geänderte Zustände ab und geht zurück und vor', () => {
    const h = make();
    h.reset(0);
    expect(h.commit(0)).toBe(false);
    expect(h.commit(1)).toBe(true);
    h.commit(2);
    expect(h.canUndo.value).toBe(true);
    expect(h.undo()).toBe(1);
    expect(h.undo()).toBe(0);
    expect(h.undo()).toBeNull();
    expect(h.redo()).toBe(1);
    expect(h.canRedo.value).toBe(true);
  });

  it('verwirft Wiederholen nach einer neuen Änderung', () => {
    const h = make();
    h.reset(0);
    h.commit(1);
    h.undo();
    h.commit(5);
    expect(h.canRedo.value).toBe(false);
    expect(h.undo()).toBe(0);
  });

  it('begrenzt die Länge und startet mit reset neu', () => {
    const h = make(2);
    h.reset(0);
    [1, 2, 3].forEach((n) => h.commit(n));
    expect(h.undo()).toBe(2);
    expect(h.undo()).toBe(1);
    expect(h.undo()).toBeNull();
    h.reset(9);
    expect(h.canUndo.value).toBe(false);
    expect(h.canRedo.value).toBe(false);
  });

  it('schreibt ohne reset beim ersten commit nur den Ausgangspunkt', () => {
    const h = make();
    expect(h.commit(3)).toBe(false);
    expect(h.canUndo.value).toBe(false);
  });
});
