/** Deutsche Texte. Schlüssel und Platzhalter gleich wie in en.ts (i18nParity-Test). */
export default {
  app: {
    name: 'Bild-Zuschneider',
    tagline: 'Bilder direkt im Browser zuschneiden, drehen und spiegeln – lokal, ohne Upload.',
  },
  nav: {
    label: 'Bereiche des Bild-Zuschneiders',
    home: 'Zuschneiden',
    guide: 'Anleitung',
    faq: 'FAQ',
    about: 'Über',
  },
  pages: {
    home: { title: 'Bild-Zuschneider' },
    guide: { title: 'Anleitung' },
    faq: { title: 'Häufig gestellte Fragen' },
    about: { title: 'Über den Bild-Zuschneider' },
    notFound: {
      title: '404',
      text: 'Diese Seite gibt es nicht.',
      back: 'Zum Bild-Zuschneider',
    },
  },
  content: {
    home: {
      title: 'Bilder online zuschneiden – kostenlos und privat',
      intro:
        'Der Bild-Zuschneider schneidet Fotos, Grafiken und Screenshots direkt im Browser zu. Ihr Bild verlässt dabei nie Ihr Gerät: Es gibt keinen Upload, kein Konto und kein Wasserzeichen.',
      featuresTitle: 'Was der Bild-Zuschneider kann',
      features: {
        ratios: 'Feste Seitenverhältnisse wie 1:1, 4:3, 16:9 und 21:9, im Hoch- oder Querformat',
        social:
          'Fertige Formate für Instagram, YouTube, LinkedIn, Facebook und X mit passender Zielgröße',
        exact: 'Exakte Maße und Position in Pixeln, dazu ein Drittel-Raster für die Bildaufteilung',
        rotate: 'Drehen in 90°-Schritten, Spiegeln und Begradigen schiefer Horizonte',
        formats: 'Speichern als JPG, PNG, WebP oder AVIF mit einstellbarer Qualität',
        privacy: 'Metadaten wie Standort und Kamera werden beim Speichern entfernt',
      },
      moreTitle: 'Mehr erfahren',
      more: 'Die {guide} erklärt jeden Schritt, die {faq} beantwortet Fragen zu Formaten und Datenschutz.',
      guideLink: 'Anleitung',
      faqLink: 'FAQ',
    },
    guide: {
      intro:
        'In fünf Schritten vom Originalbild zum fertigen Ausschnitt. Alles läuft lokal in Ihrem Browser.',
      steps: {
        load: {
          title: 'Bild laden',
          text: 'Ziehen Sie ein Bild auf die Ablagefläche, wählen Sie eine Datei aus oder fügen Sie ein Bild mit Strg+V ein. Unterstützt werden JPG, PNG, WebP, AVIF, GIF, BMP, ICO und SVG.',
        },
        ratio: {
          title: 'Seitenverhältnis wählen',
          text: 'Wählen Sie „Frei“ für einen beliebigen Ausschnitt oder ein festes Verhältnis. Mit „Hoch“ und „Quer“ wechseln Sie die Ausrichtung. Social-Media-Formate setzen zusätzlich die passende Ausgabegröße.',
        },
        frame: {
          title: 'Rahmen anpassen',
          text: 'Verschieben Sie den Rahmen mit der Maus oder dem Finger, ziehen Sie an den Griffen oder ziehen Sie auf dem Bild einen neuen Rahmen auf. Unter „Größe und Position“ geben Sie exakte Pixelwerte ein.',
        },
        rotate: {
          title: 'Drehen und begradigen',
          text: 'Drehen Sie das Bild in 90°-Schritten, spiegeln Sie es oder begradigen Sie es mit dem Regler. Der Rahmen bleibt dabei immer im Bild.',
        },
        export: {
          title: 'Speichern',
          text: 'Wählen Sie Dateiformat, Qualität und bei Bedarf eine eigene Ausgabegröße. „Herunterladen“ speichert den Ausschnitt auf Ihrem Gerät.',
        },
      },
      keysTitle: 'Tastenkürzel',
      keysIntro: 'Klicken Sie zuerst in den Rahmen oder wählen Sie ihn mit der Tabulatortaste aus.',
      keys: {
        move: { keys: 'Pfeiltasten', action: 'Rahmen um 1 % der Bildgröße verschieben' },
        resize: { keys: 'Umschalt + Pfeiltasten', action: 'Rahmen vergrößern oder verkleinern' },
        fine: { keys: 'Alt + Pfeiltasten', action: 'in 1-Pixel-Schritten arbeiten' },
        coarse: { keys: 'Strg + Pfeiltasten', action: 'in 10-%-Schritten arbeiten' },
        undo: { keys: 'Strg + Z', action: 'Rückgängig' },
        redo: { keys: 'Strg + Umschalt + Z', action: 'Wiederholen' },
        paste: { keys: 'Strg + V', action: 'Bild aus der Zwischenablage laden' },
      },
      keyColumn: 'Tasten',
      actionColumn: 'Wirkung',
    },
    faq: {
      intro: 'Antworten auf die häufigsten Fragen zum Bild-Zuschneider.',
      items: {
        upload: {
          question: 'Wird mein Bild hochgeladen?',
          answer:
            'Nein. Das Bild wird ausschließlich in Ihrem Browser verarbeitet und nie an einen Server gesendet. Nach dem Schließen der Seite ist es nicht mehr im Speicher.',
        },
        formats: {
          question: 'Welche Bildformate werden unterstützt?',
          answer:
            'Laden können Sie JPG, PNG, WebP, AVIF, GIF, BMP, ICO und SVG. Speichern können Sie als JPG, PNG, WebP und – sofern Ihr Browser es unterstützt – AVIF.',
        },
        heic: {
          question: 'Warum lassen sich HEIC- oder TIFF-Bilder nicht öffnen?',
          answer:
            'Browser können diese Formate nicht selbst darstellen. Wandeln Sie das Bild zuerst um, zum Beispiel mit dem Bildkonverter von KodiniTools, und schneiden Sie es danach hier zu.',
        },
        quality: {
          question: 'Verliert mein Bild beim Zuschneiden an Qualität?',
          answer:
            'Der Ausschnitt wird in voller Auflösung erstellt. Mit PNG bleibt er verlustfrei. Bei JPG, WebP und AVIF bestimmen Sie die Qualität mit dem Regler; 90 % und mehr sind kaum vom Original zu unterscheiden.',
        },
        metadata: {
          question: 'Bleiben Standort und Kameradaten erhalten?',
          answer:
            'Nein. Beim Speichern entsteht eine neue Datei ohne Metadaten. Standort, Aufnahmezeit und Kameramodell sind darin nicht mehr enthalten. Die Ausrichtung aus den Kameradaten wird beim Laden berücksichtigt.',
        },
        social: {
          question: 'Welche Größe brauche ich für Instagram, YouTube und Co.?',
          answer:
            'Wählen Sie unter „Social-Media-Format“ die Plattform. Der Bild-Zuschneider setzt das passende Seitenverhältnis und die empfohlene Ausgabegröße, etwa 1080 × 1350 Pixel für Instagram-Beiträge oder 1280 × 720 Pixel für YouTube-Thumbnails.',
        },
        straighten: {
          question: 'Warum wird der Rahmen beim Begradigen kleiner?',
          answer:
            'Ein gedrehtes Bild hat schräge Kanten. Damit der Ausschnitt keine leeren Ecken enthält, verkleinert der Bild-Zuschneider den Rahmen automatisch. Drehen Sie zurück auf 0°, erhält er seine alte Größe.',
        },
        size: {
          question: 'Wie groß darf ein Bild sein?',
          answer:
            'Dateien bis 100 MB und Bilder bis etwa 268 Megapixel. Die Grenze setzt der Browser; sehr große Bilder können je nach Gerät auch früher an den Arbeitsspeicher stoßen.',
        },
        gif: {
          question: 'Funktionieren animierte GIFs?',
          answer:
            'Der Bild-Zuschneider bearbeitet Einzelbilder. Bei animierten GIFs wird das erste Bild verwendet.',
        },
        mobile: {
          question: 'Kann ich den Bild-Zuschneider auf dem Smartphone nutzen?',
          answer:
            'Ja. Rahmen und Griffe lassen sich mit dem Finger bedienen, und das Bild wird direkt auf Ihrem Gerät gespeichert.',
        },
      },
    },
    about: {
      intro:
        'Der Bild-Zuschneider ist ein kostenloses Werkzeug von KodiniTools, einer Sammlung datenschutzfreundlicher Bild- und Audio-Werkzeuge.',
      privacyTitle: 'Datenschutz',
      privacy:
        'Alle Berechnungen laufen in Ihrem Browser. Es werden keine Bilder hochgeladen, gespeichert oder ausgewertet. Gespeichert werden nur Ihre Einstellungen für Sprache, Farbschema und zuletzt verwendete Farben – lokal auf Ihrem Gerät.',
      techTitle: 'Technik',
      tech: 'Das Bild wird mit den Bildfunktionen des Browsers decodiert und auf einem Canvas in voller Auflösung zugeschnitten. Dadurch funktioniert der Bild-Zuschneider ohne Installation und ohne Server.',
      moreTitle: 'Weitere Werkzeuge',
      more: 'Bilder umwandeln, komprimieren und bearbeiten können Sie mit dem {converter}; mehrere Bilder auf einmal bearbeiten mit der {batch}.',
      converterLink: 'Bildkonverter',
      batchLink: 'Bilder-Batchbearbeitung',
    },
  },
  load: {
    title: 'Bild hier ablegen',
    text: 'oder Datei auswählen – auch Einfügen mit Strg+V funktioniert. JPG, PNG, WebP, AVIF, GIF, BMP, ICO und SVG.',
    choose: 'Bild auswählen',
    replace: 'Anderes Bild',
    loading: 'Bild wird geladen …',
    privacy: 'Das Bild bleibt auf Ihrem Gerät. Nichts wird hochgeladen.',
    errorTitle: 'Bild konnte nicht geladen werden',
    errors: {
      heic: 'HEIC/HEIF-Bilder kann der Browser nicht öffnen. Wandeln Sie das Bild zuerst um, zum Beispiel im Bildkonverter.',
      tiff: 'TIFF-Bilder kann der Browser nicht öffnen. Wandeln Sie das Bild zuerst um, zum Beispiel im Bildkonverter.',
      unsupported: 'Dieses Dateiformat wird nicht unterstützt.',
      fileTooLarge: 'Die Datei ist größer als {max} MB.',
      tooManyPixels: 'Das Bild ist zu groß für die Bearbeitung im Browser.',
      decodeFailed: 'Die Datei ist beschädigt oder kein gültiges Bild.',
    },
    converterLink: 'Zum Bildkonverter',
  },
  presets: {
    title: 'Seitenverhältnis',
    social: 'Social-Media-Format',
    socialNone: 'Kein Social-Media-Format',
    orientation: 'Ausrichtung',
    landscape: 'Quer',
    portrait: 'Hoch',
    names: {
      free: 'Frei',
      original: 'Original',
      '1:1': '1:1',
      '4:3': '4:3',
      '3:2': '3:2',
      '5:4': '5:4',
      '16:9': '16:9',
      '21:9': '21:9',
      'instagram-post': 'Instagram-Beitrag (1080 × 1350)',
      'instagram-story': 'Instagram-Story (1080 × 1920)',
      'youtube-thumbnail': 'YouTube-Thumbnail (1280 × 720)',
      'linkedin-banner': 'LinkedIn-Banner (1584 × 396)',
      'facebook-cover': 'Facebook-Titelbild (851 × 315)',
      'x-header': 'X-Header (1500 × 500)',
    },
  },
  crop: {
    stageLabel: 'Bild mit Zuschnittrahmen',
    frameLabel: 'Zuschnittrahmen',
    frameHint: 'Pfeiltasten verschieben den Rahmen, mit Umschalt ändern sie die Größe.',
    handles: {
      n: 'Oberkante',
      ne: 'Ecke oben rechts',
      e: 'rechte Kante',
      se: 'Ecke unten rechts',
      s: 'Unterkante',
      sw: 'Ecke unten links',
      w: 'linke Kante',
      nw: 'Ecke oben links',
    },
    size: 'Größe und Position',
    x: 'X',
    y: 'Y',
    width: 'Breite',
    height: 'Höhe',
    ratio: 'Verhältnis {ratio}',
    original: 'Original {width} × {height} px',
    grid: 'Drittel-Raster anzeigen',
    reset: 'Rahmen zurücksetzen',
  },
  transform: {
    title: 'Drehen und Spiegeln',
    rotateLeft: 'Um 90° nach links drehen',
    rotateRight: 'Um 90° nach rechts drehen',
    flipHorizontal: 'Waagerecht spiegeln',
    flipVertical: 'Senkrecht spiegeln',
    straighten: 'Begradigen',
    straightenHint: 'Der Rahmen bleibt im Bild und wird bei Bedarf kleiner.',
    reset: 'Drehen zurücksetzen',
  },
  export: {
    title: 'Exportieren',
    format: 'Dateiformat',
    unavailable: '{format} (in diesem Browser nicht verfügbar)',
    quality: 'Qualität',
    resize: 'Ausgabegröße ändern',
    width: 'Breite (px)',
    height: 'Höhe (px)',
    background: 'Hintergrund für transparente Bereiche',
    recentColors: 'Zuletzt verwendet',
    summary: 'Ausgabe: {width} × {height} px · {format}',
    upscaled: 'vergrößert',
    download: 'Herunterladen',
    working: 'Wird erstellt …',
    privacy: 'Metadaten wie Standort und Kamera werden nicht übernommen.',
    fileSuffix: '-zugeschnitten',
    done: '{name} gespeichert ({size})',
    errors: {
      tooManyPixels:
        'Die Ausgabe ist zu groß für den Browser. Wählen Sie eine kleinere Ausgabegröße.',
      encodeFailed: 'Das Bild konnte nicht erstellt werden. Versuchen Sie ein anderes Format.',
      formatUnsupported: 'Dieser Browser kann das gewählte Format nicht erstellen.',
    },
  },
  sidebar: {
    label: 'Einstellungen',
  },
  history: {
    toolbar: 'Verlauf',
    ctrl: 'Strg',
  },
  common: {
    cancel: 'Abbrechen',
    close: 'Schließen',
    reset: 'Zurücksetzen',
    increase: 'Erhöhen',
    decrease: 'Verringern',
    undo: 'Rückgängig',
    redo: 'Wiederholen',
  },
  color: {
    pick: 'Farbe wählen',
    hue: 'Farbton',
    saturation: 'Sättigung',
    lightness: 'Helligkeit',
    hex: 'Hex-Wert',
    invalidHex: 'Ungültiger Hex-Wert (z. B. #ff8800)',
  },
};
