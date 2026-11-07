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
  content: {
    home: {
      title: 'Crop images online – free and private',
      intro:
        'Image Cropper crops photos, graphics and screenshots right in your browser. Your image never leaves your device: no upload, no account and no watermark.',
      featuresTitle: 'What Image Cropper can do',
      features: {
        ratios: 'Fixed aspect ratios such as 1:1, 4:3, 16:9 and 21:9, in portrait or landscape',
        social:
          'Ready-made formats for Instagram, YouTube, LinkedIn, Facebook and X with matching output size',
        exact: 'Exact size and position in pixels, plus a rule-of-thirds grid for composition',
        rotate: 'Rotate in 90° steps, flip and straighten tilted horizons',
        formats: 'Save as JPG, PNG, WebP or AVIF with adjustable quality',
        privacy: 'Metadata such as location and camera are removed when saving',
      },
      moreTitle: 'Learn more',
      more: 'The {guide} explains every step, the {faq} answers questions about formats and privacy.',
      guideLink: 'guide',
      faqLink: 'FAQ',
    },
    guide: {
      intro:
        'Five steps from the original image to the finished crop. Everything runs locally in your browser.',
      steps: {
        load: {
          title: 'Load an image',
          text: 'Drag an image onto the drop area, choose a file or paste an image with Ctrl+V. Supported formats are JPG, PNG, WebP, AVIF, GIF, BMP, ICO and SVG.',
        },
        ratio: {
          title: 'Choose an aspect ratio',
          text: 'Choose “Free” for any crop or a fixed ratio. “Portrait” and “Landscape” switch the orientation. Social media formats also set the matching output size.',
        },
        frame: {
          title: 'Adjust the frame',
          text: 'Move the frame with your mouse or finger, drag its handles or draw a new frame on the image. Under “Size and position” you can enter exact pixel values.',
        },
        rotate: {
          title: 'Rotate and straighten',
          text: 'Rotate the image in 90° steps, flip it or straighten it with the slider. The frame always stays inside the image.',
        },
        export: {
          title: 'Save',
          text: 'Choose the file format, quality and, if needed, your own output size. “Download” saves the crop to your device.',
        },
      },
      keysTitle: 'Keyboard shortcuts',
      keysIntro: 'Click into the frame first or select it with the Tab key.',
      keys: {
        move: { keys: 'Arrow keys', action: 'Move the frame by 1 % of the image size' },
        resize: { keys: 'Shift + arrow keys', action: 'Enlarge or shrink the frame' },
        fine: { keys: 'Alt + arrow keys', action: 'Work in 1-pixel steps' },
        coarse: { keys: 'Ctrl + arrow keys', action: 'Work in 10 % steps' },
        undo: { keys: 'Ctrl + Z', action: 'Undo' },
        redo: { keys: 'Ctrl + Shift + Z', action: 'Redo' },
        paste: { keys: 'Ctrl + V', action: 'Load an image from the clipboard' },
      },
      keyColumn: 'Keys',
      actionColumn: 'Action',
    },
    faq: {
      intro: 'Answers to the most common questions about Image Cropper.',
      items: {
        upload: {
          question: 'Is my image uploaded?',
          answer:
            'No. The image is processed only in your browser and never sent to a server. Once you close the page, it is no longer in memory.',
        },
        formats: {
          question: 'Which image formats are supported?',
          answer:
            'You can load JPG, PNG, WebP, AVIF, GIF, BMP, ICO and SVG. You can save as JPG, PNG, WebP and – if your browser supports it – AVIF.',
        },
        heic: {
          question: 'Why can’t I open HEIC or TIFF images?',
          answer:
            'Browsers cannot display these formats themselves. Convert the image first, for example with the KodiniTools Image Converter, and then crop it here.',
        },
        quality: {
          question: 'Does cropping reduce image quality?',
          answer:
            'The crop is created at full resolution. With PNG it stays lossless. For JPG, WebP and AVIF you set the quality with the slider; 90 % and above is hard to tell apart from the original.',
        },
        metadata: {
          question: 'Are location and camera data kept?',
          answer:
            'No. Saving creates a new file without metadata. Location, capture time and camera model are no longer included. The orientation from the camera data is applied when loading.',
        },
        social: {
          question: 'What size do I need for Instagram, YouTube and others?',
          answer:
            'Choose the platform under “Social media format”. Image Cropper sets the matching aspect ratio and the recommended output size, such as 1080 × 1350 pixels for Instagram posts or 1280 × 720 pixels for YouTube thumbnails.',
        },
        straighten: {
          question: 'Why does the frame shrink when straightening?',
          answer:
            'A rotated image has slanted edges. To keep empty corners out of the crop, Image Cropper shrinks the frame automatically. Turn back to 0° and it returns to its previous size.',
        },
        size: {
          question: 'How large can an image be?',
          answer:
            'Files up to 100 MB and images up to about 268 megapixels. The browser sets this limit; very large images may hit the device’s memory earlier.',
        },
        gif: {
          question: 'Do animated GIFs work?',
          answer: 'Image Cropper edits single images. For animated GIFs, the first frame is used.',
        },
        mobile: {
          question: 'Can I use Image Cropper on my smartphone?',
          answer:
            'Yes. The frame and handles work with your finger, and the image is saved directly on your device.',
        },
      },
    },
    about: {
      intro:
        'Image Cropper is a free tool by KodiniTools, a collection of privacy-friendly image and audio tools.',
      privacyTitle: 'Privacy',
      privacy:
        'All processing happens in your browser. No images are uploaded, stored or analysed. Only your settings for language, colour scheme and recently used colours are saved – locally on your device.',
      techTitle: 'Technology',
      tech: 'The image is decoded with the browser’s built-in image functions and cropped at full resolution on a canvas. That is why Image Cropper works without installation and without a server.',
      moreTitle: 'More tools',
      more: 'Convert, compress and edit images with the {converter}; edit several images at once with {batch}.',
      converterLink: 'Image Converter',
      batchLink: 'Batch Image Editor',
    },
  },
  load: {
    title: 'Drop an image here',
    text: 'or choose a file – pasting with Ctrl+V works too. JPG, PNG, WebP, AVIF, GIF, BMP, ICO and SVG.',
    choose: 'Choose image',
    replace: 'Other image',
    loading: 'Loading image …',
    privacy: 'The image stays on your device. Nothing is uploaded.',
    errorTitle: 'The image could not be loaded',
    errors: {
      heic: 'Browsers cannot open HEIC/HEIF images. Convert the image first, for example in Image Converter.',
      tiff: 'Browsers cannot open TIFF images. Convert the image first, for example in Image Converter.',
      unsupported: 'This file format is not supported.',
      fileTooLarge: 'The file is larger than {max} MB.',
      tooManyPixels: 'The image is too large to edit in the browser.',
      decodeFailed: 'The file is damaged or not a valid image.',
    },
    converterLink: 'Go to Image Converter',
  },
  presets: {
    title: 'Aspect ratio',
    social: 'Social media format',
    socialNone: 'No social media format',
    orientation: 'Orientation',
    landscape: 'Landscape',
    portrait: 'Portrait',
    names: {
      free: 'Free',
      original: 'Original',
      '1:1': '1:1',
      '4:3': '4:3',
      '3:2': '3:2',
      '5:4': '5:4',
      '16:9': '16:9',
      '21:9': '21:9',
      'instagram-post': 'Instagram post (1080 × 1350)',
      'instagram-story': 'Instagram story (1080 × 1920)',
      'youtube-thumbnail': 'YouTube thumbnail (1280 × 720)',
      'linkedin-banner': 'LinkedIn banner (1584 × 396)',
      'facebook-cover': 'Facebook cover (851 × 315)',
      'x-header': 'X header (1500 × 500)',
    },
  },
  crop: {
    stageLabel: 'Image with crop frame',
    frameLabel: 'Crop frame',
    frameHint: 'Arrow keys move the frame; with Shift they change its size.',
    handles: {
      n: 'top edge',
      ne: 'top right corner',
      e: 'right edge',
      se: 'bottom right corner',
      s: 'bottom edge',
      sw: 'bottom left corner',
      w: 'left edge',
      nw: 'top left corner',
    },
    size: 'Size and position',
    x: 'X',
    y: 'Y',
    width: 'Width',
    height: 'Height',
    ratio: 'Ratio {ratio}',
    original: 'Original {width} × {height} px',
    grid: 'Show rule-of-thirds grid',
    reset: 'Reset frame',
  },
  transform: {
    title: 'Rotate and flip',
    rotateLeft: 'Rotate 90° left',
    rotateRight: 'Rotate 90° right',
    flipHorizontal: 'Flip horizontally',
    flipVertical: 'Flip vertically',
    straighten: 'Straighten',
    straightenHint: 'The frame stays inside the image and shrinks if needed.',
    reset: 'Reset rotation',
  },
  export: {
    title: 'Export',
    format: 'File format',
    unavailable: '{format} (not available in this browser)',
    quality: 'Quality',
    resize: 'Change output size',
    width: 'Width (px)',
    height: 'Height (px)',
    background: 'Background for transparent areas',
    recentColors: 'Recently used',
    summary: 'Output: {width} × {height} px · {format}',
    upscaled: 'upscaled',
    download: 'Download',
    working: 'Creating …',
    privacy: 'Metadata such as location and camera are not kept.',
    fileSuffix: '-cropped',
    done: '{name} saved ({size})',
    errors: {
      tooManyPixels: 'The output is too large for the browser. Choose a smaller output size.',
      encodeFailed: 'The image could not be created. Try another format.',
      formatUnsupported: 'This browser cannot create the selected format.',
    },
  },
  history: {
    toolbar: 'History',
    ctrl: 'Ctrl',
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
