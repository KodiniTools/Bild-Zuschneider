<template>
  <div class="number-spinner" :class="{ disabled }">
    <input
      type="number"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      class="spinner-value"
      :aria-label="label || undefined"
      :disabled="disabled"
      @input="onInput"
      @change="emit('commit')"
    />
    <span v-if="unit" class="spinner-unit">{{ unit }}</span>
    <div class="spinner-buttons">
      <button
        type="button"
        class="spinner-btn spinner-up"
        tabindex="-1"
        :title="$t('common.increase')"
        :aria-label="$t('common.increase')"
        :disabled="disabled || modelValue >= max"
        @pointerdown="startHold(1, $event)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>
      <button
        type="button"
        class="spinner-btn spinner-down"
        tabindex="-1"
        :title="$t('common.decrease')"
        :aria-label="$t('common.decrease')"
        :disabled="disabled || modelValue <= min"
        @pointerdown="startHold(-1, $event)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';

/**
 * Zahlenfeld mit Auf-/Ab-Buttons (Kopie aus dem Bildkonverter, nach TypeScript
 * übertragen; Verhalten unverändert).
 */

// Klicken-und-Halten: ein Schritt sofort, nach HOLD_DELAY ein Dauerlauf, der
// langsam (für feines Nachjustieren) beginnt und immer schneller wird.
const HOLD_DELAY = 400;
const HOLD_PHASES = [
  { until: 5, interval: 140, factor: 1 },
  { until: 15, interval: 70, factor: 1 },
  { until: 30, interval: 40, factor: 1 },
  { until: Infinity, interval: 40, factor: 5 },
] as const;

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    disabled?: boolean;
    /** Zugänglicher Name des Zahlenfelds (z. B. das Label des Reglers) */
    label?: string;
  }>(),
  { step: 1, unit: '', disabled: false, label: '' }
);

// update:modelValue = fortlaufende Wertänderung (treibt die Live-Vorschau)
// commit           = Wert steht fest (für History: Loslassen / Enter / Blur)
const emit = defineEmits<{
  'update:modelValue': [value: number];
  commit: [];
}>();

// Rundet auf die durch step vorgegebene Genauigkeit (vermeidet Float-Drift)
function roundToStep(v: number): number {
  return Number(v.toFixed(4));
}

function clamp(v: number): number {
  if (Number.isNaN(v)) return props.modelValue;
  return Math.min(props.max, Math.max(props.min, v));
}

function onInput(e: Event) {
  emit('update:modelValue', clamp(Number((e.target as HTMLInputElement).value)));
}

// Schritt um `factor` Schritte ohne Commit (Commit erfolgt beim Loslassen)
function doStep(direction: number, factor = 1): boolean {
  const next = clamp(roundToStep(props.modelValue + direction * props.step * factor));
  if (next === props.modelValue) return false;
  emit('update:modelValue', next);
  return true;
}

let holdTimer: ReturnType<typeof setTimeout> | null = null;
let holdTicks = 0;
let holdChanged = false;

function repeatHold(direction: number) {
  holdTicks += 1;
  const phase =
    HOLD_PHASES.find((p) => holdTicks <= p.until) ?? HOLD_PHASES[HOLD_PHASES.length - 1];
  if (!doStep(direction, phase.factor)) {
    stopHold(); // Grenze erreicht → anhalten
    return;
  }
  holdChanged = true;
  holdTimer = setTimeout(() => repeatHold(direction), phase.interval);
}

function startHold(direction: number, event?: PointerEvent) {
  if (props.disabled) return;
  if (event) {
    if (event.button !== undefined && event.button !== 0) return; // nur linke Taste
    event.preventDefault();
  }
  stopHold();

  holdChanged = doStep(direction);
  holdTimer = setTimeout(() => repeatHold(direction), HOLD_DELAY);

  window.addEventListener('pointerup', stopHold);
  window.addEventListener('pointercancel', stopHold);
}

function stopHold() {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
  holdTicks = 0;
  window.removeEventListener('pointerup', stopHold);
  window.removeEventListener('pointercancel', stopHold);

  // Nach dem Loslassen genau einen History-Eintrag setzen
  if (holdChanged) {
    holdChanged = false;
    emit('commit');
  }
}

onBeforeUnmount(stopHold);
</script>

<style scoped lang="scss">
/* Zahlenfeld wie im ControlSlider des Collage Makers: 64 × 28 px, Rahmen
   border-strong, radius-sm, surface-1, text-xs. Eigene Pfeile statt der
   nativen, weil sie das langsam→schnell beim Halten tragen. */
.number-spinner {
  flex: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 64px;
  height: var(--ds-control-sm);
  padding: 0 0 0 6px;
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-sm);
  transition:
    border-color var(--ds-duration) var(--ds-ease),
    box-shadow var(--ds-duration) var(--ds-ease);

  &:focus-within {
    box-shadow: var(--ds-focus-ring);
  }

  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  .spinner-value {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    height: auto;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    color: var(--ds-text);
    font: inherit;
    font-size: var(--ds-text-xs);
    font-variant-numeric: tabular-nums;
    line-height: var(--ds-leading);
    text-align: right;
    box-shadow: none;
    -moz-appearance: textfield;
    appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &:focus,
    &:focus-visible {
      outline: none;
      box-shadow: none;
    }
  }

  .spinner-unit {
    flex: none;
    margin-left: 1px;
    font-size: var(--ds-text-xs);
    color: var(--ds-text-2);
    pointer-events: none;
  }

  .spinner-buttons {
    flex: none;
    display: flex;
    flex-direction: column;
    align-self: stretch;
    margin-left: var(--ds-space-1);
    border-left: var(--ds-border-width) solid var(--ds-border-strong);
  }

  .spinner-btn {
    flex: 1 1 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    min-height: 0;
    padding: 0;
    border: none;
    background: none;
    color: var(--ds-text-2);
    cursor: pointer;
    touch-action: none;
    transition:
      color var(--ds-duration) var(--ds-ease),
      background-color var(--ds-duration) var(--ds-ease);

    svg {
      width: 10px;
      height: 10px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    &:hover:not(:disabled) {
      color: var(--ds-text);
      background: var(--ds-surface-3);
    }

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }

  .spinner-up {
    border-top-right-radius: calc(var(--ds-radius-sm) - 1px);
  }

  .spinner-down {
    border-bottom-right-radius: calc(var(--ds-radius-sm) - 1px);
  }
}

@media (pointer: coarse) {
  .number-spinner {
    width: 72px;

    .spinner-btn {
      width: 18px;
    }
  }
}
</style>
