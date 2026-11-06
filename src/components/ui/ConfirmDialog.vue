<template>
  <UiDialog
    teleport-to="#overlay-root"
    :open="state.visible"
    :title="state.title"
    :description="state.message"
    :close-label="t('common.close')"
    @close="cancel"
  >
    <template #footer>
      <UiButton variant="secondary" @click="cancel">
        {{ state.cancelText }}
      </UiButton>
      <UiButton :variant="confirmVariant" @click="ok">
        {{ state.confirmText }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirm } from '@/composables/useConfirm';
import UiButton from '@/components/ui/UiButton.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import type { ButtonVariant } from '@/components/ui/types';

/**
 * Globaler Bestätigungsdialog für `useConfirm().confirm(message, options)`.
 * Aufbau wie die Bestätigungen im Collage Maker: UiDialog mit Titel und Text,
 * Abbrechen (sekundär) und Bestätigen (danger destruktiv, sonst primär).
 * Escape, Hintergrund und Schließen-Button brechen ab.
 */
const { t } = useI18n();
const { state, respond } = useConfirm();

const confirmVariant = computed<ButtonVariant>(() =>
  state.value.variant === 'danger' ? 'danger' : 'primary'
);

function ok(): void {
  respond(true);
}

function cancel(): void {
  respond(false);
}
</script>
