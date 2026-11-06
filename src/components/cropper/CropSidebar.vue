<template>
  <aside class="crop-sidebar">
    <AspectPanel class="crop-sidebar__panel" />
    <CropSizePanel class="crop-sidebar__panel" />
  </aside>
</template>

<script setup lang="ts">
import AspectPanel from './AspectPanel.vue';
import CropSizePanel from './CropSizePanel.vue';

/** Seitenleiste des Werkzeugs; Transform (Schritt 5) und Export (Schritt 6) folgen hier. */
</script>

<style scoped lang="scss">
.crop-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

// Panel: flache Fläche mit Rahmen (README: surface-1, radius-lg, Padding 20)
.crop-sidebar__panel {
  padding: var(--ds-space-5);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-surface-1);
}
</style>
