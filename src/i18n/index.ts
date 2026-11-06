import { createI18n } from 'vue-i18n';
import de from './de';
import en from './en';
import { resolveInitialLocale, type Locale } from '@/utils/localeSeo';

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Startsprache: ?lang=de|en (hreflang-Ziel), dann 'locale' (globale Nav), sonst Deutsch. */
export function initialLocale(): Locale {
  return resolveInitialLocale(globalThis.location?.search ?? '', readStored('locale'));
}

/**
 * i18n-Konfiguration – die Übersetzungen liegen je Sprache in de.ts und en.ts,
 * die Texte der SSI-Navigation in nav.ts.
 */
const startLocale = initialLocale();
// Speichern, damit die globale Nav (liest 'locale') dieselbe Sprache zeigt
try {
  localStorage.setItem('locale', startLocale);
} catch {
  // Speicher gesperrt: Sprache gilt nur für diesen Aufruf
}

export const i18n = createI18n({
  legacy: false,
  locale: startLocale,
  fallbackLocale: 'de',
  messages: { de, en },
});

export default i18n;
