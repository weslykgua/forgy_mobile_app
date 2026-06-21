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
      <ion-modal
        :is-open="isWorkoutModalOpen"
        @didDismiss="isWorkoutModalOpen = false"
        class="workout-modal"
      >
        <ion-header class="forgy-header">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button color="medium" @click="isWorkoutModalOpen = false">Cancelar</ion-button>
            </ion-buttons>
            <ion-title class="forgy-title">{{ editingWorkout ? 'Editar' : 'Nuevo' }} Ejercicio</ion-title>
            <ion-buttons slot="end">
              <ion-button
                strong
                color="primary"
                @click="saveWorkout"
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
                  :class="{ selected: workoutForm.exerciseId === ex.id }"
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
                    v-if="workoutForm.exerciseId === ex.id"
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
                  <div class="set-row-header">
                    <div class="set-badge">Serie {{ index + 1 }}</div>
                    <ion-button
                      v-if="workoutForm.sets.length > 1"
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
                          <ion-icon :icon="remove"></ion-icon>
                        </ion-button>
                        <span class="number-value">{{ set.reps }}</span>
                        <ion-button
                          fill="clear"
                          size="small"
                          @click="incrementValue(set, 'reps')"
                          class="calc-btn"
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
                          class="calc-btn"
                        >
                          <ion-icon :icon="remove"></ion-icon>
                        </ion-button>
                        <span class="number-value">{{ set.weight }}</span>
                        <ion-button
                          fill="clear"
                          size="small"
                          @click="incrementValue(set, 'weight', 2.5)"
                          class="calc-btn"
                        >
                          <ion-icon :icon="add"></ion-icon>
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
                    :icon="add"
                    slot="start"
                  ></ion-icon>
                  Agregar serie
                </ion-button>
              </div>
            </div>

            <!-- Paso 3: Detalles adicionales -->
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
                <ion-item class="detail-item-input">
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
                    v-model="workoutForm.notes"
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
              v-if="workoutForm.exerciseId && workoutForm.sets.length > 0"
            >
              <h4>📊 Resumen del Ejercicio</h4>
              <div class="summary-grid">
                <div class="summary-tile">
                  <span class="tile-label">Volumen total</span>
                  <span class="tile-val">{{ calculateVolume() }} kg</span>
                </div>
                <div class="summary-tile">
                  <span class="tile-label">Series</span>
                  <span class="tile-val">{{ workoutForm.sets.length }}</span>
                </div>
                <div class="summary-tile">
                  <span class="tile-label">Reps totales</span>
                  <span class="tile-val">{{ workoutForm.sets.reduce((a, s) => a + s.reps, 0) }}</span>
                </div>
              </div>
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
  IonButton, IonButtons, IonIcon, IonList, IonItem,
  IonChip, IonModal, IonInput, IonTextarea, IonItemSliding,
  IonItemOptions, IonItemOption, IonRefresher, IonRefresherContent,
  IonSearchbar, IonFab, IonFabButton,
  onIonViewWillEnter, alertController, toastController
} from '@ionic/vue';
import { ref, computed } from 'vue';
import { useProfile } from '../utils/useProfile'

import absImg from '../assets/abs.png';
import antebrazoImg from '../assets/antebrazo.png';
import bicepsImg from '../assets/biceps.png';
import cuadricepsImg from '../assets/cuadriceps.png';
import dorsalesImg from '../assets/dorsales.png';
import hombrosImg from '../assets/hombros.png';
import pantorillasImg from '../assets/pantorillas.png';
import pechoImg from '../assets/pecho.png';
import trapecioImg from '../assets/trapecio.png';
import {
  add, chevronBack, chevronForward, barbellOutline, create, trash,
  documentText, remove, checkmarkCircle, addCircleOutline, removeCircleOutline, time
} from 'ionicons/icons';

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

const { getHeaders, API_URL } = useProfile();

