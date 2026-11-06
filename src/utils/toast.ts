import type { ToastType } from '@/components/ui/types';

/** Eingabe für einen Toast (ToastContainer.addToast). */
export interface ToastInput {
  type?: ToastType;
  message: string;
  title?: string | null;
  duration?: number;
}

/** Globale Kurzform, die ToastContainer beim Mounten setzt. */
export type ToastFn = (message: string, title?: string | null, duration?: number) => void;

declare global {
  interface Window {
    $toast?: Record<ToastType, ToastFn>;
  }
}

/**
 * Text eines Toasts: UiToast zeigt eine Zeile, ein Titel wird deshalb
 * vorangestellt („Titel: Text“).
 */
export function toastText(message: string, title?: string | null): string {
  return title ? `${title}: ${message}` : message;
}
