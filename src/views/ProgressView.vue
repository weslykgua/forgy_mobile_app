<template>
  <ion-page>
    <!-- Header de la sección de Progreso con clase Forgy -->
    <ion-header class="forgy-header">
      <ion-toolbar>
        <ion-title class="forgy-title">
          Mi Progreso
        </ion-title>
        <ion-buttons slot="end">
          <ion-button class="header-add-btn" @click="openProgressModal">
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

      <div class="progress-container">
        <!-- Tarjeta principal del día -->
        <div class="hero-card">
          <div class="hero-date">{{ formattedSelectedDate }}</div>
          <div class="hero-greeting">{{ getGreeting() }}</div>

          <div class="hero-stats">
            <div
              class="hero-stat"
              @click="openProgressModal"
            >
              <div class="stat-circle weight">
                <ion-icon :icon="scaleOutline"></ion-icon>
              </div>
              <span class="stat-value">{{ displayWeight ?? '--' }}</span>
              <span class="stat-unit">kg</span>
            </div>
            <div
              class="hero-stat"
              @click="openProgressModal"
            >
              <div class="stat-circle water">
                <ion-icon :icon="waterOutline"></ion-icon>
              </div>
              <span class="stat-value">{{ formatWater(todayProgress?.waterIntake || 0) }}</span>
              <span class="stat-unit">L</span>
            </div>
            <div
              class="hero-stat"
              @click="openProgressModal"
            >
              <div class="stat-circle sleep">
                <ion-icon :icon="moonOutline"></ion-icon>
              </div>
              <span class="stat-value">{{ todayProgress?.sleepHours ?? '--' }}</span>
              <span class="stat-unit">hrs</span>
            </div>
            <div
              class="hero-stat"
              @click="openProgressModal"
            >
              <div class="stat-circle calories">
                <ion-icon :icon="nutritionOutline"></ion-icon>
              </div>
              <span class="stat-value">{{ caloricBalance >= 0 ? '+' : '' }}{{ caloricBalance }}</span>
              <span class="stat-unit">kcal netas</span>
            </div>
          </div>
        </div>

        <!-- Google Calendar-like Monthly Calendar Grid -->
        <div class="calendar-section">
          <div class="calendar-header-nav">
            <ion-button fill="clear" size="small" class="cal-nav-btn" @click="prevMonth">
              <ion-icon :icon="chevronBack" slot="icon-only"></ion-icon>
            </ion-button>
            <span class="calendar-month-title">
              {{ monthNames[currentMonth] }} {{ currentYear }}
            </span>
            <ion-button fill="clear" size="small" class="cal-nav-btn" @click="nextMonth">
              <ion-icon :icon="chevronForward" slot="icon-only"></ion-icon>
            </ion-button>
          </div>

          <div class="calendar-weekdays">
            <span v-for="d in ['L', 'M', 'M', 'J', 'V', 'S', 'D']" :key="d" class="weekday">{{ d }}</span>
          </div>

          <div class="calendar-grid">
            <div
              v-for="cell in calendarDays"
              :key="cell.dateKey"
              class="calendar-cell"
              :class="{
                'other-month': !cell.isCurrentMonth,
                'selected-day': cell.dateKey === selectedDate,
                'today-day': cell.dateKey === today
              }"
              @click="selectDate(cell.dateKey)"
            >
              <span class="day-number">{{ cell.dayNum }}</span>
              <div v-if="cell.hasData" class="data-indicator"></div>
            </div>
          </div>
        </div>

        <!-- Racha y logros -->
        <div class="streak-card">
          <div class="streak-info">
            <ion-icon :icon="flame" style="color: var(--ion-color-danger); font-size: 24px; margin-right: 8px;"></ion-icon>
            <div class="streak-text">
              <span class="streak-number">{{ progressStats.streakDays || 0 }}</span>
              <span class="streak-label">días de racha</span>
            </div>
          </div>
          <div class="streak-badges">
            <span
              class="badge"
              v-if="progressStats.streakDays >= 7"
            >1 semana</span>
            <span
              class="badge"
              v-if="progressStats.streakDays >= 30"
            >1 mes</span>
            <span
              class="badge"
              v-if="progressStats.totalWorkouts >= 10"
            >10 entrenos</span>
          </div>
        </div>

        <!-- Enfoque Muscular Reciente -->
        <div class="section-card" v-if="muscleDistribution.length > 0">
          <div class="section-header">
            <ion-icon :icon="barbell" color="primary" style="font-size: 20px; margin-right: 8px;"></ion-icon>
            <h3>Enfoque Muscular Reciente</h3>
            <span class="section-value">Por series registradas</span>
          </div>
          <div class="muscle-chart">
            <div
              v-for="item in muscleDistribution.slice(0, 5)"
              :key="item.muscle"
              class="muscle-row"
            >
              <div class="muscle-info-labels">
                <span class="muscle-label-name">{{ item.muscle }}</span>
                <span class="muscle-label-val">{{ item.series }} series</span>
              </div>
              <div class="muscle-progress-bar">
                <div
                  class="muscle-progress-fill"
                  :style="{ width: item.percentage + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ejercicios Más Frecuentes -->
        <div class="section-card" v-if="topExercises.length > 0">
          <div class="section-header">
            <ion-icon :icon="flame" color="danger" style="font-size: 20px; margin-right: 8px;"></ion-icon>
            <h3>Ejercicios Más Frecuentes</h3>
          </div>
          <div class="top-exercises-list">
            <div
              v-for="(ex, index) in topExercises"
              :key="ex.name"
              class="top-exercise-item"
            >
              <span class="top-exercise-rank">#{{ index + 1 }}</span>
              <span class="top-exercise-name">{{ ex.name }}</span>
              <span class="top-exercise-count">{{ ex.count }} veces</span>
            </div>
          </div>
        </div>

        <!-- Récords de Fuerza -->
        <div class="section-card" v-if="formattedRecordsList.length > 0">
          <div class="section-header">
            <ion-icon :icon="statsChartOutline" color="warning" style="font-size: 20px; margin-right: 8px;"></ion-icon>
            <h3>Mis Récords de Fuerza</h3>
          </div>
          <div class="records-list">
            <div
              v-for="rec in formattedRecordsList"
              :key="rec.exerciseName"
              class="record-item"
            >
              <span class="record-exercise-name">{{ rec.exerciseName }}</span>
              <div class="record-values">
                <span class="record-val" v-if="rec.maxWeight">
                  🏋️ Max Peso: {{ rec.maxWeight }} kg
                </span>
                <span class="record-val" v-if="rec.maxVolume">
                  📦 Vol: {{ formatVolume(rec.maxVolume) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hidratación -->
        <div class="section-card">
          <div class="section-header clickable-goal-header" @click="changeWaterGoal">
            <ion-icon :icon="waterOutline" color="secondary" style="font-size: 20px; margin-right: 8px;"></ion-icon>
            <h3>Hidratación</h3>
            <span class="section-value goal-value-badge">{{ todayProgress?.waterIntake || 0 }} / {{ waterGoal }} ml ✏️</span>
          </div>
          <div class="water-progress">
            <div
              class="water-fill"
              :style="{ width: waterPercentage + '%' }"
            >
              <span
                class="water-text"
                v-if="waterPercentage > 20"
              >{{ Math.round(waterPercentage) }}%</span>
            </div>
          </div>
          <div class="water-actions">
            <button
              class="water-btn"
              @click="addWater(250)"
            >
              <span>+250ml</span>
            </button>
            <button
              class="water-btn"
              @click="addWater(500)"
            >
              <span>+500ml</span>
            </button>
            <button
              class="water-btn"
              @click="addWater(1000)"
            >
              <span>+1L</span>
            </button>
            <button
              class="water-btn custom-water-btn"
              @click="addCustomWater"
            >
              <span>+ Otro</span>
            </button>
          </div>
          <p class="water-status">{{ waterStatusMessage }}</p>
        </div>


        <!-- Calculadora RM -->
        <div class="section-card rm-card" @click="goToRmCalculator">
          <div class="section-header">
            <ion-icon :icon="barbell" color="primary" style="font-size: 20px; margin-right: 8px;"></ion-icon>
            <h3>Calculadora de RM</h3>
          </div>
          <div class="bmi-body">
            <p class="bmi-label">Calcula tu 1RM estimada</p>
            <p class="bmi-message">Sirve para estimar tu máximo de 1 repetición según el peso y repeticiones que haces.</p>
            <ion-button size="small" fill="outline" class="calc-btn-action">Abrir calculadora</ion-button>
          </div>
        </div>

        <!-- Mini gráfica de peso -->
        <div
          class="section-card"
          v-if="weightHistory.length > 0"
        >
          <div class="section-header">
            <ion-icon :icon="statsChartOutline" color="primary" style="font-size: 20px; margin-right: 8px;"></ion-icon>
            <h3>Peso esta semana</h3>
            <span
              class="section-value"
              :class="weightTrend"
            >
              {{ weightChange >= 0 ? '+' : '' }}{{ weightChange }} kg
            </span>
          </div>
          <div class="mini-chart">
            <div
              v-for="(point, idx) in weightHistory"
              :key="idx"
              class="chart-col"
            >
              <div
                class="chart-bar"
                :style="{ height: getBarHeight(point.weight) + '%' }"
              >
                <span class="bar-tooltip">{{ point.weight }}</span>
              </div>
              <span class="chart-label">{{ formatShortDate(point.date) }}</span>
            </div>
          </div>
        </div>

        <!-- Resumen de Métricas Globales de Fuerza -->
        <div class="stats-row">
          <div class="stat-card">
            <ion-icon
              :icon="barbell"
              color="primary"
            ></ion-icon>
            <span class="stat-num">{{ totalSessionsCount }}</span>
            <span class="stat-label">Sesiones</span>
          </div>
          <div class="stat-card">
            <ion-icon
              :icon="flame"
              color="danger"
            ></ion-icon>
            <span class="stat-num">{{ formatVolume(cumulativeVolume) }}</span>
            <span class="stat-label">kg totales</span>
          </div>
        </div>
      </div>

      <!-- Modal Progreso -->
      <ion-modal
        :is-open="isProgressModalOpen"
        @didDismiss="isProgressModalOpen = false"
        class="workout-modal"
      >
        <ion-header class="forgy-header">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button color="medium" @click="isProgressModalOpen = false">Cancelar</ion-button>
            </ion-buttons>
            <ion-title class="forgy-title">Registrar Día</ion-title>
            <ion-buttons slot="end">
              <ion-button
                strong
                color="primary"
                @click="saveProgress"
              >Guardar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="modal-content">
          <div class="modal-container">
            <div class="metrics-grid">
              
              <!-- Tarjeta de Peso -->
              <div class="metric-card weight-card">
                <div class="metric-header">
                  <div class="metric-icon-badge">
                    <ion-icon :icon="scaleOutline"></ion-icon>
                  </div>
                  <div class="metric-meta">
                    <span class="metric-title">Peso Corporal</span>
                    <span class="metric-subtitle">Registra tu peso en kg</span>
                  </div>
                </div>
                <div class="metric-body">
                  <button class="control-btn" @click="progressForm.weight = Math.max(0, Number((progressForm.weight - 0.5).toFixed(1)))">
                    <ion-icon :icon="remove"></ion-icon>
                  </button>
                  <div class="value-display">
                    <input type="number" v-model.number="progressForm.weight" step="0.1" class="metric-input" />
                    <span class="metric-unit">kg</span>
                  </div>
                  <button class="control-btn" @click="progressForm.weight = Number((progressForm.weight + 0.5).toFixed(1))">
                    <ion-icon :icon="add"></ion-icon>
                  </button>
                </div>
                <div class="quick-actions">
                  <button class="quick-btn" @click="progressForm.weight = Math.max(0, Number((progressForm.weight - 0.1).toFixed(1)))">-0.1</button>
                  <button class="quick-btn" @click="progressForm.weight = Number((progressForm.weight + 0.1).toFixed(1))">+0.1</button>
                </div>
              </div>

              <!-- Tarjeta de Agua -->
              <div class="metric-card water-card">
                <div class="metric-header">
                  <div class="metric-icon-badge">
                    <ion-icon :icon="waterOutline"></ion-icon>
                  </div>
                  <div class="metric-meta">
                    <span class="metric-title">Consumo de Agua</span>
                    <span class="metric-subtitle">Meta diaria: {{ waterGoal }} ml</span>
                  </div>
                </div>
                <div class="metric-body">
                  <button class="control-btn" @click="progressForm.waterIntake = Math.max(0, progressForm.waterIntake - 250)">
                    <ion-icon :icon="remove"></ion-icon>
                  </button>
                  <div class="value-display">
                    <input type="number" v-model.number="progressForm.waterIntake" step="100" class="metric-input" />
                    <span class="metric-unit">ml</span>
                  </div>
                  <button class="control-btn" @click="progressForm.waterIntake += 250">
                    <ion-icon :icon="add"></ion-icon>
                  </button>
                </div>
                <div class="quick-actions">
                  <button class="quick-btn" @click="progressForm.waterIntake = Math.max(0, progressForm.waterIntake - 100)">-100</button>
                  <button class="quick-btn" @click="progressForm.waterIntake += 100">+100</button>
                </div>
              </div>

              <!-- Tarjeta de Sueño -->
              <div class="metric-card sleep-card">
                <div class="metric-header">
                  <div class="metric-icon-badge">
                    <ion-icon :icon="moonOutline"></ion-icon>
                  </div>
                  <div class="metric-meta">
                    <span class="metric-title">Horas de Sueño</span>
                    <span class="metric-subtitle">Recomendado: 7 - 9 horas</span>
                  </div>
                </div>
                <div class="metric-body">
                  <button class="control-btn" @click="progressForm.sleepHours = Math.max(0, Number((progressForm.sleepHours - 0.5).toFixed(1)))">
                    <ion-icon :icon="remove"></ion-icon>
                  </button>
                  <div class="value-display">
                    <input type="number" v-model.number="progressForm.sleepHours" step="0.5" class="metric-input" />
                    <span class="metric-unit">hrs</span>
                  </div>
                  <button class="control-btn" @click="progressForm.sleepHours = Number((progressForm.sleepHours + 0.5).toFixed(1))">
                    <ion-icon :icon="add"></ion-icon>
                  </button>
                </div>
                <div class="quick-actions">
                  <button class="quick-btn" @click="progressForm.sleepHours = 7">7 hrs</button>
                  <button class="quick-btn" @click="progressForm.sleepHours = 8">8 hrs</button>
                </div>
              </div>

              <!-- Tarjeta de Calorías Consumidas -->
              <div class="metric-card kcal-consumed-card">
                <div class="metric-header">
                  <div class="metric-icon-badge">
                    <ion-icon :icon="nutritionOutline"></ion-icon>
                  </div>
                  <div class="metric-meta">
                    <span class="metric-title">Calorías Consumidas</span>
                    <span class="metric-subtitle">Energía alimentaria</span>
                  </div>
                </div>
                <div class="metric-body">
                  <button class="control-btn" @click="progressForm.caloriesConsumed = Math.max(0, progressForm.caloriesConsumed - 100)">
                    <ion-icon :icon="remove"></ion-icon>
                  </button>
                  <div class="value-display">
                    <input type="number" v-model.number="progressForm.caloriesConsumed" step="50" class="metric-input" />
                    <span class="metric-unit">kcal</span>
                  </div>
                  <button class="control-btn" @click="progressForm.caloriesConsumed += 100">
                    <ion-icon :icon="add"></ion-icon>
                  </button>
                </div>
                <div class="quick-actions">
                  <button class="quick-btn" @click="progressForm.caloriesConsumed = Math.max(0, progressForm.caloriesConsumed - 50)">-50</button>
                  <button class="quick-btn" @click="progressForm.caloriesConsumed += 50">+50</button>
                </div>
              </div>

              <!-- Tarjeta de Calorías Quemadas -->
              <div class="metric-card kcal-burned-card">
                <div class="metric-header">
                  <div class="metric-icon-badge">
                    <ion-icon :icon="flame"></ion-icon>
                  </div>
                  <div class="metric-meta">
                    <span class="metric-title">Calorías Quemadas</span>
                    <span class="metric-subtitle">Gasto por actividad</span>
                  </div>
                </div>
                <div class="metric-body">
                  <button class="control-btn" @click="progressForm.caloriesBurned = Math.max(0, progressForm.caloriesBurned - 100)">
                    <ion-icon :icon="remove"></ion-icon>
                  </button>
                  <div class="value-display">
                    <input type="number" v-model.number="progressForm.caloriesBurned" step="50" class="metric-input" />
                    <span class="metric-unit">kcal</span>
                  </div>
                  <button class="control-btn" @click="progressForm.caloriesBurned += 100">
                    <ion-icon :icon="add"></ion-icon>
                  </button>
                </div>
                <div class="quick-actions">
                  <button class="quick-btn" @click="progressForm.caloriesBurned = Math.max(0, progressForm.caloriesBurned - 50)">-50</button>
                  <button class="quick-btn" @click="progressForm.caloriesBurned += 50">+50</button>
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
  IonButton, IonButtons, IonIcon,
  IonModal, IonRefresher, IonRefresherContent,
  onIonViewWillEnter, toastController, useIonRouter, alertController
} from '@ionic/vue';
import { ref, computed } from 'vue';

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
  add, scaleOutline, waterOutline, moonOutline, nutritionOutline, barbell, flame, bodyOutline,
  chevronBack, chevronForward, statsChartOutline, remove
} from 'ionicons/icons';

