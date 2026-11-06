import type de from './de';

/** English texts. Same keys and placeholders as de.ts (i18nParity test). */
const en: typeof de = {
  app: {
    name: 'Image Cropper',
    tagline: 'Crop, rotate and flip images right in your browser – locally, without uploading.',
  },
  nav: {
    label: 'Image Cropper sections',
    home: 'Crop',
    guide: 'Guide',
    faq: 'FAQ',
    about: 'About',
  },
  pages: {
    home: { title: 'Image Cropper' },
    guide: { title: 'Guide' },
    faq: { title: 'Frequently Asked Questions' },
    about: { title: 'About Image Cropper' },
    notFound: {
      title: '404',
      text: 'This page does not exist.',
      back: 'Go to Image Cropper',
    },
  },
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
