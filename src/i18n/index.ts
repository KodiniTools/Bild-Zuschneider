import { createI18n } from 'vue-i18n';
import de from './de';
import en from './en';

/**
 * i18n-Konfiguration – Übersetzungen je Sprache in de.ts und en.ts.
 * Startsprache (?lang=, localStorage 'locale') und SSI-Nav-Texte folgen in Schritt 3;
 * bis dahin startet die App auf Deutsch.
 */
export const i18n = createI18n({
  legacy: false,
  locale: 'de',
  fallbackLocale: 'de',
  messages: { de, en },
});

export default i18n;
