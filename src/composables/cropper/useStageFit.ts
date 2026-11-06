import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import type { Size } from '@/lib/geometry';

/** Größte Darstellungsvergrößerung kleiner Bilder (sonst unscharf und riesig). */
export const MAX_UPSCALE = 4;

/**
 * Anzeigegröße des Bildes in der Bühne: passt in die Breite des Containers und in
 * `maxHeight` (CSS-Pixel), behält das Seitenverhältnis. Reagiert auf Größenänderungen.
 */
export function fitScale(image: Size, available: Size): number {
  if (!image.width || !image.height || available.width <= 0 || available.height <= 0) return 0;
  return Math.min(available.width / image.width, available.height / image.height, MAX_UPSCALE);
}

export function useStageFit(container: Ref<HTMLElement | null>, image: Ref<Size>) {
  const available = ref<Size>({ width: 0, height: 0 });
  const scale = ref(0);
  let observer: ResizeObserver | null = null;

  function measure() {
    const el = container.value;
    if (!el) return;
    // Höhe: sichtbarer Bereich abzüglich etwas Luft für Kopfzeile und Steuerung
    const maxHeight = Math.max(240, Math.round(window.innerHeight * 0.7));
    available.value = { width: el.clientWidth, height: maxHeight };
    scale.value = fitScale(image.value, available.value);
  }

  onMounted(() => {
    measure();
    if (typeof ResizeObserver !== 'undefined' && container.value) {
      observer = new ResizeObserver(measure);
      observer.observe(container.value);
    }
    window.addEventListener('resize', measure);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    window.removeEventListener('resize', measure);
  });

  watch(image, measure);

  return { scale, measure };
}
