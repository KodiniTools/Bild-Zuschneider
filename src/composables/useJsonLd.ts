import { onBeforeUnmount, watch, type Ref } from 'vue';

/**
 * Strukturierte Daten (JSON-LD) für die aktuelle Seite (Muster: Bildkonverter
 * FaqView). Legt ein <script type="application/ld+json"> mit fester id im <head> an,
 * aktualisiert es bei Sprachwechsel und entfernt es beim Verlassen der Seite –
 * Google verlangt, dass z. B. FAQ-Daten zum sichtbaren Inhalt passen.
 */
export function useJsonLd(id: string, data: Ref<Record<string, unknown>>) {
  function write(value: Record<string, unknown>) {
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(value);
  }

  watch(data, write, { immediate: true, deep: true });
  onBeforeUnmount(() => document.getElementById(id)?.remove());
}