const API_URL = import.meta.env.VITE_API_URL || 'https://forgybackendapi-production.up.railway.app'
const router = useIonRouter();

interface DailyProgress {
  id: string;
  date: string;
  weight?: number | null;
  waterIntake?: number | null;
  caloriesConsumed?: number | null;
  caloriesBurned?: number | null;
  sleepHours?: number | null;
  mood?: string | null;
}

interface UserProfile {
  height?: number | null;
  weight?: number | null;
  name?: string | null;
}

interface ProgressStats {
  totalWorkouts: number;
  totalVolume: number;
  avgWater: number;
  weightHistory: { date: string; weight: number }[];
  currentWeight: number;
  streakDays: number;
}

const progressData = ref<DailyProgress[]>([]);
const progressStats = ref<ProgressStats>({
  totalWorkouts: 0, totalVolume: 0, avgWater: 0, weightHistory: [], currentWeight: 0, streakDays: 0
});
const isProgressModalOpen = ref(false);
const userProfile = ref<UserProfile>({});

const exercises = ref<any[]>([]);
const workoutCalendarDates = ref<Record<string, boolean>>({});
const workoutHistory = ref<any[]>([]);
const personalRecords = ref<Record<string, any>>({});
const waterGoal = ref(Number(localStorage.getItem('forgy_water_goal') || '2500'));

