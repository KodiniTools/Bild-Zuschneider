<template>
  <section class="page">
    <h1>{{ t('pages.home.title') }}</h1>
    <p class="page__lead">{{ t('app.tagline') }}</p>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
