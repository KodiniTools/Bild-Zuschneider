/**
 * Regler-Anatomie: range.css aus der Vorlage ist die einzige Quelle für Spur und
 * Daumen. SliderField bindet sie scoped ein, global.scss enthält keine eigenen
 * Range-Regeln mehr.
 */
import { describe, expect, it } from 'vitest';
import { readRelative } from '../design-system/tokenTestUtils';

const range = readRelative(import.meta.url, '../../../src/components/ui/range.css');
const slider = readRelative(import.meta.url, '../../../src/components/ui/SliderField.vue');
const global = readRelative(import.meta.url, '../../../src/styles/global.scss');

describe('range.css', () => {
  it('nutzt nur Tokens für Spur, Daumen und Fokus', () => {
    expect(range).toContain('background: var(--ds-border-strong)');
    expect(range).toContain('background: var(--ds-accent)');
    expect(range).toContain('border: 2px solid var(--ds-surface-1)');
    expect(range).toContain('box-shadow: var(--ds-focus-ring)');
  });

  it('wird von SliderField scoped eingebunden', () => {
    expect(slider).toContain('<style scoped src="./range.css"></style>');
  });

  it('hat keine Konkurrenz in global.scss', () => {
    expect(global).not.toMatch(/slider-thumb|range-thumb|range-track/);
  });

  it('Farbton/Wärme und Touch-Größe überstimmen den Spur-Hintergrund mit doppelter Klasse', () => {
    expect(slider).toContain('&.slider-field__range--hue');
    expect(slider).toContain('&.slider-field__range--warm');
    expect(slider).toContain("input[type='range'].slider-field__range");
  });
});
