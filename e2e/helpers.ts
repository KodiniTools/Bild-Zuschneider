import type { Page } from '@playwright/test';

export type Locale = 'de' | 'en';
export type Theme = 'dark' | 'light';

/** Setzt Sprache und Theme vor dem ersten Skript der Seite (wie die SSI-Navigation). */
export async function prepare(page: Page, locale: Locale, theme: Theme = 'light'): Promise<void> {
  await page.addInitScript(
    ([l, t]) => {
      localStorage.setItem('locale', l);
      localStorage.setItem('theme', t);
    },
    [locale, theme] as const
  );
}

/**
 * Ressourcen, die nur auf dem Server existieren (Root-Favicon von kodinitools.com).
 * Lokal liefern Dev-Server und `vite preview` dafür 404.
 */
const SERVER_ONLY = [/\/favicon\.ico$/];

/**
 * Sammelt unbehandelte Seitenfehler und Konsolenfehler für eine abschließende Prüfung.
 * Ladefehler von Ressourcen, die nur auf dem Server liegen, zählen nicht.
 */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const url = message.location().url;
    if (SERVER_ONLY.some((pattern) => pattern.test(url))) return;
    errors.push(`console: ${message.text()} (${url})`);
  });
  return errors;
}
