<template>
  <ion-page>
    <!-- Header principal con clase Forgy -->
    <ion-header class="forgy-header">
      <ion-toolbar>
        <ion-title class="forgy-title">
          Mi Entrenamiento
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher
        slot="fixed"
        @ionRefresh="handleRefresh($event)"
      >
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="train-container">
        <!-- Tarjeta de Calendario Semanal Rediseñado -->
        <div class="calendar-card">
          <div class="week-selector">
            <ion-button
              fill="clear"
              @click="changeWeek(-1)"
              class="nav-btn"
            >
              <ion-icon :icon="chevronBack"></ion-icon>
            </ion-button>
            <div class="week-info">
              <span class="month-name">{{ currentMonthName }}</span>
              <span class="week-range">Semana: {{ weekRangeText }}</span>
            </div>
            <ion-button
              fill="clear"
              @click="changeWeek(1)"
              class="nav-btn"
            >
              <ion-icon :icon="chevronForward"></ion-icon>
            </ion-button>
          </div>

          <div class="week-calendar">
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="day-item"
              :class="{
                'active': day.date === selectedDate,
                'today': day.isToday,
                'has-workout': calendarData[day.date]?.hasWorkout
              }"
              @click="selectDate(day.date)"
            >
              <span class="day-name">{{ day.dayName }}</span>
              <span class="day-number">{{ day.dayNumber }}</span>
              <div
                v-if="calendarData[day.date]?.hasWorkout"
                class="workout-indicator"
              ></div>
            </div>
          </div>
        </div>

        <!-- Carrusel de Mis Rutinas -->
        <div class="routines-section animate-fade-in" v-if="routines.length > 0">
          <div class="section-header-simple">
            <ion-icon :icon="albums" class="section-icon"></ion-icon>
            <h3>Mis Rutinas</h3>
          </div>
          <div class="routines-carousel">
            <div 
              v-for="r in routines" 
              :key="r.id" 
              class="routine-carousel-card"
              :class="{ 'active': activeRoutineId === r.id }"
              @click="selectActiveRoutine(r.id)"
            >
              <img 
                :src="routineImages[r.id] || r.imageUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80'" 
                class="routine-card-img"
              />
              <div class="routine-card-overlay">
                <span class="routine-card-name">{{ r.name }}</span>
                <span class="routine-card-focus">{{ r.exercises?.length || 0 }} ej.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ejercicios de la Rutina Seleccionada -->
        <div class="scheduled-section animate-fade-in" v-if="activeRoutine && activeRoutineExercises.length > 0">
          <div class="scheduled-header">
            <ion-icon :icon="barbellOutline" class="scheduled-header-icon"></ion-icon>
            <div class="scheduled-header-text">
              <h3>Ejercicios de: {{ activeRoutine.name }}</h3>
              <span class="scheduled-subtitle">Toca un ejercicio para registrar tu serie</span>
            </div>
          </div>
          <div class="scheduled-exercises-list">
            <div 
              v-for="ex in activeRoutineExercises" 
              :key="ex.id" 
              class="scheduled-exercise-card"
              @click="logScheduledExercise(ex)"
            >
              <div class="scheduled-exercise-info">
                <div class="scheduled-muscle-icon" v-html="getMuscleIcon(ex.muscle)"></div>
                <div class="scheduled-text">
                  <span class="scheduled-name">{{ ex.name }}</span>
                  <span class="scheduled-routine-source">{{ ex.muscle }}</span>
                </div>
              </div>
              <ion-button fill="clear" size="small" class="scheduled-log-btn">
                <ion-icon :icon="add" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Ejercicios Programados para Hoy -->
        <div class="scheduled-section animate-fade-in" v-if="scheduledExercises.length > 0">
          <div class="scheduled-header">
            <ion-icon :icon="calendarOutline" class="scheduled-header-icon"></ion-icon>
            <div class="scheduled-header-text">
              <h3>Programado para Hoy</h3>
              <span class="scheduled-subtitle">Ejercicios de tus rutinas programadas para este día</span>
            </div>
          </div>
          <div class="scheduled-exercises-list">
            <div 
              v-for="ex in scheduledExercises" 
              :key="ex.id" 
              class="scheduled-exercise-card"
              @click="logScheduledExercise(ex)"
            >
              <div class="scheduled-exercise-info">
                <div class="scheduled-muscle-icon" v-html="getMuscleIcon(ex.muscle)"></div>
                <div class="scheduled-text">
                  <span class="scheduled-name">{{ ex.name }}</span>
                  <span class="scheduled-routine-source">Rutina: {{ ex.routineName }}</span>
                </div>
              </div>
              <ion-button fill="clear" size="small" class="scheduled-log-btn">
                <ion-icon :icon="add" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Encabezado de sección de entrenamientos con fecha seleccionada -->
        <div class="section-header">
          <div class="header-text-group">
            <h3>Entrenamientos</h3>
            <span class="selected-date-label">{{ formattedSelectedDate }}</span>
          </div>
          <ion-button
            fill="clear"
            size="small"
            @click="openAddWorkoutModal"
            class="section-add-btn"
          >
            <ion-icon
              :icon="add"
              slot="start"
            ></ion-icon>
            Registrar
          </ion-button>
        </div>

        <!-- Estado Vacío -->
        <div
          v-if="dayWorkouts.length === 0"
          class="empty-state animate-fade-in"
          :key="'empty-' + selectedDate"
        >
          <div class="empty-icon-wrapper">
            <ion-icon :icon="barbellOutline"></ion-icon>
          </div>
          <h4>Sin entrenamientos</h4>
          <p>No has registrado ejercicios para este día.</p>
          <ion-button
            @click="openAddWorkoutModal"
            color="primary"
            class="empty-register-btn"
          >
            <ion-icon
              :icon="add"
              slot="start"
            ></ion-icon>
            Registrar ejercicio
          </ion-button>
        </div>

        <!-- Lista de Entrenamientos -->
        <ion-list
          v-else
          class="workout-list animate-slide-up"
          :key="selectedDate"
        >
          <ion-item-sliding
            v-for="workout in dayWorkouts"
            :key="workout.id"
            class="workout-sliding-item"
          >
            <ion-item lines="none" class="workout-item">
              <div class="workout-item-content">
                <div class="workout-header">
                  <h4>{{ workout.exerciseName }}</h4>
                  <ion-chip
                    size="small"
                    color="primary"
                    class="workout-sets-chip"
                  >
                    {{ workout.sets.length }} series
                  </ion-chip>
                </div>
                <div class="sets-preview">
                  <span
                    v-for="(set, idx) in workout.sets.slice(0, 4)"
                    :key="idx"
                    class="set-pill"
                  >
                    {{ set.reps }}×{{ set.weight }}kg
                  </span>
                  <span
                    v-if="workout.sets.length > 4"
                    class="more-sets"
                  >+{{ workout.sets.length - 4 }}</span>
                </div>
                <div class="workout-meta">
                  <span><ion-icon :icon="time"></ion-icon> {{ workout.duration }} min</span>
                  <span v-if="workout.notes"><ion-icon :icon="documentText"></ion-icon> {{ workout.notes }}</span>
                </div>
              </div>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option
                color="primary"
                @click="editWorkout(workout)"
                class="option-btn-edit"
              >
                <ion-icon :icon="create"></ion-icon>
              </ion-item-option>
              <ion-item-option
                color="danger"
                @click="confirmDeleteWorkout(workout)"
                class="option-btn-delete"
              >
                <ion-icon :icon="trash"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
      </div>

      <!-- Botón Flotante Premium (FAB) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button size="small" @click="openAddWorkoutModal" class="forgy-fab">
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Modal para agregar/editar entrenamiento -->
      <!-- Modal para agregar/editar entrenamiento -->
      <WorkoutFormModal
        :is-open="isWorkoutModalOpen"
        :is-editing="isEditing"
        :exercises="exercises"
        :form="workoutForm"
        @close="isWorkoutModalOpen = false"
        @save="saveWorkout"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonList, IonItem,
  IonChip, IonItemSliding, IonItemOptions, IonItemOption, IonRefresher, IonRefresherContent,
  IonFab, IonFabButton,
  onIonViewWillEnter
} from '@ionic/vue';
import { ref, computed } from 'vue';
import { useWorkouts } from '../composables/useWorkouts';
import { useRoutines } from '../composables/useRoutines';
import { getMuscleIcon } from '../utils/muscles';
import WorkoutFormModal from '../components/WorkoutFormModal.vue';
import {
  add, chevronBack, chevronForward, barbellOutline, create, trash,
  documentText, remove, checkmarkCircle, addCircleOutline, removeCircleOutline, time,
  calendarOutline, albums
} from 'ionicons/icons';

