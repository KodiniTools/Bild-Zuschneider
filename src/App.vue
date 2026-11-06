<template>
  <main id="main-content" class="app-main">
    <RouterView />
  </main>
  <ToastContainer />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { ConfirmDialog, ToastContainer } from '@/components/ui';
</script>
