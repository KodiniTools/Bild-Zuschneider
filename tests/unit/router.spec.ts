import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { routes } from '@/router';

describe('Router', () => {
  const router = createRouter({ history: createMemoryHistory(), routes });

  it.each([
    ['/', 'home'],
    ['/guide', 'guide'],
    ['/faq', 'faq'],
    ['/about', 'about'],
    ['/gibt-es-nicht', 'not-found'],
  ])('löst %s zur Route %s auf', (path, name) => {
    expect(router.resolve(path).name).toBe(name);
  });

  it('hat eindeutige Routennamen', () => {
    const names = routes.map((route) => route.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
