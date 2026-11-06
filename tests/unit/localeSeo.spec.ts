import { describe, expect, it } from 'vitest';
import { isLocale, localeUrls, localizedUrl, resolveInitialLocale } from '@/utils/localeSeo';

describe('localeSeo', () => {
  it.each([
    ['?lang=en', 'de', 'en'],
    ['?lang=de', 'en', 'de'],
    ['', 'en', 'en'],
    ['', null, 'de'],
    ['?lang=fr', 'xx', 'de'],
    ['?foo=1&lang=en', null, 'en'],
  ])('Startsprache bei search=%s, gespeichert=%s → %s', (search, stored, expected) => {
    expect(resolveInitialLocale(search, stored)).toBe(expected);
  });

  it('erkennt nur de und en', () => {
    expect(isLocale('de')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  it('Englisch bekommt ?lang=en, Deutsch keinen Parameter', () => {
    expect(localizedUrl('https://x.test/a', 'de')).toBe('https://x.test/a');
    expect(localizedUrl('https://x.test/a', 'en')).toBe('https://x.test/a?lang=en');
  });

  it('liefert Canonical je Sprache und hreflang de/en/x-default', () => {
    const { canonical, alternates } = localeUrls('https://x.test/faq', 'en');
    expect(canonical).toBe('https://x.test/faq?lang=en');
    expect(alternates).toEqual([
      { hreflang: 'de', href: 'https://x.test/faq' },
      { hreflang: 'en', href: 'https://x.test/faq?lang=en' },
      { hreflang: 'x-default', href: 'https://x.test/faq' },
    ]);
  });
});
