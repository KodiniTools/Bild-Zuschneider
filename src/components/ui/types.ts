/** Gemeinsame Typen der UI-Komponenten (src/components/ui). */

import type { StyleValue } from 'vue';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

export type IconButtonVariant = 'ghost' | 'secondary' | 'primary';
export type ControlSize = 'sm' | 'md';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type CalloutType = 'info' | 'success' | 'warning' | 'danger';

export type TextFieldType = 'text' | 'search' | 'email' | 'url' | 'password';

export interface SegmentedOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Option von UiSelect. Abweichung von der Vorlage (Bildkonverter): `group`
 * fasst aufeinanderfolgende Optionen in eine <optgroup>, `style` gilt für die
 * einzelne <option> (Schriftvorschau in den Schriftauswahlen).
 */
export interface SelectOption extends SegmentedOption {
  group?: string;
  style?: StyleValue;
}
