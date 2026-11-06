<template>
  <div
    ref="surface"
    class="crop-overlay"
    :class="{ 'crop-overlay--dragging': dragging }"
    @pointerdown="onPointerDown($event, 'create')"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div
      class="crop-overlay__frame"
      :style="frameStyle"
      tabindex="0"
      role="group"
      :aria-label="`${t('crop.frameLabel')}: ${crop.width} × ${crop.height} px`"
      :aria-describedby="hintId"
      data-testid="crop-frame"
      @pointerdown="onPointerDown($event, 'move')"
      @keydown="onKeyDown"
    >
      <div v-if="showGrid" class="crop-overlay__grid" aria-hidden="true">
        <span v-for="line in GRID_LINES" :key="line" :class="['crop-overlay__line', line]" />
      </div>
      <span
        v-for="handle in HANDLES"
        :key="handle"
        :class="['crop-overlay__handle', `crop-overlay__handle--${handle}`]"
        :data-handle="handle"
        :title="t(`crop.handles.${handle}`)"
        aria-hidden="true"
        @pointerdown="onPointerDown($event, handle)"
      />
    </div>
    <span class="crop-overlay__size" :style="labelStyle" aria-hidden="true">
      {{ crop.width }} × {{ crop.height }}
    </span>
    <p :id="hintId" class="crop-overlay__hint">{{ t('crop.frameHint') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import { HANDLES, type Rect, type Size } from '@/lib/geometry';
import { useCropInteraction } from '@/composables/cropper/useCropInteraction';

/**
 * Zuschnittrahmen über der Bildfläche (Muster: Bildkonverter `CropOverlay.vue`).
 * Arbeitet in Bildpixeln; `scale` rechnet in Anzeigepixel um. Außerhalb des Rahmens
 * dunkelt ein Schatten ab (Backdrop-Wert), Rahmen und Griffe sind weiß.
 */
const props = defineProps<{
  crop: Rect;
  bounds: Size;
  ratio: number | null;
  scale: number;
  showGrid: boolean;
}>();

const emit = defineEmits<{ change: [rect: Rect]; commit: [] }>();

const { t } = useI18n();
const hintId = useId();
const GRID_LINES = ['v1', 'v2', 'h1', 'h2'] as const;
const surface = ref<HTMLElement | null>(null);

const { dragging, onPointerDown, onPointerMove, onPointerUp, onKeyDown } = useCropInteraction({
  crop: toRef(props, 'crop'),
  bounds: toRef(props, 'bounds'),
  ratio: toRef(props, 'ratio'),
  scale: toRef(props, 'scale'),
  surface,
  onChange: (rect) => emit('change', rect),
  onCommit: () => emit('commit'),
});

const px = (value: number) => `${value * props.scale}px`;

const frameStyle = computed(() => ({
  left: px(props.crop.x),
  top: px(props.crop.y),
  width: px(props.crop.width),
  height: px(props.crop.height),
}));

/** Maße über dem Rahmen; ist oben kein Platz, innen an der Oberkante. */
const labelStyle = computed(() => {
  const top = props.crop.y * props.scale;
  return {
    left: px(props.crop.x),
    top: top >= 28 ? `${top - 28}px` : `${top + 4}px`,
  };
});
</script>

<style scoped lang="scss">
.crop-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  cursor: crosshair;
  touch-action: none;
  user-select: none;
}

.crop-overlay__frame {
  position: absolute;
  border: var(--ds-border-width) solid #fff;
  // Abdunklung außerhalb des Ausschnitts (Backdrop-Wert laut Design-System-README)
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  cursor: move;

  &:focus-visible {
    outline: none;
    border-color: var(--ds-accent);
  }
}

.crop-overlay--dragging .crop-overlay__frame {
  cursor: grabbing;
}

.crop-overlay__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

// Drittel-Linien: 1 px Weiß mit halber Deckkraft
.crop-overlay__line {
  position: absolute;
  background: rgba(255, 255, 255, 0.5);
}

.v1,
.v2 {
  top: 0;
  bottom: 0;
  width: 1px;
}

.h1,
.h2 {
  left: 0;
  right: 0;
  height: 1px;
}

.v1 {
  left: 33.333%;
}
.v2 {
  left: 66.666%;
}
.h1 {
  top: 33.333%;
}
.h2 {
  top: 66.666%;
}

// Griffe: 12 px sichtbar, Trefferfläche 32 px (::before) für Touch
.crop-overlay__handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  border: var(--ds-border-width) solid rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -50%);

  &::before {
    content: '';
    position: absolute;
    inset: -10px;
  }
}

.crop-overlay__handle--nw {
  left: 0;
  top: 0;
  cursor: nwse-resize;
}
.crop-overlay__handle--n {
  left: 50%;
  top: 0;
  cursor: ns-resize;
}
.crop-overlay__handle--ne {
  left: 100%;
  top: 0;
  cursor: nesw-resize;
}
.crop-overlay__handle--e {
  left: 100%;
  top: 50%;
  cursor: ew-resize;
}
.crop-overlay__handle--se {
  left: 100%;
  top: 100%;
  cursor: nwse-resize;
}
.crop-overlay__handle--s {
  left: 50%;
  top: 100%;
  cursor: ns-resize;
}
.crop-overlay__handle--sw {
  left: 0;
  top: 100%;
  cursor: nesw-resize;
}
.crop-overlay__handle--w {
  left: 0;
  top: 50%;
  cursor: ew-resize;
}

.crop-overlay__size {
  position: absolute;
  padding: var(--ds-space-1) var(--ds-space-2);
  border-radius: var(--ds-radius-sm);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  pointer-events: none;
  white-space: nowrap;
}

// Hinweis nur für Screenreader (über aria-describedby)
.crop-overlay__hint {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
