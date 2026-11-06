<template>
  <div class="slider-control" :class="{ 'slider-control--disabled': disabled }">
    <label v-if="label" class="slider-control__label" :for="inputId">
      <AppIcon v-if="icon" :name="icon" :size="14" />
      {{ label }}
    </label>
    <div class="slider-field">
      <input
        :id="inputId"
        type="range"
        class="slider-field__range"
        :class="trackClass"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        :disabled="disabled"
        :aria-label="label || undefined"
        @input="onRangeInput"
        @change="emit('commit')"
      />
      <NumberSpinner
        :model-value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :unit="unit"
        :disabled="disabled"
        :label="label"
        @update:model-value="emit('update:modelValue', $event)"
        @commit="emit('commit')"
      />
      <button
        v-if="hasDefault"
        type="button"
        class="slider-field__reset"
        :title="`${$t('common.reset')} (${defaultValue}${unit})`"
        :aria-label="`${$t('common.reset')} (${defaultValue}${unit})`"
        :disabled="disabled || isAtDefault"
        @click="reset"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SliderField – eine Zeile aus Regler, Zahlen-Spinner und Reset-Button
 * (Muster aus dem Visualizer, Regler-Anatomie aus `range.css` der Vorlage
 * KodiniTools/Collage-Maker). Das Label steht klein darüber.
 *
 * Abweichung von der Vorlage (Bildkonverter): Label/Icon/inputId als Props,
 * Zahleneingabe über NumberSpinner (mit Einheit), `commit` statt `start`/`change`
 * und Spur-Varianten für Farbton/Wärme.
 *
 * Events:
 * - `update:modelValue` (number) – live bei jeder Änderung
 * - `commit` – Wert steht fest (Regler losgelassen, Spinner fertig, Reset);
 *   genau ein History-Eintrag pro Interaktion
 * - `reset` – nach einem Klick auf den Reset-Button
 */
import { computed } from 'vue';
import NumberSpinner from '@/components/ui/NumberSpinner.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { IconName } from '@/components/ui/iconMap';

/** Spur-Variante; 'default' wird bei Bereichen um null automatisch zu 'center'. */
export type SliderVariant = 'default' | 'center' | 'hue' | 'warm';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    /** Wert für den Reset-Button. Ohne Angabe gibt es keinen Reset-Button. */
    defaultValue?: number;
    label?: string;
    /** Optionaler Icon-Name vor dem Label. */
    icon?: IconName | '';
    /** id des Reglers (für `<label for>` und Tests). */
    inputId?: string;
    variant?: SliderVariant;
    disabled?: boolean;
  }>(),
  {
    step: 1,
    unit: '',
    defaultValue: undefined,
    label: '',
    icon: '',
    inputId: undefined,
    variant: 'default',
    disabled: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: number];
  commit: [];
  reset: [];
}>();

const hasDefault = computed(() => typeof props.defaultValue === 'number');
const isAtDefault = computed(() => hasDefault.value && props.modelValue === props.defaultValue);
// Bereiche um null (z. B. −180…180) zeigen den Nullpunkt mittig.
const trackClass = computed(() => {
  const spansZero = props.min < 0 && props.max > 0;
  const variant = props.variant === 'default' && spansZero ? 'center' : props.variant;
  return variant === 'default' ? null : `slider-field__range--${variant}`;
});

function onRangeInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(value)) emit('update:modelValue', value);
}

function reset() {
  if (props.defaultValue === undefined || isAtDefault.value) return;
  emit('update:modelValue', props.defaultValue);
  emit('reset');
  emit('commit');
}
</script>

<style scoped src="./range.css"></style>

<style scoped lang="scss">
/* ControlSlider (Design-System v2): Label klein darüber, darunter eine Zeile
   Regler · Zahlenfeld · Reset (28-px-Platz dauerhaft reserviert). */
.slider-control {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  min-width: 0;

  /* Deaktiviert: nur die Bedienzeile wird blass; das Label bleibt lesbar
     (--ds-text-3 erfüllt 4,5:1 auf surface-0 bis -2 beider Themes). */
  &--disabled .slider-field {
    opacity: 0.45;
  }

  &--disabled .slider-control__label {
    color: var(--ds-text-3);
  }
}

.slider-control__label {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  margin: 0;
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-regular);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);
}

.slider-field {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  width: 100%;
  min-width: 0;
}

/* Spur und Daumen aus range.css (Vorlage); nur Farbton und Wärme behalten
   ihre Verlaufsspur, weil sie den Wert selbst zeigen. Doppelte Klasse, damit
   sie den Hintergrund aus range.css (input[type='range']) überstimmen. */
.slider-field__range {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  margin: 0;

  &.slider-field__range--hue {
    background: linear-gradient(
      to right,
      hsl(0, 100%, 50%),
      hsl(60, 100%, 50%),
      hsl(120, 100%, 50%),
      hsl(180, 100%, 50%),
      hsl(240, 100%, 50%),
      hsl(300, 100%, 50%),
      hsl(360, 100%, 50%)
    );
  }

  &.slider-field__range--warm {
    background: linear-gradient(
      90deg,
      var(--ds-info) 0%,
      var(--ds-border-strong) 50%,
      var(--ds-accent-hover) 100%
    );
  }
}

/* Abweichung von range.css: auf Touch-Geräten größere Spur und Daumen
   (wie bisher in global.scss) */
@media (pointer: coarse) {
  input[type='range'].slider-field__range {
    height: 8px;

    &::-webkit-slider-thumb {
      width: 20px;
      height: 20px;
    }

    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
    }
  }
}

/* ResetButton = UiIconButton size sm (ghost) */
.slider-field__reset {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-text-2);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  svg {
    width: var(--ds-icon-sm);
    height: var(--ds-icon-sm);
  }

  &:hover:not(:disabled) {
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
