import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import {
  configureVueProject,
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript';

// Neubau: .vue-Dateien nutzen ausschließlich <script setup lang="ts">.
configureVueProject({ scriptLangs: ['ts'] });

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,cjs,mjs,ts,mts,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'public/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'playwright.local.config.ts',
    ],
  },
  {
    name: 'app/globals',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
  },
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  prettierRecommended,
  {
    name: 'app/rules',
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // App-Code nutzt später den Logger, keine direkte Konsole
      'no-console': 'error',
      'prefer-const': 'error',
    },
  },
  {
    // Node-Skripte, Konfiguration und Tests dürfen direkt auf die Konsole schreiben
    name: 'app/node-scripts-and-tests',
    files: ['*.{js,cjs,mjs,ts}', 'tests/**/*.ts', 'e2e/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    // UI-Bausteine (Kopie aus Bildkonverter/Collage Maker): optionale Props sind per
    // TypeScript optional, ein explizites `undefined`-Default bringt nichts.
    name: 'app/ui-components',
    files: ['src/components/ui/**/*.vue'],
    rules: { 'vue/require-default-prop': 'off' },
  },
  {
    // Tests dürfen kleine Host-Komponenten inline definieren
    name: 'app/tests-inline-components',
    files: ['tests/**/*.ts'],
    rules: { 'vue/one-component-per-file': 'off' },
  }
);
