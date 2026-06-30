<template>
  <ion-card
    button
    @click="$emit('card-click', routine)"
    class="routine-card"
    :class="{ 'is-selected': isSelected }"
  >
    <div class="routine-card-img-container">
      <!-- Checkbox de selección múltiple -->
      <div 
        v-if="isSelectionModeActive" 
        class="routine-card-selection-check"
        @click.stop="$emit('toggle-select', routine)"
      >
        <ion-checkbox 
          :checked="isSelected"
          aria-label="select-routine"
          class="custom-checkbox"
          @click.stop
          @ionChange="$emit('toggle-select', routine)"
        ></ion-checkbox>
      </div>
      
      <!-- Botón de Favorito directo (solo si no estamos seleccionando) -->
      <div 
        v-if="!isSelectionModeActive"
        class="routine-card-favorite-btn" 
        :class="{ 'is-fav': routine.isFavorite }" 
        @click.stop="$emit('toggle-favorite', routine)"
      >
        <ion-icon :icon="routine.isFavorite ? star : starOutline"></ion-icon>
      </div>
      
      <!-- Botón de Opciones (solo si no estamos seleccionando) -->
      <ion-button
        v-if="!isSelectionModeActive"
        fill="clear"
        class="routine-options-button"
        @click.stop="$emit('present-options', routine)"
      >
        <ion-icon
          slot="icon-only"
          :icon="ellipsisVertical"
        ></ion-icon>
      </ion-button>
      
      <img
        alt="Routine image"
        :src="imageUrl || routine.imageUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80'"
        @error="onImageError"
      />
      <div class="routine-card-overlay"></div>
    </div>
    
    <ion-card-header>
      <ion-card-title>{{ routine.name }}</ion-card-title>
    </ion-card-header>
    
    <ion-card-content>
      <div class="routine-meta-row">
        <div class="routine-meta-item">
          <ion-icon :icon="albums" style="font-size: 14px;"></ion-icon>
          <span>{{ routine.exercises?.length || 0 }} ej.</span>
        </div>
        <div v-if="muscleFocus" class="routine-meta-item">
          <span class="chip-svg-icon" v-html="getMuscleIcon(muscleFocus)"></span>
          <span>{{ muscleFocus }}</span>
        </div>
      </div>
    </ion-card-content>

    <!-- Indicadores de Días Programados -->
    <div class="routine-schedule-dots">
      <span 
        v-for="d in dayLabels" 
        :key="d.name" 
        class="schedule-dot"
        :class="{ active: isScheduledOnDay(d.name) }"
      >
        {{ d.label }}
      </span>
    </div>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonCheckbox } from '@ionic/vue';
import { star, starOutline, ellipsisVertical, albums } from 'ionicons/icons';
import { getMuscleIcon } from '@/utils/muscles';
import type { Routine } from '@/interfaces';

const props = defineProps<{
  routine: Routine;
  isSelectionModeActive: boolean;
  isSelected: boolean;
  imageUrl?: string;
  muscleFocus?: string;
  scheduledDays?: string[];
}>();

defineEmits<{
  (e: 'card-click', routine: Routine): void;
  (e: 'toggle-select', routine: Routine): void;
  (e: 'toggle-favorite', routine: Routine): void;
  (e: 'present-options', routine: Routine): void;
}>();

const dayLabels = [
  { label: 'L', name: 'Lunes' },
  { label: 'M', name: 'Martes' },
  { label: 'M', name: 'Miércoles' },
  { label: 'J', name: 'Jueves' },
  { label: 'V', name: 'Viernes' },
  { label: 'S', name: 'Sábado' },
  { label: 'D', name: 'Domingo' }
];

const isScheduledOnDay = (dayName: string) => {
  return Array.isArray(props.scheduledDays) && props.scheduledDays.includes(dayName);
};

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80';
};
</script>

<style scoped>
.routine-card {
  position: relative;
  overflow: hidden;
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--forgy-card-bg, var(--ion-card-background, #fff));
  border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.08));
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.routine-card.is-selected {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 10px rgba(var(--ion-color-primary-rgb), 0.2);
}

.routine-card-img-container {
  position: relative;
  width: 100%;
  height: 110px;
  overflow: hidden;
}

.routine-card-img-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.routine-card:active img {
  transform: scale(1.05);
}

.routine-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 100%);
  pointer-events: none;
}

.routine-card-selection-check {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-checkbox {
  --size: 18px;
  --border-radius: 50%;
}

.routine-card-favorite-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
}

.routine-card-favorite-btn.is-fav {
  color: var(--ion-color-warning, #ffc409);
  background: rgba(var(--ion-color-warning-rgb, 255, 196, 9), 0.2);
}

.routine-options-button {
  position: absolute;
  top: 4px;
  right: 32px;
  z-index: 10;
  --color: #fff;
  height: 32px;
  width: 32px;
  margin: 0;
}

ion-card-header {
  padding: 12px 12px 4px 12px;
}

ion-card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--forgy-text-primary);
  line-height: 1.2;
}

ion-card-content {
  padding: 0 12px 8px 12px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.routine-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.routine-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--forgy-text-secondary, #666);
}

.chip-svg-icon {
  display: flex;
  align-items: center;
}

.chip-svg-icon :deep(.muscle-svg) {
  width: 12px;
  height: 12px;
  stroke: currentColor;
}

.chip-svg-icon :deep(.muscle-icon-img) {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.routine-schedule-dots {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.05));
  padding: 6px 10px;
  background: rgba(var(--ion-border-color-rgb), 0.02);
}

.schedule-dot {
  font-size: 9px;
  font-weight: 800;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--forgy-text-secondary, #aaa);
  background: rgba(var(--ion-border-color-rgb), 0.1);
  transition: all 0.2s ease;
}

.schedule-dot.active {
  background: var(--ion-color-primary);
  color: #fff;
}
</style>
