<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon
            :icon="calendarIcon"
            style="margin-right: 8px;"
          ></ion-icon>
          Mi Entrenamiento
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openAddWorkoutModal">
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

      <!-- Selector de semana -->
      <div class="week-selector">
        <ion-button
          fill="clear"
          @click="changeWeek(-1)"
        >
          <ion-icon :icon="chevronBack"></ion-icon>
        </ion-button>
        <div class="week-info">
          <span class="month-name">{{ currentMonthName }}</span>
          <span class="week-range">{{ weekRangeText }}</span>
        </div>
        <ion-button
          fill="clear"
          @click="changeWeek(1)"
        >
          <ion-icon :icon="chevronForward"></ion-icon>
        </ion-button>
      </div>

      <!-- Calendario semanal -->
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

      <!-- Resumen del día -->
      <ion-card class="day-summary">
        <ion-card-header>
          <ion-card-subtitle>{{ formattedSelectedDate }}</ion-card-subtitle>
          <ion-card-title>Resumen del día</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="summary-stats">
            <div class="summary-stat">
              <ion-icon
                :icon="barbell"
                color="primary"
              ></ion-icon>
              <span class="stat-value">{{ dayWorkouts.length }}</span>
              <span class="stat-label">Ejercicios</span>
            </div>
            <div class="summary-stat">
              <ion-icon
                :icon="time"
                color="tertiary"
              ></ion-icon>
              <span class="stat-value">{{ totalDuration }}</span>
              <span class="stat-label">Minutos</span>
            </div>
            <div class="summary-stat">
              <ion-icon
                :icon="fitness"
                color="success"
              ></ion-icon>
              <span class="stat-value">{{ totalVolume }}</span>
              <span class="stat-label">kg Vol.</span>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Lista de entrenamientos del día -->
      <div class="section-header">
        <h3>Entrenamientos realizados</h3>
        <ion-button
          fill="clear"
          size="small"
          @click="openAddWorkoutModal"
        >
          <ion-icon
            :icon="add"
            slot="start"
          ></ion-icon>
          Agregar
        </ion-button>
      </div>

      <div
        v-if="dayWorkouts.length === 0"
        class="empty-state"
      >
        <ion-icon :icon="barbellOutline"></ion-icon>
        <h4>Sin entrenamientos</h4>
        <p>No has registrado ejercicios este día</p>
        <ion-button
          @click="openAddWorkoutModal"
          color="primary"
        >
          <ion-icon
            :icon="add"
            slot="start"
          ></ion-icon>
          Registrar ejercicio
        </ion-button>
      </div>

      <ion-list
        v-else
        class="workout-list"
      >
        <ion-item-sliding
          v-for="workout in dayWorkouts"
          :key="workout.id"
        >
          <ion-item>
            <div class="workout-item-content">
              <div class="workout-header">
                <h4>{{ workout.exerciseName }}</h4>
                <ion-chip
                  size="small"
                  color="primary"
                >
                  {{ workout.sets.length }} series
                </ion-chip>
              </div>
              <div class="sets-preview">
                <span
                  v-for="(set, idx) in workout.sets.slice(0, 3)"
                  :key="idx"
                  class="set-pill"
                >
                  {{ set.reps }}×{{ set.weight }}kg
                </span>
                <span
                  v-if="workout.sets.length > 3"
                  class="more-sets"
                >+{{ workout.sets.length - 3 }}</span>
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
            >
              <ion-icon :icon="create"></ion-icon>
            </ion-item-option>
            <ion-item-option
              color="danger"
              @click="confirmDeleteWorkout(workout)"
            >
              <ion-icon :icon="trash"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <!-- Modal para agregar/editar entrenamiento -->
      <ion-modal
        :is-open="isWorkoutModalOpen"
        @didDismiss="isWorkoutModalOpen = false"
      >
        <ion-header>
          <ion-toolbar color="primary">
            <ion-buttons slot="start">
              <ion-button @click="isWorkoutModalOpen = false">Cancelar</ion-button>
            </ion-buttons>
            <ion-title>{{ editingWorkout ? 'Editar' : 'Nuevo' }} Ejercicio</ion-title>
            <ion-buttons slot="end">
              <ion-button
                strong
                @click="saveWorkout"
              >Guardar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="modal-content">
          <!-- Step 1: Seleccionar ejercicio -->
          <div class="step-section">
            <div class="step-header">
              <span class="step-number">1</span>
              <h4>Selecciona el ejercicio</h4>
            </div>

            <!-- Filtro por músculo -->
            <div class="muscle-filter">
              <ion-chip
                v-for="muscle in muscleGroups"
                :key="muscle"
                :color="selectedMuscle === muscle ? 'primary' : 'medium'"
                :outline="selectedMuscle !== muscle"
                @click="selectedMuscle = muscle"
              >
                {{ getMuscleEmoji(muscle) }} {{ muscle }}
              </ion-chip>
            </div>

            <!-- Lista de ejercicios filtrados -->
            <div class="exercises-grid">
              <div
                v-for="ex in filteredExercises"
                :key="ex.id"
                class="exercise-card"
                :class="{ selected: workoutForm.exerciseId === ex.id }"
                @click="selectExercise(ex)"
              >
                <div class="exercise-icon">{{ getMuscleEmoji(ex.muscle) }}</div>
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
                  v-if="workoutForm.exerciseId === ex.id"
                  :icon="checkmarkCircle"
                  color="success"
                ></ion-icon>
              </div>
            </div>
          </div>

          <!-- Step 2: Configurar series -->
          <div
            class="step-section"
            v-if="workoutForm.exerciseId"
          >
            <div class="step-header">
              <span class="step-number">2</span>
              <h4>Configura tus series</h4>
            </div>

            <div class="sets-config">
              <div
                v-for="(set, index) in workoutForm.sets"
                :key="index"
                class="set-row-enhanced"
              >
                <div class="set-badge">Serie {{ index + 1 }}</div>
                <div class="set-inputs">
                  <div class="input-group">
                    <label>Reps</label>
                    <div class="number-input">
                      <ion-button
                        fill="clear"
                        size="small"
                        @click="decrementValue(set, 'reps')"
                      >
                        <ion-icon :icon="remove"></ion-icon>
                      </ion-button>
                      <span class="number-value">{{ set.reps }}</span>
                      <ion-button
                        fill="clear"
                        size="small"
                        @click="incrementValue(set, 'reps')"
                      >
                        <ion-icon :icon="add"></ion-icon>
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
                      >
                        <ion-icon :icon="remove"></ion-icon>
                      </ion-button>
                      <span class="number-value">{{ set.weight }}</span>
                      <ion-button
                        fill="clear"
                        size="small"
                        @click="incrementValue(set, 'weight', 2.5)"
                      >
                        <ion-icon :icon="add"></ion-icon>
                      </ion-button>
                    </div>
                  </div>
                </div>
                <ion-button
                  v-if="workoutForm.sets.length > 1"
                  fill="clear"
                  color="danger"
                  size="small"
                  @click="removeSet(index)"
                >
                  <ion-icon :icon="trash"></ion-icon>
                </ion-button>
              </div>

              <ion-button
                expand="block"
                fill="outline"
                @click="addSet"
                class="add-set-btn"
              >
                <ion-icon
                  :icon="add"
                  slot="start"
                ></ion-icon>
                Agregar serie
              </ion-button>
            </div>
          </div>

          <!-- Step 3: Detalles adicionales -->
          <div
            class="step-section"
            v-if="workoutForm.exerciseId"
          >
            <div class="step-header">
              <span class="step-number">3</span>
              <h4>Detalles adicionales</h4>
            </div>

            <ion-list
              lines="none"
              class="details-list"
            >
              <ion-item>
                <ion-icon
                  :icon="time"
                  slot="start"
                  color="primary"
                ></ion-icon>
                <ion-input
                  v-model.number="workoutForm.duration"
                  type="number"
                  label="Duración (minutos)"
                  label-placement="floating"
                  placeholder="15"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-icon
                  :icon="documentText"
                  slot="start"
                  color="primary"
                ></ion-icon>
                <ion-textarea
                  v-model="workoutForm.notes"
                  label="Notas"
                  label-placement="floating"
                  placeholder="¿Cómo te sentiste?"
                  :auto-grow="true"
                ></ion-textarea>
              </ion-item>
            </ion-list>
          </div>

          <!-- Resumen -->
          <div
            class="workout-summary"
            v-if="workoutForm.exerciseId && workoutForm.sets.length > 0"
          >
            <h4>📊 Resumen</h4>
            <div class="summary-row">
              <span>Volumen total:</span>
              <strong>{{ calculateVolume() }} kg</strong>
            </div>
            <div class="summary-row">
              <span>Series:</span>
              <strong>{{ workoutForm.sets.length }}</strong>
            </div>
            <div class="summary-row">
              <span>Reps totales:</span>
              <strong>{{workoutForm.sets.reduce((a, s) => a + s.reps, 0)}}</strong>
            </div>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonList, IonItem,
  IonChip, IonModal, IonInput, IonTextarea, IonItemSliding,
  IonItemOptions, IonItemOption, IonRefresher, IonRefresherContent,
  onIonViewWillEnter, alertController, toastController
} from '@ionic/vue';
import { ref, computed } from 'vue';
import {
  calendar as calendarIcon, add, chevronBack, chevronForward, barbell, time,
  fitness, barbellOutline, create, trash, documentText, close, remove,
  checkmarkCircle
} from 'ionicons/icons';

