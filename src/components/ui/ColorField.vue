<template>
  <span
    ref="rootEl"
    class="color-field"
    :class="[rootClass, { 'color-field--open': open, 'color-field--disabled': disabled }]"
    :style="rootStyle"
  >
    <button
      ref="triggerEl"
      type="button"
      class="color-field__swatch"
      v-bind="buttonAttrs($attrs)"
      :disabled="disabled"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="dialog"
      :title="($attrs.title as string | undefined) ?? currentHex"
      :style="{ backgroundColor: currentHex }"
      @click="toggle"
      @keydown.esc="onTriggerEscape"
    >
      <span class="color-field__sr">{{ label || t('color_pick') }} {{ currentHex }}</span>
    </button>

    <Teleport :to="teleportTo">
      <div
        v-if="open"
        ref="panelEl"
        class="color-field__panel"
        role="dialog"
        :aria-label="label || t('color_pick')"
        :style="panelStyle"
        @keydown.esc.stop.prevent="close(true)"
      >
        <div v-for="ch in channels" :key="ch.key" class="color-field__row">
          <label class="color-field__label" :for="`${uid}-${ch.key}`" :title="t(ch.labelKey)">{{
            ch.short
          }}</label>
          <input
            type="range"
            class="color-field__range"
            :style="{ background: trackGradients[ch.key] }"
            :min="ch.min"
            :max="ch.max"
            :step="ch.step"
            :value="Math.round(hsl[ch.key])"
            :aria-label="t(ch.labelKey)"
            @pointerdown="beginInteraction"
            @input="onRangeInput(ch.key, $event)"
            @change="commitInteraction"
          />
          <input
            :id="`${uid}-${ch.key}`"
            type="number"
            class="color-field__num"
            inputmode="numeric"
            :min="ch.min"
            :max="ch.max"
            :step="ch.step"
            :value="Math.round(hsl[ch.key])"
            :aria-label="t(ch.labelKey)"
            @input="onNumberInput(ch.key, $event)"
            @change="commitInteraction"
            @blur="onNumberBlur(ch.key, $event)"
          />
          <span class="color-field__unit">{{ ch.unit }}</span>
        </div>

        <div class="color-field__row color-field__row--hex">
          <label class="color-field__label" :for="`${uid}-hex`" :title="t('color_hex')">#</label>
          <input
            :id="`${uid}-hex`"
            type="text"
            class="color-field__hex"
            :class="{ 'color-field__hex--invalid': hexInvalid }"
            :value="hexDraft"
            maxlength="9"
            spellcheck="false"
            autocomplete="off"
            :aria-invalid="hexInvalid ? 'true' : 'false'"
            :title="hexInvalid ? t('color_invalid_hex') : ''"
            @focus="hexFocused = true"
            @input="onHexInput"
            @blur="onHexBlur"
            @keydown.enter.prevent="onHexBlur"
          />
          <span class="color-field__preview" :style="{ backgroundColor: currentHex }"></span>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
/**
 * ColorField – Ersatz für `<input type="color">`, übernommen aus dem Playlist Generator
 * (Stand a1132de). Änderungen: Texte über vue-i18n statt useTranslation; Prop `teleportTo`.
 * Abweichung Bildkonverter: `teleportTo` ist standardmäßig `#overlay-root` (wie UiDialog).
 *
 * Ein Farbfeld (Swatch), das per Klick ein Panel aufklappt: drei Regler (Farbton,
 * Sättigung, Helligkeit) mit Zahlenfeld sowie ein Hex-Feld. Das Panel wird nach
 * `<body>` teleportiert, damit es nicht von scrollenden Bereichen abgeschnitten wird.
 *
 * v-model: Hex-String `#rrggbb`. Ungültige Eingabewerte werden als Fallback (schwarz)
 * angezeigt, es wird aber nie ein ungültiger Wert emittiert.
 *
 * Events: `update:modelValue` (live), `start` (Wert vor der Änderung), `change`
 * (Abschluss einer Interaktion), `open`, `close`.
 *
 * Nicht-Prop-Attribute: `class`/`style` landen auf dem Wurzelelement, alle anderen
 * (`title`, `aria-label`, `data-*`, …) auf dem Button.
 */
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useAttrs,
  useId,
  watch,
  type HTMLAttributes,
  type StyleValue,
} from 'vue';
import { i18n } from '@/i18n';
import {
  FALLBACK_HEX,
  HSL_RANGES,
  hexToHsl,
  hslToHex,
  hslTrackGradients,
  normalizeHex,
  setHslChannel,
  type Hsl,
  type HslChannel,
} from '@/utils/color';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    disabled?: boolean;
    /** Zugänglicher Name des Feldes; Default: i18n `color_pick`. */
    label?: string;
    /**
     * Ziel des Panel-Teleports (wie `UiDialog`). Im Bildkonverter `#overlay-root`, weil die
     * SSI-Regeln in global.scss nur #app und #overlay-root ausnehmen.
     */
    teleportTo?: string;
  }>(),
  { modelValue: FALLBACK_HEX, disabled: false, label: '', teleportTo: '#overlay-root' }
);

