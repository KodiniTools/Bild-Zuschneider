<template>
  <aside ref="aside" class="crop-sidebar" :aria-label="t('sidebar.label')">
    <div class="crop-sidebar__scroll" data-testid="sidebar-scroll">
      <AspectPanel class="crop-sidebar__panel" />
      <TransformPanel class="crop-sidebar__panel" />
      <CropSizePanel class="crop-sidebar__panel" />
      <ExportPanel class="crop-sidebar__panel" />
    </div>
    <DownloadAction class="crop-sidebar__footer" />
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useViewportFit } from '@/composables/useViewportFit';
import AspectPanel from './AspectPanel.vue';
import CropSizePanel from './CropSizePanel.vue';
import DownloadAction from './DownloadAction.vue';
import ExportPanel from './ExportPanel.vue';
import TransformPanel from './TransformPanel.vue';

/**
 * Seitenleiste: Format, Drehen, Maße, Export-Einstellungen und im Fuß die Primäraktion.
 *
 * Ab 900 px (zweispaltig) bleibt sie neben dem Bild stehen (sticky), ist höchstens so
 * hoch wie der sichtbare Rest des Fensters (useViewportFit) und scrollt in sich;
 * „Herunterladen“ bleibt dadurch immer sichtbar. Darunter (einspaltig) fließt alles
 * normal untereinander.
 */
const { t } = useI18n();
const aside = ref<HTMLElement | null>(null);

// 16 px = --ds-space-4 (sticky top und Abstand zum unteren Fensterrand)
useViewportFit(aside, { query: '(min-width: 901px)', stickyTop: 16, gap: 16 });
</script>

<style scoped lang="scss">
.crop-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.crop-sidebar__scroll {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

// Panel: flache Fläche mit Rahmen (README: surface-1, radius-lg, Padding 20)
.crop-sidebar__panel,
.crop-sidebar__footer {
  padding: var(--ds-space-5);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-surface-1);
}

@media (min-width: 901px) {
  .crop-sidebar {
    position: sticky;
    top: var(--ds-space-4); // = stickyTop in useViewportFit
    // max-height setzt useViewportFit (abhängig vom Abstand zur Fensteroberkante)
    gap: var(--ds-space-3);
  }

  .crop-sidebar__scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    // Platz für die Scrollleiste, damit sie die Panel-Rahmen nicht überdeckt
    padding-right: var(--ds-space-1);
    scrollbar-gutter: stable;
  }

  .crop-sidebar__footer {
    flex: none;
  }
}
</style>
