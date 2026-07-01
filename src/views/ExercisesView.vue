<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonGrid, IonRow, IonCol, IonSegment, IonSegmentButton,
  IonButton, IonIcon, IonButtons, IonSearchbar, IonBadge, IonRefresher,
  IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent,
  onIonViewWillEnter, onIonViewWillLeave, alertController,
  IonFab, IonFabButton, IonLabel, IonModal
} from '@ionic/vue';
import { io } from 'socket.io-client';
import {
  add, fitness, albums, list, calendarOutline, addCircleOutline, removeCircleOutline, closeCircle, camera
} from 'ionicons/icons';

// Composables
import { useExercises } from '@/composables/useExercises';
import { useRoutines } from '@/composables/useRoutines';

// Components
import MuscleFilter from '@/components/MuscleFilter.vue';
import ExerciseCard from '@/components/ExerciseCard.vue';
import RoutineCard from '@/components/RoutineCard.vue';
import BulkActionBar from '@/components/BulkActionBar.vue';
import ExerciseDetailModal from '@/components/ExerciseDetailModal.vue';
import ExerciseFormModal from '@/components/ExerciseFormModal.vue';
import RoutineFormModal from '@/components/RoutineFormModal.vue';
import RoutineDetailModal from '@/components/RoutineDetailModal.vue';
import WorkoutSetLoggerModal from '@/components/WorkoutSetLoggerModal.vue';

// Utils
import { musclesWithEmoji, getMuscleIcon, mainMuscles } from '@/utils/muscles';
import { useProfile } from '@/utils/useProfile';

// View Mode switcher
const viewMode = ref<'exercises' | 'routines'>('exercises');

// Composables initialization
const exercisesCtx = useExercises();
const routinesCtx = useRoutines();
const { API_URL, getHeaders } = useProfile();

// Socket client for realtime updates
let socket: any = null;

// Training Mode logic inside routine details
const isTrainingMode = ref(false);
const workoutLogs = ref<Record<string, any>>({});
const currentTrainingSessionId = ref<string | null>(null);
const exerciseToLog = ref<any | null>(null);
const isExerciseLogModalOpen = ref(false);

const startTrainingSession = () => {
  if (!routinesCtx.selectedRoutine.value) return;

  const initialLogs: Record<string, any> = {};
  routinesCtx.selectedRoutine.value.exercises.forEach(ex => {
    initialLogs[ex.id] = {
      sets: [{ reps: '', weight: '', completed: false }],
      notes: '',
      duration: ''
    };
  });
  workoutLogs.value = initialLogs;

  isTrainingMode.value = true;
  routinesCtx.isReorderMode.value = false;
  currentTrainingSessionId.value = null;
};

const finishWorkout = async () => {
  if (!isTrainingMode.value) return;

  const alert = await alertController.create({
    header: 'Finalizar Entreno',
    message: '¿Quieres guardar este entrenamiento?',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Guardar',
        handler: async () => {
          try {
            const finalLogs = Object.entries(workoutLogs.value)
              .map(([exerciseId, logData]) => {
                const completedSets = logData.sets
                  .filter((set: any) => set.reps && set.weight && set.completed)
                  .map((set: any) => ({
                    reps: Number(set.reps),
                    weight: Number(set.weight),
                    completed: set.completed,
                  }));

                if (completedSets.length > 0) {
                  return {
                    exerciseId: exerciseId,
                    sets: completedSets,
                    notes: logData.notes,
                    duration: logData.duration ? parseInt(logData.duration, 10) : null,
                  };
                }
                return null;
              })
              .filter(Boolean);

            if (finalLogs.length === 0) {
              const toast = await routinesCtx.addToRoutine({ id: '' } as any); // just mock helper call or use internal toast
              isTrainingMode.value = false;
              routinesCtx.isRoutineDetailOpen.value = false;
              workoutLogs.value = {};
              currentTrainingSessionId.value = null;
              return;
            }

            const totalDuration = finalLogs.reduce((sum, log) => sum + (log?.duration || 0), 0);

            const workoutPayload = {
              routineId: routinesCtx.selectedRoutine.value?.id,
              duration: totalDuration > 0 ? totalDuration : null,
              workouts: finalLogs,
            };

            const response = await fetch(`${API_URL}/workouts`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify(workoutPayload),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || 'Error al guardar entreno');
            }

            const successToast = await alertController.create({ header: '¡Entrenamiento guardado!', buttons: ['OK'] });
            await successToast.present();

            isTrainingMode.value = false;
            routinesCtx.isRoutineDetailOpen.value = false;
          } catch (error: any) {
            console.error('Error finishing workout:', error);
          }
        },
      },
    ],
  });
  await alert.present();
};

