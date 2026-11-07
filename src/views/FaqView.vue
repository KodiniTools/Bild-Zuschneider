<template>
  <section class="page content-page">
    <h1>{{ t('pages.faq.title') }}</h1>
    <p class="page__lead">{{ t('content.faq.intro') }}</p>

    <div class="faq">
      <div
        v-for="key in FAQ_KEYS"
        :key="key"
        class="faq__item"
        :class="{ 'faq__item--open': open.has(key) }"
      >
        <h2 class="faq__heading">
          <button
            :id="`faq-q-${key}`"
            type="button"
            class="faq__question"
            :aria-expanded="open.has(key)"
            :aria-controls="`faq-a-${key}`"
            @click="toggle(key)"
          >
            <span>{{ t(`content.faq.items.${key}.question`) }}</span>
            <AppIcon name="chevron-down" :size="20" class="faq__chevron" />
          </button>
        </h2>
        <div
          v-show="open.has(key)"
          :id="`faq-a-${key}`"
          class="faq__answer"
          role="region"
          :aria-labelledby="`faq-q-${key}`"
        >
          <p>{{ t(`content.faq.items.${key}.answer`) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { AppIcon } from '@/components/ui';
import { useJsonLd } from '@/composables/useJsonLd';

/**
 * Häufige Fragen als Akkordeon (Muster: Bildkonverter FaqView: h2 > button,
 * aria-expanded/-controls). Mehrere Antworten dürfen gleichzeitig offen sein.
 * FAQPage-JSON-LD in der aktuellen Sprache, nur auf dieser Seite.
 */
const { t } = useI18n();

type FaqKey =
  | 'upload'
  | 'formats'
  | 'heic'
  | 'quality'
  | 'metadata'
  | 'social'
  | 'straighten'
  | 'size'
  | 'gif'
  | 'mobile';

const FAQ_KEYS: readonly FaqKey[] = [
  'upload',
  'formats',
  'heic',
  'quality',
  'metadata',
  'social',
  'straighten',
  'size',
  'gif',
  'mobile',
];

const open = reactive(new Set<FaqKey>(['upload']));

function toggle(key: FaqKey) {
  if (open.has(key)) open.delete(key);
  else open.add(key);
}

useJsonLd(
  'faq-jsonld',
  computed(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_KEYS.map((key) => ({
      '@type': 'Question',
      name: t(`content.faq.items.${key}.question`),
      acceptedAnswer: { '@type': 'Answer', text: t(`content.faq.items.${key}.answer`) },
    })),
  }))
);
</script>

<style scoped lang="scss">
.faq {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  max-width: 760px;
}

.faq__item {
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-surface-1);
}

.faq__heading {
  margin: 0;
  font-size: var(--ds-text-lg);
}

.faq__question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-4);
  width: 100%;
  padding: var(--ds-space-4) var(--ds-space-5);
  border: 0;
  border-radius: var(--ds-radius-lg);
  background: transparent;
  color: var(--ds-text);
  font: inherit;
  font-weight: var(--ds-weight-semibold);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-2);
  }
}

.faq__chevron {
  color: var(--ds-text-2);
  transition: transform var(--ds-duration) var(--ds-ease);
}

.faq__item--open .faq__chevron {
  transform: rotate(180deg);
}

.faq__answer {
  padding: 0 var(--ds-space-5) var(--ds-space-4);
  color: var(--ds-text-2);

  p {
    margin: 0;
  }
}
</style>
