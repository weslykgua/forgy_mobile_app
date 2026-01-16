<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-title>
          <div class="header-title">
            <span class="title-emoji">📊</span>
            <span>Mi Progreso</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openProgressModal">
            <ion-icon :icon="add"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar
        color="primary"
        class="segment-toolbar"
      >
        <ion-segment
          v-model="activeTab"
          mode="ios"
        >
          <ion-segment-button value="today">
            <ion-label>Hoy</ion-label>
          </ion-segment-button>
          <ion-segment-button value="history">
            <ion-label>Historial</ion-label>
          </ion-segment-button>
          <ion-segment-button value="records">
            <ion-label>Records</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher
        slot="fixed"
        @ionRefresh="handleRefresh($event)"
      >
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- TAB: HOY -->
      <div
        v-if="activeTab === 'today'"
        class="tab-content"
      >
        <!-- Tarjeta principal del día -->
        <div class="hero-card">
          <div class="hero-date">{{ todayFormatted }}</div>
          <div class="hero-greeting">{{ getGreeting() }}</div>

          <div class="hero-stats">
            <div
              class="hero-stat"
              @click="openProgressModal"
            >
              <div class="stat-circle weight">
                <ion-icon :icon="scaleOutline"></ion-icon>
              </div>
              <span class="stat-value">{{ todayProgress?.weight || '--' }}</span>
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
              <span class="stat-value">{{ todayProgress?.sleepHours || '--' }}</span>
              <span class="stat-unit">hrs</span>
            </div>
          </div>
        </div>

        <!-- Racha y logros -->
        <div class="streak-card">
          <div class="streak-info">
            <span class="streak-flame">🔥</span>
            <div class="streak-text">
              <span class="streak-number">{{ progressStats.streakDays || 0 }}</span>
              <span class="streak-label">días de racha</span>
            </div>
          </div>
          <div class="streak-badges">
            <span
              class="badge"
              v-if="progressStats.streakDays >= 7"
            >🏅 1 semana</span>
            <span
              class="badge"
              v-if="progressStats.streakDays >= 30"
            >🏆 1 mes</span>
            <span
              class="badge"
              v-if="progressStats.totalWorkouts >= 10"
            >💪 10 entrenos</span>
          </div>
        </div>

        <!-- Hidratación -->
        <div class="section-card">
          <div class="section-header">
            <span class="section-icon">💧</span>
            <h3>Hidratación</h3>
            <span class="section-value">{{ todayProgress?.waterIntake || 0 }} / 3000 ml</span>
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
              <span class="btn-icon">🥤</span>
              <span>+250ml</span>
            </button>
            <button
              class="water-btn"
              @click="addWater(500)"
            >
              <span class="btn-icon">🫗</span>
              <span>+500ml</span>
            </button>
            <button
              class="water-btn"
              @click="addWater(1000)"
            >
              <span class="btn-icon">🍶</span>
              <span>+1L</span>
            </button>
          </div>
        </div>

        <!-- Estado de ánimo -->
        <div class="section-card">
          <div class="section-header">
            <span class="section-icon">😊</span>
            <h3>¿Cómo te sientes?</h3>
          </div>
          <div class="mood-grid">
            <button
              v-for="mood in moods"
              :key="mood.value"
              class="mood-btn"
              :class="{ active: todayProgress?.mood === mood.value }"
              @click="setMood(mood.value)"
            >
              <span class="mood-emoji">{{ mood.emoji }}</span>
              <span class="mood-label">{{ mood.label }}</span>
            </button>
          </div>
        </div>

        <!-- Mini gráfica de peso -->
        <div
          class="section-card"
          v-if="weightHistory.length > 0"
        >
          <div class="section-header">
            <span class="section-icon">📈</span>
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

        <!-- Resumen stats -->
        <div class="stats-row">
          <div class="stat-card">
            <ion-icon
              :icon="barbell"
              color="primary"
            ></ion-icon>
            <span class="stat-num">{{ progressStats.totalWorkouts }}</span>
            <span class="stat-label">Entrenamientos</span>
          </div>
          <div class="stat-card">
            <ion-icon
              :icon="flame"
              color="danger"
            ></ion-icon>
            <span class="stat-num">{{ formatVolume(progressStats.totalVolume) }}</span>
            <span class="stat-label">kg levantados</span>
          </div>
        </div>
      </div>

      <!-- TAB: HISTORIAL -->
      <div
        v-if="activeTab === 'history'"
        class="tab-content"
      >
        <div
          v-if="workoutHistory.length === 0"
          class="empty-history"
        >
          <div class="empty-icon">📅</div>
          <h3>Sin historial</h3>
          <p>Registra tus entrenamientos para ver tu progreso</p>
        </div>

        <div
          v-else
          class="history-list"
        >
          <div
            v-for="day in workoutHistory"
            :key="day.date"
            class="history-day"
          >
            <div class="day-header">
              <div class="day-date">
                <span class="day-name">{{ formatDayName(day.date) }}</span>
                <span class="day-full">{{ formatFullDate(day.date) }}</span>
              </div>
              <div class="day-stats">
                <span class="day-stat">
                  <ion-icon :icon="barbell"></ion-icon>
                  {{ day.exerciseCount }} ejercicios
                </span>
                <span class="day-stat">
                  <ion-icon :icon="fitness"></ion-icon>
                  {{ day.totalVolume }} kg
                </span>
              </div>
            </div>
            <div class="day-workouts">
              <div
                v-for="workout in day.workouts"
                :key="workout.id"
                class="workout-item"
              >
                <span class="workout-name">{{ workout.exerciseName }}</span>
                <div class="workout-sets">
                  <span
                    v-for="(set, idx) in workout.sets.slice(0, 3)"
                    :key="idx"
                    class="set-tag"
                  >
                    {{ set.reps }}×{{ set.weight }}kg
                  </span>
                  <span
                    v-if="workout.sets.length > 3"
                    class="more-tag"
                  >+{{ workout.sets.length - 3 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: RECORDS -->
      <div
        v-if="activeTab === 'records'"
        class="tab-content"
      >
        <div
          v-if="personalRecords.length === 0"
          class="empty-history"
        >
          <div class="empty-icon">🏆</div>
          <h3>Sin records</h3>
          <p>Completa entrenamientos para registrar tus PRs</p>
        </div>

        <div
          v-else
          class="records-list"
        >
          <div class="records-header">
            <span class="header-icon">🏆</span>
            <h2>Records Personales</h2>
            <p>Tu mejor rendimiento en cada ejercicio</p>
          </div>

          <div
            v-for="(pr, idx) in personalRecords"
            :key="pr.exerciseName"
            class="pr-card"
          >
            <div class="pr-rank">{{ idx + 1 }}</div>
            <div class="pr-info">
              <span class="pr-name">{{ pr.exerciseName }}</span>
              <span class="pr-date">{{ formatFullDate(pr.date) }}</span>
            </div>
            <div class="pr-weight">
              <span class="pr-value">{{ pr.maxWeight }}</span>
              <span class="pr-unit">kg</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Progreso -->
      <ion-modal
        :is-open="isProgressModalOpen"
        @didDismiss="isProgressModalOpen = false"
      >
        <ion-header>
          <ion-toolbar color="primary">
            <ion-buttons slot="start">
              <ion-button @click="isProgressModalOpen = false">Cancelar</ion-button>
            </ion-buttons>
            <ion-title>Registrar Hoy</ion-title>
            <ion-buttons slot="end">
              <ion-button
                strong
                @click="saveProgress"
              >Guardar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="modal-content">
          <div class="form-section">
            <div class="form-row">
              <label>
                <span class="form-icon">⚖️</span>
                Peso (kg)
              </label>
              <div class="number-control">
                <button @click="progressForm.weight = Math.max(0, progressForm.weight - 0.5)">−</button>
                <input
                  type="number"
                  v-model.number="progressForm.weight"
                  step="0.1"
                />
                <button @click="progressForm.weight += 0.5">+</button>
              </div>
            </div>
            <div class="form-row">
              <label>
                <span class="form-icon">💧</span>
                Agua (ml)
              </label>
              <div class="number-control">
                <button @click="progressForm.waterIntake = Math.max(0, progressForm.waterIntake - 250)">−</button>
                <input
                  type="number"
                  v-model.number="progressForm.waterIntake"
                  step="100"
                />
                <button @click="progressForm.waterIntake += 250">+</button>
              </div>
            </div>
            <div class="form-row">
              <label>
                <span class="form-icon">😴</span>
                Horas de sueño
              </label>
              <div class="number-control">
                <button @click="progressForm.sleepHours = Math.max(0, progressForm.sleepHours - 0.5)">−</button>
                <input
                  type="number"
                  v-model.number="progressForm.sleepHours"
                  step="0.5"
                />
                <button @click="progressForm.sleepHours += 0.5">+</button>
              </div>
            </div>
            <div class="form-row">
              <label>
                <span class="form-icon">🍽️</span>
                Calorías consumidas
              </label>
              <div class="number-control">
                <button
                  @click="progressForm.caloriesConsumed = Math.max(0, progressForm.caloriesConsumed - 100)">−</button>
                <input
                  type="number"
                  v-model.number="progressForm.caloriesConsumed"
                  step="50"
                />
                <button @click="progressForm.caloriesConsumed += 100">+</button>
              </div>
            </div>
          </div>
          <div class="form-section">
            <label class="notes-label">📝 Notas del día</label>
            <textarea
              v-model="progressForm.notes"
              placeholder="¿Cómo te sentiste hoy?"
            ></textarea>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonSegment, IonSegmentButton,
  IonLabel, IonModal, IonRefresher, IonRefresherContent,
  onIonViewWillEnter, toastController
} from '@ionic/vue';
import { ref, computed } from 'vue';
import {
  add, scaleOutline, waterOutline, moonOutline, barbell, flame, fitness
} from 'ionicons/icons';

const API_URL = 'http://localhost:3000';

interface DailyProgress {
  id: string;
  date: string;
  weight: number;
  waterIntake: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  sleepHours: number;
  mood: string;
  notes: string;
}

interface ProgressStats {
  totalWorkouts: number;
  totalVolume: number;
  avgWater: number;
  weightHistory: { date: string; weight: number }[];
  currentWeight: number;
  streakDays: number;
}

interface WorkoutHistory {
  date: string;
  exerciseCount: number;
  totalVolume: number;
  totalDuration: number;
  workouts: any[];
}

interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
  maxVolume: number;
  date: string;
}