const API_URL = 'http://localhost:3000';

interface Exercise {
  id: string;
  name: string;
  muscle: string;
  difficulty: string;
}

interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
}

interface Workout {
  id: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  duration: number;
  notes: string;
}

const exercises = ref<Exercise[]>([]);
const workouts = ref<Workout[]>([]);
const calendarData = ref<{ [date: string]: { hasWorkout: boolean } }>({});
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const currentWeekStart = ref(getWeekStart(new Date()));
const isWorkoutModalOpen = ref(false);
const editingWorkout = ref<Workout | null>(null);
const selectedMuscle = ref('Todos');

const muscleGroups = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Abdomen'];

const workoutForm = ref({
  exerciseId: '',
  exerciseName: '',
  duration: 15,
  sets: [{ reps: 12, weight: 20, completed: false }] as WorkoutSet[],
  notes: ''
});

const filteredExercises = computed(() => {
  if (selectedMuscle.value === 'Todos') return exercises.value;
  return exercises.value.filter(e => e.muscle === selectedMuscle.value);
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
const totalDuration = computed(() => dayWorkouts.value.reduce((acc, w) => acc + w.duration, 0));
const totalVolume = computed(() => dayWorkouts.value.reduce((acc, w) =>
  acc + w.sets.reduce((setAcc, s) => setAcc + (s.reps * s.weight), 0), 0));

function getMuscleEmoji(muscle: string): string {
  const emojis: { [key: string]: string } = {
    'Todos': '💪',
    'Pecho': '🫁',
    'Espalda': '🔙',
    'Piernas': '🦵',
    'Hombros': '🤷',
    'Bíceps': '💪',
    'Tríceps': '🦾',
    'Abdomen': '🎯'
  };
  return emojis[muscle] || '💪';
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

function changeWeek(direction: number) {
  const current = new Date(currentWeekStart.value);
  current.setDate(current.getDate() + (direction * 7));
  currentWeekStart.value = current.toISOString().split('T')[0];
}

function selectDate(date: string) {
  selectedDate.value = date;
  loadWorkouts();
}

function selectExercise(ex: Exercise) {
  workoutForm.value.exerciseId = ex.id;
  workoutForm.value.exerciseName = ex.name;
}

function incrementValue(set: WorkoutSet, field: 'reps' | 'weight', step = 1) {
  set[field] += step;
}

function decrementValue(set: WorkoutSet, field: 'reps' | 'weight', step = 1) {
  if (set[field] > step) set[field] -= step;
}

function calculateVolume(): number {
  return workoutForm.value.sets.reduce((acc, s) => acc + (s.reps * s.weight), 0);
}

async function loadExercises() {
  try {
    const response = await fetch(`${API_URL}/exercises`);
    exercises.value = await response.json();
  } catch (error) {
    console.error('Error loading exercises:', error);
  }
}

async function loadWorkouts() {
  try {
    const response = await fetch(`${API_URL}/workouts?date=${selectedDate.value}`);
    workouts.value = await response.json();
  } catch (error) {
    console.error('Error loading workouts:', error);
  }
}

async function loadCalendarData() {
  try {
    const response = await fetch(`${API_URL}/workouts/calendar`);
    calendarData.value = await response.json();
  } catch (error) {
    console.error('Error loading calendar:', error);
  }
}

function openAddWorkoutModal() {
  editingWorkout.value = null;
  selectedMuscle.value = 'Todos';
  workoutForm.value = {
    exerciseId: '',
    exerciseName: '',
    duration: 15,
    sets: [{ reps: 12, weight: 20, completed: false }],
    notes: ''
  };
  isWorkoutModalOpen.value = true;
}

function addSet() {
  const lastSet = workoutForm.value.sets[workoutForm.value.sets.length - 1];
  workoutForm.value.sets.push({
    reps: lastSet?.reps || 12,
    weight: lastSet?.weight || 20,
    completed: false
  });
}

function removeSet(index: number) {
  workoutForm.value.sets.splice(index, 1);
}

function editWorkout(workout: Workout) {
  editingWorkout.value = workout;
  selectedMuscle.value = 'Todos';
  workoutForm.value = {
    exerciseId: workout.exerciseId,
    exerciseName: workout.exerciseName,
    duration: workout.duration,
    sets: [...workout.sets],
    notes: workout.notes
  };
  isWorkoutModalOpen.value = true;
}

async function saveWorkout() {
  if (!workoutForm.value.exerciseId) {
    showToast('Selecciona un ejercicio', 'warning');
    return;
  }

  try {
    const data = {
      date: selectedDate.value,
      ...workoutForm.value
    };

    if (editingWorkout.value) {
      await fetch(`${API_URL}/workouts/${editingWorkout.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      showToast('¡Entrenamiento actualizado!');
    } else {
      await fetch(`${API_URL}/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      showToast('¡Ejercicio registrado! 💪');
    }

    isWorkoutModalOpen.value = false;
    loadWorkouts();
    loadCalendarData();
  } catch (error) {
    showToast('Error al guardar', 'danger');
  }
}

async function confirmDeleteWorkout(workout: Workout) {
  const alert = await alertController.create({
    header: '¿Eliminar entrenamiento?',
    message: `¿Eliminar "${workout.exerciseName}"?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          await fetch(`${API_URL}/workouts/${workout.id}`, { method: 'DELETE' });
          showToast('Entrenamiento eliminado', 'warning');
          loadWorkouts();
          loadCalendarData();
        }
      }
    ]
  });
  await alert.present();
}

async function showToast(message: string, color: string = 'success') {
  const toast = await toastController.create({ message, duration: 2000, color, position: 'bottom' });
  await toast.present();
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
.week-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px;
  background: var(--ion-color-light);
}

.week-info {
  text-align: center;
}

.month-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.week-range {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.week-calendar {
  display: flex;
  justify-content: space-around;
  padding: 12px 8px;
  background: white;
  border-bottom: 1px solid var(--ion-color-light);
}

.day-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.day-item.active {
  background: var(--ion-color-primary);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.4);
}

.day-item.today:not(.active) {
  border: 2px solid var(--ion-color-primary);
}

.day-name {
  font-size: 11px;
  text-transform: uppercase;
  opacity: 0.7;
}

.day-number {
  font-size: 18px;
  font-weight: 600;
  margin-top: 4px;
}

.workout-indicator {
  width: 6px;
  height: 6px;
  background: var(--ion-color-success);
  border-radius: 50%;
  position: absolute;
  bottom: 4px;
}

.day-item.active .workout-indicator {
  background: white;
}

.day-summary {
  margin: 16px;
  border-radius: 16px;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-stat ion-icon {
  font-size: 24px;
}

.summary-stat .stat-value {
  font-size: 20px;
  font-weight: 700;
}

.summary-stat .stat-label {
  font-size: 11px;
  color: var(--ion-color-medium);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  margin-top: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  font-size: 48px;
  opacity: 0.5;
  margin-bottom: 12px;
}

.empty-state h4 {
  margin: 0 0 8px;
  color: var(--ion-color-dark);
}

.workout-list {
  margin: 8px 16px;
  border-radius: 12px;
  overflow: hidden;
}

.workout-item-content {
  padding: 8px 0;
  width: 100%;
}

.workout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.workout-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.sets-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.set-pill {
  background: var(--ion-color-light);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.more-sets {
  color: var(--ion-color-medium);
  font-size: 12px;
  padding: 4px 8px;
}

.workout-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.workout-meta ion-icon {
  font-size: 14px;
  vertical-align: middle;
  margin-right: 4px;
}

/* Modal Styles */
.modal-content {
  --background: var(--ion-color-light);
}

.step-section {
  background: white;
  margin: 12px;
  border-radius: 16px;
  padding: 16px;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.step-number {
  width: 28px;
  height: 28px;
  background: var(--ion-color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.step-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.muscle-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.muscle-filter ion-chip {
  --padding-start: 10px;
  --padding-end: 10px;
  font-size: 12px;
}

.exercises-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
}

.exercise-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.exercise-card.selected {
  border-color: var(--ion-color-primary);
  background: rgba(var(--ion-color-primary-rgb), 0.1);
}

.exercise-icon {
  font-size: 24px;
}

.exercise-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.exercise-name {
  font-weight: 600;
  font-size: 14px;
}

.exercise-difficulty {
  font-size: 11px;
  margin-top: 2px;
}

.exercise-difficulty.principiante {
  color: var(--ion-color-success);
}

.exercise-difficulty.intermedio {
  color: var(--ion-color-warning);
}

.exercise-difficulty.avanzado {
  color: var(--ion-color-danger);
}

.sets-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.set-row-enhanced {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 12px;
}

.set-badge {
  background: var(--ion-color-primary);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.set-inputs {
  flex: 1;
  display: flex;
  gap: 16px;
}

.input-group {
  flex: 1;
}

.input-group label {
  display: block;
  font-size: 11px;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
  text-align: center;
}

.number-input {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  padding: 4px;
}

.number-value {
  min-width: 40px;
  text-align: center;
  font-weight: 700;
  font-size: 16px;
}

.add-set-btn {
  margin-top: 8px;
}

.details-list {
  background: transparent;
}

.details-list ion-item {
  --background: var(--ion-color-light);
  border-radius: 12px;
  margin-bottom: 8px;
}

.workout-summary {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-tertiary));
  color: white;
  margin: 12px;
  padding: 16px;
  border-radius: 16px;
}

.workout-summary h4 {
  margin: 0 0 12px;
  font-size: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 14px;
}

.summary-row strong {
  font-weight: 700;
}
</style>
