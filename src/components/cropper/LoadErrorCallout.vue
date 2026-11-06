<template>
  <UiCallout type="danger" :title="t('load.errorTitle')" role="alert">
    {{ t(`load.errors.${code}`, { max: MAX_FILE_MB }) }}
    <a v-if="suggestConverter" :href="CONVERTER_URL" class="load-error__link">
      {{ t('load.converterLink') }}
    </a>
  </UiCallout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { UiCallout } from '@/components/ui';
import { MAX_FILE_BYTES, type LoadErrorCode } from '@/lib/loadImage';

/**
 * Fehlermeldung beim Laden. Für HEIC/TIFF verweist sie auf den Bildkonverter
 * (Entscheidung Schritt 0).
 */
const props = defineProps<{ code: LoadErrorCode }>();
const { t } = useI18n();

const MAX_FILE_MB = MAX_FILE_BYTES / 1024 / 1024;
const CONVERTER_URL = '/bildkonverter/';
const suggestConverter = computed(() => props.code === 'heic' || props.code === 'tiff');
</script>

<style scoped lang="scss">
.load-error__link {
  margin-left: var(--ds-space-1);
  font-weight: var(--ds-weight-medium);
}
</style>
