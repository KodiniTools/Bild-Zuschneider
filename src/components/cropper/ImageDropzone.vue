<template>
  <div
    class="image-dropzone"
    :class="{ 'image-dropzone--over': over }"
    @dragenter.prevent="over = true"
    @dragover.prevent="over = true"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <UiEmptyState :title="t('load.title')" :text="t('load.text')">
      <template #icon>
        <AppIcon name="image-up" :size="40" />
      </template>
      <template #action>
        <UiButton variant="primary" :disabled="loading" @click="input?.click()">
          <template #icon>
            <AppIcon :name="loading ? 'loader-circle' : 'upload'" :spin="loading" />
          </template>
          {{ loading ? t('load.loading') : t('load.choose') }}
        </UiButton>
      </template>
    </UiEmptyState>
    <p class="image-dropzone__privacy">{{ t('load.privacy') }}</p>
    <input
      ref="input"
      class="image-dropzone__input"
      type="file"
      :accept="ACCEPT"
      tabindex="-1"
      aria-hidden="true"
      data-testid="file-input"
      @change="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { AppIcon, UiButton, UiEmptyState } from '@/components/ui';
import { ACCEPT } from '@/lib/loadImage';

/** Ablagefläche für ein Bild: Ziehen & Ablegen oder Dateiauswahl. Meldet die Datei. */
defineProps<{ loading: boolean }>();
const emit = defineEmits<{ file: [file: File] }>();

const { t } = useI18n();
const input = ref<HTMLInputElement | null>(null);
const over = ref(false);

function onDragLeave(event: DragEvent) {
  // Nur beim Verlassen der Fläche selbst, nicht beim Wechsel auf ein Kind
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
    over.value = false;
  }
}

function onDrop(event: DragEvent) {
  over.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) emit('file', file);
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) emit('file', file);
  target.value = ''; // dieselbe Datei erneut wählbar
}

defineExpose({ open: () => input.value?.click() });
</script>

<style scoped lang="scss">
.image-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--ds-space-6);
  border: var(--ds-border-width) dashed var(--ds-border-strong);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-surface-1);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);
}

.image-dropzone--over {
  border-color: var(--ds-accent);
  background: var(--ds-accent-soft);
}

.image-dropzone__privacy {
  margin: 0;
  color: var(--ds-text-3);
  font-size: var(--ds-text-sm);
}

.image-dropzone__input {
  display: none;
}
</style>