const {
  exercises,
  workouts,
  calendarData,
  selectedDate,
  currentWeekStart,
  isWorkoutModalOpen,
  editingWorkout,
  workoutForm,
  selectedMuscle,
  modalSearchText,
  changeWeek,
  selectDate,
  selectExercise,
  addSet,
  removeSet,
  incrementValue,
  decrementValue,
  calculateVolume,
  loadExercises,
  loadWorkouts,
  loadCalendarData,
  openAddWorkoutModal,
  editWorkout,
  saveWorkout,
  confirmDeleteWorkout
} = useWorkouts();

const { routines, loadRoutines, routineSchedule, routineImages } = useRoutines();

const activeRoutineId = ref<string | null>(null);

const activeRoutine = computed(() => {
  return routines.value.find(r => r.id === activeRoutineId.value) || null;
});

const activeRoutineExercises = computed(() => {
  if (!activeRoutine.value) return [];
  const result: any[] = [];
  if (activeRoutine.value.exercises && Array.isArray(activeRoutine.value.exercises)) {
    activeRoutine.value.exercises.forEach(ref => {
      const fullEx = exercises.value.find(e => e.id === ref.exerciseId);
      if (fullEx) {
        result.push(fullEx);
      }
    });
  }
  return result;
});

const selectActiveRoutine = (routineId: string) => {
  if (activeRoutineId.value === routineId) {
    activeRoutineId.value = null;
  } else {
    activeRoutineId.value = routineId;
  }
};

