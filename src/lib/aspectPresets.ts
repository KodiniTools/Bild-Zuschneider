/**
 * Seitenverhältnis-Presets des Zuschneiders.
 *
 * `ratio` ist Breite/Höhe im Querformat; Hochformat dreht es um (siehe `presetRatio`).
 * Social-Media-Formate tragen zusätzlich ihre Zielgröße (`target`), die der Export
 * ab Schritt 6 als Vorschlag übernimmt. Bezeichnungen kommen aus i18n (`presets.*`).
 */
import type { Size } from './geometry';

export type Orientation = 'landscape' | 'portrait';

export interface AspectPreset {
  id: string;
  /** Breite/Höhe; null = frei, 'original' = wie das geladene Bild */
  ratio: number | null | 'original';
  group: 'basic' | 'social';
  /** Zielgröße in Pixeln (Social-Media-Vorgaben), sonst undefined */
  target?: Size;
  /** Kreisförmige o. ä. Formate haben keine Hoch-/Quer-Variante */
  fixedOrientation?: boolean;
}

export const ASPECT_PRESETS: readonly AspectPreset[] = [
  { id: 'free', ratio: null, group: 'basic', fixedOrientation: true },
  { id: 'original', ratio: 'original', group: 'basic', fixedOrientation: true },
  { id: '1:1', ratio: 1, group: 'basic', fixedOrientation: true },
  { id: '4:3', ratio: 4 / 3, group: 'basic' },
  { id: '3:2', ratio: 3 / 2, group: 'basic' },
  { id: '5:4', ratio: 5 / 4, group: 'basic' },
  { id: '16:9', ratio: 16 / 9, group: 'basic' },
  { id: '21:9', ratio: 21 / 9, group: 'basic' },
  {
    id: 'instagram-post',
    ratio: 4 / 5,
    group: 'social',
    target: { width: 1080, height: 1350 },
    fixedOrientation: true,
  },
  {
    id: 'instagram-story',
    ratio: 9 / 16,
    group: 'social',
    target: { width: 1080, height: 1920 },
    fixedOrientation: true,
  },
  {
    id: 'youtube-thumbnail',
    ratio: 16 / 9,
    group: 'social',
    target: { width: 1280, height: 720 },
    fixedOrientation: true,
  },
  {
    id: 'linkedin-banner',
    ratio: 4,
    group: 'social',
    target: { width: 1584, height: 396 },
    fixedOrientation: true,
  },
  {
    id: 'facebook-cover',
    ratio: 851 / 315,
    group: 'social',
    target: { width: 851, height: 315 },
    fixedOrientation: true,
  },
  {
    id: 'x-header',
    ratio: 3,
    group: 'social',
    target: { width: 1500, height: 500 },
    fixedOrientation: true,
  },
];

export const DEFAULT_PRESET_ID = 'free';

export function findPreset(id: string): AspectPreset {
  return ASPECT_PRESETS.find((preset) => preset.id === id) ?? ASPECT_PRESETS[0]!;
}

/**
 * Wirksames Seitenverhältnis eines Presets: null = frei. Hochformat kehrt das
 * Verhältnis um, außer bei Presets mit fester Ausrichtung.
 */
export function presetRatio(
  preset: AspectPreset,
  orientation: Orientation,
  image: Size
): number | null {
  if (preset.ratio === null) return null;
  const ratio = preset.ratio === 'original' ? image.width / image.height : preset.ratio;
  if (preset.fixedOrientation || ratio === 1) return ratio;
  const landscape = Math.max(ratio, 1 / ratio);
  return orientation === 'portrait' ? 1 / landscape : landscape;
}
