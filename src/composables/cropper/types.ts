import type { Handle } from '@/lib/geometry';

/** Was eine Zeigeraktion am Rahmen macht: verschieben, Griff ziehen, neu aufziehen. */
export type DragMode = 'move' | 'create' | Handle;
