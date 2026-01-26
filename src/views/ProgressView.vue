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
              <span class="stat-value">{{ todayProgress?.weight ?? '--' }}</span>
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
              <span class="stat-value">{{ todayProgress?.caloriesConsumed ?? '--' }}</span>
              <span class="stat-unit">kcal</span>
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
            <span class="section-value">{{ todayProgress?.waterIntake || 0 }} / 5000 ml</span>
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
          <p class="water-status">{{ waterStatusMessage }}</p>
        </div>

        <!-- Calculadora IMC -->
        <div class="section-card bmi-card" @click="goToBmiTest">
          <div class="section-header">
            <span class="section-icon">⚖️</span>
            <h3>Calculadora de IMC</h3>
            <span class="section-value" v-if="bmiValue">{{ bmiValue }}</span>
          </div>
          <div class="bmi-body">
            <p class="bmi-label">{{ bmiLabel || 'Sin datos aún' }}</p>
            <p class="bmi-message">{{ bmiMessage }}</p>
            <ion-button size="small" fill="outline">Hacer test</ion-button>
          </div>
        </div>

        <!-- Calculadora RM -->
        <div class="section-card rm-card" @click="goToRmCalculator">
          <div class="section-header">
            <span class="section-icon">🏋️</span>
            <h3>Calculadora de RM</h3>
          </div>
          <div class="bmi-body">
            <p class="bmi-label">Calcula tu 1RM estimada</p>
            <p class="bmi-message">Sirve para estimar tu máximo de 1 repetición según el peso y repeticiones que haces.</p>
            <ion-button size="small" fill="outline">Abrir calculadora</ion-button>
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
          v-if="weeklyHistory.length === 0"
          class="empty-history"
        >
          <div class="empty-icon">📅</div>
          <h3>Sin historial</h3>
          <p>Registra tu progreso diario para verlo aquí</p>
        </div>

        <div
          v-else
          class="history-list"
        >
          <div
            v-for="day in weeklyHistory"
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
                  <ion-icon :icon="scaleOutline"></ion-icon>
                  {{ day.weight ?? '--' }} kg
                </span>
                <span class="day-stat">
                  <ion-icon :icon="waterOutline"></ion-icon>
                  {{ formatWater(day.waterIntake || 0) }} L
                </span>
              </div>
            </div>
            <div class="day-workouts metrics-grid">
              <div class="metric-chip">
                <span class="metric-label">Sueño</span>
                <span class="metric-value">{{ day.sleepHours ?? '--' }} hrs</span>
              </div>
              <div class="metric-chip">
                <span class="metric-label">Calorías</span>
                <span class="metric-value">{{ day.caloriesConsumed ?? '--' }} kcal</span>
              </div>
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
  onIonViewWillEnter, toastController, useIonRouter
} from '@ionic/vue';
import { ref, computed } from 'vue';
import {
  add, scaleOutline, waterOutline, moonOutline, nutritionOutline, barbell, flame
} from 'ionicons/icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
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

const activeTab = ref('today');
const progressData = ref<DailyProgress[]>([]);
const progressStats = ref<ProgressStats>({
  totalWorkouts: 0, totalVolume: 0, avgWater: 0, weightHistory: [], currentWeight: 0, streakDays: 0
});
const isProgressModalOpen = ref(false);
const userProfile = ref<UserProfile>({});
const today = new Date().toISOString().split('T')[0];

const progressForm = ref({
  weight: 0, waterIntake: 0, caloriesConsumed: 0, caloriesBurned: 0, sleepHours: 0
});

