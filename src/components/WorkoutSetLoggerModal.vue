<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="$emit('close')"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ exercise?.name }}</ion-title>
        <ion-buttons slot="end">
          <ion-button
            strong
            @click="$emit('close')"
          >Hecho</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content
      class="ion-padding"
      v-if="exercise && log"
    >
      <div class="sets-header">
        <ion-label>Set</ion-label>
        <ion-label>Peso (kg)</ion-label>
        <ion-label>Reps</ion-label>
        <ion-label>Hecho</ion-label>
        <span />
      </div>
      
      <div
        v-for="(set, index) in log.sets"
        :key="index"
        class="set-row"
      >
        <ion-label class="set-number">{{ index + 1 }}</ion-label>
        <ion-input
          type="number"
          v-model="set.weight"
          placeholder="0"
          aria-label="Peso"
        ></ion-input>
        <ion-input
          type="number"
          v-model="set.reps"
          placeholder="0"
          aria-label="Repeticiones"
        ></ion-input>
        <ion-checkbox
          v-model="set.completed"
          @ionChange="onCheckChange($event, set)"
          aria-label="Completado"
        ></ion-checkbox>
        <ion-button
          fill="clear"
          color="danger"
          @click="removeSet(index)"
        >
          <ion-icon
            slot="icon-only"
            :icon="trash"
          ></ion-icon>
        </ion-button>
      </div>

      <ion-button
        expand="block"
        fill="clear"
        @click="addSet"
        class="ion-margin-bottom"
      >
        <ion-icon
          slot="start"
          :icon="addCircleOutline"
        ></ion-icon>
        Añadir Serie
      </ion-button>

      <ion-item>
        <ion-input
          label="Duración (minutos)"
          label-placement="stacked"
          type="number"
          v-model="log.duration"
          placeholder="Ej: 15"
        ></ion-input>
      </ion-item>

      <ion-item>
        <ion-textarea
          label="Notas del ejercicio"
          label-placement="stacked"
          v-model="log.notes"
          placeholder="¿Cómo te sentiste? ¿Alguna observación?"
          :auto-grow="true"
          :rows="3"
        ></ion-textarea>
      </ion-item>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonLabel, IonInput, IonCheckbox, IonIcon, IonItem, IonTextarea, toastController } from '@ionic/vue';
import { trash, addCircleOutline } from 'ionicons/icons';
import type { Exercise } from '@/interfaces';

const props = defineProps<{
  isOpen: boolean;
  exercise: Exercise | null;
  log: {
    sets: Array<{ reps: string; weight: string; completed: boolean }>;
    notes: string;
    duration: string;
  } | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const showToast = async (message: string, color = 'warning') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: 'bottom'
  });
  await toast.present();
};

const addSet = () => {
  if (props.log) {
    props.log.sets.push({ reps: '', weight: '', completed: false });
  }
};

const removeSet = (index: number) => {
  if (!props.log) return;
  if (props.log.sets.length > 1) {
    props.log.sets.splice(index, 1);
  } else {
    showToast('Cada ejercicio debe tener al menos una serie.', 'warning');
  }
};

const onCheckChange = (event: CustomEvent, set: { reps: string; weight: string; completed: boolean }) => {
  const isChecked = event.detail.checked;
  if (isChecked) {
    if (!set.weight || !set.reps || Number(set.weight) <= 0 || Number(set.reps) <= 0) {
      showToast('Ingresa peso y repeticiones válidos antes de marcar.', 'warning');
      setTimeout(() => {
        set.completed = false;
      }, 10);
    }
  }
};
</script>

<style scoped>
.sets-header {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 50px 40px;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.1));
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--forgy-text-secondary);
  text-align: center;
  align-items: center;
}

.set-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 50px 40px;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.05));
  align-items: center;
  text-align: center;
}

.set-number {
  font-weight: 800;
  color: var(--forgy-text-primary);
}

ion-input {
  --background: var(--forgy-input-bg, #f4f5f8);
  border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.08));
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  --padding-start: 4px;
  --padding-end: 4px;
  height: 36px;
}

ion-checkbox {
  margin: 0 auto;
  --size: 20px;
}

ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-top: 10px;
}
</style>