const activeTab = ref('today');
const progressData = ref<DailyProgress[]>([]);
const progressStats = ref<ProgressStats>({
  totalWorkouts: 0, totalVolume: 0, avgWater: 0, weightHistory: [], currentWeight: 0, streakDays: 0
});
const workoutHistory = ref<WorkoutHistory[]>([]);
const personalRecords = ref<PersonalRecord[]>([]);
const isProgressModalOpen = ref(false);
const today = new Date().toISOString().split('T')[0];

const progressForm = ref({
  weight: 0, waterIntake: 0, caloriesConsumed: 0, caloriesBurned: 0, sleepHours: 0, notes: ''
});

const moods = [
  { value: 'Excelente', emoji: '😄', label: 'Genial' },
  { value: 'Bien', emoji: '🙂', label: 'Bien' },
  { value: 'Regular', emoji: '😐', label: 'Meh' },
  { value: 'Mal', emoji: '😔', label: 'Mal' }
];

const todayFormatted = computed(() => new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
const todayProgress = computed(() => progressData.value.find(p => p.date === today));
const waterPercentage = computed(() => Math.min(((todayProgress.value?.waterIntake || 0) / 3000) * 100, 100));
const weightHistory = computed(() => progressStats.value.weightHistory.slice(-7));
const weightChange = computed(() => {
  if (weightHistory.value.length < 2) return 0;
  return Number((weightHistory.value[weightHistory.value.length - 1].weight - weightHistory.value[0].weight).toFixed(1));
});
const weightTrend = computed(() => weightChange.value > 0 ? 'trend-up' : weightChange.value < 0 ? 'trend-down' : '');

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '¡Buenos días! ☀️';
  if (hour < 18) return '¡Buenas tardes! 🌤️';
  return '¡Buenas noches! 🌙';
}