function getLocalDateKey(date = new Date()) {
  return date.toLocaleDateString('en-CA');
}

const today = getLocalDateKey();

const progressForm = ref({
  weight: 0, waterIntake: 0, caloriesConsumed: 0, caloriesBurned: 0, sleepHours: 0
});

const selectedDate = ref(today);

const now = new Date();
const currentYear = ref(now.getFullYear());
const currentMonth = ref(now.getMonth());

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function selectDate(dateKey: string) {
  selectedDate.value = dateKey;
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

const formattedSelectedDate = computed(() => {
  if (selectedDate.value === today) return 'Hoy';
  const d = new Date(selectedDate.value + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
});

function checkIfDateHasData(dateKey: string) {
  const hasProgress = progressData.value.some(p => p.date === dateKey && (p.waterIntake || p.weight || p.sleepHours || p.caloriesConsumed || p.caloriesBurned));
  const hasWorkout = workoutCalendarDates.value[dateKey] || false;
  return hasProgress || hasWorkout;
}

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;

  const firstDay = new Date(year, month, 1);
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  const numDays = new Date(year, month + 1, 0).getDate();
  const prevMonthNumDays = new Date(year, month, 0).getDate();
  const days: { dateKey: string; dayNum: number; isCurrentMonth: boolean; hasData: boolean }[] = [];

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthNumDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateKey = `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    days.push({
      dateKey,
      dayNum: day,
      isCurrentMonth: false,
      hasData: checkIfDateHasData(dateKey)
    });
  }

  for (let day = 1; day <= numDays; day++) {
    const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    days.push({
      dateKey,
      dayNum: day,
      isCurrentMonth: true,
      hasData: checkIfDateHasData(dateKey)
    });
  }

  const remainingCells = 42 - days.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateKey = `${nextYear}-${(nextMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    days.push({
      dateKey,
      dayNum: day,
      isCurrentMonth: false,
      hasData: checkIfDateHasData(dateKey)
    });
  }

  return days;
});

const todayProgress = computed(() => progressData.value.find(p => p.date === selectedDate.value));

const displayWeight = computed(() => {
  const weight = todayProgress.value?.weight ?? userProfile.value.weight ?? progressStats.value.currentWeight ?? null;
  return weight === 0 ? null : weight;
});

const displayHeight = computed(() => {
  const height = userProfile.value.height ?? null;
  return height === 0 ? null : height;
});

const waterPercentage = computed(() => Math.min(((todayProgress.value?.waterIntake || 0) / waterGoal.value) * 100, 100));

const waterStatusMessage = computed(() => {
  const intake = todayProgress.value?.waterIntake || 0;
  if (intake >= waterGoal.value) return '¡Excelente! Hidratación completa hoy';
  if (intake >= waterGoal.value * 0.6) return 'Vas bien: hidratación normal';
  if (intake >= waterGoal.value * 0.3) return 'Vas a mitad: toma un poco más';
  return 'Hidratación baja: suma más agua hoy';
});

const weightHistory = computed(() => progressStats.value.weightHistory.slice(-7));

const weightChange = computed(() => {
  if (weightHistory.value.length < 2) return 0;
  return Number((weightHistory.value[weightHistory.value.length - 1].weight - weightHistory.value[0].weight).toFixed(1));
});

const weightTrend = computed(() => weightChange.value > 0 ? 'trend-up' : weightChange.value < 0 ? 'trend-down' : '');


const caloricBalance = computed(() => {
  const consumed = todayProgress.value?.caloriesConsumed || 0;
  const burned = todayProgress.value?.caloriesBurned || 0;
  return consumed - burned;
});

const topExercises = computed(() => {
  const counts: Record<string, number> = {};
  workoutHistory.value.forEach((sess: any) => {
    if (Array.isArray(sess.exercises)) {
      sess.exercises.forEach((ex: any) => {
        counts[ex.name] = (counts[ex.name] || 0) + 1;
      });
    }
  });

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
});

const exerciseToMuscleMap = computed(() => {
  const map: Record<string, string> = {};
  exercises.value.forEach(ex => {
    map[ex.name.toLowerCase()] = ex.muscle;
  });
  return map;
});

const muscleDistribution = computed(() => {
  const counts: Record<string, number> = {};
  const map = exerciseToMuscleMap.value;

  workoutHistory.value.forEach((sess: any) => {
    if (Array.isArray(sess.exercises)) {
      sess.exercises.forEach((ex: any) => {
        const muscle = map[ex.name.toLowerCase()] || 'Otros';
        const setRules = Array.isArray(ex.sets) ? ex.sets.length : 0;
        counts[muscle] = (counts[muscle] || 0) + setRules;
      });
    }
  });

  const list = Object.entries(counts)
    .map(([muscle, series]) => ({ muscle, series }))
    .sort((a, b) => b.series - a.series);

  const maxSeries = list.length > 0 ? Math.max(...list.map(l => l.series)) : 1;
  return list.map(item => ({
    ...item,
    percentage: (item.series / maxSeries) * 100
  }));
});

const cumulativeVolume = computed(() => {
  return workoutHistory.value.reduce((sum, sess) => sum + (sess.totalVolume || 0), 0);
});

const totalSessionsCount = computed(() => {
  return workoutHistory.value.length;
});

const formattedRecordsList = computed(() => {
  return Object.entries(personalRecords.value).map(([_, data]: [string, any]) => {
    return {
      exerciseName: data.exerciseName,
      maxWeight: data.records.max_weight?.value || null,
      maxReps: data.records.max_reps?.value || null,
      maxRepsWeight: data.records.max_reps?.weight || null,
      maxVolume: data.records.max_volume?.value || null
    };
  }).slice(0, 5);
});

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '¡Buenos días!';
  if (hour < 18) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

function toDateKey(value: string) {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value;
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function formatWater(ml: number) { return (ml / 1000).toFixed(1); }
function formatVolume(vol: number | undefined | null) {
  if (vol === undefined || vol === null) return '0';
  return vol >= 1000 ? (vol / 1000).toFixed(1) + 'k' : vol.toString();
}
function formatShortDate(dateStr: string) { return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric' }); }

function getBarHeight(weight: number) {
  const weights = weightHistory.value.map(w => w.weight);
  if (weights.length === 0) return 50;
  const min = Math.min(...weights) - 2;
  const max = Math.max(...weights) + 2;
  return Math.max(20, ((weight - min) / (max - min)) * 100);
}

function mergeLocalWorkouts() {
  const stored = localStorage.getItem('local_workouts');
  const localList: any[] = stored ? JSON.parse(stored) : [];

  localList.forEach(w => {
    if (w.date) {
      workoutCalendarDates.value[w.date] = true;
    }
  });

  const formattedLocals = localList.map(w => {
    const totalVol = w.sets.reduce((sum: number, s: any) => sum + (s.reps * s.weight), 0);
    return {
      id: w.id,
      date: w.date,
      routine: 'Entrenamiento Libre (Local)',
      exerciseCount: 1,
      totalVolume: totalVol,
      duration: w.duration || 15,
      exercises: [{
        name: w.exerciseName,
        sets: w.sets
      }]
    };
  });

  const combinedHistory = [...workoutHistory.value];
  formattedLocals.forEach(l => {
    if (!combinedHistory.some(h => h.id === l.id)) {
      combinedHistory.push(l);
    }
  });

  combinedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  workoutHistory.value = combinedHistory;
}

async function loadAllData() {
  try {
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      return;
    }

    const [progressRes, statsRes, profileRes, workoutsCalRes, workoutsHistRes, exercisesRes, recordsRes] = await Promise.all([
      fetch(`${API_URL}/progress`, { headers }),
      fetch(`${API_URL}/progress/stats`, { headers }),
      fetch(`${API_URL}/user/profile`, { headers }),
      fetch(`${API_URL}/workouts/calendar`, { headers }),
      fetch(`${API_URL}/workouts/history?limit=100`, { headers }),
      fetch(`${API_URL}/exercises?paginate=false`, { headers }),
      fetch(`${API_URL}/workouts/records`, { headers })
    ]);

    if (progressRes.ok) {
      const progressJson = await progressRes.json();
      progressData.value = Array.isArray(progressJson)
        ? progressJson.map((item: any) => ({ ...item, date: toDateKey(item.date) }))
        : [];
      localStorage.setItem('cache_all_progress', JSON.stringify(progressData.value));
    }

    if (statsRes.ok) {
      progressStats.value = await statsRes.json();
      localStorage.setItem('cache_progress_stats', JSON.stringify(progressStats.value));
    }

    if (profileRes.ok) {
      userProfile.value = await profileRes.json();
      localStorage.setItem('cache_user_profile', JSON.stringify(userProfile.value));
    }

    if (workoutsCalRes.ok) {
      const calData = await workoutsCalRes.json();
      const dates: Record<string, boolean> = {};
      Object.keys(calData).forEach(d => {
        dates[d] = true;
      });
      workoutCalendarDates.value = dates;
    }

    if (workoutsHistRes.ok) {
      workoutHistory.value = await workoutsHistRes.json();
    }

    if (exercisesRes.ok) {
      const data = await exercisesRes.json();
      exercises.value = Array.isArray(data) ? data : (data.data ?? []);
    }

    if (recordsRes.ok) {
      personalRecords.value = await recordsRes.json();
    }

    mergeLocalWorkouts();

  } catch (error) {
    console.error('Error loading data:', error);
  }
}


function goToRmCalculator() {
  router.push('/tabs/rm');
}

function openProgressModal() {
  const tp = todayProgress.value;
  progressForm.value = {
    weight: tp?.weight ?? userProfile.value.weight ?? progressStats.value.currentWeight ?? 70,
    waterIntake: tp?.waterIntake || 0,
    caloriesConsumed: tp?.caloriesConsumed || 0,
    caloriesBurned: tp?.caloriesBurned || 0,
    sleepHours: tp?.sleepHours || 7
  };
  isProgressModalOpen.value = true;
}

function normalizeNumber(value: unknown, { asInt = false } = {}) {
  if (value === null || value === undefined || value === '') return null;
  let raw = value as string | number;
  if (typeof raw === 'string') {
    raw = raw.trim().replace(/\s+/g, '');
    if (raw.includes(',') && raw.includes('.')) {
      raw = raw.replace(/\./g, '').replace(',', '.');
    } else if (raw.includes(',')) {
      raw = raw.replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
      raw = raw.replace(/\./g, '');
    }
  }
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  return asInt ? Math.round(num) : num;
}

function buildProgressPayload() {
  return {
    weight: normalizeNumber(progressForm.value.weight),
    waterIntake: normalizeNumber(progressForm.value.waterIntake, { asInt: true }),
    caloriesConsumed: normalizeNumber(progressForm.value.caloriesConsumed, { asInt: true }),
    caloriesBurned: normalizeNumber(progressForm.value.caloriesBurned, { asInt: true }),
    sleepHours: normalizeNumber(progressForm.value.sleepHours)
  };
}

async function saveProgress() {
  try {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      showToast('Inicia sesión para guardar', 'danger');
      return;
    }

    const payload = buildProgressPayload();
    const saveRes = await fetch(`${API_URL}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ date: selectedDate.value, ...payload })
    });
    if (!saveRes.ok) {
      throw new Error('No se pudo guardar el progreso');
    }
    showToast('¡Progreso guardado! 💪');
    isProgressModalOpen.value = false;
    loadAllData();
  } catch (error) {
    showToast('Error al guardar', 'danger');
  }
}

async function changeWaterGoal() {
  const alert = await alertController.create({
    header: 'Objetivo de Agua',
    message: 'Introduce tu objetivo diario de hidratación en mililitros (ml):',
    inputs: [
      {
        name: 'goal',
        type: 'number',
        placeholder: 'Ej. 2500',
        value: waterGoal.value
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Guardar',
        handler: (data) => {
          const val = Number(data.goal);
          if (val > 0) {
            waterGoal.value = val;
            localStorage.setItem('forgy_water_goal', val.toString());
            showToast(`Objetivo de agua actualizado a ${val} ml`);
          }
        }
      }
    ]
  });
  await alert.present();
}

async function addCustomWater() {
  const alert = await alertController.create({
    header: 'Cantidad Personalizada',
    message: 'Introduce la cantidad de agua consumida en mililitros (ml):',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        placeholder: 'Ej. 330'
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Agregar',
        handler: (data) => {
          const amount = Number(data.amount);
          if (amount > 0) {
            addWater(amount);
          }
        }
      }
    ]
  });
  await alert.present();
}

async function addWater(amount: number) {
  try {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      showToast('Inicia sesión para guardar', 'danger');
      return;
    }

    const currentWater = todayProgress.value?.waterIntake || 0;
    const addRes = await fetch(`${API_URL}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        date: selectedDate.value,
        waterIntake: currentWater + amount
      })
    });
    if (!addRes.ok) {
      throw new Error('No se pudo guardar el agua');
    }
    showToast(`+${amount}ml 💧`);
    loadAllData();
  } catch (error) {
    showToast('Error', 'danger');
  }
}

