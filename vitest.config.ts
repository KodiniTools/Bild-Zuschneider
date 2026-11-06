import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

/**
 * Chromium für den Browser-Modus finden (Muster: Bildkonverter).
 * Normalfall: `npx playwright install chromium` – Playwright findet den Browser selbst.
 * Fallback: ein vorhandenes Chromium unter PLAYWRIGHT_BROWSERS_PATH, dessen Build-Nummer
 * nicht zur Playwright-Version passt. Explizit per VITEST_CHROMIUM setzbar.
 */
function findChromium(): string | undefined {
  if (process.env.VITEST_CHROMIUM) return process.env.VITEST_CHROMIUM;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !fs.existsSync(root)) return undefined;
  const dir = fs
    .readdirSync(root)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort()
    .at(-1);
  if (!dir) return undefined;
  const candidate = ['chrome-linux64', 'chrome-linux']
    .map((sub) => path.join(root, dir, sub, 'chrome'))
    .find((file) => fs.existsSync(file));
  return candidate;
}

const shared = {
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  css: {
    preprocessorOptions: { scss: { api: 'modern-compiler' as const, quietDeps: true } },
  },
};

export default defineConfig({
  ...shared,
  test: {
    projects: [
      {
        // Reine Logik und Komponenten ohne Canvas: schnell, in happy-dom
        ...shared,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: ['tests/unit/**/*.spec.ts'],
          setupFiles: ['tests/unit/setup.ts'],
        },
      },
      {
        // Alles, was einen echten Canvas braucht (Export, Rotation)
        ...shared,
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.spec.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            screenshotFailures: false,
            instances: [
              {
                browser: 'chromium',
                launch: { executablePath: findChromium(), args: ['--no-sandbox'] },
              },
            ],
          },
        },
      },
    ],
  },
});
