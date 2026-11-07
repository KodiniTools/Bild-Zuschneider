<template>
  <section class="page content-page">
    <h1>{{ t('pages.about.title') }}</h1>
    <p class="page__lead">{{ t('content.about.intro') }}</p>

    <h2>{{ t('content.about.privacyTitle') }}</h2>
    <p>{{ t('content.about.privacy') }}</p>

    <h2>{{ t('content.about.techTitle') }}</h2>
    <p>{{ t('content.about.tech') }}</p>

    <h2>{{ t('content.about.moreTitle') }}</h2>
    <i18n-t keypath="content.about.more" tag="p">
      <template #converter>
        <a href="/bildkonverter/">{{ t('content.about.converterLink') }}</a>
      </template>
      <template #batch>
        <a href="/bilderseriebearbeiten/">{{ t('content.about.batchLink') }}</a>
      </template>
    </i18n-t>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

/** Über: Datenschutz, Technik, weitere Werkzeuge von KodiniTools. */
const { t } = useI18n();
</script>
