<template>
  <section class="page content-page">
    <h1>{{ t('pages.guide.title') }}</h1>
    <p class="page__lead">{{ t('content.guide.intro') }}</p>

    <ol class="guide-steps">
      <li v-for="(key, index) in STEP_KEYS" :key="key" class="guide-steps__item">
        <span class="guide-steps__number" aria-hidden="true">{{ index + 1 }}</span>
        <div>
          <h2 class="guide-steps__title">{{ t(`content.guide.steps.${key}.title`) }}</h2>
          <p>{{ t(`content.guide.steps.${key}.text`) }}</p>
        </div>
      </li>
    </ol>

    <h2>{{ t('content.guide.keysTitle') }}</h2>
    <p>{{ t('content.guide.keysIntro') }}</p>
    <table class="guide-keys">
      <thead>
        <tr>
          <th scope="col">{{ t('content.guide.keyColumn') }}</th>
          <th scope="col">{{ t('content.guide.actionColumn') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="key in KEY_ROWS" :key="key">
          <td>
            <kbd>{{ t(`content.guide.keys.${key}.keys`) }}</kbd>
          </td>
          <td>{{ t(`content.guide.keys.${key}.action`) }}</td>
        </tr>
      </tbody>
    </table>

    <p class="guide-start">
      <RouterLink :to="{ name: 'home' }" class="guide-start__link">
        <AppIcon name="crop" />
        {{ t('pages.notFound.back') }}
      </RouterLink>
    </p>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { AppIcon } from '@/components/ui';

/** Anleitung: fünf Schritte und Tastenkürzel. */
const { t } = useI18n();

const STEP_KEYS = ['load', 'ratio', 'frame', 'rotate', 'export'] as const;
const KEY_ROWS = ['move', 'resize', 'fine', 'coarse', 'undo', 'redo', 'paste'] as const;
</script>

<style scoped lang="scss">
.guide-steps {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  max-width: 760px;
  margin: 0 0 var(--ds-space-8);
  padding: 0;
  list-style: none;
}

.guide-steps__item {
  display: flex;
  gap: var(--ds-space-4);
  padding: var(--ds-space-5);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-surface-1);

  p {
    margin: 0;
    color: var(--ds-text-2);
  }
}

.guide-steps__number {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-full);
  color: var(--ds-text);
  font-weight: var(--ds-weight-semibold);
}

.guide-steps__title {
  margin-bottom: var(--ds-space-1);
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
}

.guide-keys {
  width: 100%;
  max-width: 760px;
  margin-bottom: var(--ds-space-8);
  border-collapse: collapse;

  th,
  td {
    padding: var(--ds-space-2) var(--ds-space-3);
    border-bottom: var(--ds-border-width) solid var(--ds-border);
    text-align: left;
    vertical-align: top;
  }

  th {
    color: var(--ds-text-2);
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-medium);
  }
}

kbd {
  padding: 2px var(--ds-space-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-surface-2);
  font-family: inherit;
  font-size: var(--ds-text-sm);
  white-space: nowrap;
}

.guide-start__link {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  font-weight: var(--ds-weight-medium);
}
</style>
