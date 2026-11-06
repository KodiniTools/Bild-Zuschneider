/**
 * SEO-Meta pro Route (Muster: Bildkonverter, src/composables/useSeoMeta.js).
 *
 * Aktualisiert <title>, Description, Canonical, hreflang (de/en/x-default), Open Graph
 * und html[lang] bei jedem Routen- und Sprachwechsel. CSR-SPA: Crawler ohne
 * JavaScript sehen die statischen Werte aus index.html.
 */
import { localeUrls, type Locale } from '@/utils/localeSeo';

export const BASE_URL = 'https://kodinitools.com/bild-zuschneider';
const SITE_NAME = 'KodiniTools';
const APP_NAME: Record<Locale, string> = { de: 'Bild-Zuschneider', en: 'Image Cropper' };

export interface SeoTexts {
  title: string;
  description: string;
}

/** SEO-Felder in `route.meta` (siehe src/router/index.ts). */
export interface RouteSeo extends SeoTexts {
  /** URL-Pfad der Route ohne Base, z. B. '/faq' */
  path: string;
  en: SeoTexts;
  noIndex?: boolean;
}

declare module 'vue-router' {
  interface RouteMeta {
    seo?: RouteSeo;
  }
}

function upsert(selector: string, tag: 'meta' | 'link', attrs: Record<string, string>) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(tag);
    document.head.appendChild(el);
  }
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
}

/** Vollständiger Seitentitel: „Titel – App | KodiniTools“. */
export function fullTitle(title: string, locale: Locale): string {
  return `${title} – ${APP_NAME[locale]} | ${SITE_NAME}`;
}

export function updateSeoMeta(seo: RouteSeo, locale: Locale): void {
  const texts = locale === 'en' ? seo.en : seo;
  const title = fullTitle(texts.title, locale);
  const { canonical, alternates } = localeUrls(`${BASE_URL}${seo.path}`, locale);

  document.documentElement.setAttribute('lang', locale);
  document.title = title;

  upsert('meta[name="description"]', 'meta', { name: 'description', content: texts.description });
  upsert('meta[name="robots"]', 'meta', {
    name: 'robots',
    content: seo.noIndex ? 'noindex, nofollow' : 'index, follow',
  });
  upsert('link[rel="canonical"]', 'link', { rel: 'canonical', href: canonical });
  for (const { hreflang, href } of alternates) {
    upsert(`link[rel="alternate"][hreflang="${hreflang}"]`, 'link', {
      rel: 'alternate',
      hreflang,
      href,
    });
  }

  upsert('meta[property="og:title"]', 'meta', { property: 'og:title', content: title });
  upsert('meta[property="og:description"]', 'meta', {
    property: 'og:description',
    content: texts.description,
  });
  upsert('meta[property="og:url"]', 'meta', { property: 'og:url', content: canonical });
  upsert('meta[property="og:locale"]', 'meta', {
    property: 'og:locale',
    content: locale === 'de' ? 'de_DE' : 'en_US',
  });
  upsert('meta[property="og:locale:alternate"]', 'meta', {
    property: 'og:locale:alternate',
    content: locale === 'de' ? 'en_US' : 'de_DE',
  });
}