async function showToast(message: string, color = 'success') {
  const toast = await toastController.create({ message, duration: 2000, color, position: 'bottom' });
  await toast.present();
}

async function handleRefresh(event: CustomEvent) {
  await loadAllData();
  (event.target as any).complete();
}

onIonViewWillEnter(() => {
  const cachedProgress = localStorage.getItem('cache_all_progress');
  const cachedStats = localStorage.getItem('cache_progress_stats');
  const cachedProfile = localStorage.getItem('cache_user_profile');

  if (cachedProgress) {
    const progressJson = JSON.parse(cachedProgress);
    progressData.value = Array.isArray(progressJson)
      ? progressJson.map((item: any) => ({ ...item, date: toDateKey(item.date) }))
      : [];
  }
  if (cachedStats) {
    progressStats.value = JSON.parse(cachedStats);
  }
  if (cachedProfile) {
    userProfile.value = JSON.parse(cachedProfile);
  }

  loadAllData();
});
</script>

<style scoped>
.progress-container {
  max-width: 768px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
  padding-bottom: 100px;
}

/* Header */
.header-add-btn {
  --color: var(--ion-color-primary);
}

/* Hero Card */
.hero-card {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-tertiary));
  border-radius: 24px;
  padding: 24px;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(var(--ion-color-primary-rgb), 0.25);
}

