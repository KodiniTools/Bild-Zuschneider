<template>
  <section class="page home">
    <header class="home__header">
      <div>
        <h1>{{ t('pages.home.title') }}</h1>
        <p class="page__lead">{{ t('app.tagline') }}</p>
      </div>
      <UiButton v-if="editor.hasImage" variant="secondary" @click="dropzone?.open()">
        <template #icon><AppIcon name="image-up" /></template>
        {{ t('load.replace') }}
      </UiButton>
    </header>

    <LoadErrorCallout v-if="editor.error" :code="editor.error" class="home__error" />

    <ImageDropzone
      v-show="!editor.hasImage"
      ref="dropzone"
      :loading="editor.loading"
      @file="editor.loadFile"
    />

    <div v-if="editor.hasImage" class="home__workspace">
      <div class="home__stage">
        <StageToolbar />
        <CropStage />
      </div>
      <CropSidebar class="home__sidebar" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { AppIcon, UiButton } from '@/components/ui';
import CropSidebar from '@/components/cropper/CropSidebar.vue';
import CropStage from '@/components/cropper/CropStage.vue';
import ImageDropzone from '@/components/cropper/ImageDropzone.vue';
import StageToolbar from '@/components/cropper/StageToolbar.vue';
import LoadErrorCallout from '@/components/cropper/LoadErrorCallout.vue';
import { useEditorStore } from '@/stores/editor';

/**
 * Werkzeug auf `/` (Entscheidung Schritt 0): Bild laden, Rahmen setzen, drehen;
 * Tastenkürzel für den Verlauf. Die
 * Ablagefläche bleibt eingebunden (v-show), damit „Anderes Bild“ ihr Datei-Input nutzt.
 */
const { t } = useI18n();
const editor = useEditorStore();
const dropzone = ref<InstanceType<typeof ImageDropzone> | null>(null);

/** Bild aus der Zwischenablage (Strg+V), außer beim Tippen in Feldern. */
function onPaste(event: ClipboardEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest('input, textarea, [contenteditable="true"]')) return;
  const file = [...(event.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
  if (!file) return;
  event.preventDefault();
  void editor.loadFile(file);
}

/** Rückgängig: Strg/⌘+Z; Wiederholen: Strg/⌘+Umschalt+Z oder Strg+Y. Nicht in Feldern. */
function onKeyDown(event: KeyboardEvent) {
  if (!editor.hasImage || !(event.ctrlKey || event.metaKey) || event.altKey) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
  const key = event.key.toLowerCase();
  if (key === 'z' && !event.shiftKey) editor.undo();
  else if ((key === 'z' && event.shiftKey) || key === 'y') editor.redo();
  else return;
  event.preventDefault();
}

onMounted(() => {
  window.addEventListener('paste', onPaste);
  window.addEventListener('keydown', onKeyDown);
});
onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste);
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<style scoped lang="scss">
.home__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--ds-space-4);
  margin-bottom: var(--ds-space-6);
}

.home__error {
  margin-bottom: var(--ds-space-4);
}

.home__stage {
  min-width: 0;
}

.home__workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
  gap: var(--ds-space-6);
}

@media (max-width: 900px) {
  .home__workspace {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
