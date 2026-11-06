<template>
  <section class="transform-panel" aria-labelledby="transform-panel-title">
    <h2 id="transform-panel-title" class="panel-title">{{ t('transform.title') }}</h2>
    <div class="transform-panel__buttons">
      <UiIconButton
        v-for="action in ACTIONS"
        :key="action.id"
        variant="secondary"
        :label="t(`transform.${action.id}`)"
        :title="t(`transform.${action.id}`)"
        :data-action="action.id"
        @click="action.run"
      >
        <AppIcon :name="action.icon" />
      </UiIconButton>
    </div>
    <SliderField
      :model-value="editor.transform.angle"
      :min="-MAX_ANGLE"
      :max="MAX_ANGLE"
      :step="0.1"
      :default-value="0"
      unit="°"
      :label="t('transform.straighten')"
      input-id="straighten"
      variant="center"
      @update:model-value="editor.setAngle"
      @commit="editor.commitAngle"
      @reset="onResetAngle"
    />
    <p class="transform-panel__hint">{{ t('transform.straightenHint') }}</p>
    <UiButton variant="ghost" size="sm" :disabled="identity" @click="editor.resetTransform()">
      <template #icon><AppIcon name="rotate-ccw-square" /></template>
      {{ t('transform.reset') }}
    </UiButton>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { AppIcon, SliderField, UiButton, UiIconButton, type IconName } from '@/components/ui';
import { MAX_ANGLE, isIdentity } from '@/lib/transform';
import { useEditorStore } from '@/stores/editor';

/** Drehen in 90°-Schritten, Spiegeln und Begradigen (±45°, Rahmen zoomt mit). */
const { t } = useI18n();
const editor = useEditorStore();

const ACTIONS: ReadonlyArray<{ id: string; icon: IconName; run: () => void }> = [
  { id: 'rotateLeft', icon: 'rotate-ccw', run: () => editor.rotate('left') },
  { id: 'rotateRight', icon: 'rotate-cw', run: () => editor.rotate('right') },
  { id: 'flipHorizontal', icon: 'flip-horizontal-2', run: () => editor.flip('horizontal') },
  { id: 'flipVertical', icon: 'flip-vertical-2', run: () => editor.flip('vertical') },
];

const identity = computed(() => isIdentity(editor.transform));

function onResetAngle() {
  editor.setAngle(0);
  editor.commitAngle();
}
</script>

<style scoped lang="scss">
.transform-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-4);
}

.transform-panel__buttons {
  display: flex;
  gap: var(--ds-space-2);
}

.transform-panel__hint {
  margin: calc(-1 * var(--ds-space-2)) 0 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}

.transform-panel :deep(.slider-control) {
  width: 100%;
}
</style>