.hero-date {
  font-size: 14px;
  opacity: 0.9;
  text-transform: capitalize;
  margin-bottom: 4px;
}

.hero-greeting {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
}

.hero-stats {
  display: flex;
  justify-content: space-around;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: background 0.2s;
  min-width: 60px;
}

.hero-stat:active {
  background: rgba(255, 255, 255, 0.1);
}

.stat-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-circle.weight {
  background: rgba(255, 255, 255, 0.2);
}

.stat-circle.water {
  background: rgba(56, 128, 255, 0.45);
}

.stat-circle.sleep {
  background: rgba(255, 196, 9, 0.45);
}

.stat-circle.calories {
  background: rgba(244, 67, 54, 0.45);
}

.stat-circle.height {
  background: rgba(156, 39, 176, 0.4);
}

.stat-value {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
}

.stat-unit {
  font-size: 11px;
  opacity: 0.85;
  margin-top: 4px;
  font-weight: 600;
}

/* Streak Card */
.streak-card {
  background: var(--forgy-card-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 20px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  color: var(--forgy-text-primary);
}

.streak-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.streak-number {
  font-size: 28px;
  font-weight: 800;
  color: var(--ion-color-primary);
}

.streak-label {
  display: block;
  font-size: 13px;
  color: var(--forgy-text-secondary);
  font-weight: 500;
}

.streak-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  background: var(--forgy-input-bg);
  border: 1px solid var(--forgy-border);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

/* Section Card */
.section-card {
  background: var(--forgy-card-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  color: var(--forgy-text-primary);
}

.bmi-card, .rm-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bmi-card:hover, .rm-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

.bmi-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.bmi-label {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.bmi-message {
  margin: 0;
  font-size: 13px;
  color: var(--forgy-text-secondary);
  line-height: 1.4;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--forgy-border);
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.clickable-goal-header {
  cursor: pointer;
}

.clickable-goal-header:hover h3 {
  color: var(--ion-color-primary);
}

.goal-value-badge {
  font-size: 13px;
  font-weight: 700;
  color: var(--forgy-text-secondary);
  background: var(--forgy-input-bg);
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid var(--forgy-border);
}

.section-header h3 {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.section-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--forgy-text-secondary);
}

.section-value.trend-up {
  color: var(--ion-color-danger);
}

.section-value.trend-down {
  color: var(--ion-color-success);
}

/* Enfoque muscular */
.muscle-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.muscle-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.muscle-info-labels {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
}

.muscle-label-name {
  color: var(--forgy-text-primary);
}

.muscle-label-val {
  color: var(--ion-color-primary);
  font-weight: 700;
}

.muscle-progress-bar {
  height: 8px;
  background: var(--forgy-input-bg);
  border-radius: 4px;
  overflow: hidden;
}

.muscle-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ion-color-primary), var(--ion-color-tertiary, var(--ion-color-secondary)));
  border-radius: 4px;
}

