# UI-Bausteine

Bausteine des Design-Systems v2 (`--ds-*`, siehe `src/design-system/README.md`).
Export über `index.ts`:

```ts
import { UiButton, UiSelect, SliderField } from '@/components/ui';
```

## Herkunft

Die Bausteine stammen aus dem Collage Maker. Für die meisten ist die Quelle die Fassung des Bildkonverters, weil sie die festen Regeln schon umsetzt (`#overlay-root`, AppIcon). Entscheidung dazu in Schritt 0.

| Baustein                                                                | Quelle (Stand)                                      | Abweichung hier                                                       |
| ----------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| `UiButton`, `UiIconButton`, `UiSwitch`, `UiToast`                       | Bildkonverter `8370f65` (= Collage Maker `145663b`) | keine                                                                 |
| `UiDialog`                                                              | Bildkonverter `8370f65`                             | keine (Teleport-Standard `#overlay-root`, `white-space: pre-line`)    |
| `UiSelect`                                                              | Bildkonverter `8370f65`                             | keine (`group` → `<optgroup>`, `style` je Option)                     |
| `SliderField` + `range.css`, `NumberSpinner`                            | Bildkonverter `8370f65`                             | `NumberSpinner` nach TypeScript übertragen; `icon` ist ein `IconName` |
| `ColorField` (+ `utils/color.ts`)                                       | Bildkonverter `8370f65`                             | keine                                                                 |
| `ToastContainer` (+ `utils/toast.ts`), `ConfirmDialog` (+ `useConfirm`) | Bildkonverter `8370f65`                             | `useConfirm` nach TypeScript übertragen                               |
| `UiSegmentedControl`, `UiEmptyState`, `UiCallout`, `UiTextField`        | Collage Maker `145663b`                             | nur mit der Prettier-Konfiguration dieses Repos formatiert            |
| `AppIcon` + `iconMap.ts`                                                | neu nach Bildkonverter-Muster                       | Lucide-Namen statt Font-Awesome-Aliase; nur die genutzten Icons       |

Nicht übernommen: `HistoryActions` des Bildkonverters. Rückgängig/Wiederholen entsteht in Schritt 5 aus `UiIconButton` + `AppIcon`.

`UiToast`, `UiCallout`, `NumberSpinner` und `UiDialog` zeichnen ihre kleinen Status- und Pfeil-Icons als Inline-SVG im Lucide-Stil, wie in der Vorlage. Neue Icons kommen über `AppIcon`.

## Regeln

- `<script setup lang="ts">` mit typisierten Props, Styling nur über `--ds-*` Tokens, scoped.
- Overlays (UiDialog, ColorField) teleportieren nach `#overlay-root`, nie nach `body`.
- Außerhalb dieses Ordners keine nativen `<select>`, Checkboxen, Regler (`type="range"`) oder Farbfelder (`type="color"`). `tests/unit/design-system/appRules.spec.ts` prüft das.
- Je Baustein ein Test unter `tests/unit/ui/`.
