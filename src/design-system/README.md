# Design-System v2 im Bild-Zuschneider

Der Bild-Zuschneider nutzt pixelgleich das Design-System des Collage Makers
(`KodiniTools/Collage-Maker`, `src/design-system/`, Stand `145663b`), das dieser mit dem
Playlist Generator und dem Bildkonverter teilt. `tokens-v2.css` und `tokens-v2.json` sind
**unveränderte Kopien**; Werte werden nur im Collage Maker geändert und hierher kopiert.
Fehlende Tokens werden dort ergänzt und zurückkopiert. `tokens-v2.ts` (Fassung des
Bildkonverters) bietet typisierten Zugriff, z. B. `themeColorsV2()` für Canvas-Zeichnung.

- **Tests:** `tests/unit/design-system/tokens-v2.spec.ts` (JSON ↔ CSS, Light-Spiegel,
  Kontrast WCAG AA), `designTokens.spec.ts` (alle Styles: Farbliterale, Schriftgrößen/-familien,
  Radien, Schatten, Verläufe, z-index ≤ 100, undefinierte `--ds-*`, Token-Zyklen; Ausnahmen mit
  Begründung je Datei) und `appRules.spec.ts` (Overlays nach `#overlay-root`, keine nativen
  Selects/Checkboxen/Regler/Farbfelder außerhalb von `components/ui`, Icons nur über AppIcon,
  Basis-Styles).
- **Tokens:** `tokens-v2.css` (`--ds-*`). Dark liegt auf `:root`, Light auf
  `:root[data-theme='light']`. `index.html` setzt `data-theme` vor dem ersten Paint (Schritt 3).
- **Keine Legacy-Aliase:** Neubau, Code nutzt direkt `--ds-*`.
- **Basis:** `src/styles/global.scss` – Schrift Supreme (400/500/700), Body, Typografie,
  Fokus, Scrollbar, reduzierte Bewegung; ab Schritt 3 der Block „SSI-Partials“.
- **Icons:** `src/components/ui/AppIcon.vue` (Lucide, `stroke-width` 1.75), Namen = Lucide-Namen
  in kebab-case aus `iconMap.ts`.

## Regeln

### Farbe

| Rolle                                                                     | Token                                                                                     |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Seite                                                                     | `--ds-surface-0`                                                                          |
| Panel, Karte, Dialog, Toast, Popover                                      | `--ds-surface-1`                                                                          |
| Eingabe, Sekundär-Button, Callout, Chip                                   | `--ds-surface-2`                                                                          |
| Hover (nur Hover)                                                         | `--ds-surface-3`                                                                          |
| Rahmen / Feld- und Sekundär-Rahmen                                        | `--ds-border` / `--ds-border-strong`                                                      |
| Text: Titel, Inhalt / Labels, Meta, Icons in Ruhe / Platzhalter, Hinweise | `--ds-text` / `--ds-text-2` / `--ds-text-3`                                               |
| Primäraktion (eine pro Ansicht)                                           | `--ds-accent`, Hover `--ds-accent-hover`, Schrift `--ds-on-accent`                        |
| Ausgewählt / aktiv                                                        | Fläche `--ds-accent-soft` + 1-px-Rahmen `--ds-accent`, Text bleibt `--ds-text`            |
| Link, Info                                                                | `--ds-link` (Hover `--ds-accent`)                                                         |
| Status                                                                    | `--ds-success`, `--ds-warning`, `--ds-danger`, `--ds-info` – nur Icon, Linie, kurzer Text |
| Text auf gefüllter Erfolgs-Fläche                                         | `--ds-on-success`                                                                         |

- Keine festen Farbwerte (`#…`, `rgb()`, `rgba()`), keine Alpha-Tints außer
  `--ds-accent-soft`. Erlaubt bleiben: Backdrop `rgba(0, 0, 0, 0.5)`, Weiß (`#fff`)
  für Häkchen, Schalter-Knopf und Griffe über Bildern, Schachbrett-Muster für
  Transparenz, Farbwähler-/Farbton-Verläufe, die einen Wert zeigen.
- Gold ist im Light-Theme nie Textfarbe (2,4:1). Links → `--ds-link`,
  Hervorhebung → `--ds-text`, Icons → `--ds-text-2` (aktiv: `--ds-text`).
- Status nie als Fläche: keine grünen/roten Vollflächen. Destruktiv = Text/Icon in
  `--ds-danger` auf flacher Fläche.
- Keine Dark-Overrides (`:root[data-theme='dark'] …`): Die Tokens wechseln selbst.

### Typografie

- Nur Supreme (`--ds-font-sans`); Mono (`--ds-font-mono`) nur für Hex-Werte und Code.
- Sieben Grade: `--ds-text-xs` 12 · `-sm` 13 · `-md` 14 · `-lg` 16 · `-xl` 20 ·
  `-2xl` 24 · `-3xl` 32. Keine anderen Größen, keine `rem`/`em`-Größen.
- Gewichte `--ds-weight-regular|medium|semibold|bold`.
- Zeilenhöhe `--ds-leading` (1.5), ab 20 px `--ds-leading-tight` (1.25), in
  Controls `1`.
- Titel: `page-title` 24/700 (`--ds-tracking-tight`), `section-title` 20/700,
  `panel-title` 16/600, `eyebrow` 12/600 Versalien. Sonst keine Versalien, kein
  `letter-spacing`.
- Controls: Button/Select/Feld 14/500 (Primär 600), Label 13/500 `--ds-text-2`,
  Caption 13, Small 12.

### Abstände, Größen, Radien, Rahmen

- 4-px-Raster: `--ds-space-1|2|3|4|5|6|8|10|12|16` (4 … 64).
- Control-Höhen: `--ds-control-sm` 28 · `-md` 36 · `-lg` 40 (Textfeld);
  Touch-Ziel `--ds-row-height` 44.
- Icons: 16 in Controls, 20 freistehend, 32 Dropzone, 40 Leerzustand.
- Radien: `--ds-radius-sm` 6 (Controls sm, Badge, Kbd, Thumbnail),
  `--ds-radius-md` 10 (Button, Feld, Select, Kachel, Karte, Callout, Toast),
  `--ds-radius-lg` 16 (Panel, Dialog, Sektion), `--ds-radius-full` (Pille);
  `50%` für Kreise.
- Rahmen immer `--ds-border-width` (1 px). Ausnahmen: Toast-Linie 3 px links,
  Kbd-Unterkante 2 px, Slider-Daumen-Rand 2 px, Thumbnail-Ring 2 px.

### Schatten, Bewegung, Fokus

- `--ds-shadow-overlay` nur auf Dialog, Modal, Toast, Popover/Dropdown und
  schwebenden Toolbars. Panels, Karten und Buttons liegen flach – auch beim Hover.
- Hover ändert nur Farben. Kein `transform` (`translate`, `scale`), kein Glow,
  kein Gradient, kein `backdrop-filter`.
- Transitions nur auf `background-color`, `border-color`, `color`, `opacity` mit
  `var(--ds-duration) var(--ds-ease)` (150 ms); Dialog/Toast/Panel-Breite
  `var(--ds-duration-slow)` (250 ms). Kein `transition: all`.
- Fokus: `:focus-visible { outline: none; box-shadow: var(--ds-focus-ring); }`,
  Felder färben zusätzlich den Rahmen `--ds-accent`. Kein anderer Fokus-Stil.
- Deaktiviert: Buttons/Segmente `opacity: 0.45; cursor: not-allowed`, Felder `0.6`.

## Bausteine

Siehe `src/components/ui/README.md` (Herkunft, Abweichungen, Einsatz).
