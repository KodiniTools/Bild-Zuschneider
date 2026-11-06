import { describe, expect, it } from 'vitest';
import { ASPECT_PRESETS, DEFAULT_PRESET_ID, findPreset, presetRatio } from '@/lib/aspectPresets';
import de from '@/i18n/de';

const IMG = { width: 1200, height: 800 };

describe('Seitenverhältnis-Presets', () => {
  it('haben eindeutige IDs und eine Bezeichnung in i18n', () => {
    const ids = ASPECT_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(de.presets.names, id).toHaveProperty(id);
  });

  it('Social-Formate haben eine Zielgröße passend zum Verhältnis', () => {
    for (const preset of ASPECT_PRESETS.filter((p) => p.group === 'social')) {
      expect(preset.target, preset.id).toBeDefined();
      expect(preset.target!.width / preset.target!.height).toBeCloseTo(preset.ratio as number, 2);
    }
  });

  it('Standard ist „frei“, unbekannte IDs fallen darauf zurück', () => {
    expect(DEFAULT_PRESET_ID).toBe('free');
    expect(findPreset('gibt-es-nicht').id).toBe('free');
  });

  it('frei hat kein Verhältnis, Original das des Bildes', () => {
    expect(presetRatio(findPreset('free'), 'landscape', IMG)).toBeNull();
    expect(presetRatio(findPreset('original'), 'portrait', IMG)).toBeCloseTo(1.5);
  });

  it('dreht Verhältnisse im Hochformat um', () => {
    expect(presetRatio(findPreset('16:9'), 'landscape', IMG)).toBeCloseTo(16 / 9);
    expect(presetRatio(findPreset('16:9'), 'portrait', IMG)).toBeCloseTo(9 / 16);
    expect(presetRatio(findPreset('4:3'), 'portrait', IMG)).toBeCloseTo(3 / 4);
  });

  it('lässt feste Formate unabhängig von der Ausrichtung', () => {
    expect(presetRatio(findPreset('1:1'), 'portrait', IMG)).toBe(1);
    expect(presetRatio(findPreset('instagram-story'), 'landscape', IMG)).toBeCloseTo(9 / 16);
  });
});