const handleRoutineExerciseClick = (exercise: any) => {
  if (routinesCtx.isReorderMode.value) return;

  if (!isTrainingMode.value) {
    startTrainingSession();
  }

  exerciseToLog.value = exercise;
  isExerciseLogModalOpen.value = true;
};

const quickStartTraining = async (routine: any) => {
  await routinesCtx.openRoutineDetail(routine, exercisesCtx.exercises.value);
  startTrainingSession();
};

const getRoutinesForDay = (dayName: string) => {
  return routinesCtx.routines.value.filter(r => routinesCtx.isRoutineScheduledOnDay(r.id, dayName));
};

const handleRefresh = async (event: CustomEvent) => {
  exercisesCtx.currentPage.value = 1;
  exercisesCtx.hasMore.value = false;
  await Promise.all([
    exercisesCtx.loadExercises(),
    routinesCtx.loadRoutines()
  ]);
  (event.target as any).complete();
};

const handleUpdateReorderMode = (v: boolean) => {
  routinesCtx.isReorderMode.value = v;
};

const handleToggleDay = (payload: { routineId: string; day: string }) => {
  routinesCtx.toggleRoutineDay(payload.routineId, payload.day);
};

const handleReorderExercises = (event: any) => {
  routinesCtx.handleExerciseReorder(event);
};

const handleDeleteExercise = (exerciseId: string) => {
  routinesCtx.confirmDeleteExerciseFromRoutine(exerciseId);
};

const handleAddExercise = (exercise: any) => {
  routinesCtx.addExerciseToCurrentRoutine(exercise);
};

const canDismissRoutineDetail = async () => {
  if (!isTrainingMode.value) {
    return true;
  }
  const alert = await alertController.create({
    header: 'Salir sin Guardar',
    message: 'Tienes un entrenamiento en progreso. Si sales, no se guardarán los registros. ¿Estás seguro?',
    buttons: [
      { text: 'Continuar Entreno', role: 'cancel' },
      { text: 'Salir', role: 'destructive' }
    ]
  });
  await alert.present();
  const { role } = await alert.onDidDismiss();
  return role === 'destructive';
};

const onRoutineDetailDismiss = () => {
  routinesCtx.isReorderMode.value = false;
  isTrainingMode.value = false;
  workoutLogs.value = {};
  currentTrainingSessionId.value = null;
};

// Carga de ciclos de vida de Ionic
onIonViewWillEnter(() => {
  exercisesCtx.loadExercises();
  routinesCtx.loadRoutines();
  routinesCtx.loadAllExercisesLight();

  // Socket (se inicializa una sola vez para evitar reconexiones innecesarias)
  if (!socket) {
    socket = io(API_URL.replace('/api', ''), {
      auth: { token: localStorage.getItem('token') }
    });
    socket.on('exercises-updated', () => {
      exercisesCtx.currentPage.value = 1;
      exercisesCtx.loadExercises();
    });
  }
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
});
</script>

