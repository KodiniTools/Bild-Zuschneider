// @vitest-environment node
/**
 * Regressionsschutz für das Design-System v2 über ALLE Styles in src/
 * (Kopie aus KodiniTools/Bildkonverter, tests/unit/design-system/designTokens.spec.ts, dort aus
 * dem Collage Maker; App-eigene Regeln in tests/unit/design-system/appRules.spec.ts).
 * Literale gehören nur nach src/design-system/; Komponenten und Stylesheets
 * laufen auf --ds-* Tokens. Anders als in der Vorlage werden auch .scss-Dateien geprüft.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '../../../src');
const SKIP = ['design-system', '__tests__'];

/**
 * Bewusste Ausnahmen, je mit Begründung. Format: `datei: fund` wie in den Treffern.
 * Neubau: Es gibt keine Altlasten; jede Ausnahme braucht eine fachliche Begründung.
 * Beim Verschieben einer Datei die Ausnahme mit anpassen.
 */
const ALLOWED_COLORS = new Set([
  // Farbton-Regler: das Farbspektrum ist der Inhalt, kein Token denkbar
  'components/ui/SliderField.vue: hsl(0, 100%, 50%)',
  'components/ui/SliderField.vue: hsl(60, 100%, 50%)',
  'components/ui/SliderField.vue: hsl(120, 100%, 50%)',
  'components/ui/SliderField.vue: hsl(180, 100%, 50%)',
  'components/ui/SliderField.vue: hsl(240, 100%, 50%)',
  'components/ui/SliderField.vue: hsl(300, 100%, 50%)',
  'components/ui/SliderField.vue: hsl(360, 100%, 50%)',
]);
const ALLOWED_GRADIENTS = new Set([
  // Farbton- und Temperatur-Regler zeigen ihren Wertebereich als Verlauf
  'components/ui/SliderField.vue: linear-gradient( to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%,',
  'components/ui/SliderField.vue: linear-gradient( 90deg, var(--ds-info) 0%, var(--ds-border-strong) 50%, var(--ds',
]);
const ALLOWED_FONT_SIZES = new Set<string>([]);
const ALLOWED_FONT_FAMILIES = new Set<string>([]);
const ALLOWED_RADII = new Set<string>([]);
const ALLOWED_SHADOWS = new Set<string>([]);
const ALLOWED_Z_INDEX = new Set([
  // SSI-Block 1:1 aus dem Collage Maker: Cookie-Banner liegt über Nav (100) und Overlays (9999)
  'styles/global.scss: z-index: 10000',
]);

function collect(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (SKIP.some((s) => full.includes(s))) continue;
    if (statSync(full).isDirectory()) collect(full, out);
    else if (['.vue', '.css', '.scss'].some((ext) => entry.endsWith(ext))) out.push(full);
  }
  return out;
}

/** Alle Style-Blöcke als [datei, css]; Kommentare und @font-face ausgeblendet. */
const sheets: ReadonlyArray<readonly [string, string]> = collect(SRC).flatMap((file) => {
  const source = readFileSync(file, 'utf8');
  const blocks = file.endsWith('.vue')
    ? [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1] ?? '')
    : [source];
  return blocks.map(
    (css) =>
      [
        relative(SRC, file),
        css
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/(^|[^:])\/\/.*$/gm, '$1')
          .replace(/@font-face\s*\{[^}]*\}/g, ''),
      ] as const
  );
});

/** Treffer `datei: fund` für ein Muster (mit g-Flag) in allen Style-Blöcken. */
function find(pattern: RegExp, keep: (m: RegExpMatchArray) => boolean = () => true): string[] {
  const hits: string[] = [];
  for (const [file, css] of sheets) {
    for (const m of css.matchAll(pattern)) {
      if (keep(m)) hits.push(`${file}: ${m[0].trim().replace(/\s+/g, ' ').slice(0, 80)}`);
    }
  }
  return hits;
}