function formatWater(ml: number) { return (ml / 1000).toFixed(1); }
function formatVolume(vol: number) { return vol >= 1000 ? (vol / 1000).toFixed(1) + 'k' : vol.toString(); }
function formatShortDate(dateStr: string) { return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric' }); }
function formatDayName(dateStr: string) { return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long' }); }
function formatFullDate(dateStr: string) { return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }); }

function getBarHeight(weight: number) {
  const weights = weightHistory.value.map(w => w.weight);
  if (weights.length === 0) return 50;
  const min = Math.min(...weights) - 2;
  const max = Math.max(...weights) + 2;
  return Math.max(20, ((weight - min) / (max - min)) * 100);
}

async function loadAllData() {
  try {
    const [progressRes, statsRes, historyRes, prsRes] = await Promise.all([
      fetch(`${API_URL}/progress`),
      fetch(`${API_URL}/progress/stats`),
      fetch(`${API_URL}/workouts/history`),
      fetch(`${API_URL}/workouts/prs`)
    ]);
    progressData.value = await progressRes.json();
    progressStats.value = await statsRes.json();
    workoutHistory.value = await historyRes.json();
    personalRecords.value = await prsRes.json();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function openProgressModal() {
  const tp = todayProgress.value;
  progressForm.value = {
    weight: tp?.weight || progressStats.value.currentWeight || 70,
    waterIntake: tp?.waterIntake || 0,
    caloriesConsumed: tp?.caloriesConsumed || 0,
    caloriesBurned: tp?.caloriesBurned || 0,
    sleepHours: tp?.sleepHours || 7,
    notes: tp?.notes || ''
  };
  isProgressModalOpen.value = true;
}

async function saveProgress() {
  try {
    await fetch(`${API_URL}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, ...progressForm.value, mood: todayProgress.value?.mood || 'Bien' })
    });
    showToast('¡Progreso guardado! 💪');
    isProgressModalOpen.value = false;
    loadAllData();
  } catch (error) {
    showToast('Error al guardar', 'danger');
  }
}

async function addWater(amount: number) {
  try {
    await fetch(`${API_URL}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: today,
        waterIntake: (todayProgress.value?.waterIntake || 0) + amount,
        weight: todayProgress.value?.weight || 0,
        mood: todayProgress.value?.mood || 'Bien'
      })
    });
    showToast(`+${amount}ml 💧`);
    loadAllData();
  } catch (error) {
    showToast('Error', 'danger');
  }
}

