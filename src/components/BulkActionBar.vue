<template>
  <div class="bulk-action-bar" v-if="selectedCount > 0">
    <span class="bulk-selected-count">{{ selectedCount }} seleccionadas</span>
    <div class="bulk-action-buttons">
      <ion-button color="primary" size="small" @click="$emit('schedule')">
        <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
        Programar
      </ion-button>
      <ion-button color="danger" size="small" @click="$emit('delete')">
        <ion-icon :icon="trash" slot="start"></ion-icon>
        Eliminar
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue';
import { calendarOutline, trash } from 'ionicons/icons';

defineProps<{
  selectedCount: number;
}>();

defineEmits<{
  (e: 'schedule'): void;
  (e: 'delete'): void;
}>();
</script>

<style scoped>
.bulk-action-bar {
  position: fixed;
  bottom: 20px;
  left: 16px;
  right: 16px;
  background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.08));
  border-radius: 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
  z-index: 1000;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.bulk-selected-count {
  font-size: 14px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.bulk-action-buttons {
  display: flex;
  gap: 8px;
}

.bulk-action-buttons ion-button {
  --border-radius: 10px !important;
  font-weight: 700;
  margin: 0;
}
</style>