/* Ejercicios Frecuentes */
.top-exercises-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.top-exercise-item {
  display: flex;
  align-items: center;
  background: var(--forgy-input-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
}

.top-exercise-rank {
  color: var(--ion-color-primary);
  font-weight: 800;
  margin-right: 12px;
  font-size: 14px;
}

.top-exercise-name {
  flex: 1;
  color: var(--forgy-text-primary);
}

.top-exercise-count {
  color: var(--forgy-text-secondary);
  font-size: 12px;
}

/* Récords de Fuerza */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--forgy-input-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 12px;
  padding: 12px;
}

.record-exercise-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.record-values {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.record-val {
  font-size: 12px;
  font-weight: 600;
  color: var(--forgy-text-primary);
}

/* Water Progress */
.water-progress {
  height: 24px;
  background: var(--forgy-input-bg);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

.water-fill {
  height: 100%;
  background: linear-gradient(90deg, #56ccf2, var(--ion-color-secondary));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.water-text {
  color: white;
  font-size: 11px;
  font-weight: 700;
}

.water-actions {
  display: flex;
  gap: 8px;
}

.water-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: var(--forgy-input-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 12px;
  cursor: pointer;
  color: var(--forgy-text-primary);
  font-weight: 600;
  font-size: 13px;
  transition: background-color 0.2s;
}

.water-btn:active {
  background: rgba(var(--ion-color-secondary-rgb), 0.1);
}

.custom-water-btn {
  background: rgba(var(--ion-color-secondary-rgb), 0.08);
  border-color: rgba(var(--ion-color-secondary-rgb), 0.2);
  color: var(--ion-color-secondary);
}

.custom-water-btn:active {
  background: rgba(var(--ion-color-secondary-rgb), 0.15);
}

.water-status {
  margin-top: 12px;
  font-size: 12px;
  color: var(--forgy-text-secondary);
  font-weight: 500;
}

/* Mini Chart */
.mini-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 100px;
  padding-top: 20px;
}

.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.chart-bar {
  width: 20px;
  background: linear-gradient(180deg, var(--ion-color-primary), var(--ion-color-tertiary));
  border-radius: 6px 6px 0 0;
  min-height: 20px;
  position: relative;
}

.bar-tooltip {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 700;
  color: var(--ion-color-primary);
}

.chart-label {
  margin-top: 8px;
  font-size: 10px;
  color: var(--forgy-text-secondary);
  font-weight: 600;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 20px;
}

.stat-card {
  background: var(--forgy-card-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 16px;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  color: var(--forgy-text-primary);
  text-align: center;
}

.stat-card ion-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.stat-num {
  font-size: 18px;
  font-weight: 800;
}

.stat-label {
  font-size: 10px;
  color: var(--forgy-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Calculadora Botón */
.calc-btn-action {
  --border-radius: 10px;
  --border-width: 1.5px;
  font-weight: 700;
  margin-top: 12px;
  --color: var(--ion-color-primary);
  --border-color: var(--ion-color-primary);
  align-self: flex-start;
}

/* Modal */
.modal-content {
  --background: var(--forgy-content-bg);
}

.workout-modal {
  --border-radius: 24px;
}

.modal-container {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

/* Modal Metrics Grid & Cards */
.metrics-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

@media (min-width: 576px) {
  .metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
}

.metric-card {
  background: var(--forgy-input-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-icon-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

/* Colores específicos de iconos por métrica */
.weight-card .metric-icon-badge {
  background: rgba(156, 39, 176, 0.1);
  color: #9c27b0;
}
.water-card .metric-icon-badge {
  background: rgba(56, 128, 255, 0.1);
  color: #3880ff;
}
.sleep-card .metric-icon-badge {
  background: rgba(255, 196, 9, 0.1);
  color: #ffc409;
}
.kcal-consumed-card .metric-icon-badge {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}
.kcal-burned-card .metric-icon-badge {
  background: rgba(255, 106, 0, 0.1);
  color: #ff6a00;
}

.metric-meta {
  display: flex;
  flex-direction: column;
}

.metric-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.metric-subtitle {
  font-size: 11px;
  color: var(--forgy-text-secondary);
}

.metric-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--forgy-card-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 16px;
  padding: 8px 12px;
}

.value-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  flex: 1;
}

.metric-input {
  width: 90px;
  text-align: center;
  border: none;
  background: transparent;
  font-size: 24px;
  font-weight: 800;
  color: var(--forgy-text-primary);
  outline: none;
}

.metric-input::-webkit-outer-spin-button,
.metric-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.metric-input[type=number] {
  -moz-appearance: textfield;
}

.metric-unit {
  font-size: 14px;
  font-weight: 700;
  color: var(--forgy-text-secondary);
  margin-left: 2px;
}

.control-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--forgy-input-bg);
  border-radius: 50%;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  color: var(--forgy-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
}

.control-btn:active {
  background: var(--forgy-border);
  transform: scale(0.95);
}

.quick-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.quick-btn {
  flex: 1;
  background: var(--forgy-card-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 10px;
  padding: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--forgy-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-btn:active {
  background: var(--forgy-input-bg);
  color: var(--ion-color-primary);
}

/* Calendar Styles */
.calendar-section {
  background: var(--forgy-card-bg);
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--forgy-border);
}

.calendar-header-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.cal-nav-btn {
  --color: var(--ion-color-primary);
  margin: 0;
}

.calendar-month-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--forgy-text-primary);
  text-transform: capitalize;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 12px;
}

.weekday {
  font-size: 11px;
  font-weight: 600;
  color: var(--forgy-text-secondary);
  opacity: 0.7;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  background: var(--forgy-input-bg);
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.calendar-cell:hover {
  background: rgba(var(--ion-color-primary-rgb), 0.08);
}

.calendar-cell:active {
  opacity: 0.8;
}

.calendar-cell.other-month {
  opacity: 0.35;
}

.calendar-cell.selected-day {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-tertiary, var(--ion-color-secondary)));
  box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.35);
}

.calendar-cell.selected-day .day-number {
  color: #ffffff;
  font-weight: 700;
}

.calendar-cell.today-day:not(.selected-day) {
  border: 1px dashed var(--ion-color-primary);
}

.day-number {
  font-size: 13px;
  font-weight: 600;
  color: var(--forgy-text-primary);
}

.data-indicator {
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--ion-color-secondary);
}

.calendar-cell.selected-day .data-indicator {
  background: #ffffff;
}
</style>
