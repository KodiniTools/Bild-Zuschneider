import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { i18n } from '@/i18n';
import { ssiNavTranslations } from '@/i18n/nav';
import { isLocale, type Locale } from '@/utils/localeSeo';

export type Theme = 'light' | 'dark';

function readTheme(): Theme {
  try {
    return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Speicher gesperrt: Einstellung gilt nur für diesen Aufruf
  }
}

/**
 * Theme und Sprache (Muster: Collage-Maker, src/stores/settings.ts).
 *
 * Quelle der Wahrheit ist dieser Store; die globale SSI-Navigation wird synchron
 * gehalten: Sie meldet Sprachwechsel per `locale-changed`-Event und Themewechsel
 * über html[data-theme] (MutationObserver). Keys wie in der Nav: 'theme', 'locale'.
 */
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>(readTheme());
  const locale = ref<Locale>(i18n.global.locale.value as Locale);

  let themeObserver: MutationObserver | null = null;
  let ignoreMutation = false;

  // html[data-theme] schaltet die Tokens (--ds-*) und die SSI-Navigation;
  // body.light-theme hält Parität zu den Light-Selektoren in tokens-v2.css.
  watch(
    theme,
    (newTheme) => {
      store('theme', newTheme);
      ignoreMutation = true;
      document.documentElement.setAttribute('data-theme', newTheme);
      document.body.classList.toggle('light-theme', newTheme === 'light');
      ignoreMutation = false;
      // Mond/Sonne der SSI-Navigation
      document.querySelectorAll('.global-nav-theme-icon').forEach((icon) => {
        icon.textContent = newTheme === 'light' ? '🌙' : '☀️';
      });
    },
    { immediate: true }
  );

  // Sprache: localStorage, html[lang], vue-i18n und SSI-Navigation
  watch(
    locale,
    (newLocale) => {
      store('locale', newLocale);
      document.documentElement.setAttribute('lang', newLocale);
      i18n.global.locale.value = newLocale;
      syncNavLangButtons(newLocale);
      translateSsiNav(newLocale);
    },
    { immediate: true }
  );

  function onLocaleChanged(e: Event) {
    const next = (e as CustomEvent<{ locale?: string }>).detail?.locale;
    if (isLocale(next) && next !== locale.value) locale.value = next;
  }

  /** Übersetzt die SSI-Navigation über ihre data-i18n-Attribute. */
  function translateSsiNav(lang: Locale) {
    const texts = ssiNavTranslations[lang] ?? ssiNavTranslations.de ?? {};
    const nav = document.querySelector('.global-nav');
    if (!nav) return;
    nav.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key && texts[key]) el.textContent = texts[key];
    });
    nav.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (key && texts[key]) el.setAttribute('aria-label', texts[key]);
    });
    nav.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key && texts[key]) el.setAttribute('title', texts[key]);
    });
  }

  /** Aktive Sprache in den Sprach-Buttons der SSI-Navigation markieren. */
  function syncNavLangButtons(lang: Locale) {
    document.querySelectorAll('.global-nav-lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  function startListening() {
    window.addEventListener('locale-changed', onLocaleChanged);
    themeObserver = new MutationObserver((mutations) => {
      if (ignoreMutation) return;
      for (const m of mutations) {
        if (m.attributeName !== 'data-theme') continue;
        const next = document.documentElement.getAttribute('data-theme');
        if ((next === 'light' || next === 'dark') && next !== theme.value) theme.value = next;
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  function stopListening() {
    window.removeEventListener('locale-changed', onLocaleChanged);
    themeObserver?.disconnect();
    themeObserver = null;
  }

  startListening();

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }

  function setLocale(next: Locale) {
    locale.value = next;
  }

  return { theme, locale, toggleTheme, setLocale, startListening, stopListening };
});
