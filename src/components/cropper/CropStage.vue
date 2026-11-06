<template>
  <div ref="container" class="crop-stage" :aria-label="t('crop.stageLabel')" role="region">
    <div v-if="scale > 0" class="crop-stage__surface" :style="surfaceStyle">
      <canvas ref="canvas" class="crop-stage__canvas" data-testid="crop-canvas" />
      <CropOverlay
        :crop="editor.crop"
        :bounds="editor.workSize"
        :ratio="editor.ratio"
        :scale="scale"
        :show-grid="editor.showGrid"
        @change="editor.setCrop"
        @commit="editor.commit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEditorStore } from '@/stores/editor';
import { useStageFit } from '@/composables/cropper/useStageFit';
import { drawTransformed } from '@/lib/transform';
import CropOverlay from './CropOverlay.vue';

/**
 * Bühne: zeigt das gedrehte/gespiegelte/begradigte Bild eingepasst auf einem Canvas
 * (Gerätepixel-genau) und legt den Zuschnittrahmen darüber. Gezeichnet wird nur bei
 * neuem Bild, neuer Transformation oder neuer Größe – nicht beim Ziehen des Rahmens.
 */
const { t } = useI18n();
const editor = useEditorStore();
const container = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const { scale } = useStageFit(container, toRef(editor, 'workSize'));

const displaySize = computed(() => ({
  width: Math.round(editor.workSize.width * scale.value),
  height: Math.round(editor.workSize.height * scale.value),
}));

const surfaceStyle = computed(() => ({
  width: `${displaySize.value.width}px`,
  height: `${displaySize.value.height}px`,
}));

function draw() {
  const el = canvas.value;
  const source = editor.image?.bitmap;
  if (!el || !source) return;
  const dpr = window.devicePixelRatio || 1;
  el.width = Math.max(1, Math.round(displaySize.value.width * dpr));
  el.height = Math.max(1, Math.round(displaySize.value.height * dpr));
  const ctx = el.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, el.width, el.height);
  drawTransformed(ctx, source, editor.transform, { scale: el.width / editor.workSize.width });
}

watch(
  [() => editor.image, () => editor.transform, displaySize],
  async () => {
    await nextTick(); // Canvas existiert erst, wenn scale > 0
    draw();
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.crop-stage {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  min-height: 240px;
}

.crop-stage__surface {
  position: relative;
  flex: none;
  // Schachbrett zeigt Transparenz (README: erlaubt für Transparenz)
  background: repeating-conic-gradient(var(--ds-border-strong) 0% 25%, var(--ds-surface-1) 0% 50%) 0
    0 / 16px 16px;
}

.crop-stage__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
