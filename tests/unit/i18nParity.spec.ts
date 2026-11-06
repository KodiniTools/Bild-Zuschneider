/** Parität der TS-Übersetzungen (Muster: Collage-Maker src/tests/i18nParity.spec.ts) */
import { describe, expect, it } from 'vitest';
import de from '@/i18n/de';
import en from '@/i18n/en';
import { ssiNavTranslations } from '@/i18n/nav';
import { i18n } from '@/i18n';

type Tree = string | Tree[] | { [key: string]: Tree };

/** Flacht verschachtelte Texte zu `pfad → text` ab (Arrays mit Index im Pfad). */
function flatten(node: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof node === 'string') {
    out.set(prefix, node);
    return out;
  }
  const entries = Array.isArray(node)
    ? node.map((value, index) => [String(index), value] as const)
    : Object.entries(node);
  for (const [key, value] of entries) {
    for (const [path, text] of flatten(value, prefix ? `${prefix}.${key}` : key)) {
      out.set(path, text);
    }
  }
  return out;
}

/** Benannte Platzhalter wie `{count}`, sortiert. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).sort();
}

const deFlat = flatten(de as unknown as Tree);
const enFlat = flatten(en as unknown as Tree);

describe('i18n-Parität', () => {
  it('kein Text ist leer (außer bewusst leeren Satzteilen)', () => {
    const intentionallyEmpty: string[] = [];
    const empty = [
      ...[...deFlat].map(([key, text]) => [`de:${key}`, text] as const),
      ...[...enFlat].map(([key, text]) => [`en:${key}`, text] as const),
    ]
      .filter(([, text]) => text.trim() === '')
      .map(([key]) => key);
    expect(empty).toEqual(intentionallyEmpty);
  });

  it('DE und EN haben dieselben Schlüssel', () => {
    expect([...enFlat.keys()].sort()).toEqual([...deFlat.keys()].sort());
  });

  it('Platzhalter stimmen je Schlüssel überein', () => {
    const mismatched = [...deFlat]
      .filter(([key, text]) => {
        const other = enFlat.get(key);
        return other !== undefined && placeholders(text).join() !== placeholders(other).join();
      })
      .map(([key]) => key);
    expect(mismatched).toEqual([]);
  });

  it('SSI-Navigation: DE und EN haben dieselben Schlüssel', () => {
    expect(Object.keys(ssiNavTranslations.en!).sort()).toEqual(
      Object.keys(ssiNavTranslations.de!).sort()
    );
  });

  it('vue-i18n nutzt die TS-Texte, Fallback bleibt DE', () => {
    expect(i18n.global.availableLocales.sort()).toEqual(['de', 'en']);
    expect(i18n.global.fallbackLocale.value).toBe('de');
    expect(i18n.global.getLocaleMessage('de')).toEqual(de);
    expect(i18n.global.getLocaleMessage('en')).toEqual(en);
  });
});
