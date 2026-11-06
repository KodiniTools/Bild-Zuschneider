import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { i18n } from '@/i18n';
import UiToast from '@/components/ui/UiToast.vue';

describe('UiToast', () => {
  it('ist standardmäßig eine Info mit role=status', () => {
    const wrapper = mount(UiToast, { props: { message: '4 Dateien hinzugefügt' } });
    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.classes()).toContain('ui-toast--info');
    expect(wrapper.get('.ui-toast__message').text()).toBe('4 Dateien hinzugefügt');
    expect(wrapper.find('.ui-button').exists()).toBe(false);
    expect(wrapper.get('.ui-icon-button').attributes('aria-label')).toBe('Schließen');
  });

  it('macht Fehler zu role=alert', () => {
    const wrapper = mount(UiToast, { props: { message: 'Fehler', type: 'error' } });
    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.classes()).toContain('ui-toast--error');
  });

  it('schließt bei Klick auf die Fläche nur mit dismissOnClick', async () => {
    const plain = mount(UiToast, { props: { message: 'Hinweis' } });
    await plain.get('.ui-toast__message').trigger('click');
    expect(plain.emitted('dismiss')).toBeUndefined();

    const dismissable = mount(UiToast, {
      props: { message: 'Hinweis', actionLabel: 'Rückgängig', dismissOnClick: true },
    });
    expect(dismissable.classes()).toContain('ui-toast--dismissable');
    await dismissable.get('.ui-button').trigger('click');
    expect(dismissable.emitted('action')).toHaveLength(1);
    expect(dismissable.emitted('dismiss')).toBeUndefined();

    await dismissable.get('.ui-toast__message').trigger('click');
    expect(dismissable.emitted('dismiss')).toHaveLength(1);
  });

  it('meldet Aktion und Schließen als Events', async () => {
    const wrapper = mount(UiToast, {
      props: { message: 'Gespeichert', type: 'success', actionLabel: 'Rückgängig' },
    });
    await wrapper.get('.ui-button').trigger('click');
    await wrapper.get('.ui-icon-button').trigger('click');
    expect(wrapper.emitted('action')).toHaveLength(1);
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('kennt den Typ warning mit eigener Klasse und role=status', () => {
    const wrapper = mount(UiToast, { props: { message: 'Achtung', type: 'warning' } });
    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.classes()).toContain('ui-toast--warning');
    expect(wrapper.find('.ui-toast__icon svg path').exists()).toBe(true);
  });

  describe('Schließen-Label', () => {
    afterEach(() => {
      i18n.global.locale.value = 'de';
    });

    it('fällt ohne dismissLabel auf die Übersetzung der aktuellen Sprache zurück', async () => {
      const wrapper = mount(UiToast, { props: { message: 'Hinweis' } });
      expect(wrapper.get('.ui-icon-button').attributes('aria-label')).toBe('Schließen');
      i18n.global.locale.value = 'en';
      await wrapper.vm.$nextTick();
      expect(wrapper.get('.ui-icon-button').attributes('aria-label')).toBe('Close');
    });

    it('nutzt ein übergebenes dismissLabel unverändert', () => {
      const wrapper = mount(UiToast, { props: { message: 'Hinweis', dismissLabel: 'Weg damit' } });
      expect(wrapper.get('.ui-icon-button').attributes('aria-label')).toBe('Weg damit');
    });
  });
});
