<template>
  <ion-page>
    <!-- Header principal con clase Forgy -->
    <ion-header class="forgy-header">
      <ion-toolbar>
        <ion-title class="forgy-title">
          Mi Entrenamiento
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openAddWorkoutModal" class="header-add-btn">
            <ion-icon :icon="add"></ion-icon>
          </ion-button>
        </ion-buttons>
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
          class="empty-state"
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
          class="workout-list"
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
        <ion-fab-button @click="openAddWorkoutModal" class="forgy-fab">
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
import WorkoutFormModal from '../components/WorkoutFormModal.vue';
import {
  add, chevronBack, chevronForward, barbellOutline, create, trash,
  documentText, remove, checkmarkCircle, addCircleOutline, removeCircleOutline, time
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

const dayWorkouts = computed(() => workouts.value.filter(w => w.date === selectedDate.value));

function getMuscleIcon(muscle: string): string {
  // Logic remains in useWorkouts or internal helper
  return '';
}

async function handleRefresh(event: CustomEvent) {
  await Promise.all([loadWorkouts(), loadCalendarData()]);
  (event.target as any).complete();
}

onIonViewWillEnter(() => {
  loadExercises();
  loadWorkouts();
  loadCalendarData();
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

/* FAB Premium */
.forgy-fab {
  --background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-tertiary, var(--ion-color-secondary)));
  --background-hover: var(--ion-color-primary-tint);
  --color: #fff;
  box-shadow: 0 8px 24px rgba(var(--ion-color-primary-rgb), 0.4);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.forgy-fab:hover {
  transform: scale(1.08);
}


</style>
