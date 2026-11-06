<template>
  <Teleport to="#overlay-root">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <UiToast
          v-for="toast in toasts"
          :key="toast.id"
          :message="toast.text"
          :type="toast.type"
          :dismiss-label="t('common.close')"
          dismiss-on-click
          @dismiss="removeToast(toast.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UiToast from '@/components/ui/UiToast.vue';
import type { ToastType } from '@/components/ui/types';
import { toastText, type ToastInput } from '@/utils/toast';

/**
 * Stapel der Benachrichtigungen unten rechts. Die App ruft sie über
 * `window.$toast.success|error|warning|info(message, title?, duration?)` auf.
 */
interface ToastItem {
  id: number;
  type: ToastType;
  text: string;
}

const { t } = useI18n();
const toasts = ref<ToastItem[]>([]);

function addToast(toast: ToastInput): void {
  const id = Date.now() + Math.random();
  const duration = toast.duration || 3000;

  toasts.value.push({
    id,
    type: toast.type || 'info',
    text: toastText(toast.message, toast.title),
  });

  setTimeout(() => {
    removeToast(id);
  }, duration);
}

function removeToast(id: number): void {
  const index = toasts.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
}

defineExpose({
  addToast,
});

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.$toast = {
      success: (message, title = null, duration = 3000) => {
        addToast({ type: 'success', message, title, duration });
      },
      error: (message, title = null, duration = 4000) => {
        addToast({ type: 'error', message, title, duration });
      },
      warning: (message, title = null, duration = 3500) => {
        addToast({ type: 'warning', message, title, duration });
      },
      info: (message, title = null, duration = 3000) => {
        addToast({ type: 'info', message, title, duration });
      },
    };
  }
});
</script>

<style lang="scss" scoped>
/* Stapel wie im Collage Maker (ToastContainer): unten rechts, Abstand space-2,
   Klicks nur auf die Toasts selbst. Aussehen kommt aus UiToast. */
.toast-container {
  position: fixed;
  right: var(--ds-space-4);
  bottom: var(--ds-space-4);
  z-index: var(--ds-z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  max-width: calc(100vw - var(--ds-space-4));
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  @media (max-width: 639px) {
    right: var(--ds-space-2);
    bottom: var(--ds-space-2);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--ds-duration-slow) var(--ds-ease),
    transform var(--ds-duration-slow) var(--ds-ease);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
