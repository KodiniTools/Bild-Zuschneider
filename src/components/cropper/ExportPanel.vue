<template>
  <section class="export-panel" aria-labelledby="export-panel-title">
    <h2 id="export-panel-title" class="panel-title">{{ t('export.title') }}</h2>

    <UiSelect v-model="exp.format" :label="t('export.format')" :options="formatOptions" />

    <SliderField
      v-if="exp.info.lossy"
      :model-value="qualityPercent"
      :min="1"
      :max="100"
      unit="%"
      :default-value="Math.round(DEFAULT_QUALITY * 100)"
      :label="t('export.quality')"
      input-id="export-quality"
      @update:model-value="exp.quality = $event / 100"
      @reset="exp.quality = DEFAULT_QUALITY"
    />

    <UiSwitch
      :model-value="exp.resize"
      :label="t('export.resize')"
      @update:model-value="exp.setResize"
    />
    <div v-if="exp.resize" class="export-panel__size">
      <UiTextField
        v-model="drafts.width"
        :label="t('export.width')"
        inputmode="numeric"
        autocomplete="off"
        data-field="out-width"
        @change="commitSize('width')"
        @keydown.enter="commitSize('width')"
      />
      <UiTextField
        v-model="drafts.height"
        :label="t('export.height')"
        inputmode="numeric"
        autocomplete="off"
        data-field="out-height"
        @change="commitSize('height')"
        @keydown.enter="commitSize('height')"
      />
    </div>

    <RecentColorField
      v-if="exp.needsBackground"
      v-model="exp.background"
      :label="t('export.background')"
      :recent-label="t('export.recentColors')"
    />

    <p class="export-panel__summary" data-testid="export-summary">
      {{
        t('export.summary', {
          width: exp.size.width,
          height: exp.size.height,
          format: exp.info.label,
        })
      }}
      <span v-if="upscaled" class="export-panel__warn">
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
    <p class="export-panel__privacy">{{ t('export.privacy') }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  AppIcon,
  SliderField,
  UiButton,
  UiSelect,
  UiSwitch,
  UiTextField,
  type SelectOption,
} from '@/components/ui';
import RecentColorField from '@/components/common/RecentColorField.vue';
import { DEFAULT_QUALITY, ExportError, OUTPUT_FORMATS, formatBytes } from '@/lib/exportImage';
import { useEditorStore } from '@/stores/editor';
import { useExportStore } from '@/stores/export';
import { logger } from '@/utils/logger';

/**
 * Export: Format (nur kodierbare wählbar), Qualität für verlustbehaftete Formate,
 * optionale Ausgabegröße, Hintergrund für JPG und die eine Primäraktion „Herunterladen“.
 */
const { t, locale } = useI18n();
const editor = useEditorStore();
const exp = useExportStore();

const formatOptions = computed<SelectOption[]>(() =>
  OUTPUT_FORMATS.map((f) => {
    const available = exp.encodable.includes(f.id);
    return {
      value: f.id,
      label: available ? f.label : t('export.unavailable', { format: f.label }),
      disabled: !available,
    };
  })
);

const qualityPercent = computed(() => Math.round(exp.quality * 100));
const upscaled = computed(() => exp.size.width > editor.crop.width);

const drafts = reactive({ width: '', height: '' });
watch(
  () => exp.size,
  (size) => {
    drafts.width = String(size.width);
    drafts.height = String(size.height);
  },
  { immediate: true }
);

function commitSize(field: 'width' | 'height') {
  const value = Number(drafts[field].trim());
  if (drafts[field].trim() !== '' && Number.isFinite(value) && value > 0) {
    if (field === 'width') exp.setTargetWidth(value);
    else exp.setTargetHeight(value);
  }
  drafts.width = String(exp.size.width);
  drafts.height = String(exp.size.height);
}

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
.export-panel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--ds-space-4);
}

.export-panel__size {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-3);
}

.export-panel__summary,
.export-panel__privacy {
  margin: 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}

.export-panel__warn {
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
