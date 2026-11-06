import { ref } from 'vue';

/** Variante des Bestätigen-Buttons: nur `danger` färbt ihn destruktiv, sonst primär. */
export type ConfirmVariant = 'default' | 'warning' | 'danger';

export interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: ConfirmVariant;
  resolve: ((result: boolean) => void) | null;
}

// Ein Dialog für die ganze App (ConfirmDialog in App.vue), daher Modul-Zustand
const state = ref<ConfirmState>({
  visible: false,
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  variant: 'default',
  resolve: null,
});

/**
 * Bestätigung per Promise (Muster: Bildkonverter, nach TypeScript übertragen).
 * Ohne eigene Texte gelten „OK“/„Abbrechen“; Aufrufer übergeben übersetzte Texte.
 */
export function useConfirm() {
  function confirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
    return new Promise((resolve) => {
      state.value = {
        visible: true,
        title: options.title || '',
        message,
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Abbrechen',
        variant: options.variant || 'default',
        resolve,
      };
    });
  }

  function respond(result: boolean) {
    const { resolve } = state.value;
    state.value = { ...state.value, visible: false, resolve: null };
    if (resolve) resolve(result);
  }

  return { confirm, respond, state };
}
