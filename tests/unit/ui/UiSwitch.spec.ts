import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiSwitch from '@/components/ui/UiSwitch.vue';

describe('UiSwitch', () => {
  it('ist ein Schalter mit sichtbarem Label und schaltet per Klick um', async () => {
    const wrapper = mount(UiSwitch, {
      props: {
        label: 'Bestehende Liste ersetzen',
        modelValue: false,
        'onUpdate:modelValue': (value: boolean) => wrapper.setProps({ modelValue: value }),
      },
    });
    const button = wrapper.get('[role="switch"]');
    const label = wrapper.get('label');
    expect(button.attributes('aria-checked')).toBe('false');
    expect(label.text()).toBe('Bestehende Liste ersetzen');
    expect(label.attributes('for')).toBe(button.attributes('id'));

    await button.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
    expect(button.attributes('aria-checked')).toBe('true');
    expect(button.classes()).toContain('ui-switch__track--on');
  });

  it('schaltet auch per Klick auf das Label', async () => {
    const wrapper = mount(UiSwitch, {
      props: { label: 'An', modelValue: true },
      attachTo: document.body,
    });
    await wrapper.get('label').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
    wrapper.unmount();
  });

  it('labelHidden setzt das Label als aria-label und title', () => {
    const wrapper = mount(UiSwitch, { props: { label: 'An/Aus', labelHidden: true } });
    expect(wrapper.find('label').exists()).toBe(false);
    expect(wrapper.get('button').attributes('aria-label')).toBe('An/Aus');
    expect(wrapper.get('button').attributes('title')).toBe('An/Aus');
  });

  it('respektiert eine eigene id', () => {
    const wrapper = mount(UiSwitch, { props: { label: 'X', id: 'replace-mode' } });
    expect(wrapper.get('button').attributes('id')).toBe('replace-mode');
    expect(wrapper.get('label').attributes('for')).toBe('replace-mode');
  });

  it('reagiert deaktiviert nicht', async () => {
    const wrapper = mount(UiSwitch, { props: { label: 'X', disabled: true } });
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.classes()).toContain('ui-switch--disabled');
  });
});