const getDayOfWeekName = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const daysInSpanish = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return daysInSpanish[date.getDay()];
};

const scheduledExercises = computed(() => {
  const dayName = getDayOfWeekName(selectedDate.value);
  if (!dayName) return [];
  
  const dayRoutines = routines.value.filter(r => {
    const scheduled = routineSchedule.value[r.id] || [];
    return scheduled.includes(dayName);
  });
  
  const result: any[] = [];
  const seenIds = new Set<string>();
  
  dayRoutines.forEach(routine => {
    if (routine.exercises && Array.isArray(routine.exercises)) {
      routine.exercises.forEach(ref => {
        if (!seenIds.has(ref.exerciseId)) {
          seenIds.add(ref.exerciseId);
          const fullEx = exercises.value.find(e => e.id === ref.exerciseId);
          if (fullEx) {
            result.push({
              ...fullEx,
              routineName: routine.name
            });
          }
        }
      });
    }
  });
  
  return result;
});

const logScheduledExercise = (ex: any) => {
  editingWorkout.value = null;
  selectedMuscle.value = 'Todos';
  modalSearchText.value = '';
  workoutForm.value = {
    exerciseId: ex.id,
    exerciseName: ex.name,
    duration: 15,
    sets: [{ reps: 12, weight: 20, completed: false }],
    notes: ''
  };
  isWorkoutModalOpen.value = true;
};

const isEditing = computed(() => !!editingWorkout.value);

const filteredExercises = computed(() => {
  let list = exercises.value;
  if (selectedMuscle.value !== 'Todos') {
    list = list.filter(e => e.muscle === selectedMuscle.value);
  }
  if (modalSearchText.value.trim() !== '') {
    const query = modalSearchText.value.toLowerCase();
    list = list.filter(e => e.name.toLowerCase().includes(query));
  }
  return list;
});

const weekDays = computed(() => {
  const days = [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const start = new Date(currentWeekStart.value);
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      dayName: dayNames[date.getDay()],
      dayNumber: date.getDate(),
      isToday: dateStr === today
    });
  }
  return days;
});

const currentMonthName = computed(() => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const date = new Date(currentWeekStart.value);
  return months[date.getMonth()] + ' ' + date.getFullYear();
});

