<template>
  <section class="page">
    <h1>{{ t('pages.notFound.title') }}</h1>
    <p>{{ t('pages.notFound.text') }}</p>
    <RouterLink :to="{ name: 'home' }">{{ t('pages.notFound.back') }}</RouterLink>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';

const { t } = useI18n();
</script>
