import { onBeforeUnmount, onMounted, type Ref } from 'vue';

/**
 * Hält ein (sticky) Element höchstens so hoch wie der sichtbare Rest des Fensters
 * unterhalb seiner Oberkante: `max-height = innerHeight − max(top, stickyTop) − gap`.
 * So passt es schon vor dem Scrollen ganz ins Fenster (Kopfzeile, globale Navigation
 * darüber) und nach dem Andocken bei `stickyTop` ebenso. Nur solange `query` zutrifft;
 * sonst wird die Höhe freigegeben. Aktualisiert bei Scrollen und Größenänderung
 * (einmal je Frame).
 */
export function useViewportFit(
  element: Ref<HTMLElement | null>,
  options: { query: string; stickyTop: number; gap: number }
) {
  let frame = 0;
  let media: MediaQueryList | null = null;

  function update() {
    frame = 0;
    const el = element.value;
    if (!el) return;
    if (!media?.matches) {
      el.style.removeProperty('max-height');
      return;
    }
    const top = Math.max(el.getBoundingClientRect().top, options.stickyTop);
    el.style.maxHeight = `${Math.max(240, window.innerHeight - top - options.gap)}px`;
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  onMounted(() => {
    media = window.matchMedia(options.query);
    media.addEventListener('change', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
  });

  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame);
    media?.removeEventListener('change', schedule);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
  });

  return { update };
}
