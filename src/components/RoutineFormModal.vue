<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="$emit('close')"
  >
    <ion-header class="forgy-header">
      <ion-toolbar class="modal-header-toolbar">
        <ion-buttons slot="start">
          <ion-button 
            fill="clear" 
            color="medium" 
            class="modal-btn-cancel" 
            @click="$emit('close')"
          >
            Cancelar
          </ion-button>
        </ion-buttons>
        <ion-title class="forgy-title">Nueva Rutina</ion-title>
        <ion-buttons slot="end">
          <ion-button
            fill="solid"
            color="primary"
            class="modal-btn-create"
            :disabled="isSaving"
            @click="$emit('save')"
          >
            <span v-if="!isSaving">Crear</span>
            <ion-spinner v-else name="crescent" size="small"></ion-spinner>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="routine-create-content">
      <div class="routine-image-preview-container">
        <div
          class="routine-image-preview"
          @click="$emit('open-image-picker')"
        >
          <img
            :src="form.imageUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80'"
            alt="Routine preview"
            @error="onImageError"
          />
          <div class="preview-edit-badge">
            <ion-icon :icon="camera" style="font-size: 15px; margin-right: 4px;"></ion-icon>
            <span>Elegir Portada</span>
          </div>
          <div class="routine-image-overlay"></div>
        </div>
      </div>

      <div class="routine-form-container">
        <div class="form-group">
          <label class="form-label">Nombre de la Rutina</label>
          <ion-input
            v-model="form.name"
            placeholder="Ej: Día de Piernas"
            required
            class="clean-form-input"
            aria-label="Nombre de la rutina"
          ></ion-input>
        </div>
        
        <div class="form-group">
          <label class="form-label">Foco Muscular</label>
          <ion-select
            v-model="form.muscleFocus"
            placeholder="Selecciona el foco principal"
            interface="action-sheet"
            class="clean-form-select"
            aria-label="Foco Muscular"
          >
            <ion-select-option
              v-for="m in muscles.slice(1)"
              :key="m"
              :value="m"
            >
              {{ m }}
            </ion-select-option>
          </ion-select>
        </div>

        <div class="form-group">
          <label class="form-label">Descripción <span class="optional-text">(Opcional)</span></label>
          <ion-textarea
            v-model="form.description"
            placeholder="Describe brevemente la rutina..."
            :auto-grow="true"
            :rows="3"
            class="clean-form-textarea"
            aria-label="Descripción"
          ></ion-textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Programar Días de Entrenamiento</label>
          <div class="form-days-row">
            <span 
              v-for="day in daysOfWeek" 
              :key="day" 
              class="form-day-toggle-chip" 
              :class="{ active: form.scheduledDays.includes(day) }"
              @click="toggleDay(day)"
            >
              {{ day.substring(0, 3) }}
            </span>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonSpinner, IonContent, IonInput, IonSelect, IonSelectOption, IonTextarea, IonIcon } from '@ionic/vue';
import { camera } from 'ionicons/icons';
import { muscleGroups } from '@/utils/muscles';

const props = defineProps<{
  isOpen: boolean;
  isSaving: boolean;
  form: {
    name: string;
    description: string;
    muscleFocus: string;
    imageUrl: string;
    scheduledDays: string[];
  };
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'save'): void;
  (e: 'open-image-picker'): void;
}>();

const muscles = muscleGroups;
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const toggleDay = (day: string) => {
  const index = props.form.scheduledDays.indexOf(day);
  if (index > -1) {
    props.form.scheduledDays.splice(index, 1);
  } else {
    props.form.scheduledDays.push(day);
  }
};

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80';
};
</script>

<style scoped>
.routine-image-preview-container {
  padding: 16px 20px 8px 20px;
}

.routine-image-preview {
  width: 100%;
  height: 130px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background-color: var(--forgy-input-bg, #f4f5f8);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.routine-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.routine-image-preview:active {
  transform: scale(0.98);
}

.preview-edit-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 20px;
  color: #ffffff;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.routine-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 60%);
  pointer-events: none;
}

.routine-form-container {
  padding: 12px 20px 32px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--forgy-text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-left: 2px;
}

.optional-text {
  font-size: 11px;
  text-transform: lowercase;
  font-weight: 500;
  opacity: 0.6;
}

.clean-form-input,
.clean-form-select,
.clean-form-textarea {
  --background: var(--forgy-input-bg, #f4f5f8) !important;
  --color: var(--forgy-text-primary) !important;
  --placeholder-color: var(--forgy-text-secondary) !important;
  --placeholder-opacity: 0.5 !important;
  --padding-start: 16px !important;
  --padding-end: 16px !important;
  border-radius: 14px !important;
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08)) !important;
  background: var(--forgy-input-bg, #f4f5f8) !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.clean-form-input {
  height: 52px;
}

.clean-form-select {
  --padding-top: 0 !important;
  --padding-bottom: 0 !important;
  height: 52px;
  display: flex;
  align-items: center;
}

.clean-form-textarea {
  --padding-top: 14px !important;
  --padding-bottom: 14px !important;
  min-height: 90px;
}

.clean-form-input:focus-within,
.clean-form-select:focus-within,
.clean-form-textarea:focus-within {
  border-color: var(--ion-color-primary) !important;
}

.form-days-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  width: 100%;
}

.form-day-toggle-chip {
  aspect-ratio: 1;
  flex: 1;
  max-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--forgy-input-bg, #f4f5f8);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: var(--forgy-text-secondary, #666);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-day-toggle-chip.active {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb, 56, 128, 255), 0.35);
  transform: scale(1.08);
}

.form-day-toggle-chip:active {
  transform: scale(0.9);
}
</style>
