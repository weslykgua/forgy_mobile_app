<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="$emit('close')"
  >
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-button @click="$emit('close')">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>Nuevo Ejercicio</ion-title>
        <ion-buttons slot="end">
          <ion-button strong @click="$emit('save')">Guardar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-item>
          <ion-input
            v-model="form.name"
            label="Nombre"
            label-placement="stacked"
            placeholder="Ej: Press de banca"
            required
            aria-label="Nombre del ejercicio"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-select
            v-model="form.muscle"
            label="Músculo"
            label-placement="stacked"
            interface="action-sheet"
            aria-label="Grupo muscular"
          >
            <ion-select-option
              v-for="m in muscles.slice(1)"
              :key="m"
              :value="m"
            >
              {{ m }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-select
            v-model="form.difficulty"
            label="Dificultad"
            label-placement="stacked"
            interface="action-sheet"
            aria-label="Nivel de dificultad"
          >
            <ion-select-option
              v-for="d in difficulties"
              :key="d"
              :value="d"
            >
              {{ d }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-input
            v-model="form.equipment"
            label="Equipamiento"
            label-placement="stacked"
            placeholder="Ej: Barra y mancuernas"
            aria-label="Equipamiento necesario"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-textarea
            v-model="form.description"
            label="Descripción"
            label-placement="stacked"
            placeholder="Describe el ejercicio..."
            :auto-grow="true"
            aria-label="Descripción del ejercicio"
          ></ion-textarea>
        </ion-item>

        <ion-item>
          <ion-textarea
            v-model="form.instructions"
            label="Instrucciones (una por línea)"
            label-placement="stacked"
            placeholder="1. Primer paso&#10;2. Segundo paso..."
            :auto-grow="true"
            :rows="4"
            aria-label="Instrucciones paso a paso"
          ></ion-textarea>
        </ion-item>

        <ion-item>
          <ion-input
            v-model="form.video"
            label="URL del Video"
            label-placement="stacked"
            placeholder="https://youtube.com/..."
            type="url"
            aria-label="Enlace a video demostrativo"
          ></ion-input>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonList, IonItem, IonInput, IonSelect, IonSelectOption, IonTextarea } from '@ionic/vue';
import { muscleGroups } from '@/utils/muscles';

defineProps<{
  isOpen: boolean;
  form: {
    name: string;
    muscle: string;
    video: string;
    description: string;
    difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
    equipment: string;
    instructions: string;
  };
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'save'): void;
}>();

const muscles = muscleGroups;
const difficulties = ['Principiante', 'Intermedio', 'Avanzado'];
</script>

<style scoped>
ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 8px;
}
</style>
