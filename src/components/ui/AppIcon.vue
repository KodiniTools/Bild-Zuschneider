<template>
  <component
    :is="iconMap[name]"
    :class="['app-icon', { 'app-icon--spin': spin }]"
    :size="size"
    :stroke-width="strokeWidth"
    aria-hidden="true"
    focusable="false"
  />
</template>

<script setup lang="ts">
import { iconMap, type IconName } from './iconMap';

/**
 * Icon im Lucide-Stil (Design-System v2): Outline, 24-px-Raster,
 * stroke-width 1.75, erbt currentColor. 16 px in Controls, 20 px freistehend.
 * Rein dekorativ (aria-hidden); den zugänglichen Namen trägt der Button.
 */
withDefaults(
  defineProps<{
    name: IconName;
    size?: number;
    strokeWidth?: number;
    spin?: boolean;
  }>(),
  { size: 16, strokeWidth: 1.75, spin: false }
);
</script>

<style scoped>
.app-icon {
  flex-shrink: 0;
  vertical-align: middle;
}

.app-icon--spin {
  animation: app-icon-spin 1s linear infinite;
}

@keyframes app-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-icon--spin {
    animation: none;
  }
}
</style>
