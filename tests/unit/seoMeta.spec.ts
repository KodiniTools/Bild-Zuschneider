import { beforeEach, describe, expect, it } from 'vitest';
import { BASE_URL, fullTitle, updateSeoMeta, type RouteSeo } from '@/composables/useSeoMeta';
import { routes } from '@/router';

const seo: RouteSeo = {
  path: '/faq',
  title: 'Häufige Fragen',
  description: 'Beschreibung DE',
  en: { title: 'FAQ', description: 'Description EN' },
};

const attr = (selector: string, name: string) =>
  document.head.querySelector(selector)?.getAttribute(name);

describe('updateSeoMeta', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('setzt Titel, Description, Canonical und hreflang auf Deutsch', () => {
    updateSeoMeta(seo, 'de');
    expect(document.title).toBe('Häufige Fragen – Bild-Zuschneider | KodiniTools');
    expect(document.documentElement.lang).toBe('de');
    expect(attr('meta[name="description"]', 'content')).toBe('Beschreibung DE');
    expect(attr('link[rel="canonical"]', 'href')).toBe(`${BASE_URL}/faq`);
    expect(attr('link[hreflang="en"]', 'href')).toBe(`${BASE_URL}/faq?lang=en`);
    expect(attr('link[hreflang="x-default"]', 'href')).toBe(`${BASE_URL}/faq`);
    expect(attr('meta[property="og:locale"]', 'content')).toBe('de_DE');
    expect(attr('meta[name="robots"]', 'content')).toBe('index, follow');
  });

  it('nutzt auf Englisch die EN-Texte und ?lang=en, ohne Tags zu verdoppeln', () => {
    updateSeoMeta(seo, 'de');
    updateSeoMeta(seo, 'en');
    expect(document.title).toBe(fullTitle('FAQ', 'en'));
    expect(document.title).toContain('Image Cropper');
    expect(attr('link[rel="canonical"]', 'href')).toBe(`${BASE_URL}/faq?lang=en`);
    expect(attr('meta[property="og:description"]', 'content')).toBe('Description EN');
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('link[rel="alternate"]')).toHaveLength(3);
  });

  it('setzt noindex für nicht indexierbare Seiten', () => {
    updateSeoMeta({ ...seo, noIndex: true }, 'de');
    expect(attr('meta[name="robots"]', 'content')).toBe('noindex, nofollow');
  });
});

describe('SEO-Meta der Routen', () => {
  it('hat für jede Route DE- und EN-Texte', () => {
    for (const route of routes) {
      const meta = route.meta?.seo;
      expect(meta, String(route.name)).toBeDefined();
      expect(
        meta!.title && meta!.description && meta!.en.title && meta!.en.description
      ).toBeTruthy();
    }
  });

  it('hat eindeutige Pfade und Titel', () => {
    const seos = routes.map((route) => route.meta!.seo!);
    expect(new Set(seos.map((s) => s.path)).size).toBe(seos.length);
    expect(new Set(seos.map((s) => s.title)).size).toBe(seos.length);
    expect(new Set(seos.map((s) => s.en.title)).size).toBe(seos.length);
  });

  it('indexiert nur die 404-Seite nicht', () => {
    expect(routes.filter((route) => route.meta?.seo?.noIndex).map((r) => r.name)).toEqual([
      'not-found',
    ]);
  });
});