const emit = defineEmits<{
  'update:modelValue': [hex: string];
  start: [hex: string];
  change: [hex: string];
  open: [];
  close: [];
}>();

const I18N_KEYS = {
  color_pick: 'color.pick',
  color_hue: 'color.hue',
  color_saturation: 'color.saturation',
  color_lightness: 'color.lightness',
  color_hex: 'color.hex',
  color_invalid_hex: 'color.invalidHex',
} as const;
type TranslationKey = keyof typeof I18N_KEYS;
const t = (key: TranslationKey): string => i18n.global.t(I18N_KEYS[key]);
const uid = useId();
const attrs = useAttrs();
const rootClass = computed(() => attrs.class as HTMLAttributes['class']);
const rootStyle = computed(() => attrs.style as StyleValue);

interface Channel {
  key: HslChannel;
  short: string;
  labelKey: TranslationKey;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const channels: Channel[] = [
  { key: 'h', short: 'H', labelKey: 'color_hue', ...HSL_RANGES.h },
  { key: 's', short: 'S', labelKey: 'color_saturation', ...HSL_RANGES.s },
  { key: 'l', short: 'L', labelKey: 'color_lightness', ...HSL_RANGES.l },
];

const FALLBACK_HSL: Hsl = { h: 0, s: 0, l: 0 };

// ── Zustand ────────────────────────────────────────────────────────────────
const rootEl = ref<HTMLElement | null>(null);
const triggerEl = ref<HTMLButtonElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);

const open = ref(false);
const panelStyle = ref<Record<string, string>>({});

const hsl = ref<Hsl>(hexToHsl(props.modelValue) ?? hexToHsl(FALLBACK_HEX) ?? FALLBACK_HSL);
const currentHex = computed(() => hslToHex(hsl.value.h, hsl.value.s, hsl.value.l));
const trackGradients = computed(() => hslTrackGradients(hsl.value));

const hexDraft = ref(currentHex.value);
const hexFocused = ref(false);
const hexInvalid = ref(false);

// Externe Änderungen übernehmen. Ergibt der interne HSL-Zustand bereits denselben
// Hex-Wert, bleibt er unangetastet: so gehen Farbton/Sättigung bei Grau nicht
// verloren und der Regler springt beim Live-Update nicht durch Rundung.
watch(
  () => props.modelValue,
  (value) => {
    const normalized = normalizeHex(value) ?? FALLBACK_HEX;
    if (normalized !== currentHex.value) {
      hsl.value = hexToHsl(normalized) ?? FALLBACK_HSL;
    }
    if (!hexFocused.value) {
      hexDraft.value = normalized;
      hexInvalid.value = false;
    }
  }
);

// ── Interaktion (start/change) ─────────────────────────────────────────────
let interacting = false;
let hexBeforeInteraction: string | null = null;

function beginInteraction() {
  if (interacting) return;
  interacting = true;
  hexBeforeInteraction = currentHex.value;
  emit('start', hexBeforeInteraction);
}

