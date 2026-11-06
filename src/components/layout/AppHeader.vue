<template>
  <header class="app-header">
    <RouterLink :to="{ name: 'home' }" class="app-header__brand">
      <AppIcon name="crop" :size="20" />
      <span>{{ t('app.name') }}</span>
    </RouterLink>
    <nav class="app-header__nav" :aria-label="t('nav.label')">
      <RouterLink
        v-for="item in items"
        :key="item.name"
        :to="{ name: item.name }"
        class="app-header__link"
        exact-active-class="app-header__link--active"
      >
        {{ t(item.label) }}
      </RouterLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppIcon from '@/components/ui/AppIcon.vue';

/**
 * Kopfzeile der App unterhalb der globalen SSI-Navigation: App-Name und die
 * Bereiche des Werkzeugs. Theme und Sprache schaltet die globale Navigation.
 */
const { t } = useI18n();

const items = [
  { name: 'home', label: 'nav.home' },
  { name: 'guide', label: 'nav.guide' },
  { name: 'faq', label: 'nav.faq' },
  { name: 'about', label: 'nav.about' },
] as const;
</script>

<style scoped lang="scss">
.app-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3) var(--ds-space-6);
  max-width: var(--ds-container);
  margin: 0 auto;
  padding: var(--ds-space-4) var(--ds-space-6);
  border-bottom: var(--ds-border-width) solid var(--ds-border);
}

.app-header__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  color: var(--ds-text);
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);

  &:hover {
    color: var(--ds-text);
  }
}

.app-header__nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-1);
}

.app-header__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--ds-control-md);
  padding: 0 var(--ds-space-3);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  color: var(--ds-text-2);
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background-color: var(--ds-surface-3);
    color: var(--ds-text);
  }
}

// Aktive Auswahl: accent-soft + 1-px-Rahmen, Text bleibt --ds-text (README Farbe)
.app-header__link--active {
  background-color: var(--ds-accent-soft);
  border-color: var(--ds-accent);
  color: var(--ds-text);
}

@media (max-width: 480px) {
  .app-header {
    padding: var(--ds-space-3) var(--ds-space-4);
  }
}
</style>
