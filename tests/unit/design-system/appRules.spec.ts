// @vitest-environment node
/**
 * App-eigene Regeln des Bild-Zuschneiders (Muster: Bildkonverter, tests/unit/designTokens.spec.js).
 * Ergänzt designTokens.spec.ts (Literale, Radien, Schatten, z-index) um Regeln für
 * Overlays, Icons, Bedienelemente und die Basis-Styles.
 * Der Block „SSI-Partials“ in global.scss wird ab Schritt 3 hier mitgeprüft.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '../../../src');
const read = (path: string) => readFileSync(join(SRC, path), 'utf8');

function collectFiles(dir: string, extensions: string[], out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectFiles(full, extensions, out);
    else if (extensions.some((ext) => entry.endsWith(ext))) out.push(full);
  }
  return out;
}

/** Datei:Zeile aller Treffer in .vue-Templates (ohne <script>/<style>). */
function findInTemplates(pattern: RegExp, filter: (file: string) => boolean = () => true) {
  const hits: string[] = [];
  for (const file of collectFiles(SRC, ['.vue']).filter(filter)) {
    const text = readFileSync(file, 'utf8');
    const template = text.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, (block) =>
      block.replace(/[^\n]/g, '')
    );
    template.split('\n').forEach((line, index) => {
      if (pattern.test(line)) hits.push(`${relative(SRC, file)}:${index + 1}: ${line.trim()}`);
    });
  }
  return hits;
}

/** Datei:Zeile aller Treffer in .ts/.vue-Quelltext. */
function findInSource(pattern: RegExp, filter: (file: string) => boolean = () => true) {
  const hits: string[] = [];
  for (const file of collectFiles(SRC, ['.ts', '.vue']).filter(filter)) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        if (pattern.test(line)) hits.push(`${relative(SRC, file)}:${index + 1}: ${line.trim()}`);
      });
  }
  return hits;
}

const outsideUi = (file: string) => !relative(SRC, file).startsWith(join('components', 'ui'));

describe('Overlays', () => {
  it('teleportieren nie nach body', () => {
    expect(findInTemplates(/<Teleport\s[^>]*to="body"/)).toEqual([]);
    expect(findInSource(/teleportTo:\s*'body'/)).toEqual([]);
  });

  it('haben #overlay-root in index.html als Ziel', () => {
    const html = readFileSync(join(SRC, '..', 'index.html'), 'utf8');
    expect(html).toMatch(/<div id="overlay-root"><\/div>/);
    expect(read('components/ui/UiDialog.vue')).toContain("teleportTo: '#overlay-root'");
    expect(read('components/ui/ColorField.vue')).toMatch(/teleportTo:\s*'#overlay-root'/);
  });
});

describe('Bedienelemente', () => {
  it('nutzen außerhalb von components/ui keine nativen Selects, Checkboxen, Regler oder Farbfelder', () => {
    expect(findInTemplates(/<select\b/, outsideUi)).toEqual([]);
    expect(findInTemplates(/<input\b[^>]*type="(checkbox|range|color|radio)"/, outsideUi)).toEqual(
      []
    );
  });
});

describe('Icons', () => {
  it('kommen nur über AppIcon/iconMap aus lucide-vue-next', () => {
    expect(findInSource(/from 'lucide-vue-next'/, (file) => !file.endsWith('iconMap.ts'))).toEqual(
      []
    );
  });

  it('nutzen kein Font Awesome', () => {
    expect(findInTemplates(/\bfa[srb]?\s+fa-|class="[^"]*\bfa-/)).toEqual([]);
  });
});

describe('Basis-Styles (global.scss)', () => {
  const global = read('styles/global.scss');
  const faces = (global.match(/@font-face\s*{[^}]*}/g) ?? []).filter((face) =>
    /font-family:\s*'Supreme'/.test(face)
  );

  it.each([400, 500, 700])('deklariert @font-face für Supreme %i', (weight) => {
    const face = faces.find((f) => new RegExp(`font-weight:\\s*${weight}\\b`).test(f));
    expect(face, `Kein @font-face für Supreme ${weight}`).toBeDefined();
    expect(face).toMatch(/@\/assets\/fonts\/Supreme-(Regular|Medium|Bold)\.woff2/);
  });

  it('setzt Grundgröße, Schrift und Flächen des Body aus den Tokens', () => {
    expect(global).toMatch(/body \{[^}]*font-family: var\(--ds-font-sans\)/);
    expect(global).toMatch(/body \{[^}]*font-size: var\(--ds-text-lg\)/);
    expect(global).toMatch(/body \{[^}]*background: var\(--ds-surface-0\)/);
  });

  it('hat keine Dark-Overrides (Dark liegt auf :root, Light auf data-theme=light)', () => {
    // Einzige Ausnahme (wie im Collage Maker): das Bootstrap-Toggler-Icon der
    // SSI-Navigation ist ein Hintergrundbild und wird im Dark-Theme invertiert.
    const overrides = global
      .split('\n')
      .filter((line) => /data-theme=['"]?dark/.test(line) && !line.includes('toggler-icon'));
    expect(overrides).toEqual([]);
  });
});

describe('SSI-Partials (global.scss)', () => {
  const global = read('styles/global.scss');

  it('übernimmt wie der Collage Maker Seitenfläche und Textfarben aus den Tokens', () => {
    expect(global).toMatch(/background-color: transparent !important/);
    expect(global).toMatch(
      /\[class\*='drop'\][\s\S]*?background-color: var\(--ds-surface-1\) !important/
    );
    expect(global).toMatch(/color: var\(--ds-text\) !important/);
    expect(global).toMatch(/color: var\(--ds-link\) !important/);
    expect(global).toMatch(/color: var\(--ds-accent\) !important/);
  });

  it('nimmt #overlay-root in jedem Partial-Selektor aus', () => {
    const selectors = global.match(/body\s*>\s*:not\(#app\)[^,{]*/g) ?? [];
    expect(selectors.length).toBeGreaterThan(10);
    for (const selector of selectors) expect(selector).toContain(':not(#overlay-root)');
  });

  it('hebt #overlay-root über die Navigation (z-index --ds-z-toast)', () => {
    expect(global).toMatch(
      /#overlay-root \{\s*position: relative;\s*z-index: var\(--ds-z-toast\);/
    );
  });
});