const exercises = ref<Exercise[]>([]);
const workouts = ref<Workout[]>([]);
const calendarData = ref<{ [date: string]: { hasWorkout: boolean } }>({});
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const currentWeekStart = ref(getWeekStart(new Date()));
const isWorkoutModalOpen = ref(false);
const editingWorkout = ref<Workout | null>(null);
const selectedMuscle = ref('Todos');
const modalSearchText = ref('');

const muscleGroups = [
  'Todos', 'Brazos', 'Piernas', 'Espalda', 'Abdomen', 'Pecho', 
  'Hombros', 'Pantorrillas', 'Antebrazos', 'Cardio', 'Cuello'
];
const isExpandedMuscleGroups = ref(false);
const mainMuscles = ['Todos', 'Brazos', 'Piernas', 'Espalda', 'Abdomen', 'Pecho', 'Hombros'];

const visibleMuscleGroups = computed(() => {
  if (isExpandedMuscleGroups.value) return muscleGroups;
  return muscleGroups.filter(m => mainMuscles.includes(m));
});

const workoutForm = ref({
  exerciseId: '',
  exerciseName: '',
  duration: 15,
  sets: [{ reps: 12, weight: 20, completed: false }] as WorkoutSet[],
  notes: ''
});

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
  const icons: { [key: string]: string } = {
    'Todos': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="muscle-svg" style="width:16px;height:16px;vertical-align:middle;display:inline-block;"><path d="M6.5 6.5 11 11"/><path d="M21 21-1.5-1.5"/><path d="M3 3 1.5 1.5"/><path d="M18.5 5.5 3-3"/><path d="M2.5 21.5 3-3"/><path d="M14 5s.5 1.5 3 3"/><path d="M5 14s1.5.5 3 3"/><path d="M10 5.5A3.5 3.5 0 0 0 5.5 10"/><path d="M18.5 14a3.5 3.5 0 0 1-4.5 4.5"/></svg>`,
    'Brazos': `<img src="${bicepsImg}" class="muscle-icon-img" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;display:inline-block;" alt="Brazos" />`,
    'Piernas': `<img src="${cuadricepsImg}" class="muscle-icon-img" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;display:inline-block;" alt="Piernas" />`,
    'Espalda': `<img src="${dorsalesImg}" class="muscle-icon-img" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;display:inline-block;" alt="Espalda" />`,
    'Abdomen': `<img src="${absImg}" class="muscle-icon-img" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;display:inline-block;" alt="Abdomen" />`,
    'Pecho': `<img src="${pechoImg}" class="muscle-icon-img" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;display:inline-block;" alt="Pecho" />`,
    'Hombros': `<img src="${hombrosImg}" class="muscle-icon-img" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;display:inline-block;" alt="Hombros" />`,
    'Pantorrillas': `<img src="${pantorillasImg}" class="muscle-icon-img" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;display:inline-block;" alt="Pantorrillas" />`,
    'Antebrazos': `<img src="${antebrazoImg}" class="muscle-icon-img" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;display:inline-block;" alt="Antebrazos" />`,
    'Cardio': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="muscle-svg" style="width:16px;height:16px;vertical-align:middle;display:inline-block;"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    'Cuello': `<img src="${trapecioImg}" class="muscle-icon-img" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;display:inline-block;" alt="Cuello" />`
  };
  return icons[muscle] || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="muscle-svg" style="width:16px;height:16px;vertical-align:middle;display:inline-block;"><path d="M12 20h.01M12 4h.01M4 12h.01M20 12h.01"/></svg>`;
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

let cachedExercises: Exercise[] = [];

async function loadExercises() {
  if (cachedExercises.length > 0) {
    exercises.value = cachedExercises;
    return;
  }
  try {
    const response = await fetch(`${API_URL}/exercises?paginate=false`, { headers: getHeaders() });
    if (response.ok) {
      const data = await response.json();
      cachedExercises = Array.isArray(data) ? data : (data.data ?? []);
      exercises.value = cachedExercises;
    }
  } catch (error) {
    console.error('Error loading exercises:', error);
  }
}

async function loadWorkouts() {
  let backendWorkouts: Workout[] = [];
  try {
    const response = await fetch(`${API_URL}/workouts?date=${selectedDate.value}`, { headers: getHeaders() });
    if (response.ok) {
      const data = await response.json();
      backendWorkouts = Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error('Error loading workouts:', error);
  }

  const stored = localStorage.getItem('local_workouts');
  const allLocal: Workout[] = stored ? JSON.parse(stored) : [];
  const localWorkouts = allLocal.filter(w => w.date === selectedDate.value);

  workouts.value = [...backendWorkouts, ...localWorkouts];
}

async function loadCalendarData() {
  let backendCalendar: { [date: string]: { hasWorkout: boolean } } = {};
  try {
    const response = await fetch(`${API_URL}/workouts/calendar`, { headers: getHeaders() });
    if (response.ok) {
      backendCalendar = await response.json();
    }
  } catch (error) {
    console.error('Error loading calendar:', error);
  }

  const stored = localStorage.getItem('local_workouts');
  const allLocal: Workout[] = stored ? JSON.parse(stored) : [];
  const localCalendar: { [date: string]: { hasWorkout: boolean } } = {};
  allLocal.forEach(w => {
    localCalendar[w.date] = { hasWorkout: true };
  });

  calendarData.value = { ...backendCalendar, ...localCalendar };
}

function openAddWorkoutModal() {
  editingWorkout.value = null;
  selectedMuscle.value = 'Todos';
  modalSearchText.value = '';
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
  modalSearchText.value = '';
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

  const data = {
    date: selectedDate.value,
    exerciseId: workoutForm.value.exerciseId,
    exerciseName: workoutForm.value.exerciseName,
    sets: workoutForm.value.sets,
    duration: workoutForm.value.duration,
    notes: workoutForm.value.notes
  };

  try {
    let response;
    if (editingWorkout.value) {
      response = await fetch(`${API_URL}/workouts/${editingWorkout.value.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
    } else {
      response = await fetch(`${API_URL}/workouts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
    }

    if (!response.ok) throw new Error(`Error saving workout: ${response.status}`);

    showToast(editingWorkout.value ? '¡Entrenamiento actualizado!' : '¡Ejercicio registrado! 💪');
  } catch (error) {
    console.warn('Backend error, saving locally:', error);

    const stored = localStorage.getItem('local_workouts');
    let allLocal: Workout[] = stored ? JSON.parse(stored) : [];

    if (editingWorkout.value) {
      const index = allLocal.findIndex(w => w.id === editingWorkout.value?.id);
      if (index !== -1) {
        allLocal[index] = { ...allLocal[index], ...data, id: editingWorkout.value.id };
        localStorage.setItem('local_workouts', JSON.stringify(allLocal));
        showToast('Actualizado en local', 'warning');
      } else {
        showToast('No se pudo guardar en el servidor', 'danger');
        return;
      }
    } else {
      const newLocal = { ...data, id: Date.now().toString() };
      allLocal.push(newLocal);
      localStorage.setItem('local_workouts', JSON.stringify(allLocal));
    }
  }
  isWorkoutModalOpen.value = false;
  loadWorkouts();
  loadCalendarData();
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
          try {
            const res = await fetch(`${API_URL}/workouts/${workout.id}`, { method: 'DELETE', headers: getHeaders() });
            if (!res.ok) throw new Error('Backend delete failed');
            showToast('Entrenamiento eliminado', 'warning');
          } catch (error) {
            const stored = localStorage.getItem('local_workouts');
            if (stored) {
              let allLocal: Workout[] = JSON.parse(stored);
              const initialLen = allLocal.length;
              allLocal = allLocal.filter(w => w.id !== workout.id);
              if (allLocal.length < initialLen) {
                localStorage.setItem('local_workouts', JSON.stringify(allLocal));
                showToast('Eliminado de local', 'warning');
              }
            }
          }
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

/* Modal Styles */
.workout-modal {
  --border-radius: 24px;
}

.modal-content {
  --background: var(--forgy-content-bg);
}

.modal-container {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.step-section {
  background: var(--forgy-card-bg);
  margin-bottom: 20px;
  border-radius: 20px;
  padding: 20px;
  color: var(--forgy-text-primary);
  border: 1px solid var(--forgy-border);
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
  font-weight: 800;
  font-size: 14px;
}

.step-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.modal-searchbar {
  --background: var(--forgy-input-bg);
  --border-radius: 12px;
  padding-left: 0;
  padding-right: 0;
  margin-bottom: 16px;
}

.muscle-filter-scroll {
  overflow-x: auto;
  margin: 0 -20px 16px;
  padding: 0 20px;
  scrollbar-width: none;
}

.muscle-filter-scroll::-webkit-scrollbar {
  display: none;
}

.muscle-filter {
  display: flex;
  gap: 8px;
  width: max-content;
}

.muscle-chip {
  --border-radius: 12px;
  font-weight: 600;
  font-size: 12px;
  margin: 0;
}

.expand-chip {
  --background: var(--forgy-input-bg);
}

.expand-icon {
  font-size: 16px;
}

.exercises-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  max-height: 260px;
  overflow-y: auto;
  padding-right: 4px;
}

@media (min-width: 576px) {
  .exercises-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.exercise-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--forgy-input-bg);
  border-radius: 14px;
  border: 1px solid var(--forgy-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.exercise-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.exercise-card.selected {
  border-color: var(--ion-color-primary);
  background: rgba(var(--ion-color-primary-rgb), 0.08);
}

.exercise-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--forgy-card-bg);
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--forgy-border);
}

.exercise-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.exercise-name {
  font-weight: 700;
  font-size: 14px;
  color: var(--forgy-text-primary);
}

.exercise-difficulty {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
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

.check-icon {
  font-size: 20px;
}

.no-exercises-found {
  text-align: center;
  padding: 24px;
  color: var(--forgy-text-secondary);
  font-size: 14px;
  grid-column: 1 / -1;
}

/* Configurador de series */
.sets-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.set-row-enhanced {
  background: var(--forgy-input-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 16px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.set-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.set-badge {
  background: var(--ion-color-primary);
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.delete-set-btn {
  margin: 0;
  --padding-start: 6px;
  --padding-end: 6px;
}

.set-inputs {
  display: flex;
  gap: 12px;
}

.input-group {
  flex: 1;
}

.input-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--forgy-text-secondary);
  margin-bottom: 6px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.number-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--forgy-card-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 12px;
  padding: 2px;
}

.number-value {
  text-align: center;
  font-weight: 800;
  font-size: 16px;
  color: var(--forgy-text-primary);
  min-width: 40px;
}

.calc-btn {
  --color: var(--ion-color-primary);
  --padding-start: 8px;
  --padding-end: 8px;
  margin: 0;
}

.add-set-btn {
  margin-top: 8px;
  --border-radius: 12px;
  font-weight: 600;
}

/* Detalles adicionales */
.details-list {
  background: transparent;
  padding: 0;
}

.detail-item-input {
  --background: var(--forgy-input-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 16px;
  margin-bottom: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
}

.detail-input, .detail-textarea {
  --color: var(--forgy-text-primary);
  font-size: 14px;
}

/* Resumen del ejercicio */
.workout-summary {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-tertiary, var(--ion-color-secondary)));
  color: white;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(var(--ion-color-primary-rgb), 0.25);
  margin-top: 24px;
}

.workout-summary h4 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.95;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.summary-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.12);
  padding: 10px 4px;
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.tile-label {
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.8;
  font-weight: 600;
  margin-bottom: 4px;
}

.tile-val {
  font-size: 16px;
  font-weight: 800;
}
</style>
