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
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { SliderField, UiSelect, UiSwitch, UiTextField, type SelectOption } from '@/components/ui';
import RecentColorField from '@/components/common/RecentColorField.vue';
import { DEFAULT_QUALITY, OUTPUT_FORMATS } from '@/lib/exportImage';
import { useExportStore } from '@/stores/export';

/**
 * Export-Einstellungen: Format (nur kodierbare wählbar), Qualität für verlustbehaftete
 * Formate, optionale Ausgabegröße, Hintergrund für JPG. Die Primäraktion
 * „Herunterladen“ liegt im Fuß der Seitenleiste (DownloadAction), immer sichtbar.
 */
const { t } = useI18n();
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
</style>
