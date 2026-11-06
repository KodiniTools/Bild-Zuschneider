import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ColorField from '@/components/ui/ColorField.vue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wrapper: VueWrapper<any> | null = null;

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  document.body.innerHTML = '';
});

function mountField(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  wrapper = mount(ColorField, {
    props: { modelValue: '#ff8800', ...props },
    attrs,
    attachTo: document.body,
  });
  return wrapper;
}

function panel(): HTMLElement | null {
  return document.body.querySelector<HTMLElement>('.color-field__panel');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function openPanel(w: VueWrapper<any>): Promise<HTMLElement> {
  await w.find('button.color-field__swatch').trigger('click');
  await nextTick();
  return panel()!;
}

function setInput(el: Element | null | undefined, value: string, type = 'input') {
  if (!(el instanceof HTMLInputElement)) throw new Error('kein Input');
  el.value = value;
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

describe('ColorField', () => {
  it('renders a swatch in the model color and forwards class/title', () => {
    const w = mountField({}, { class: 'color-input-sm', title: 'Glow' });
    const root = w.find('.color-field');
    expect(root.classes()).toContain('color-input-sm');
    const btn = w.find('button.color-field__swatch');
    expect(btn.attributes('title')).toBe('Glow');
    // happy-dom lässt Hex stehen, jsdom (Vorlage) wandelt in rgb()
    expect(btn.attributes('style')).toMatch(/background-color: (rgb\(255, 136, 0\)|#ff8800)/);
    expect(btn.attributes('aria-expanded')).toBe('false');
    expect(panel()).toBeNull();
  });

  it('opens the panel into <body> with three sliders, spinners and a hex field', async () => {
    const w = mountField();
    const p = await openPanel(w);
    expect(p).not.toBeNull();
    expect(p.querySelectorAll('input[type="range"]')).toHaveLength(3);
    expect(p.querySelectorAll('input[type="number"]')).toHaveLength(3);
    expect(p.querySelector<HTMLInputElement>('input.color-field__hex')!.value).toBe('#ff8800');
    expect(w.emitted('open')).toHaveLength(1);

    const [h, s, l] = [...p.querySelectorAll<HTMLInputElement>('input[type="number"]')].map(
      (el) => el.value
    );
    expect(h).toBe('32');
    expect(s).toBe('100');
    expect(l).toBe('50');
  });

  it('emits update:modelValue live while dragging and change on release', async () => {
    const w = mountField({ modelValue: '#ff0000' });
    const p = await openPanel(w);
    const hue = p.querySelector<HTMLInputElement>('input[type="range"]')!;

    hue.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    setInput(hue, '120');
    expect(w.emitted('start')).toEqual([['#ff0000']]);
    expect(w.emitted('update:modelValue')).toEqual([['#00ff00']]);
    expect(w.emitted('change')).toBeUndefined();

    setInput(hue, '240');
    setInput(hue, '240', 'change');
    expect(w.emitted('update:modelValue')).toEqual([['#00ff00'], ['#0000ff']]);
    expect(w.emitted('change')).toEqual([['#0000ff']]);
    expect(w.emitted('start')).toHaveLength(1);
  });

  it('spinner input clamps into range and emits', async () => {
    const w = mountField({ modelValue: '#ff0000' });
    const p = await openPanel(w);
    const [, satNum, lightNum] = p.querySelectorAll('input[type="number"]');

    setInput(lightNum, '150');
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['#ffffff']);

    setInput(satNum, ''); // noch am Tippen → kein Emit
    const count = w.emitted('update:modelValue')!.length;
    setInput(satNum, 'abc');
    expect(w.emitted('update:modelValue')).toHaveLength(count);
  });

  it('accepts valid hex input, rejects invalid input without emitting', async () => {
    const w = mountField();
    const p = await openPanel(w);
    const hex = p.querySelector<HTMLInputElement>('input.color-field__hex')!;

    hex.dispatchEvent(new Event('focus'));
    setInput(hex, '#12');
    expect(hex.classList.contains('color-field__hex--invalid')).toBe(false); // erst nach Re-Render
    await nextTick();
    expect(hex.classList.contains('color-field__hex--invalid')).toBe(true);
    expect(w.emitted('update:modelValue')).toBeUndefined();

    setInput(hex, '123456');
    await nextTick();
    expect(hex.classList.contains('color-field__hex--invalid')).toBe(false);
    expect(w.emitted('update:modelValue')).toEqual([['#123456']]);

    hex.dispatchEvent(new Event('blur'));
    await nextTick();
    expect(hex.value).toBe('#123456');
    expect(w.emitted('change')).toEqual([['#123456']]);
  });

  it('follows external modelValue changes and keeps hue for greys', async () => {
    const w = mountField({ modelValue: '#ff0000' });
    const p = await openPanel(w);

    await w.setProps({ modelValue: '#00ff00' });
    expect(p.querySelector<HTMLInputElement>('input[type="number"]')!.value).toBe('120');
    expect(p.querySelector<HTMLInputElement>('input.color-field__hex')!.value).toBe('#00ff00');

    // Sättigung auf 0 → Grau, Farbton bleibt intern 120 erhalten
    const satRange = p.querySelectorAll('input[type="range"]')[1];
    setInput(satRange, '0');
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['#808080']);
    await w.setProps({ modelValue: '#808080' });
    expect(p.querySelector<HTMLInputElement>('input[type="number"]')!.value).toBe('120');

    // Ungültiger externer Wert → Fallback schwarz, kein Emit
    const emitted = w.emitted('update:modelValue')!.length;
    await w.setProps({ modelValue: 'not-a-color' });
    expect(w.find('button').attributes('style')).toMatch(/rgb\(0, 0, 0\)|#000000/);
    expect(w.emitted('update:modelValue')).toHaveLength(emitted);
  });

  it('closes on Escape, on outside pointerdown and on toggle click', async () => {
    const w = mountField();
    await openPanel(w);
    expect(panel()).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();
    expect(panel()).toBeNull();
    expect(w.emitted('close')).toHaveLength(1);

    await openPanel(w);
    const inside = panel()!.querySelector('input')!;
    inside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await nextTick();
    expect(panel()).not.toBeNull();

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await nextTick();
    expect(panel()).toBeNull();

    await openPanel(w);
    await w.find('button').trigger('click');
    expect(panel()).toBeNull();
  });

  it('does not open when disabled', async () => {
    const w = mountField({ disabled: true });
    await openPanel(w);
    expect(panel()).toBeNull();
    expect(w.find('button').attributes('disabled')).toBeDefined();
  });

  it('works with v-model plus a trailing @update:model-value handler (model is updated first)', async () => {
    const seen: string[] = [];
    const color = ref('#ff0000');
    const Parent = defineComponent({
      setup() {
        return () =>
          h(ColorField, {
            modelValue: color.value,
            // v-model zuerst, danach ein eigener Handler (wie `v-model` + `@update:model-value`)
            'onUpdate:modelValue': (value: string) => {
              color.value = value;
              seen.push(color.value);
            },
          });
      },
    });
    wrapper = mount(Parent, { attachTo: document.body });
    const p = await openPanel(wrapper);
    setInput(p.querySelector('input[type="range"]'), '120');
    expect(color.value).toBe('#00ff00');
    expect(seen).toEqual(['#00ff00']);
  });

  it('Escape am Auslöser schließt nur das Panel und hält das Event vom umgebenden Dialog fern', async () => {
    let dialogSawEscape = false;
    const Host = defineComponent({
      setup() {
        return () =>
          h('div', { onKeydown: () => (dialogSawEscape = true) }, [
            h(ColorField, { modelValue: '#ff8800' }),
          ]);
      },
    });
    wrapper = mount(Host, { attachTo: document.body });
    await openPanel(wrapper);
    await wrapper.get('button.color-field__swatch').trigger('keydown', { key: 'Escape' });
    await nextTick();
    expect(panel()).toBeNull();
    expect(dialogSawEscape).toBe(false);

    // Geschlossen läuft Escape normal weiter (Dialog darf schließen).
    await wrapper.get('button.color-field__swatch').trigger('keydown', { key: 'Escape' });
    expect(dialogSawEscape).toBe(true);
  });

  it('nennt das Feld über label oder die Übersetzung', async () => {
    const named = mountField({ label: 'Textfarbe' });
    expect(named.get('.color-field__sr').text()).toBe('Textfarbe #ff8800');
    named.unmount();
    wrapper = null;
    const unnamed = mountField();
    expect(unnamed.get('.color-field__sr').text()).toBe('Farbe wählen #ff8800');
  });

  it('teleportiert das Panel wahlweise in ein eigenes Portal-Element', async () => {
    const portal = document.createElement('div');
    portal.id = 'cf-portal';
    document.body.appendChild(portal);
    const w = mountField({ teleportTo: '#cf-portal' });
    await openPanel(w);
    expect(portal.querySelector('.color-field__panel')).not.toBeNull();
    expect(document.body.querySelector(':scope > .color-field__panel')).toBeNull();
  });
});
