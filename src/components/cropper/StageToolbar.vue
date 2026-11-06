<template>
  <div class="stage-toolbar" role="toolbar" :aria-label="t('history.toolbar')">
    <UiIconButton
      :label="t('common.undo')"
      :title="`${t('common.undo')} (${shortcut}+Z)`"
      :disabled="!editor.canUndo"
      data-action="undo"
      @click="editor.undo()"
    >
      <AppIcon name="undo-2" />
    </UiIconButton>
    <UiIconButton
      :label="t('common.redo')"
      :title="`${t('common.redo')} (${shortcut}+Shift+Z)`"
      :disabled="!editor.canRedo"
      data-action="redo"
      @click="editor.redo()"
    >
      <AppIcon name="redo-2" />
    </UiIconButton>
    <span class="stage-toolbar__file" :title="editor.image?.name">{{ editor.image?.name }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { AppIcon, UiIconButton } from '@/components/ui';
import { useEditorStore } from '@/stores/editor';

/** Werkzeugleiste über der Bühne: Rückgängig/Wiederholen und Dateiname. */
const { t } = useI18n();
const editor = useEditorStore();
const isMac = /Mac|iPhone|iPad/.test(globalThis.navigator?.platform ?? '');
const shortcut = computed(() => (isMac ? '⌘' : t('history.ctrl')));
</script>

<style scoped lang="scss">
.stage-toolbar {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  margin-bottom: var(--ds-space-3);
}

.stage-toolbar__file {
  margin-left: var(--ds-space-3);
  overflow: hidden;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