/** Deklarationen `--name: value` des ersten Top-Level-Blocks mit genau diesem Selektor. */
function block(source: string, selector: string): Map<string, string> {
  const escaped = selector.replace(/[[\]'.]/g, '\\$&');
  const match = source.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  expect(match, `Block ${selector}`).not.toBeNull();
  const body = (match?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = new Map<string, string>();
  for (const decl of body.split(';')) {
    const i = decl.indexOf(':');
    if (i === -1) continue;
    const name = decl.slice(0, i).trim();
    if (name.startsWith('--'))
      tokens.set(
        name,
        decl
          .slice(i + 1)
          .replace(/\s+/g, ' ')
          .trim()
      );
  }
  return tokens;
}

const refs = (value: string): string[] =>
  [...value.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1] ?? '');

const NEUTRAL =
  /^(#fff|#ffffff|#000|#000000)$|^rgba?\(\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255|0 0 0|255 255 255)\b/;

describe('Design-Tokens in allen Styles', () => {
  it('keine Farbliterale außer Weiß/Schwarz(-Tönungen)', () => {
    const hits = find(
      /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi,
      (m) => !NEUTRAL.test(m[0].toLowerCase())
    ).filter((hit) => !ALLOWED_COLORS.has(hit));
    expect(hits).toEqual([]);
  });

  it('Schriftgrößen nur aus der Token-Skala', () => {
    const hits = find(/font-size:\s*[0-9.]*[1-9][0-9.]*(px|rem|em)\b/g).filter(
      (hit) => !ALLOWED_FONT_SIZES.has(hit)
    );
    expect(hits).toEqual([]);
  });

  it('Schriftfamilie nur über Tokens', () => {
    const allowed = /^(var\(--ds-font-(sans|mono)\)|inherit)$/;
    const hits = find(/font-family:\s*([^;]+)/g, (m) => !allowed.test((m[1] ?? '').trim())).filter(
      (hit) => !ALLOWED_FONT_FAMILIES.has(hit)
    );
    expect(hits).toEqual([]);
  });

  it('Radien nur über Tokens', () => {
    const hits = find(
      /border(-[a-z]+)*-radius:\s*([^;]+)/g,
      (m) => !/^calc\(/.test((m[2] ?? '').trim()) && /\b[1-9][0-9]*(px|%|rem)/.test(m[2] ?? '')
    ).filter((hit) => !ALLOWED_RADII.has(hit));
    expect(hits).toEqual([]);
  });

  it('Schatten nur als Fokus-Ring, Overlay oder Innenlinie; kein Blur, kein Text-Schatten', () => {
    const shadows = find(/box-shadow:\s*([^;]+)/g, (m) => {
      const value = (m[1] ?? '').replace(/\s*!important$/, '').trim();
      if (['none', 'var(--ds-focus-ring)', 'var(--ds-shadow-overlay)'].includes(value))
        return false;
      if (value === 'inset var(--ds-focus-ring)') return false;
      // 1-px-Rahmen und 2-px-Einfügemarke (Drag & Drop in UiFileList)
      return !/^inset 0 (0 0 1px|-?2px 0) var\(--ds-[\w-]+\)$/.test(value);
    }).filter((hit) => !ALLOWED_SHADOWS.has(hit));
    expect(shadows).toEqual([]);
    expect(
      find(/text-shadow:|backdrop-filter:|drop-shadow\(/g).filter(
        (hit) => !ALLOWED_SHADOWS.has(hit)
      )
    ).toEqual([]);
  });

  it('keine Farbverläufe (Scrims aus Transparent/Schwarz/Weiß ausgenommen)', () => {
    const hits = find(
      /[a-z-]*gradient\([^;]*/g,
      (m) => !/transparent|rgba?\(\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)/.test(m[0])
    ).filter((hit) => !ALLOWED_GRADIENTS.has(hit));
    expect(hits).toEqual([]);
  });

  it('Ebenen über --ds-z-* (numerische z-index nur bis 100)', () => {
    const hits = find(/z-index:\s*([0-9]+)/g, (m) => Number(m[1]) > 100).filter(
      (hit) => !ALLOWED_Z_INDEX.has(hit)
    );
    expect(hits).toEqual([]);
  });

  it('jede genutzte --ds-* Variable ist in tokens-v2.css definiert', () => {
    const tokensCss = readFileSync(join(SRC, 'design-system/tokens-v2.css'), 'utf8');
    const defined = new Set([...tokensCss.matchAll(/(--ds-[\w-]+)\s*:/g)].map((m) => m[1]));
    expect(find(/var\((--ds-[\w-]+)/g, (m) => !defined.has(m[1]))).toEqual([]);
  });
});

describe('Token-Dateien: kein Token verweist auf sich selbst', () => {
  // Ein Zyklus wie `--x: var(--x)` macht die Variable ungültig; das hat im Visualizer
  // am 05.10.2026 das Light Theme gebrochen.
  const cases: ReadonlyArray<readonly [string, string]> = [
    ['tokens-v2.css', ':root'],
    ['tokens-v2.css', '.light-theme'],
    ['tokens-v2.css', ":root[data-theme='light']"],
  ];

  it.each(cases)('%s %s', (file, selector) => {
    const tokens = block(readFileSync(join(SRC, 'design-system', file), 'utf8'), selector);
    expect(tokens.size).toBeGreaterThan(0);
    const cyclic = [...tokens].filter(([name, value]) => refs(value).includes(name));
    expect(cyclic).toEqual([]);
  });
});
