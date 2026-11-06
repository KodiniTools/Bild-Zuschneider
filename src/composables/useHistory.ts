import { computed, shallowRef } from 'vue';

/**
 * Verlauf für Rückgängig/Wiederholen über unveränderliche Schnappschüsse.
 *
 * `present` ist der zuletzt festgeschriebene Zustand. `commit(snapshot)` legt ihn ab,
 * wenn er sich geändert hat (laufende Zieh-Vorgänge schreiben erst am Ende fest).
 * `undo`/`redo` liefern den Zustand, den der Aufrufer anwenden soll.
 */
export function useHistory<T>(equals: (a: T, b: T) => boolean, limit = 50) {
  const past = shallowRef<T[]>([]);
  const future = shallowRef<T[]>([]);
  let present: T | null = null;

  /** Neuer Ausgangspunkt ohne Verlauf (z. B. neues Bild). */
  function reset(snapshot: T) {
    past.value = [];
    future.value = [];
    present = snapshot;
  }

  /** Schreibt einen Zustand fest; true, wenn ein Verlaufsschritt entstanden ist. */
  function commit(snapshot: T): boolean {
    if (present === null) {
      present = snapshot;
      return false;
    }
    if (equals(present, snapshot)) return false;
    past.value = [...past.value, present].slice(-limit);
    future.value = [];
    present = snapshot;
    return true;
  }

  function undo(): T | null {
    const previous = past.value.at(-1);
    if (previous === undefined || present === null) return null;
    past.value = past.value.slice(0, -1);
    future.value = [present, ...future.value];
    present = previous;
    return previous;
  }

  function redo(): T | null {
    const [next, ...rest] = future.value;
    if (next === undefined || present === null) return null;
    future.value = rest;
    past.value = [...past.value, present];
    present = next;
    return next;
  }

  return {
    canUndo: computed(() => past.value.length > 0),
    canRedo: computed(() => future.value.length > 0),
    reset,
    commit,
    undo,
    redo,
  };
}