const weekRangeText = computed(() => {
  const start = new Date(currentWeekStart.value);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.getDate()} - ${end.getDate()}`;
});

const formattedSelectedDate = computed(() => {
  const date = new Date(selectedDate.value + 'T12:00:00');
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
});

const dayWorkouts = computed(() => {
  return workouts.value.filter(w => {
    if (!w.date) return false;
    const wDateOnly = w.date.includes('T') ? w.date.split('T')[0] : w.date;
    return wDateOnly === selectedDate.value;
  });
});

// getMuscleIcon imported from '@/utils/muscles'

async function handleRefresh(event: CustomEvent) {
  await Promise.all([loadWorkouts(), loadCalendarData()]);
  (event.target as any).complete();
}

onIonViewWillEnter(() => {
  loadExercises();
  loadWorkouts();
  loadCalendarData();
  loadRoutines();
});
</script>

<style scoped>
.train-container {
  max-width: 768px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

.calendar-card {
  background: var(--forgy-card-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.week-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--forgy-border);
  background: rgba(var(--ion-card-background-rgb, 255, 255, 255), 0.5);
}

.week-info {
  text-align: center;
}

.month-name {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--forgy-text-primary);
  text-transform: capitalize;
}

.week-range {
  display: block;
  font-size: 11px;
  color: var(--forgy-text-secondary);
  margin-top: 2px;
}

.nav-btn {
  --color: var(--ion-color-primary);
  margin: 0;
}

.week-calendar {
  display: flex;
  justify-content: space-around;
  padding: 16px 8px;
}

.day-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 60px;
  border-radius: 14px;
  cursor: pointer;
  position: relative;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.day-item:hover {
  background: rgba(var(--ion-color-primary-rgb), 0.08);
}

.day-item.active {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-tertiary, var(--ion-color-secondary)));
  color: #fff;
  box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.35);
  transform: translateY(-2px);
}

.day-item.today:not(.active) {
  border: 1px dashed var(--ion-color-primary);
}

.day-name {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.6;
}

.day-item.active .day-name {
  opacity: 0.9;
}

.day-number {
  font-size: 16px;
  font-weight: 700;
  margin-top: 4px;
}

.workout-indicator {
  width: 5px;
  height: 5px;
  background: var(--ion-color-success, #2dd36f);
  border-radius: 50%;
  position: absolute;
  bottom: 6px;
  transition: all 0.2s ease;
}

.day-item.active .workout-indicator {
  background: #fff;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  margin-bottom: 16px;
}

.header-text-group h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.selected-date-label {
  font-size: 12px;
  color: var(--ion-color-primary);
  font-weight: 500;
  text-transform: capitalize;
}

.section-add-btn {
  --color: var(--ion-color-primary);
  font-weight: 600;
  font-size: 13px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: var(--forgy-card-bg);
  border: 1px dashed var(--forgy-border);
  border-radius: 20px;
  text-align: center;
  margin-top: 8px;
}

.empty-icon-wrapper {
  background: rgba(var(--ion-color-primary-rgb), 0.08);
  border-radius: 50%;
  padding: 16px;
  margin-bottom: 16px;
  color: var(--ion-color-primary);
}

.empty-state ion-icon {
  font-size: 36px;
  display: block;
}

.empty-state h4 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.empty-state p {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--forgy-text-secondary);
}

.empty-register-btn {
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.2);
  font-weight: 600;
}

.workout-list {
  background: transparent;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workout-sliding-item {
  border-radius: 16px;
  overflow: hidden;
  background: transparent;
  margin-bottom: 12px;
  border: 1px solid var(--forgy-border);
}

.workout-item {
  --background: var(--forgy-card-bg);
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  transition: background-color 0.2s ease;
}

.workout-item-content {
  width: 100%;
}

.workout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.workout-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.workout-sets-chip {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sets-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.set-pill {
  background: var(--forgy-input-bg);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--forgy-text-primary);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.more-sets {
  color: var(--forgy-text-secondary);
  font-size: 12px;
  font-weight: 500;
  padding: 4px 4px;
}

.workout-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--forgy-text-secondary);
}

.workout-meta ion-icon {
  font-size: 14px;
  margin-right: 4px;
  color: var(--ion-color-primary);
}

.option-btn-edit {
  --background: var(--ion-color-primary);
  color: #fff;
}

.option-btn-delete {
  --background: var(--ion-color-danger);
  color: #fff;
}


/* Scheduled Section Styles */
.scheduled-section {
  background: var(--forgy-card-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 20px;
  padding: 16px 20px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}

.scheduled-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.scheduled-header-icon {
  font-size: 24px;
  color: var(--ion-color-primary);
}

.scheduled-header-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.scheduled-subtitle {
  font-size: 11px;
  color: var(--forgy-text-secondary);
}

.scheduled-exercises-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scheduled-exercise-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: var(--forgy-input-bg);
  border: 1px solid var(--ion-border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.scheduled-exercise-card:active {
  transform: scale(0.98);
  background: rgba(var(--ion-color-primary-rgb), 0.05);
}

.scheduled-exercise-info {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.scheduled-muscle-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--forgy-card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--ion-border-color);
}

.scheduled-muscle-icon :deep(.muscle-svg) {
  width: 18px;
  height: 18px;
  stroke: var(--forgy-text-secondary);
}

.scheduled-muscle-icon :deep(.muscle-icon-img) {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.scheduled-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.scheduled-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--forgy-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scheduled-routine-source {
  font-size: 10px;
  color: var(--ion-color-primary);
  font-weight: 600;
  margin-top: 2px;
}

.scheduled-log-btn {
  --color: var(--ion-color-primary);
  margin: 0;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Carrusel de Rutinas */
.routines-section {
  margin-bottom: 24px;
}

.routines-carousel {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding: 4px 2px 12px 2px;
  scrollbar-width: none;
}

.routines-carousel::-webkit-scrollbar {
  display: none;
}

.routine-carousel-card {
  position: relative;
  flex: 0 0 140px;
  height: 90px;
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.routine-carousel-card.active {
  border-color: var(--ion-color-primary);
  transform: scale(1.04);
  box-shadow: 0 6px 16px rgba(var(--ion-color-primary-rgb), 0.25);
}

.routine-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.routine-card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
  padding: 8px;
  display: flex;
  flex-direction: column;
  color: #fff;
}

.routine-card-name {
  font-size: 11px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.routine-card-focus {
  font-size: 9px;
  opacity: 0.85;
}

.section-header-simple {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-header-simple h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--forgy-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-header-simple .section-icon {
  font-size: 16px;
  color: var(--ion-color-primary);
}

</style>
