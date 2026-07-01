<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="$emit('close')"
  >
    <ion-header class="forgy-header">
      <ion-toolbar class="modal-header-toolbar">
        <ion-buttons slot="start">
          <ion-button
            v-if="routine?.exercises && routine.exercises.length > 0"
            fill="clear"
            color="primary"
            @click="$emit('update-reorder-mode', !isReorderMode)"
            :disabled="isTrainingMode"
            class="modal-btn-order"
          >
            {{ isReorderMode ? 'Hecho' : 'Ordenar' }}
          </ion-button>
        </ion-buttons>
        <ion-title class="forgy-title">{{ routine?.name }}</ion-title>
        <ion-buttons slot="end">
          <ion-button
            v-slot="end"
            v-if="isTrainingMode"
            fill="solid"
            color="success"
            @click="$emit('finish-workout')"
            strong
            class="modal-btn-finish"
          >
            Finalizar
          </ion-button>
          <ion-button 
            fill="clear" 
            color="medium" 
            class="modal-btn-close" 
            @click="$emit('close')"
          >
            Cerrar
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <template v-if="routine">
        <!-- Modificación de días asignados (programación) -->
        <div class="detail-schedule-section">
          <h4 class="form-section-title">Asignar Días</h4>
          <div class="detail-days-row">
            <span
              v-for="day in daysOfWeek"
              :key="day"
              class="detail-day-toggle-chip"
              :class="{ active: isScheduledOnDay(day) }"
              @click="$emit('toggle-day', { routineId: routine.id, day })"
            >
              {{ day.substring(0, 3) }}
            </span>
          </div>
        </div>

        <ion-reorder-group
          v-if="routine.exercises && routine.exercises.length > 0"
          :disabled="!isReorderMode"
          @ionItemReorder="handleReorder"
        >
          <ion-item-sliding
            v-for="ex in routine.exercises"
            :key="ex.id"
            :disabled="isReorderMode"
          >
            <ion-item
              lines="full"
              class="exercise-list-item"
              :button="!isReorderMode"
              @click="$emit('exercise-click', ex)"
              :detail="!isReorderMode"
            >
              <ion-button
                v-if="isReorderMode"
                slot="start"
                fill="clear"
                color="danger"
                @click.stop="$emit('delete-exercise', ex.id)"
              >
                <ion-icon
                  :icon="removeCircleOutline"
                  slot="icon-only"
                ></ion-icon>
              </ion-button>

              <div
                v-if="!isReorderMode"
                slot="start"
                class="exercise-avatar"
                v-html="getMuscleIcon(ex.muscle)"
              ></div>

              <ion-label>
                <h2>{{ ex.name }}</h2>
                <slot name="exercise-subtitle" :exercise="ex">
                  <p v-if="isTrainingMode && workoutLogs[ex.id]">
                    {{ workoutLogs[ex.id].sets.filter((s: any) => s.completed).length }} de {{ workoutLogs[ex.id].sets.length }} series
                  </p>
                  <p v-else>
                    {{ ex.muscle }}
                  </p>
                </slot>
              </ion-label>

              <ion-reorder
                v-if="isReorderMode"
                slot="end"
              >
                <ion-icon :icon="reorderThreeOutline"></ion-icon>
              </ion-reorder>
            </ion-item>

            <ion-item-options side="end">
              <ion-item-option
                color="danger"
                @click="$emit('delete-exercise', ex.id)"
              >
                <ion-icon
                  :icon="trash"
                  slot="icon-only"
                ></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-reorder-group>

        <div
          v-else
          class="ion-text-center ion-padding"
        >
          <p>Esta rutina está vacía.</p>
          <ion-button
            fill="clear"
            @click="openAddExercise"
          >
            <ion-icon
              :icon="add"
              slot="start"
            ></ion-icon>
            Agregar Ejercicios
          </ion-button>
        </div>
      </template>

      <ion-fab
        v-if="routine && routine.exercises.length > 0 && !isReorderMode && !isTrainingMode"
        slot="fixed"
        vertical="bottom"
        horizontal="end"
      >
        <ion-fab-button @click="openAddExercise">
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-modal>

  <!-- Modal para agregar ejercicio a la rutina -->
  <ion-modal
    :is-open="isAddExerciseModalOpen"
    @didDismiss="isAddExerciseModalOpen = false"
  >
    <ion-header class="forgy-header">
      <ion-toolbar>
        <ion-title class="forgy-title">Agregar Ejercicio</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="isAddExerciseModalOpen = false">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          v-model="addExerciseSearchText"
          placeholder="Buscar ejercicio para agregar..."
          class="custom-searchbar"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="muscle-chips" style="margin-bottom: 12px; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; display: flex; gap: 8px;">
        <ion-chip
          v-for="muscle in visibleMuscles"
          :key="muscle"
          :color="addExerciseSelectedMuscle === muscle ? 'primary' : undefined"
          @click="addExerciseSelectedMuscle = muscle"
          class="muscle-chip"
          :class="{ 'chip-inactive': addExerciseSelectedMuscle !== muscle }"
        >
          <span class="chip-svg-icon" v-html="getMuscleIcon(muscle)"></span>
          <ion-label class="chip-text">{{ muscle }}</ion-label>
        </ion-chip>
        <ion-chip
          class="muscle-chip expand-chip"
          color="medium"
          @click="isExpandedMuscles = !isExpandedMuscles"
          :outline="!isExpandedMuscles"
        >
          <ion-icon :icon="isExpandedMuscles ? removeCircleOutline : addCircleOutline" style="font-size: 16px; margin-right: 4px;"></ion-icon>
          <ion-label class="chip-text">{{ isExpandedMuscles ? 'Ver menos' : 'Ver más' }}</ion-label>
        </ion-chip>
      </div>

      <ion-list>
        <ion-item
          v-for="ex in exercisesAvailable"
          :key="ex.id"
          lines="full"
        >
          <div
            slot="start"
            class="exercise-avatar"
            v-html="getMuscleIcon(ex.muscle)"
          ></div>
          <ion-label>
            <h2>{{ ex.name }}</h2>
            <p>{{ ex.muscle }}</p>
          </ion-label>
          <ion-button
            slot="end"
            fill="clear"
            @click="$emit('add-exercise', ex)"
          >
            <ion-icon
              slot="icon-only"
              :icon="addCircleOutline"
            ></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>

      <div
        v-if="exercisesAvailable.length === 0"
        class="empty-state"
      >
        <h3>Todo Agregado</h3>
        <p>No hay más ejercicios para agregar o que coincidan con tu búsqueda.</p>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonReorderGroup, IonItemSliding, IonItem, IonIcon, IonLabel, IonReorder, IonItemOptions, IonItemOption, IonFab, IonFabButton, IonSearchbar, IonChip } from '@ionic/vue';
