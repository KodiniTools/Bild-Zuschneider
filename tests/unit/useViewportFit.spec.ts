import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { useViewportFit } from '@/composables/useViewportFit';

function host(matches: boolean, top: number) {
  vi.stubGlobal('matchMedia', () => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal('innerHeight', 800);
  let api: ReturnType<typeof useViewportFit>;
  const el = ref<HTMLElement | null>(null);
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useViewportFit(el, { query: '(min-width: 901px)', stickyTop: 16, gap: 16 });
        return () => h('div', { ref: el });
      },
    }),
    { attachTo: document.body }
  );
  el.value!.getBoundingClientRect = () => ({ top }) as DOMRect;
  api!.update();
  return { wrapper, el: el.value! };
}

describe('useViewportFit', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('begrenzt auf den sichtbaren Rest unter der Oberkante', () => {
    const { el, wrapper } = host(true, 210);
    expect(el.style.maxHeight).toBe('574px'); // 800 − 210 − 16
    wrapper.unmount();
  });

  it('nach dem Andocken zählt stickyTop', () => {
    const { el, wrapper } = host(true, -300);
    expect(el.style.maxHeight).toBe('768px'); // 800 − 16 − 16
    wrapper.unmount();
  });

  it('gibt die Höhe frei, wenn die Media-Query nicht zutrifft', () => {
    const { el, wrapper } = host(false, 210);
    expect(el.style.maxHeight).toBe('');
    wrapper.unmount();
  });
});