<template>
  <ion-page>
    <ion-header class="forgy-header">
      <ion-toolbar>
        <ion-title class="forgy-title">Biblioteca</ion-title>
      </ion-toolbar>

      <ion-toolbar>
        <ion-segment v-model="viewMode">
          <ion-segment-button value="exercises">
            <ion-label>Ejercicios</ion-label>
          </ion-segment-button>
          <ion-segment-button value="routines">
            <ion-label>Mis Rutinas</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>

      <ion-toolbar v-if="viewMode === 'exercises'">
        <ion-searchbar
          :value="exercisesCtx.searchText.value"
          @ionInput="exercisesCtx.onSearchInput"
          placeholder="Buscar ejercicios..."
          :animated="true"
          show-clear-button="always"
          class="custom-searchbar"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <!-- VISTA DE EJERCICIOS -->
    <ion-content :fullscreen="true" class="ion-padding" v-if="viewMode === 'exercises'">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <MuscleFilter
        v-model="exercisesCtx.selectedMuscle.value"
        multiple
      />

      <div
        v-if="!exercisesCtx.selectedMuscle.value.includes('Todos') && exercisesCtx.selectedMuscle.value.length > 0"
        class="filter-actions"
      >
        <ion-button
          fill="clear"
          size="small"
          @click="exercisesCtx.selectedMuscle.value = ['Todos']; exercisesCtx.loadExercises()"
        >
          <ion-icon :icon="closeCircle" slot="start"></ion-icon>
          Eliminar filtros
        </ion-button>
      </div>

      <div class="results-count" v-if="!exercisesCtx.isLoading.value">
        <ion-badge color="primary">{{ exercisesCtx.totalExercises.value }}</ion-badge>
        <span>ejercicios disponibles &middot; mostrando {{ exercisesCtx.exercises.value.length }}</span>
      </div>

      <!-- Spinner / skeleton loaders -->
      <div v-if="exercisesCtx.isLoading.value" class="ion-text-center ion-padding">
        <ion-badge color="medium">Cargando catálogo...</ion-badge>
      </div>

      <div v-else>
        <ExerciseCard
          v-for="ex in exercisesCtx.exercises.value"
          :key="ex.id"
          :exercise="ex"
          @click="exercisesCtx.openDetailModal(ex)"
        />
      </div>

      <ion-infinite-scroll
        v-if="!exercisesCtx.isLoading.value"
        @ionInfinite="exercisesCtx.loadMoreExercises"
        :disabled="!exercisesCtx.hasMore.value"
      >
        <ion-infinite-scroll-content
          loading-spinner="crescent"
          loading-text="Cargando más..."
        ></ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>

    <!-- VISTA DE RUTINAS -->
    <ion-content :fullscreen="true" class="ion-padding" v-if="viewMode === 'routines'">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="view-switcher-container">
        <div class="forgy-segment" style="max-width: 320px;">
          <button
            type="button"
            class="forgy-segment-btn"
            :class="{ active: routinesCtx.routineViewStyle.value === 'grid' }"
            @click="routinesCtx.routineViewStyle.value = 'grid'"
          >
            <ion-icon :icon="list" class="switcher-icon"></ion-icon>
            <span>Lista</span>
          </button>
          <button
            type="button"
            class="forgy-segment-btn"
            :class="{ active: routinesCtx.routineViewStyle.value === 'calendar' }"
            @click="routinesCtx.routineViewStyle.value = 'calendar'"
          >
            <ion-icon :icon="calendarOutline" class="switcher-icon"></ion-icon>
            <span>Calendario</span>
          </button>
        </div>
      </div>

      <!-- Cuadrícula de rutinas -->
      <div v-if="routinesCtx.routineViewStyle.value === 'grid'">
        <div class="grid-select-action-container">
          <ion-button
            fill="clear"
            size="small"
            class="bulk-select-btn-grid"
            @click="routinesCtx.toggleSelectionMode"
          >
            <ion-icon slot="start" :icon="routinesCtx.isSelectionModeActive.value ? closeCircle : list" style="font-size: 16px;"></ion-icon>
            {{ routinesCtx.isSelectionModeActive.value ? 'Cancelar Selección' : 'Seleccionar Múltiple' }}
          </ion-button>
        </div>

        <ion-grid v-if="routinesCtx.routines.value.length > 0">
          <ion-row>
            <ion-col
              size="6"
              v-for="routine in routinesCtx.routines.value"
              :key="routine.id"
            >
              <RoutineCard
                :routine="routine"
                :isSelectionModeActive="routinesCtx.isSelectionModeActive.value"
                :isSelected="routinesCtx.selectedRoutineIds.value.includes(routine.id)"
                :imageUrl="routinesCtx.routineImages.value[routine.id]"
                :muscleFocus="routinesCtx.routineMuscles.value[routine.id]"
                :scheduledDays="routinesCtx.routineSchedule.value[routine.id]"
                @card-click="routinesCtx.isSelectionModeActive.value ? routinesCtx.toggleRoutineSelection(routine.id) : routinesCtx.openRoutineDetail(routine, exercisesCtx.exercises.value)"
                @toggle-select="routinesCtx.toggleRoutineSelection(routine.id)"
                @toggle-favorite="routinesCtx.toggleFavoriteRoutine"
                @present-options="routinesCtx.presentRoutineOptions"
              />
            </ion-col>
          </ion-row>
        </ion-grid>

        <div v-else class="empty-state">
          <ion-icon :icon="albums" size="large"></ion-icon>
          <h3>No tienes rutinas</h3>
          <p>Crea tu primera rutina de entrenamiento.</p>
        </div>
      </div>

      <!-- Calendario semanal -->
      <div v-else class="calendar-planner-board">
        <div
          v-for="day in routinesCtx.daysOfWeek"
          :key="day"
          class="calendar-day-section"
        >
          <div class="calendar-day-header">
            <h3>{{ day }}</h3>
            <span class="day-dot-indicator" :class="{ 'has-routines': getRoutinesForDay(day).length > 0 }"></span>
          </div>

          <div class="calendar-routines-container">
            <div
              v-for="routine in getRoutinesForDay(day)"
              :key="routine.id"
              class="calendar-routine-item"
              @click="routinesCtx.openRoutineDetail(routine, exercisesCtx.exercises.value)"
            >
              <img
                :src="routinesCtx.routineImages.value[routine.id] || routine.imageUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80'"
                class="calendar-routine-cover"
              />
              <div class="calendar-routine-info">
                <h4 class="calendar-routine-name">{{ routine.name }}</h4>
                <div class="calendar-routine-details">
                  <span class="details-text">
                    <ion-icon :icon="fitness" style="font-size: 12px; vertical-align: middle; margin-right: 2px;"></ion-icon>
                    {{ routine.exercises?.length || 0 }} ej.
                  </span>
                  <span v-if="routinesCtx.routineMuscles.value[routine.id]" class="details-text">
                    &middot; {{ routinesCtx.routineMuscles.value[routine.id] }}
                  </span>
                </div>
              </div>
              
              <ion-button
                fill="clear"
                size="small"
                color="success"
                class="quick-train-btn"
                @click.stop="quickStartTraining(routine)"
              >
                Entrenar
              </ion-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Botón Flotante Premium (FAB) para Biblioteca -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" v-if="viewMode === 'exercises' || (viewMode === 'routines' && !routinesCtx.isSelectionModeActive.value)">
        <ion-fab-button @click="viewMode === 'exercises' ? exercisesCtx.openCreateModal() : routinesCtx.createRoutine()" class="forgy-fab">
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- Bulk actions bar -->
    <BulkActionBar
      :selectedCount="routinesCtx.selectedRoutineIds.value.length"
      @schedule="routinesCtx.bulkScheduleDays"
      @delete="routinesCtx.bulkDeleteRoutines"
    />

    <!-- MODALES -->
    <ExerciseFormModal
      :isOpen="exercisesCtx.isModalOpen.value"
      :form="exercisesCtx.form.value"
      @close="exercisesCtx.isModalOpen.value = false"
      @save="exercisesCtx.saveExercise"
    />

    <ExerciseDetailModal
      :isOpen="exercisesCtx.isDetailModalOpen.value"
      :exercise="exercisesCtx.selectedExercise.value"
      @close="exercisesCtx.isDetailModalOpen.value = false"
      @add="routinesCtx.addToRoutine"
    />

    <RoutineFormModal
      :isOpen="routinesCtx.isCreateRoutineModalOpen.value"
      :isSaving="routinesCtx.isSavingRoutine.value"
      :form="routinesCtx.newRoutineForm.value"
      @close="routinesCtx.isCreateRoutineModalOpen.value = false"
      @save="routinesCtx.saveNewRoutine"
      @open-image-picker="routinesCtx.openImagePicker(null)"
    />

    <RoutineDetailModal
      :isOpen="routinesCtx.isRoutineDetailOpen.value"
      :routine="routinesCtx.selectedRoutine.value"
      :isReorderMode="routinesCtx.isReorderMode.value"
      :isTrainingMode="isTrainingMode"
      :workoutLogs="workoutLogs"
      :scheduledDays="routinesCtx.selectedRoutine.value ? (routinesCtx.routineSchedule.value[routinesCtx.selectedRoutine.value.id] || []) : []"
      :allExercisesLight="routinesCtx.allExercisesLight.value"
      @close="routinesCtx.isRoutineDetailOpen.value = false"
      @update-reorder-mode="handleUpdateReorderMode($event)"
      @finish-workout="finishWorkout"
      @toggle-day="handleToggleDay($event)"
      @reorder-exercises="handleReorderExercises($event)"
      @delete-exercise="handleDeleteExercise($event)"
      @add-exercise="handleAddExercise($event)"
      @exercise-click="handleRoutineExerciseClick($event)"
      @request-light-exercises="routinesCtx.loadAllExercisesLight"
    />

    <WorkoutSetLoggerModal
      :isOpen="isExerciseLogModalOpen"
      :exercise="exerciseToLog"
      :log="exerciseToLog ? workoutLogs[exerciseToLog.id] : null"
      @close="isExerciseLogModalOpen = false"
    />

    <!-- Image Picker Modal -->
    <ion-modal
      :is-open="routinesCtx.isImagePickerOpen.value"
      @didDismiss="routinesCtx.isImagePickerOpen.value = false"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Elegir Fondo</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="routinesCtx.isImagePickerOpen.value = false">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-button
          expand="block"
          @click="routinesCtx.selectImageFromDevice"
          class="ion-margin-bottom"
        >
          <ion-icon slot="start" :icon="camera"></ion-icon>
          Subir desde el dispositivo
        </ion-button>
        <ion-grid>
          <ion-row>
            <ion-col
              size="6"
              v-for="img in routinesCtx.predefinedImages.value"
              :key="img"
            >
              <div
                class="image-picker-item"
                @click="routinesCtx.updateRoutineImage(img)"
              >
                <img
                  :src="img"
                  alt="Imagen de rutina"
                  style="object-fit:cover;width:100%;height:100px;border-radius:12px;"
                />
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<style scoped>
.filter-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.filter-actions ion-button {
  --color: var(--ion-color-medium);
  font-weight: 600;
}

