<template>
  <section class="home-seo" aria-labelledby="home-seo-title">
    <h2 id="home-seo-title">{{ t('content.home.title') }}</h2>
    <p>{{ t('content.home.intro') }}</p>

    <h3>{{ t('content.home.featuresTitle') }}</h3>
    <ul class="home-seo__features">
      <li v-for="key in FEATURES" :key="key">
        <AppIcon name="check" class="home-seo__check" />
        {{ t(`content.home.features.${key}`) }}
      </li>
    </ul>

    <h3>{{ t('content.home.moreTitle') }}</h3>
    <i18n-t keypath="content.home.more" tag="p">
      <template #guide>
        <RouterLink :to="{ name: 'guide' }">{{ t('content.home.guideLink') }}</RouterLink>
      </template>
      <template #faq>
        <RouterLink :to="{ name: 'faq' }">{{ t('content.home.faqLink') }}</RouterLink>
      </template>
    </i18n-t>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { AppIcon } from '@/components/ui';

/** Beschreibender Text unter dem Werkzeug (SEO, Entscheidung Schritt 0). */
const { t } = useI18n();
const FEATURES = ['ratios', 'social', 'exact', 'rotate', 'formats', 'privacy'] as const;
</script>

<style scoped lang="scss">
.home-seo {
  max-width: 760px;
  margin-top: var(--ds-space-12);
  padding-top: var(--ds-space-8);
  border-top: var(--ds-border-width) solid var(--ds-border);

  p {
    color: var(--ds-text-2);
  }
}

.home-seo__features {
  display: grid;
  gap: var(--ds-space-2);
  margin: 0 0 var(--ds-space-6);
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: var(--ds-space-2);
    color: var(--ds-text-2);
  }
}

.home-seo__check {
  margin-top: 4px;
  color: var(--ds-success);
}
</style>
