/**
 * Sprachfassungen als eigene URLs (Muster: Bildkonverter, src/utils/localeSeo.js):
 * Deutsch ohne Parameter, Englisch mit ?lang=en. Canonical und hreflang zeigen darauf;
 * beim Start hat ?lang Vorrang vor der gespeicherten Sprache, damit Googlebot
 * (ohne Speicher) unter ?lang=en Englisch sieht.
 */
export type Locale = 'de' | 'en';

export const isLocale = (value: unknown): value is Locale => value === 'de' || value === 'en';

/** Startsprache: ?lang=de|en, dann gespeicherte Wahl, sonst Deutsch. */
export function resolveInitialLocale(search: string, stored: string | null): Locale {
  const fromUrl = new URLSearchParams(search).get('lang');
  if (isLocale(fromUrl)) return fromUrl;
  return isLocale(stored) ? stored : 'de';
}

/** Absolute URL einer Seite in der gewünschten Sprache. */
export function localizedUrl(baseUrl: string, locale: Locale): string {
  return locale === 'en' ? `${baseUrl}?lang=en` : baseUrl;
}

export interface LocaleUrls {
  canonical: string;
  alternates: Array<{ hreflang: 'de' | 'en' | 'x-default'; href: string }>;
}

/** Canonical und hreflang-Ziele (de, en, x-default = de) für eine Seite. */
export function localeUrls(baseUrl: string, locale: Locale): LocaleUrls {
  return {
    canonical: localizedUrl(baseUrl, locale),
    alternates: [
      { hreflang: 'de', href: localizedUrl(baseUrl, 'de') },
      { hreflang: 'en', href: localizedUrl(baseUrl, 'en') },
      { hreflang: 'x-default', href: localizedUrl(baseUrl, 'de') },
    ],
  };
}