.results-count {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--forgy-text-secondary);
  font-size: 14px;
}

/* Selector de vista: Lista/Calendario Semanal */
.view-switcher-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  width: 100%;
}



.switcher-icon {
  font-size: 18px;
}

/* VISTA EN CALENDARIO / PLANIFICADOR SEMANAL */
.calendar-planner-board {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 32px;
}

.calendar-day-section {
  background: var(--forgy-card-bg);
  border: 1px solid var(--ion-border-color);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.calendar-day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.calendar-day-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: var(--forgy-text-primary);
}

.day-dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
}

.day-dot-indicator.has-routines {
  background: var(--ion-color-primary);
}

.calendar-routines-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calendar-routine-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--forgy-input-bg);
  border: 1px solid var(--ion-border-color);
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
}

.calendar-routine-cover {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
}

.calendar-routine-info {
  flex: 1;
}

.calendar-routine-name {
  margin: 0 0 2px 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.calendar-routine-details {
  font-size: 12px;
  color: var(--forgy-text-secondary);
  display: flex;
  align-items: center;
}

.details-text {
  display: flex;
  align-items: center;
}

.quick-train-btn {
  font-size: 13px;
  font-weight: 700;
  margin: 0;
  --padding-start: 12px;
  --padding-end: 12px;
}

.grid-select-action-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
  padding: 0 4px;
}

.bulk-select-btn-grid {
  margin: 0;
  font-weight: 700;
  font-size: 13px;
  --color: var(--ion-color-primary);
}

.image-picker-item {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.image-picker-item:active {
  transform: scale(0.95);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  color: var(--forgy-text-secondary);
}

.empty-state ion-icon {
  font-size: 48px;
  color: var(--ion-color-medium);
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}
</style>