import { removeCircleOutline, reorderThreeOutline, trash, add, addCircleOutline } from 'ionicons/icons';
import { getMuscleIcon, muscleGroups, mainMuscles } from '@/utils/muscles';
import type { RoutineDetail, Exercise } from '@/interfaces';
import { DAYS_OF_WEEK } from '@/constants/calendar';

const props = withDefaults(defineProps<{
  isOpen: boolean;
  routine: RoutineDetail | null;
  isReorderMode: boolean;
  isTrainingMode?: boolean;
  workoutLogs?: any;
  scheduledDays?: string[];
  allExercisesLight?: Exercise[];
}>(), {
  isTrainingMode: false,
  workoutLogs: () => ({}),
  scheduledDays: () => [],
  allExercisesLight: () => []
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update-reorder-mode', value: boolean): void;
  (e: 'finish-workout'): void;
  (e: 'toggle-day', payload: { routineId: string; day: string }): void;
  (e: 'reorder-exercises', event: CustomEvent): void;
  (e: 'delete-exercise', exerciseId: string): void;
  (e: 'add-exercise', exercise: Exercise): void;
  (e: 'exercise-click', exercise: Exercise): void;
  (e: 'request-light-exercises'): void;
}>();

const daysOfWeek = DAYS_OF_WEEK;

const isAddExerciseModalOpen = ref(false);
const addExerciseSearchText = ref('');
const addExerciseSelectedMuscle = ref('Todos');
const isExpandedMuscles = ref(false);

const visibleMuscles = computed(() => {
  if (isExpandedMuscles.value) return muscleGroups;
  return muscleGroups.filter(m => mainMuscles.includes(m));
});

const exercisesAvailable = computed(() => {
  if (!props.routine) return [];
  const exerciseIdsInRoutine = props.routine.exercises.map(ex => ex.id);
  let available = props.allExercisesLight.filter(ex => !exerciseIdsInRoutine.includes(ex.id));

  if (addExerciseSelectedMuscle.value !== 'Todos') {
    available = available.filter(ex => ex.muscle === addExerciseSelectedMuscle.value);
  }

  if (addExerciseSearchText.value) {
    const search = addExerciseSearchText.value.toLowerCase();
    available = available.filter(ex =>
      ex.name.toLowerCase().includes(search) ||
      ex.muscle?.toLowerCase().includes(search) ||
      ex.description?.toLowerCase().includes(search) ||
      ex.equipment?.toLowerCase().includes(search)
    );
  }

  return available;
});

const isScheduledOnDay = (day: string) => {
  return props.scheduledDays.includes(day);
};

const handleReorder = (event: CustomEvent) => {
  emit('reorder-exercises', event);
};

const openAddExercise = () => {
  addExerciseSearchText.value = '';
  isAddExerciseModalOpen.value = true;
  emit('request-light-exercises');
};
</script>

<style scoped>
.detail-schedule-section {
  background: var(--forgy-input-bg, #f4f5f8);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
}

.form-section-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--forgy-text-secondary, #666);
  text-transform: uppercase;
}

.detail-days-row {
  display: flex;
  overflow-x: auto;
  gap: 6px;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.detail-days-row::-webkit-scrollbar {
  display: none;
}

.detail-day-toggle-chip {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  background: rgba(var(--ion-border-color-rgb, 0,0,0), 0.05);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--forgy-text-secondary, #666);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 36px;
}

.detail-day-toggle-chip.active {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: white;
  box-shadow: 0 2px 6px rgba(var(--ion-color-primary-rgb, 56,128,255), 0.2);
}

.exercise-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--forgy-input-bg, #f4f5f8);
}

.exercise-avatar :deep(.muscle-icon-img) {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.exercise-avatar :deep(.muscle-svg) {
  width: 18px;
  height: 18px;
  stroke: var(--forgy-text-secondary);
}

.chip-svg-icon {
  display: flex;
  align-items: center;
  margin-right: 4px;
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

.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: var(--forgy-text-secondary);
}

.muscle-chips::-webkit-scrollbar {
  display: none;
}

.exercise-list-item h2 {
  color: var(--forgy-text-primary) !important;
  font-weight: 700;
}
</style>
