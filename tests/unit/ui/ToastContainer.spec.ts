import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { i18n } from '@/i18n';
import ToastContainer from '@/components/ui/ToastContainer.vue';
import { toastText } from '@/utils/toast';

function mountContainer() {
  return mount(ToastContainer, {
    global: { plugins: [i18n], stubs: { teleport: true } },
  });
}

describe('toastText', () => {
  it('stellt einen Titel voran, ohne Titel bleibt die Nachricht', () => {
    expect(toastText('Gespeichert')).toBe('Gespeichert');
    expect(toastText('Gespeichert', null)).toBe('Gespeichert');
    expect(toastText('Datei fehlt', 'Fehler')).toBe('Fehler: Datei fehlt');
  });
});

describe('ToastContainer (UiToast)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete window.$toast;
  });

  it('stellt window.$toast bereit und zeigt je Typ einen UiToast', async () => {
    const wrapper = mountContainer();
    expect(window.$toast).toBeDefined();

    window.$toast?.success('Gespeichert');
    window.$toast?.error('Kaputt');
    window.$toast?.warning('Achtung', 'Offline');
    window.$toast?.info('Hinweis');
    await nextTick();

    const toasts = wrapper.findAll('.ui-toast');
    expect(
      toasts.map((t) =>
        t.classes().find((c) => c.startsWith('ui-toast--') && c !== 'ui-toast--dismissable')
      )
    ).toEqual(['ui-toast--success', 'ui-toast--error', 'ui-toast--warning', 'ui-toast--info']);
    expect(toasts[1]?.attributes('role')).toBe('alert');
    expect(toasts[2]?.get('.ui-toast__message').text()).toBe('Offline: Achtung');
    expect(toasts[0]?.get('.ui-icon-button').attributes('aria-label')).toBe(
      i18n.global.t('common.close')
    );
  });

  it('schließt per Klick auf die Fläche, per Schließen-Button und nach Ablauf', async () => {
    const wrapper = mountContainer();
    window.$toast?.info('Eins');
    window.$toast?.info('Zwei');
    window.$toast?.info('Drei', null, 10000);
    await nextTick();
    expect(wrapper.findAll('.ui-toast')).toHaveLength(3);

    await wrapper.findAll('.ui-toast__message')[0]?.trigger('click');
    expect(wrapper.findAll('.ui-toast')).toHaveLength(2);

    await wrapper.findAll('.ui-icon-button')[0]?.trigger('click');
    expect(wrapper.findAll('.ui-toast')).toHaveLength(1);

    vi.advanceTimersByTime(10000);
    await nextTick();
    expect(wrapper.findAll('.ui-toast')).toHaveLength(0);
  });

  it('nutzt die Standarddauer je Typ (info 3 s)', async () => {
    const wrapper = mountContainer();
    window.$toast?.info('Kurz');
    await nextTick();
    vi.advanceTimersByTime(2999);
    await nextTick();
    expect(wrapper.findAll('.ui-toast')).toHaveLength(1);
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(wrapper.findAll('.ui-toast')).toHaveLength(0);
  });
});
