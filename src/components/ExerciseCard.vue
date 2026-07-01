<template>
  <ion-card
    class="exercise-card"
    button
    @click="$emit('click', exercise)"
  >
    <ion-card-header>
      <div class="card-header-content">
        <div class="exercise-info">
          <ion-card-title>{{ exercise.name }}</ion-card-title>
          <div class="exercise-meta">
            <ion-chip
              size="small"
              color="tertiary"
            >
              <span class="chip-svg-icon" v-html="getMuscleIcon(exercise.muscle)"></span>
              <ion-label class="chip-text">{{ exercise.muscle }}</ion-label>
            </ion-chip>
            <ion-chip
              size="small"
              :color="getDifficultyColor(exercise.difficulty)"
              class="difficulty-chip"
              :class="exercise.difficulty.toLowerCase()"
            >
              <span class="difficulty-dot"></span>
              <ion-label>{{ exercise.difficulty }}</ion-label>
            </ion-chip>
          </div>
        </div>
        <!-- GIF thumbnail con manejador de error -->
        <div v-if="exercise.gifUrl" class="exercise-gif-thumb">
          <img :src="exercise.gifUrl" :alt="exercise.name" loading="lazy" @error="onImageError" />
        </div>
      </div>
    </ion-card-header>

    <ion-card-content>
      <p class="exercise-description">{{ exercise.description || exercise.equipment || 'Toca para ver detalles' }}</p>

      <div
        v-if="exercise.equipment"
        class="exercise-equipment"
      >
        <ion-icon :icon="barbell"></ion-icon>
        <span>{{ exercise.equipment }}</span>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonChip, IonLabel, IonIcon } from '@ionic/vue';
import { barbell } from 'ionicons/icons';
import { getMuscleIcon } from '@/utils/muscles';
import type { Exercise } from '@/interfaces';

defineProps<{
  exercise: Exercise;
}>();

defineEmits<{
  (e: 'click', exercise: Exercise): void;
}>();

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Principiante': return 'success';
    case 'Intermedio': return 'warning';
    case 'Avanzado': return 'danger';
    default: return 'medium';
  }
};

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  let currentSrc = img.src;
  let modified = false;

  if (currentSrc.includes('/data/videos/')) {
    currentSrc = currentSrc.replace('/data/videos/', '/videos/');
    modified = true;
  } else if (currentSrc.includes('/data/images/')) {
    currentSrc = currentSrc.replace('/data/images/', '/images/');
    modified = true;
  }

  if (currentSrc.includes('/videos/') && currentSrc.endsWith('.gif')) {
    img.src = currentSrc.replace('/videos/', '/images/').replace('.gif', '.jpg');
  } else if (modified) {
    img.src = currentSrc;
  } else {
    img.style.display = 'none';
  }
};
</script>

<style scoped>
.exercise-card {
  margin-bottom: 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  --background: var(--forgy-card-bg);
  color: var(--forgy-text-primary);
  border: 1px solid var(--ion-border-color);
  margin-left: 0;
  margin-right: 0;
}

.exercise-card ion-card-title {
  color: var(--forgy-text-primary) !important;
  font-weight: 700;
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.exercise-info {
  flex: 1;
}

.exercise-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.exercise-meta ion-chip {
  height: 28px;
  font-size: 12px;
  margin: 0;
}

/* Mejorar contraste de la letra del músculo en tarjetas (modo claro y oscuro) */
.exercise-meta :deep(ion-chip[color="tertiary"]) {
  --color: #5856d6 !important;
  --background: rgba(88, 86, 214, 0.1) !important;
}

.difficulty-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
  background-color: currentColor;
  display: inline-block;
}

.exercise-gif-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--ion-border-color);
  background: var(--forgy-input-bg);
}

.exercise-gif-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.exercise-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--forgy-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.exercise-equipment {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--forgy-text-secondary);
}

.exercise-equipment ion-icon {
  font-size: 16px;
}

.chip-svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.chip-text {
  margin-left: 6px;
  vertical-align: middle;
}
</style>