function commitInteraction() {
  if (!interacting) return;
  interacting = false;
  const hex = currentHex.value;
  if (hex !== hexBeforeInteraction) emit('change', hex);
  hexBeforeInteraction = null;
}

function applyHsl(next: Hsl) {
  hsl.value = next;
  const hex = currentHex.value;
  if (!hexFocused.value) {
    hexDraft.value = hex;
    hexInvalid.value = false;
  }
  emit('update:modelValue', hex);
}

function inputValue(event: Event): string {
  return (event.target as HTMLInputElement).value;
}

function onRangeInput(channel: HslChannel, event: Event) {
  beginInteraction();
  applyHsl(setHslChannel(hsl.value, channel, inputValue(event)));
}

function onNumberInput(channel: HslChannel, event: Event) {
  const raw = inputValue(event);
  if (raw === '' || raw === '-') return; // Nutzer tippt noch
  const n = Number(raw);
  if (!Number.isFinite(n)) return;
  beginInteraction();
  applyHsl(setHslChannel(hsl.value, channel, n));
}

function onNumberBlur(channel: HslChannel, event: Event) {
  // Leeres/ungültiges Feld auf den aktuellen Wert zurücksetzen.
  (event.target as HTMLInputElement).value = String(Math.round(hsl.value[channel]));
  commitInteraction();
}

function onHexInput(event: Event) {
  hexDraft.value = inputValue(event);
  const normalized = normalizeHex(hexDraft.value);
  hexInvalid.value = normalized === null;
  if (!normalized) return;
  beginInteraction();
  if (normalized !== currentHex.value) {
    hsl.value = hexToHsl(normalized) ?? FALLBACK_HSL;
    emit('update:modelValue', normalized);
  }
}

function onHexBlur() {
  hexFocused.value = false;
  hexDraft.value = currentHex.value;
  hexInvalid.value = false;
  commitInteraction();
}

// ── Öffnen/Schließen & Positionierung ──────────────────────────────────────
const VIEWPORT_MARGIN = 8;
const PANEL_GAP = 6;

function updatePosition() {
  if (!open.value || !rootEl.value || !panelEl.value) return;
  const anchor = rootEl.value.getBoundingClientRect();
  const panel = panelEl.value.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = anchor.bottom + PANEL_GAP;
  if (top + panel.height + VIEWPORT_MARGIN > vh) {
    const above = anchor.top - PANEL_GAP - panel.height;
    top =
      above >= VIEWPORT_MARGIN
        ? above
        : Math.max(VIEWPORT_MARGIN, vh - panel.height - VIEWPORT_MARGIN);
  }

  let left = anchor.left;
  if (left + panel.width + VIEWPORT_MARGIN > vw) left = vw - panel.width - VIEWPORT_MARGIN;
  if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

  panelStyle.value = { top: `${Math.round(top)}px`, left: `${Math.round(left)}px` };
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;
  if (rootEl.value?.contains(target) || panelEl.value?.contains(target)) return;
  close(false);
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close(true);
}

function addGlobalListeners() {
  document.addEventListener('pointerdown', onDocumentPointerDown, true);
  document.addEventListener('keydown', onDocumentKeydown);
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);
}

function removeGlobalListeners() {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  document.removeEventListener('keydown', onDocumentKeydown);
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition, true);
}

async function openPanel(viaKeyboard = false) {
  if (open.value || props.disabled) return;
  open.value = true;
  hexDraft.value = currentHex.value;
  hexInvalid.value = false;
  emit('open');
  await nextTick();
  updatePosition();
  addGlobalListeners();
  if (viaKeyboard) panelEl.value?.querySelector('input')?.focus();
}

function close(restoreFocus = false) {
  if (!open.value) return;
  // Laufende Interaktion sauber abschließen (z. B. Hex-Feld noch fokussiert).
  hexFocused.value = false;
  commitInteraction();
  open.value = false;
  removeGlobalListeners();
  emit('close');
  if (restoreFocus) triggerEl.value?.focus();
}

function toggle(event?: MouseEvent) {
  if (open.value) close(false);
  else openPanel(event?.detail === 0);
}

