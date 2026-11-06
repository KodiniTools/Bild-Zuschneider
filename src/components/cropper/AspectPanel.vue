<template>
  <section class="aspect-panel" aria-labelledby="aspect-panel-title">
    <h2 id="aspect-panel-title" class="panel-title">{{ t('presets.title') }}</h2>
    <div class="aspect-panel__grid">
      <button
        v-for="preset in basicPresets"
        :key="preset.id"
        type="button"
        class="aspect-panel__tile"
        :class="{ 'aspect-panel__tile--active': preset.id === editor.presetId }"
        :aria-pressed="preset.id === editor.presetId"
        :data-preset="preset.id"
        @click="editor.setPreset(preset.id)"
      >
        {{ t(`presets.names.${preset.id}`) }}
      </button>
    </div>
    <UiSelect v-model="socialValue" :label="t('presets.social')" :options="socialOptions" />
    <UiSegmentedControl
      v-model="orientationValue"
      :label="t('presets.orientation')"
      :options="orientationOptions"
      size="sm"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  UiSegmentedControl,
  UiSelect,
  type SegmentedOption,
  type SelectOption,
} from '@/components/ui';
import { ASPECT_PRESETS, DEFAULT_PRESET_ID, type Orientation } from '@/lib/aspectPresets';
import { useEditorStore } from '@/stores/editor';

/**
 * Seitenverhältnis wählen: Grundformate als Kacheln (aktive Auswahl in Gold-Soft),
 * Social-Media-Formate im Select, Hoch/Quer als Segmented Control.
 */
const { t } = useI18n();
const editor = useEditorStore();

const basicPresets = ASPECT_PRESETS.filter((preset) => preset.group === 'basic');

const socialOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('presets.socialNone') },
  ...ASPECT_PRESETS.filter((preset) => preset.group === 'social').map((preset) => ({
    value: preset.id,
    label: t(`presets.names.${preset.id}`),
  })),
]);

/** Select zeigt das Social-Preset oder „keins“; „keins“ setzt auf frei zurück. */
const socialValue = computed({
  get: () => (editor.preset.group === 'social' ? editor.presetId : ''),
  set: (id: string) => editor.setPreset(id || DEFAULT_PRESET_ID),
});

const orientationOptions = computed<SegmentedOption[]>(() =>
  (['landscape', 'portrait'] as const).map((value) => ({
    value,
    label: t(`presets.${value}`),
    disabled: Boolean(editor.preset.fixedOrientation),
  }))
);

const orientationValue = computed({
  get: () => editor.orientation,
  set: (value: string) => editor.setOrientation(value as Orientation),
});
</script>

<style scoped lang="scss">
.aspect-panel {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.aspect-panel__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-2);
}

.aspect-panel__tile {
  min-height: var(--ds-control-md);
  padding: 0 var(--ds-space-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-2);
  color: var(--ds-text);
  font-family: inherit;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-3);
  }
}

// Aktive Auswahl: Fläche accent-soft + 1-px-Rahmen accent, Text bleibt --ds-text
.aspect-panel__tile--active,
.aspect-panel__tile--active:hover {
  background: var(--ds-accent-soft);
  border-color: var(--ds-accent);
}
</style>
