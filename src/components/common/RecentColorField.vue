<template>
  <div class="recent-color-field">
    <ColorField
      :model-value="modelValue"
      :label="label"
      @update:model-value="emit('update:modelValue', $event)"
      @change="commit"
    />
    <div
      v-if="recentColors.length"
      class="recent-color-field__swatches"
      role="group"
      :aria-label="recentLabel"
    >
      <button
        v-for="color in recentColors"
        :key="color"
        type="button"
        class="recent-color-field__swatch"
        :class="{ 'recent-color-field__swatch--active': color === current }"
        :style="{ backgroundColor: color }"
        :title="color"
        :aria-label="`${recentLabel}: ${color}`"
        :aria-pressed="color === current"
        :data-color="color"
        @click="pick(color)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ColorField } from '@/components/ui';
import { useRecentColors } from '@/composables/useRecentColors';

/**
 * ColorField mit den zuletzt verwendeten Farben (Muster: Bildkonverter
 * `features/shapes/ColorField.vue`). `update:modelValue` bei jeder Änderung,
 * `commit` bei abgeschlossener Auswahl; dabei kommt die Farbe in die Liste.
 */
const props = defineProps<{ modelValue: string; label: string; recentLabel: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string]; commit: [value: string] }>();

const { recentColors, addRecentColor } = useRecentColors();
const current = computed(() => props.modelValue.toLowerCase());

function commit(value: string) {
  addRecentColor(value);
  emit('commit', value);
}

function pick(color: string) {
  emit('update:modelValue', color);
  commit(color);
}
</script>

<style scoped lang="scss">
.recent-color-field__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-1);
  margin-top: var(--ds-space-2);
}

.recent-color-field__swatch {
  width: 24px;
  height: 24px;
  padding: 0;
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-text-2);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

// Aktive Auswahl: Rahmen in Akzentfarbe
.recent-color-field__swatch--active,
.recent-color-field__swatch--active:hover {
  border-color: var(--ds-accent);
}
</style>