async function setMood(mood: string) {
  try {
    await fetch(`${API_URL}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: today, mood,
        weight: todayProgress.value?.weight || 0,
        waterIntake: todayProgress.value?.waterIntake || 0
      })
    });
    loadAllData();
  } catch (error) {
    console.error(error);
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

onIonViewWillEnter(() => loadAllData());
</script>

<style scoped>
.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-emoji {
  font-size: 22px;
}

.segment-toolbar {
  --padding-bottom: 8px;
}

.segment-toolbar ion-segment {
  --background: rgba(255, 255, 255, 0.15);
}

.tab-content {
  padding: 16px;
  padding-bottom: 100px;
}

/* Hero Card */
.hero-card {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-tertiary));
  border-radius: 24px;
  padding: 24px;
  color: white;
  margin-bottom: 16px;
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
}

.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: background 0.2s;
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
}

.stat-circle.weight {
  background: rgba(255, 255, 255, 0.2);
}

.stat-circle.water {
  background: rgba(56, 128, 255, 0.4);
}

.stat-circle.sleep {
  background: rgba(255, 196, 9, 0.4);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.stat-unit {
  font-size: 12px;
  opacity: 0.8;
}

/* Streak Card */
.streak-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.streak-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.streak-flame {
  font-size: 36px;
}

.streak-number {
  font-size: 32px;
  font-weight: 800;
  color: var(--ion-color-primary);
}

.streak-label {
  display: block;
  font-size: 13px;
  color: var(--ion-color-medium);
}

.streak-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  background: var(--ion-color-light);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
}

/* Section Card */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-icon {
  font-size: 20px;
}

.section-header h3 {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.section-value {
  font-size: 13px;
  color: var(--ion-color-medium);
}

.section-value.trend-up {
  color: var(--ion-color-danger);
}

.section-value.trend-down {
  color: var(--ion-color-success);
}

/* Water Progress */
.water-progress {
  height: 24px;
  background: var(--ion-color-light);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}

.water-fill {
  height: 100%;
  background: linear-gradient(90deg, #56CCF2, #2F80ED);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  transition: width 0.5s ease;
}

.water-text {
  color: white;
  font-size: 11px;
  font-weight: 600;
}

.water-actions {
  display: flex;
  gap: 8px;
}

.water-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: var(--ion-color-light);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.water-btn:active {
  transform: scale(0.95);
  background: var(--ion-color-primary-tint);
}

.btn-icon {
  font-size: 20px;
}

.water-btn span:last-child {
  font-size: 12px;
  font-weight: 600;
}

/* Mood */
.mood-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.mood-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: var(--ion-color-light);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.mood-btn.active {
  background: var(--ion-color-primary-tint);
  border-color: var(--ion-color-primary);
  transform: scale(1.05);
}

.mood-emoji {
  font-size: 28px;
}

.mood-label {
  font-size: 11px;
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
  border-radius: 4px 4px 0 0;
  min-height: 20px;
  position: relative;
  transition: height 0.5s;
}

.bar-tooltip {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.chart-label {
  margin-top: 6px;
  font-size: 10px;
  color: var(--ion-color-medium);
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.stat-card ion-icon {
  font-size: 28px;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  color: var(--ion-color-medium);
}

/* History */
.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-history h3 {
  margin: 0 0 8px;
  font-size: 20px;
}

.empty-history p {
  margin: 0;
  color: var(--ion-color-medium);
}

.history-day {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ion-color-light);
}

.day-name {
  display: block;
  font-weight: 700;
  font-size: 16px;
  text-transform: capitalize;
}

.day-full {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.day-stats {
  display: flex;
  gap: 12px;
}

.day-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--ion-color-medium);
}

.workout-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.workout-name {
  font-weight: 500;
  font-size: 14px;
}

.workout-sets {
  display: flex;
  gap: 4px;
}

.set-tag {
  background: var(--ion-color-light);
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
}

.more-tag {
  color: var(--ion-color-medium);
  font-size: 11px;
}

/* Records */
.records-header {
  text-align: center;
  margin-bottom: 24px;
}

.header-icon {
  font-size: 48px;
}

.records-header h2 {
  margin: 8px 0 4px;
  font-size: 24px;
}

.records-header p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 14px;
}

.pr-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.pr-rank {
  width: 36px;
  height: 36px;
  background: var(--ion-color-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.pr-card:first-child .pr-rank {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
}

.pr-card:nth-child(2) .pr-rank {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
  color: white;
}

.pr-card:nth-child(3) .pr-rank {
  background: linear-gradient(135deg, #CD7F32, #A0522D);
  color: white;
}

.pr-info {
  flex: 1;
}

.pr-name {
  display: block;
  font-weight: 600;
  font-size: 15px;
}

.pr-date {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.pr-weight {
  text-align: right;
}

.pr-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--ion-color-primary);
}

.pr-unit {
  font-size: 14px;
  color: var(--ion-color-medium);
}

/* Modal */
.modal-content {
  --background: var(--ion-color-light);
}

.form-section {
  background: white;
  margin: 16px;
  border-radius: 16px;
  padding: 8px 16px;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--ion-color-light);
}

.form-row:last-child {
  border-bottom: none;
}

.form-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.form-icon {
  font-size: 20px;
}

.number-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.number-control button {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--ion-color-light);
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
}

.number-control input {
  width: 70px;
  text-align: center;
  border: none;
  background: transparent;
  font-size: 18px;
  font-weight: 600;
}

.notes-label {
  display: block;
  padding: 12px 0;
  font-weight: 500;
}

.form-section textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid var(--ion-color-light);
  border-radius: 12px;
  padding: 12px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
}
</style>
