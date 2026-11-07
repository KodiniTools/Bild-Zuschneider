<template>
  <div class="download-action">
    <p class="download-action__summary" data-testid="export-summary">
      {{
        t('export.summary', {
          width: exp.size.width,
          height: exp.size.height,
          format: exp.info.label,
        })
      }}
      <span v-if="upscaled" class="download-action__warn">
        <AppIcon name="triangle-alert" :size="14" />
        {{ t('export.upscaled') }}
      </span>
    </p>
    <UiButton variant="primary" block :disabled="exp.exporting" @click="onExport">
      <template #icon>
        <AppIcon :name="exp.exporting ? 'loader-circle' : 'download'" :spin="exp.exporting" />
      </template>
      {{ exp.exporting ? t('export.working') : t('export.download') }}
    </UiButton>
    <p class="download-action__privacy">{{ t('export.privacy') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { AppIcon, UiButton } from '@/components/ui';
import { ExportError, formatBytes } from '@/lib/exportImage';
import { useEditorStore } from '@/stores/editor';
import { useExportStore } from '@/stores/export';
import { logger } from '@/utils/logger';

/**
 * Die eine Primäraktion „Herunterladen“ mit Zusammenfassung der Ausgabe. Liegt im Fuß
 * der Seitenleiste und bleibt dort ab 900 px immer sichtbar (Entscheidung 2026-11-07).
 */
const { t, locale } = useI18n();
const editor = useEditorStore();
const exp = useExportStore();

const upscaled = computed(() => exp.size.width > editor.crop.width);

async function onExport() {
  try {
    const result = await exp.exportImage(t('export.fileSuffix'));
    window.$toast?.success(
      t('export.done', { name: result.fileName, size: formatBytes(result.bytes, locale.value) })
    );
  } catch (error) {
    const code = error instanceof ExportError ? error.code : 'encodeFailed';
    if (!(error instanceof ExportError)) logger.error('Export fehlgeschlagen:', error);
    window.$toast?.error(t(`export.errors.${code}`), null, 6000);
  }
}
</script>

<style scoped lang="scss">
.download-action {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}

.download-action__summary,
.download-action__privacy {
  margin: 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}

.download-action__warn {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  margin-left: var(--ds-space-2);
  color: var(--ds-text);

  :deep(.app-icon) {
    color: var(--ds-warning);
  }
}
</style>
