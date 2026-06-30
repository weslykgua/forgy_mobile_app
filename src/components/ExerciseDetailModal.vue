<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="$emit('close')"
    :initial-breakpoint="0.75"
    :breakpoints="[0, 0.4, 0.75, 1]"
  >
    <ion-header class="forgy-header">
      <ion-toolbar>
        <ion-title class="forgy-title">Detalles</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content
      class="ion-padding"
      v-if="exercise"
    >
      <!-- Compact info header (GIF left, title/meta right) -->
      <div class="exercise-detail-compact-header">
        <div class="detail-gif-container" v-if="exercise.gifUrl">
          <img :src="exercise.gifUrl" :alt="exercise.name" @error="onImageError" />
        </div>
        <div class="detail-info-container">
          <h2 class="detail-title">{{ exercise.name }}</h2>
          <div class="detail-badges-row">
            <span class="detail-badge muscle-badge">
              <span class="chip-svg-icon" v-html="getMuscleIcon(exercise.muscle)"></span>
              <span>{{ exercise.muscle }}</span>
            </span>
            <span class="detail-badge difficulty-badge" :class="exercise.difficulty.toLowerCase()">
              <span class="difficulty-dot"></span>
              <span>{{ exercise.difficulty }}</span>
            </span>
          </div>
          <div class="detail-equipment-row" v-if="exercise.equipment">
            <ion-icon :icon="barbell" class="equipment-icon"></ion-icon>
            <span>{{ exercise.equipment }}</span>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="detail-section" v-if="exercise.description">
        <h4 class="detail-section-title">Descripción</h4>
        <p class="detail-description-text">{{ exercise.description }}</p>
      </div>

      <!-- Step-by-step instructions -->
      <div class="detail-section" v-if="exercise.instructions && exercise.instructions.length">
        <h4 class="detail-section-title">Instrucciones técnicas</h4>
        <div class="technical-steps">
          <div
            v-for="(step, idx) in exercise.instructions"
            :key="idx"
            class="technical-step-row"
          >
            <span class="step-number-circle">{{ idx + 1 }}</span>
            <span class="step-text">{{ step }}</span>
          </div>
        </div>
      </div>

      <!-- Action buttons (compact and aligned) -->
      <div class="ion-margin-top" style="display: flex; flex-direction: column; gap: 8px;">
        <ion-button
          expand="block"
          color="primary"
          @click="openVideo"
        >
          <ion-icon
            slot="start"
            :icon="videocam"
          ></ion-icon>
          {{ exercise.video ? 'Ver Video Tutorial' : 'Buscar Video en YouTube' }}
        </ion-button>

        <ion-button
          expand="block"
          fill="outline"
          @click="$emit('add', exercise)"
        >
          <ion-icon
            slot="start"
            :icon="bookmark"
          ></ion-icon>
          Guardar en Rutina
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon } from '@ionic/vue';
import { barbell, videocam, bookmark } from 'ionicons/icons';
import { getMuscleIcon } from '@/utils/muscles';
import type { Exercise } from '@/interfaces';

const props = defineProps<{
  isOpen: boolean;
  exercise: Exercise | null;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'add', exercise: Exercise): void;
}>();

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
};

const openVideo = () => {
  if (!props.exercise) return;
  const url = props.exercise.video || 'https://www.youtube.com/results?search_query=' + encodeURIComponent(props.exercise.name) + ' exercise';
  window.open(url, '_blank');
};
</script>

<style scoped>
.exercise-detail-compact-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.detail-gif-container {
  width: 90px;
  height: 90px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--forgy-input-bg, rgba(var(--ion-border-color-rgb), 0.08));
  border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.06));
}

.detail-gif-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-info-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--forgy-text-primary);
  line-height: 1.2;
}

.detail-badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.muscle-badge {
  background: var(--forgy-input-bg, rgba(var(--ion-border-color-rgb), 0.05));
  border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.06));
  color: var(--forgy-text-primary);
}

.difficulty-badge {
  border: 1px solid currentColor;
  background: transparent;
}

.difficulty-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.difficulty-badge.principiante {
  color: var(--ion-color-success, #2dd36f);
  background: rgba(var(--ion-color-success-rgb, 45, 211, 111), 0.08);
}

.difficulty-badge.intermedio {
  color: var(--ion-color-warning, #ffc409);
  background: rgba(var(--ion-color-warning-rgb, 255, 196, 9), 0.08);
}

.difficulty-badge.avanzado {
  color: var(--ion-color-danger, #eb445a);
  background: rgba(var(--ion-color-danger-rgb, 235, 68, 90), 0.08);
}

.detail-equipment-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--forgy-text-secondary, #666);
}

.equipment-icon {
  font-size: 16px;
}

.detail-section {
  border-top: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.06));
  padding-top: 16px;
  margin-top: 16px;
}

.detail-section-title {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--forgy-text-secondary, #777);
  letter-spacing: 0.05em;
}

.detail-description-text {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--forgy-text-primary);
}

.technical-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.technical-step-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-number-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--forgy-text-primary);
}

.chip-svg-icon {
  display: flex;
  align-items: center;
}

.chip-svg-icon :deep(.muscle-svg) {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

.chip-svg-icon :deep(.muscle-icon-img) {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
</style>
