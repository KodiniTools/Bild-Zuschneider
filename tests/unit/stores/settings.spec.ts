import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { i18n } from '@/i18n';
import { useSettingsStore } from '@/stores/settings';

/** Ausschnitt der globalen SSI-Navigation (nav.html) mit den Attributen, die der Store pflegt. */
const NAV = `
  <nav class="global-nav">
    <ul data-i18n-aria="aria.mainNav"></ul>
    <a data-i18n="nav.imageTools">Bildtools</a>
    <button class="global-nav-theme-icon" data-i18n-title="aria.toggleTheme"></button>
    <button class="global-nav-lang-btn active" data-lang="de">DE</button>
    <button class="global-nav-lang-btn" data-lang="en">EN</button>
  </nav>`;

describe('Settings-Store', () => {
  let store: ReturnType<typeof useSettingsStore>;

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = NAV;
    document.documentElement.removeAttribute('data-theme');
    i18n.global.locale.value = 'de';
    setActivePinia(createPinia());
    store = useSettingsStore();
  });

  afterEach(() => store.stopListening());

  it('startet ohne gespeichertes Theme hell und setzt data-theme sofort', () => {
    expect(store.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.body.classList.contains('light-theme')).toBe(true);
  });

  it('speichert Themewechsel unter "theme" und tauscht das Nav-Icon', async () => {
    store.toggleTheme();
    await nextTick();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.body.classList.contains('light-theme')).toBe(false);
    expect(document.querySelector('.global-nav-theme-icon')!.textContent).toBe('☀️');
  });

  it('folgt einem Themewechsel der globalen Navigation (html[data-theme])', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    await new Promise((resolve) => setTimeout(resolve, 0)); // MutationObserver
    expect(store.theme).toBe('dark');
  });

  it('folgt dem locale-changed-Event der Navigation und übersetzt sie', async () => {
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: 'en' } }));
    await nextTick();
    expect(store.locale).toBe('en');
    expect(i18n.global.locale.value).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('locale')).toBe('en');
    expect(document.querySelector('[data-i18n="nav.imageTools"]')!.textContent).toBe('Image Tools');
    expect(document.querySelector('[data-i18n-aria]')!.getAttribute('aria-label')).toBe(
      'Main navigation'
    );
    const active = [...document.querySelectorAll('.global-nav-lang-btn.active')];
    expect(active.map((btn) => btn.getAttribute('data-lang'))).toEqual(['en']);
  });

  it('ignoriert unbekannte Sprachen', async () => {
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: 'fr' } }));
    await nextTick();
    expect(store.locale).toBe('de');
  });
});
