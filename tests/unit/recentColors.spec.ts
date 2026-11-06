import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { i18n } from '@/i18n';
import RecentColorField from '@/components/common/RecentColorField.vue';
import {
  RECENT_COLORS_KEY,
  RECENT_COLORS_MAX,
  addRecentColor,
  clearRecentColors,
  reloadRecentColors,
  useRecentColors,
} from '@/composables/useRecentColors';

describe('useRecentColors', () => {
  beforeEach(() => {
    localStorage.clear();
    clearRecentColors();
  });

  it('reiht neue Farben vorn ein, ohne Duplikate, begrenzt und gespeichert', () => {
    const { recentColors } = useRecentColors();
    addRecentColor('#FF0000');
    addRecentColor('#00ff00');
    addRecentColor('#ff0000');
    expect(recentColors.value).toEqual(['#ff0000', '#00ff00']);
    expect(addRecentColor('rot')).toBe(false);
    for (let i = 0; i < 12; i++) addRecentColor(`#0000${String(i).padStart(2, '0')}`);
    expect(recentColors.value).toHaveLength(RECENT_COLORS_MAX);
    expect(JSON.parse(localStorage.getItem(RECENT_COLORS_KEY)!)).toEqual(recentColors.value);
  });

  it('liest nur gültige Einträge aus dem Speicher', () => {
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(['#ABCDEF', 'x', 3]));
    reloadRecentColors();
    expect(useRecentColors().recentColors.value).toEqual(['#abcdef']);
    localStorage.setItem(RECENT_COLORS_KEY, '{kaputt');
    reloadRecentColors();
    expect(useRecentColors().recentColors.value).toEqual([]);
  });
});

describe('RecentColorField', () => {
  beforeEach(() => clearRecentColors());

  it('zeigt zuletzt verwendete Farben und übernimmt sie per Klick', async () => {
    addRecentColor('#112233');
    addRecentColor('#445566');
    const wrapper = mount(RecentColorField, {
      props: { modelValue: '#445566', label: 'Hintergrund', recentLabel: 'Zuletzt' },
      global: { plugins: [i18n] },
    });
    const swatches = wrapper.findAll('[data-color]');
    expect(swatches.map((s) => s.attributes('data-color'))).toEqual(['#445566', '#112233']);
    expect(swatches[0]!.attributes('aria-pressed')).toBe('true');
    await swatches[1]!.trigger('click');
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['#112233']);
    expect(wrapper.emitted('commit')![0]).toEqual(['#112233']);
    expect(useRecentColors().recentColors.value[0]).toBe('#112233');
  });
});