const todayFormatted = computed(() => new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
const todayProgress = computed(() => progressData.value.find(p => p.date === today));
const waterPercentage = computed(() => Math.min(((todayProgress.value?.waterIntake || 0) / 5000) * 100, 100));
const waterStatusMessage = computed(() => {
  const intake = todayProgress.value?.waterIntake || 0;
  if (intake >= 5000) return '¡Excelente! Hidratación completa hoy 💧';
  if (intake >= 2000) return 'Vas bien: hidratación normal 👌';
  if (intake >= 1000) return 'Vas a mitad: toma un poco más 🚰';
  return 'Hidratación baja: suma más agua hoy 🥤';
});
const weightHistory = computed(() => progressStats.value.weightHistory.slice(-7));
const weightChange = computed(() => {
  if (weightHistory.value.length < 2) return 0;
  return Number((weightHistory.value[weightHistory.value.length - 1].weight - weightHistory.value[0].weight).toFixed(1));
});
const weightTrend = computed(() => weightChange.value > 0 ? 'trend-up' : weightChange.value < 0 ? 'trend-down' : '');
const weeklyHistory = computed(() => {
  const { start, end } = getWeekRange();
  return progressData.value
    .filter((item) => {
      const itemDate = new Date(item.date + 'T12:00:00');
      return itemDate >= start && itemDate <= end;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
});

const bmiValue = computed(() => {
  const height = userProfile.value.height;
  const weight = todayProgress.value?.weight ?? userProfile.value.weight ?? progressStats.value.currentWeight;
  if (!height || !weight) return '';
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  return bmi.toFixed(1);
});

const bmiLabel = computed(() => {
  const value = Number(bmiValue.value);
  if (!value) return '';
  if (value < 18.5) return 'Bajo peso';
  if (value < 25) return 'Peso normal';
  if (value < 30) return 'Sobrepeso';
  return 'Obesidad';
});

const bmiMessage = computed(() => {
  const value = Number(bmiValue.value);
  if (!value) return 'Ingresa tus datos para calcular tu IMC.';
  if (value < 18.5) return 'Un poco más de energía y nutrición te ayudará a sentirte mejor.';
  if (value < 25) return 'Buen rango. Mantén tus hábitos saludables.';
  if (value < 30) return 'Vas bien: con constancia puedes mejorar tu bienestar.';
  return 'No estás solo: con pasos pequeños y constancia puedes mejorar.';
});

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return '¡Buenos días! ☀️';
  if (hour < 18) return '¡Buenas tardes! 🌤️';
  return '¡Buenas noches! 🌙';
}

function getWeekRange(baseDate = new Date()) {
  const start = new Date(baseDate);
  const day = start.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function toDateKey(value: string) {
  if (!value) return value;
  return value.includes('T') ? value.split('T')[0] : value;
}

function getAuthHeaders() {
  const token = localStorage.getItem('forgy_token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function formatWater(ml: number) { return (ml / 1000).toFixed(1); }
function formatVolume(vol: number | undefined | null) {
  if (vol === undefined || vol === null) return '0';
  return vol >= 1000 ? (vol / 1000).toFixed(1) + 'k' : vol.toString();
}
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
    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      return;
    }

    const [progressRes, statsRes, profileRes] = await Promise.all([
      fetch(`${API_URL}/progress`, { headers }),
      fetch(`${API_URL}/progress/stats`, { headers }),
      fetch(`${API_URL}/user/profile`, { headers })
    ]);

    const progressJson = await progressRes.json();
    progressData.value = Array.isArray(progressJson)
      ? progressJson.map((item: any) => ({ ...item, date: toDateKey(item.date) }))
      : [];
    progressStats.value = await statsRes.json();
    userProfile.value = await profileRes.json();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function goToBmiTest() {
  router.push('/tabs/bmi');
}

function goToRmCalculator() {
  router.push('/tabs/rm');
}

function openProgressModal() {
  const tp = todayProgress.value;
  progressForm.value = {
    weight: tp?.weight || progressStats.value.currentWeight || 70,
    waterIntake: tp?.waterIntake || 0,
    caloriesConsumed: tp?.caloriesConsumed || 0,
    caloriesBurned: tp?.caloriesBurned || 0,
    sleepHours: tp?.sleepHours || 7
  };
  isProgressModalOpen.value = true;
}

async function saveProgress() {
  try {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      showToast('Inicia sesión para guardar', 'danger');
      return;
    }

    await fetch(`${API_URL}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ date: today, ...progressForm.value })
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
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      showToast('Inicia sesión para guardar', 'danger');
      return;
    }

    await fetch(`${API_URL}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        date: today,
        waterIntake: (todayProgress.value?.waterIntake || 0) + amount,
        weight: todayProgress.value?.weight || 0
      })
    });
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

.stat-circle.calories {
  background: rgba(244, 67, 54, 0.35);
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
  background: var(--forgy-card-bg);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  color: var(--forgy-text-primary);
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
  color: var(--forgy-text-secondary);
}

.streak-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  background: var(--forgy-input-bg);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  color: var(--forgy-text-primary);
}

/* Section Card */
.section-card {
  background: var(--forgy-card-bg);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  color: var(--forgy-text-primary);
}

.bmi-card {
  cursor: pointer;
}

.rm-card {
  cursor: pointer;
}

.bmi-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bmi-label {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.bmi-message {
  margin: 0;
  font-size: 12px;
  color: var(--forgy-text-secondary);
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
  color: var(--forgy-text-secondary);
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
  background: var(--forgy-input-bg);
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
  background: var(--forgy-input-bg);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--forgy-text-primary);
}

.water-btn:active {
  background: var(--ion-color-primary-tint);
}

.btn-icon {
  font-size: 20px;
}

.water-btn span:last-child {
  font-size: 12px;
  font-weight: 600;
}

.water-status {
  margin-top: 10px;
  font-size: 12px;
  color: var(--forgy-text-secondary);
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
  color: var(--forgy-text-secondary);
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-card {
  background: var(--forgy-card-bg);
  border-radius: 16px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  color: var(--forgy-text-primary);
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
  color: var(--forgy-text-secondary);
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
  color: var(--forgy-text-primary);
}

.empty-history p {
  margin: 0;
  color: var(--forgy-text-secondary);
}

.history-day {
  background: var(--forgy-card-bg);
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
  border-bottom: 1px solid var(--forgy-border);
}

.day-name {
  display: block;
  font-weight: 700;
  font-size: 16px;
  text-transform: capitalize;
  color: var(--forgy-text-primary);
}

.day-full {
  font-size: 12px;
  color: var(--forgy-text-secondary);
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
  color: var(--forgy-text-secondary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.metric-chip {
  background: var(--forgy-input-bg);
  padding: 10px 12px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: 12px;
  color: var(--forgy-text-secondary);
}

.metric-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--forgy-text-primary);
}

/* Modal */
.modal-content {
  --background: var(--forgy-content-bg);
}

.form-section {
  background: var(--forgy-card-bg);
  margin: 16px;
  border-radius: 16px;
  padding: 8px 16px;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--forgy-border);
}

.form-row:last-child {
  border-bottom: none;
}

.form-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--forgy-text-primary);
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
  background: var(--forgy-input-bg);
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  color: var(--forgy-text-primary);
}

.number-control input {
  width: 70px;
  text-align: center;
  border: none;
  background: transparent;
  font-size: 18px;
  font-weight: 600;
  color: var(--forgy-text-primary);
}

</style>
