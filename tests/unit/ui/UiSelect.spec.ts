import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiSelect from '@/components/ui/UiSelect.vue';

const options = [
  { value: 'm3u', label: 'M3U' },
  { value: 'xspf', label: 'XSPF' },
  { value: 'json', label: 'JSON', disabled: true },
];

describe('UiSelect', () => {
  it('verknüpft Label und select und rendert die Optionen', () => {
    const wrapper = mount(UiSelect, { props: { options, label: 'Format', modelValue: 'm3u' } });
    const select = wrapper.get<HTMLSelectElement>('select');
    expect(wrapper.get('label').attributes('for')).toBe(select.attributes('id'));
    expect(select.element.value).toBe('m3u');
    expect(wrapper.findAll('option').map((option) => option.text())).toEqual([
      'M3U',
      'XSPF',
      'JSON',
    ]);
    expect(wrapper.findAll('option').at(2)?.attributes('disabled')).toBeDefined();
  });

  it('meldet die Auswahl als v-model und reicht Attribute durch', async () => {
    const wrapper = mount(UiSelect, {
      props: { options, label: 'Format', modelValue: 'm3u', id: 'format', inline: true },
      attrs: { 'data-test': 'format-select' },
    });
    expect(wrapper.classes()).toContain('ui-select--inline');
    const select = wrapper.get('select');
    expect(select.attributes('id')).toBe('format');
    expect(select.attributes('data-test')).toBe('format-select');
    await select.setValue('xspf');
    expect(wrapper.emitted('update:modelValue')).toEqual([['xspf']]);
  });

  it('kann das Label visuell verstecken', () => {
    const wrapper = mount(UiSelect, {
      props: { options, label: 'Format', modelValue: 'm3u', labelHidden: true },
    });
    expect(wrapper.get('label').classes()).toContain('ui-select__label--hidden');
  });

  // Abweichung von der Vorlage: Optgroups und Stil je Option (Schriftvorschau)
  it('gruppiert Optionen mit group in optgroup und setzt style je Option', () => {
    const wrapper = mount(UiSelect, {
      props: {
        label: 'Schrift',
        modelValue: 'Arial',
        options: [
          { value: '', label: 'Ohne' },
          { value: 'Satoshi', label: 'Satoshi', group: 'Eigene', style: { fontFamily: 'Satoshi' } },
          { value: 'Arial', label: 'Arial', group: 'System', style: { fontFamily: 'Arial' } },
          { value: 'Georgia', label: 'Georgia', group: 'System' },
        ],
      },
    });
    const select = wrapper.get<HTMLSelectElement>('select');
    expect(select.element.value).toBe('Arial');
    expect(select.element.children[0].tagName).toBe('OPTION');
    const groups = wrapper.findAll('optgroup');
    expect(groups.map((group) => group.attributes('label'))).toEqual(['Eigene', 'System']);
    expect(groups[1].findAll('option').map((option) => option.text())).toEqual([
      'Arial',
      'Georgia',
    ]);
    expect(groups[0].get('option').attributes('style')).toContain('font-family: Satoshi');
  });
});
