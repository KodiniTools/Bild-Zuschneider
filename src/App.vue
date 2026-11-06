<template>
  <AppHeader />
  <main id="main-content" class="app-main">
    <RouterView />
  </main>
  <ToastContainer />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppHeader from '@/components/layout/AppHeader.vue';
import { ConfirmDialog, ToastContainer } from '@/components/ui';
import { useSettingsStore } from '@/stores/settings';

// Früh starten: Theme-/Sprach-Watcher und Listener der globalen Navigation
useSettingsStore();
</script>

<style lang="scss">
// Seitenrahmen der Views (global, da von allen Views genutzt)
.app-main {
  max-width: var(--ds-container);
  margin: 0 auto;
  padding: var(--ds-space-8) var(--ds-space-6) var(--ds-space-16);
}

.page__lead {
  color: var(--ds-text-2);
  max-width: 60ch;
}

@media (max-width: 480px) {
  .app-main {
    padding: var(--ds-space-6) var(--ds-space-4) var(--ds-space-12);
  }
}
</style>
