import type de from './de';

/** English texts. Same keys and placeholders as de.ts (i18nParity test). */
const en: typeof de = {
  common: {
    cancel: 'Cancel',
    close: 'Close',
    reset: 'Reset',
    increase: 'Increase',
    decrease: 'Decrease',
    undo: 'Undo',
    redo: 'Redo',
  },
  color: {
    pick: 'Pick color',
    hue: 'Hue',
    saturation: 'Saturation',
    lightness: 'Lightness',
    hex: 'Hex value',
    invalidHex: 'Invalid hex value (e.g. #ff8800)',
  },
};

export default en;
