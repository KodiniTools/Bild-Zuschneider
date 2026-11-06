// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('vite.config.ts', () => {
  it('liefert die App unter /bild-zuschneider/ aus (Server-Pfad, nicht ändern)', () => {
    const source = readFileSync(join(__dirname, '..', '..', 'vite.config.ts'), 'utf8');
    expect(source).toMatch(/^\s*base: '\/bild-zuschneider\/',$/m);
  });
});
