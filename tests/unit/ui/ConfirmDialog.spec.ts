import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { i18n } from '@/i18n';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import { useConfirm } from '@/composables/useConfirm';

function mountConfirm() {
  return mount(ConfirmDialog, {
    global: { plugins: [i18n], stubs: { teleport: true } },
  });
}

describe('ConfirmDialog (UiDialog)', () => {
  const { confirm, respond, state } = useConfirm();

  afterEach(() => {
    if (state.value.visible) respond(false);
  });

  it('zeigt Titel, Text und beide Buttons; danger macht den Bestätigen-Button destruktiv', async () => {
    const wrapper = mountConfirm();
    const result = confirm('Möchten Sie "a.png" wirklich löschen?', {
      title: 'Bild löschen?',
      confirmText: 'Löschen',
      cancelText: 'Abbrechen',
      variant: 'danger',
    });
    await nextTick();

    const dialog = wrapper.get('[role="dialog"]');
    expect(dialog.get('.ui-dialog__title').text()).toBe('Bild löschen?');
    expect(dialog.get('.ui-dialog__description').text()).toBe(
      'Möchten Sie "a.png" wirklich löschen?'
    );
    const buttons = dialog.findAll('.ui-dialog__footer .ui-button');
    expect(buttons.map((b) => b.text())).toEqual(['Abbrechen', 'Löschen']);
    expect(buttons[0]?.classes()).toContain('ui-button--secondary');
    expect(buttons[1]?.classes()).toContain('ui-button--danger');

    await buttons[1]?.trigger('click');
    await expect(result).resolves.toBe(true);
    await nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('nutzt für andere Varianten den Primär-Button', async () => {
    const wrapper = mountConfirm();
    void confirm('Zurücksetzen?', { title: 'Zurücksetzen', confirmText: 'OK', variant: 'warning' });
    await nextTick();
    const buttons = wrapper.findAll('.ui-dialog__footer .ui-button');
    expect(buttons[1]?.classes()).toContain('ui-button--primary');
  });

  it.each([
    [
      'Abbrechen',
      (w: ReturnType<typeof mountConfirm>) => w.findAll('.ui-button')[0]?.trigger('click'),
    ],
    [
      'Escape',
      (w: ReturnType<typeof mountConfirm>) =>
        w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' }),
    ],
    [
      'Hintergrund',
      (w: ReturnType<typeof mountConfirm>) => w.get('.ui-dialog__backdrop').trigger('click'),
    ],
    [
      'Schließen-Button',
      (w: ReturnType<typeof mountConfirm>) => w.get('.ui-icon-button').trigger('click'),
    ],
  ])('%s bricht ab (false)', async (_name, act) => {
    const wrapper = mountConfirm();
    const result = confirm('Wirklich?', { title: 'Frage' });
    await nextTick();
    await act(wrapper);
    await expect(result).resolves.toBe(false);
  });
});
