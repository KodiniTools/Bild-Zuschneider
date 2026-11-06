<template>
  <section class="size-panel" aria-labelledby="size-panel-title">
    <h2 id="size-panel-title" class="panel-title">{{ t('crop.size') }}</h2>
    <div class="size-panel__fields">
      <UiTextField
        v-for="field in FIELDS"
        :key="field"
        v-model="drafts[field]"
        :label="t(`crop.${field}`) + ' (px)'"
        inputmode="numeric"
        autocomplete="off"
        :data-field="field"
        @change="commit(field)"
        @keydown.enter="commit(field)"
      />
    </div>
    <p class="size-panel__meta">
      <span>{{ t('crop.ratio', { ratio: ratioText }) }}</span>
      <span>
        {{ t('crop.original', { ...editor.imageSize }) }}
      </span>
    </p>
    <UiSwitch
      :model-value="editor.showGrid"
      :label="t('crop.grid')"
      @update:model-value="editor.toggleGrid()"
    />
    <UiButton variant="ghost" size="sm" @click="editor.resetCrop()">
      <template #icon><AppIcon name="rotate-ccw-square" /></template>
      {{ t('crop.reset') }}
    </UiButton>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { AppIcon, UiButton, UiSwitch, UiTextField } from '@/components/ui';
import { ratioLabel, ratioValueLabel } from '@/lib/geometry';
import { useEditorStore, type CropField } from '@/stores/editor';

/**
 * Exakte Pixelwerte des Rahmens (übernommen bei Enter oder beim Verlassen des Feldes),
 * Verhältnis, Raster und Zurücksetzen.
 */
const { t } = useI18n();
const editor = useEditorStore();

const FIELDS: readonly CropField[] = ['width', 'height', 'x', 'y'];

/** Festes Verhältnis als Bruch (4:3), frei aus den Pixelmaßen des Rahmens. */
const ratioText = computed(() =>
  editor.ratio ? ratioValueLabel(editor.ratio) : ratioLabel(editor.crop)
);

/** Eingabetexte je Feld; folgen dem Store, solange nicht getippt wird. */
const drafts = reactive<Record<CropField, string>>({ x: '', y: '', width: '', height: '' });

watch(
  () => ({ ...editor.crop }),
  (crop) => {
    for (const field of FIELDS) drafts[field] = String(crop[field]);
  },
  { immediate: true }
);

/** Übernimmt einen Wert bei Enter/Verlassen; Ungültiges stellt den Store-Wert wieder her. */
function commit(field: CropField) {
  const value = Number(drafts[field].replace(',', '.').trim());
  if (drafts[field].trim() !== '' && Number.isFinite(value)) editor.setCropField(field, value);
  drafts[field] = String(editor.crop[field]);
}
</script>

<style scoped lang="scss">
.size-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-4);
}

.size-panel__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-3);
  width: 100%;
}

.size-panel__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-1) var(--ds-space-4);
  margin: 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}
</style>
