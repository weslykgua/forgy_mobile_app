<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="$emit('close')"
    class="workout-modal"
  >
    <ion-header class="forgy-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button color="medium" @click="$emit('close')">Cancelar</ion-button>
        </ion-buttons>
        <ion-title class="forgy-title">{{ isEditing ? 'Editar' : 'Nuevo' }} Ejercicio</ion-title>
        <ion-buttons slot="end">
          <ion-button
            strong
            color="primary"
            @click="$emit('save')"
          >Guardar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modal-content">
      <div class="modal-container">
        <!-- Paso 1: Seleccionar ejercicio -->
        <div class="step-section">
          <div class="step-header">
            <span class="step-number">1</span>
            <h4>Selecciona el ejercicio</h4>
          </div>

          <!-- Buscador de ejercicios -->
          <ion-searchbar
            v-model="modalSearchText"
            placeholder="Buscar por nombre..."
            :animated="true"
            class="modal-searchbar"
          ></ion-searchbar>

          <!-- Filtro por músculo -->
          <div class="muscle-filter-scroll">
            <div class="muscle-filter">
              <ion-chip
                v-for="muscle in visibleMuscleGroups"
                :key="muscle"
                :color="selectedMuscle === muscle ? 'primary' : 'medium'"
                :outline="selectedMuscle !== muscle"
                @click="selectedMuscle = muscle"
                class="muscle-chip"
              >
                <span class="muscle-icon-span" v-html="getMuscleIcon(muscle)"></span>
                <span class="chip-text">{{ muscle }}</span>
              </ion-chip>
              <ion-chip
                class="muscle-chip expand-chip"
                color="medium"
                @click="isExpandedMuscleGroups = !isExpandedMuscleGroups"
                :outline="!isExpandedMuscleGroups"
              >
                <ion-icon :icon="isExpandedMuscleGroups ? removeCircleOutline : addCircleOutline" class="expand-icon"></ion-icon>
                <span class="chip-text">{{ isExpandedMuscleGroups ? 'Ver menos' : 'Ver más' }}</span>
              </ion-chip>
            </div>
          </div>

          <!-- Lista de ejercicios filtrados -->
          <div class="exercises-grid">
            <div
              v-for="ex in filteredExercises"
              :key="ex.id"
              class="exercise-card"
              :class="{ selected: form.exerciseId === ex.id }"
              @click="selectExercise(ex)"
            >
              <div class="exercise-icon" v-html="getMuscleIcon(ex.muscle)"></div>
              <div class="exercise-info">
                <span class="exercise-name">{{ ex.name }}</span>
                <span
                  class="exercise-difficulty"
                  :class="ex.difficulty.toLowerCase()"
                >
                  {{ ex.difficulty }}
                </span>
              </div>
              <ion-icon
                v-if="form.exerciseId === ex.id"
                :icon="checkmarkCircle"
                color="success"
                class="check-icon"
              ></ion-icon>
            </div>
            <div v-if="filteredExercises.length === 0" class="no-exercises-found">
              Sin resultados para "{{ modalSearchText }}"
            </div>
          </div>
        </div>

        <!-- Paso 2: Configurar series -->
        <div
          class="step-section"
          v-if="form.exerciseId"
        >
          <div class="step-header">
            <span class="step-number">2</span>
            <h4>Configura tus series</h4>
          </div>

          <div class="sets-config">
            <div
              v-for="(set, index) in form.sets"
              :key="index"
              class="set-row-enhanced"
            >
              <div class="set-row-header">
                <div class="set-badge">Serie {{ index + 1 }}</div>
                <ion-button
                  v-if="form.sets.length > 1"
                  fill="clear"
                  color="danger"
                  size="small"
                  @click="removeSet(index)"
                  class="delete-set-btn"
                >
                  <ion-icon :icon="trash"></ion-icon>
                </ion-button>
              </div>
              
              <div class="set-inputs">
                <div class="input-group">
                  <label>Reps</label>
                  <div class="number-input">
                    <ion-button
                      fill="clear"
                      size="small"
                      @click="decrementValue(set, 'reps')"
                      class="calc-btn"
                    >
                      <ion-icon :icon="removeIcon"></ion-icon>
                    </ion-button>
                    <span class="number-value">{{ set.reps }}</span>
                    <ion-button
                      fill="clear"
                      size="small"
                      @click="incrementValue(set, 'reps')"
                      class="calc-btn"
                    >
                      <ion-icon :icon="addIcon"></ion-icon>
                    </ion-button>
                  </div>
                </div>
                <div class="input-group">
                  <label>Peso (kg)</label>
                  <div class="number-input">
                    <ion-button
                      fill="clear"
                      size="small"
                      @click="decrementValue(set, 'weight', 2.5)"
                      class="calc-btn"
                    >
                      <ion-icon :icon="removeIcon"></ion-icon>
                    </ion-button>
                    <span class="number-value">{{ set.weight }}</span>
                    <ion-button
                      fill="clear"
                      size="small"
                      @click="incrementValue(set, 'weight', 2.5)"
                      class="calc-btn"
                    >
                      <ion-icon :icon="addIcon"></ion-icon>
                    </ion-button>
                  </div>
                </div>
              </div>
            </div>

            <ion-button
              expand="block"
              fill="outline"
              @click="addSet"
              class="add-set-btn"
            >
              <ion-icon
                :icon="addIcon"
                slot="start"
              ></ion-icon>
              Agregar serie
            </ion-button>
          </div>
        </div>

        <!-- Paso 3: Detalles adicionales -->
        <div
          class="step-section"
          v-if="form.exerciseId"
        >
          <div class="step-header">
            <span class="step-number">3</span>
            <h4>Detalles adicionales</h4>
          </div>

          <ion-list
            lines="none"
            class="details-list"
          >
            <ion-item class="detail-item-input">
              <ion-icon
                :icon="time"
                slot="start"
                color="primary"
              ></ion-icon>
              <ion-input
                v-model.number="form.duration"
                type="number"
                label="Duración (minutos)"
                label-placement="floating"
                placeholder="15"
                class="detail-input"
              ></ion-input>
            </ion-item>

            <ion-item class="detail-item-input">
              <ion-icon
                :icon="documentText"
                slot="start"
                color="primary"
              ></ion-icon>
              <ion-textarea
                v-model="form.notes"
                label="Notas"
                label-placement="floating"
                placeholder="¿Cómo te sentiste? Técnica, esfuerzo..."
                :auto-grow="true"
                class="detail-textarea"
              ></ion-textarea>
            </ion-item>
          </ion-list>
        </div>

        <!-- Resumen de volumen -->
        <div
          class="workout-summary"
          v-if="form.exerciseId && form.sets.length > 0"
        >
          <h4>📊 Resumen del Ejercicio</h4>
          <div class="summary-grid">
            <div class="summary-tile">
              <span class="tile-label">Volumen total</span>
              <span class="tile-val">{{ calculateVolume() }} kg</span>
            </div>
            <div class="summary-tile">
              <span class="tile-label">Series</span>
              <span class="tile-val">{{ form.sets.length }}</span>
            </div>
            <div class="summary-tile">
              <span class="tile-label">Reps totales</span>
              <span class="tile-val">{{ form.sets.reduce((a, s) => a + s.reps, 0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonSearchbar, IonChip, IonIcon, IonList, IonItem, IonInput, IonTextarea } from '@ionic/vue';
import { removeCircleOutline, addCircleOutline, checkmarkCircle, trash, remove as removeIcon, add as addIcon, time, documentText } from 'ionicons/icons';
import { getMuscleIcon, muscleGroups, mainMuscles } from '@/utils/muscles';
import type { ExerciseSimple, WorkoutSet } from '@/interfaces';

const props = defineProps<{
  isOpen: boolean;
  isEditing: boolean;
  exercises: ExerciseSimple[];
  form: {
    exerciseId: string;
    exerciseName: string;
    duration: number;
    sets: WorkoutSet[];
    notes: string;
  };
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save'): void;
}>();

const modalSearchText = ref('');
const selectedMuscle = ref('Todos');
const isExpandedMuscleGroups = ref(false);

const visibleMuscleGroups = computed(() => {
  if (isExpandedMuscleGroups.value) return muscleGroups;
  return muscleGroups.filter(m => mainMuscles.includes(m));
});

const filteredExercises = computed(() => {
  let list = props.exercises;
  if (selectedMuscle.value !== 'Todos') {
    list = list.filter(e => e.muscle === selectedMuscle.value);
  }
  if (modalSearchText.value.trim() !== '') {
    const query = modalSearchText.value.toLowerCase();
    list = list.filter(e => e.name.toLowerCase().includes(query));
  }
  return list;
});

const selectExercise = (ex: ExerciseSimple) => {
  props.form.exerciseId = ex.id;
  props.form.exerciseName = ex.name;
};

const incrementValue = (set: WorkoutSet, field: 'reps' | 'weight', step = 1) => {
  set[field] = Number((set[field] + step).toFixed(1));
};

const decrementValue = (set: WorkoutSet, field: 'reps' | 'weight', step = 1) => {
  if (set[field] > step) {
    set[field] = Number((set[field] - step).toFixed(1));
  }
};

const calculateVolume = () => {
  return props.form.sets.reduce((acc, s) => acc + (s.reps * s.weight), 0);
};

const addSet = () => {
  const lastSet = props.form.sets[props.form.sets.length - 1];
  props.form.sets.push({
    reps: lastSet?.reps || 12,
    weight: lastSet?.weight || 20,
    completed: false
  });
};

const removeSet = (index: number) => {
  props.form.sets.splice(index, 1);
};
</script>

<style scoped>
.modal-container {
  padding: 12px 16px 32px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-number {
  background: var(--ion-color-primary);
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
}

.step-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.modal-searchbar {
  --background: var(--forgy-input-bg, #f4f5f8);
  --border-radius: 12px;
  padding: 0;
}

.muscle-filter-scroll {
  width: 100%;
}
.muscle-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  padding: 2px 0;
}

.muscle-chip {
  margin: 0;
  height: 32px;
  font-size: 12px;
}

.muscle-icon-span {
  display: flex;
  align-items: center;
  margin-right: 4px;
}
.muscle-icon-span :deep(.muscle-svg) {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}
.muscle-icon-span :deep(.muscle-icon-img) {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.expand-chip {
  height: 32px;
}

.exercises-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px 2px;
}

.exercise-card {
  background: var(--forgy-input-bg, #f4f5f8);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 12px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.exercise-card.selected {
  border-color: var(--ion-color-success);
  background: rgba(var(--ion-color-success-rgb, 45,211,111), 0.08);
}

.exercise-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.exercise-icon :deep(.muscle-svg) {
  width: 16px;
  height: 16px;
  stroke: var(--forgy-text-secondary);
}
.exercise-icon :deep(.muscle-icon-img) {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.exercise-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.exercise-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--forgy-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.exercise-difficulty {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
}
.exercise-difficulty.principiante { color: var(--ion-color-success); }
.exercise-difficulty.intermedio { color: var(--ion-color-warning); }
.exercise-difficulty.avanzado { color: var(--ion-color-danger); }

.check-icon {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 14px;
}

.no-exercises-found {
  grid-column: 1 / -1;
  text-align: center;
  font-size: 12px;
  color: var(--forgy-text-secondary);
  padding: 16px;
}

.sets-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.set-row-enhanced {
  background: var(--forgy-input-bg, #f4f5f8);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.set-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.set-badge {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--forgy-text-secondary);
}

.delete-set-btn {
  height: 24px;
  margin: 0;
}

.set-inputs {
  display: flex;
  gap: 12px;
}

.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--forgy-text-secondary);
}

.number-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--forgy-card-bg, #fff);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 8px;
  height: 36px;
  padding: 0 4px;
}

.calc-btn {
  height: 28px;
  width: 28px;
  margin: 0;
  --padding-start: 0;
  --padding-end: 0;
}

.number-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.add-set-btn {
  --border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
  margin: 0;
}

.details-list {
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item-input {
  --background: var(--forgy-input-bg, #f4f5f8);
  --border-radius: 12px;
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  margin: 0;
  padding: 0 8px;
}

.detail-input, .detail-textarea {
  font-size: 13.5px;
}

.workout-summary {
  background: var(--forgy-input-bg, #f4f5f8);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 12px;
  padding: 14px;
}

.workout-summary h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--forgy-text-secondary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.summary-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--forgy-card-bg, #fff);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 8px;
  padding: 8px 4px;
}

.tile-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--forgy-text-secondary);
  margin-bottom: 2px;
}

.tile-val {
  font-size: 13px;
  font-weight: 800;
  color: var(--forgy-text-primary);
}
</style>