/** Escape am Auslöser schließt nur das offene Panel, nicht einen umgebenden Dialog. */
function onTriggerEscape(event: KeyboardEvent) {
  if (!open.value) return;
  event.stopPropagation();
  event.preventDefault();
  close(true);
}

onBeforeUnmount(() => {
  removeGlobalListeners();
});

/** Alle Attribute außer class/style gehen an den Button. */
function buttonAttrs(all: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(all).filter(([key]) => key !== 'class' && key !== 'style')
  );
}

defineExpose({ open: openPanel, close, isOpen: () => open.value });
</script>

<style scoped>
/* Wurzel: übernimmt die Größen-/Rahmen-Klassen der Elternkomponente. */
.color-field {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  width: 32px;
  height: 24px;
  vertical-align: middle;
  line-height: 0;
}
.color-field--disabled {
  opacity: 0.45;
  pointer-events: none;
}

.color-field__swatch {
  display: block;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: inherit;
  cursor: pointer;
  background-clip: padding-box;
  transition: box-shadow var(--ds-duration) var(--ds-ease);
}
.color-field__swatch:focus-visible,
.color-field--open .color-field__swatch {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.color-field__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

/* Panel (nach <body> teleportiert): Overlay-Rezept wie UiDialog/UiToast */
.color-field__panel {
  position: fixed;
  z-index: var(--ds-z-toast);
  box-sizing: border-box;
  width: 260px;
  padding: var(--ds-space-3);
  display: grid;
  gap: var(--ds-space-2);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--ds-shadow-overlay);
  color: var(--ds-text);
  font-size: var(--ds-text-xs);
  line-height: var(--ds-leading-tight);
}

.color-field__row {
  display: grid;
  grid-template-columns: 16px 1fr 56px 12px;
  gap: var(--ds-space-2);
  align-items: center;
}
.color-field__row--hex {
  grid-template-columns: 16px 1fr var(--ds-control-sm);
}

.color-field__label {
  color: var(--ds-text-2);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  text-transform: uppercase;
  cursor: help;
}

/* Die Spur zeigt den Farbverlauf des Kanals (inline gesetzt) */
.color-field__range {
  width: 100%;
  height: 8px;
  margin: 0;
  border-radius: var(--ds-radius-full);
  border: var(--ds-border-width) solid var(--ds-border);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}
.color-field__range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: var(--ds-radius-full);
  background: var(--ds-surface-1);
  border: 2px solid var(--ds-accent);
  cursor: pointer;
}
.color-field__range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: var(--ds-radius-full);
  background: var(--ds-surface-1);
  border: 2px solid var(--ds-accent);
  cursor: pointer;
}
.color-field__range:focus-visible {
  box-shadow: var(--ds-focus-ring);
}

.color-field__num,
.color-field__hex {
  box-sizing: border-box;
  width: 100%;
  height: var(--ds-control-sm);
  padding: 0 var(--ds-space-1) 0 var(--ds-space-2);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-sm);
  color: var(--ds-text);
  font-family: var(--ds-font-mono);
  font-size: var(--ds-text-xs);
  font-variant-numeric: tabular-nums;
  transition:
    border-color var(--ds-duration) var(--ds-ease),
    box-shadow var(--ds-duration) var(--ds-ease);
}
.color-field__num:focus-visible,
.color-field__hex:focus-visible {
  outline: none;
  border-color: var(--ds-accent);
  box-shadow: var(--ds-focus-ring);
}
.color-field__hex--invalid,
.color-field__hex--invalid:focus-visible {
  border-color: var(--ds-danger);
  color: var(--ds-danger);
}

.color-field__unit {
  color: var(--ds-text-2);
  font-size: var(--ds-text-xs);
}

.color-field__preview {
  display: block;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  border-radius: var(--ds-radius-sm);
  border: var(--ds-border-width) solid var(--ds-border-strong);
}

@media (max-width: 768px) {
  .color-field__panel {
    width: min(300px, calc(100vw - 16px));
  }
  .color-field__range::-webkit-slider-thumb,
  .color-field__range::-moz-range-thumb {
    width: 18px;
    height: 18px;
  }
}
</style>
