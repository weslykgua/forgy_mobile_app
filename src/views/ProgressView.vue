<template>
  <ion-page>
    <!-- Header de la sección de Progreso con clase Forgy -->
    <ion-header class="forgy-header">
      <ion-toolbar>
        <ion-title class="forgy-title">
          Mi Progreso
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

      <div class="progress-container">
        <!-- Tarjeta principal del día -->
        <div class="hero-card">
          <div class="hero-date">{{ formattedSelectedDate }}</div>
          <div class="hero-greeting">{{ getGreeting() }}</div>

          <div class="hero-stats">
            <div
              class="hero-stat"
              @click="openEditModal('weight')"
            >
              <div class="stat-circle weight">
                <ion-icon :icon="scaleOutline"></ion-icon>
              </div>
              <span class="stat-value">{{ displayWeight ?? '--' }}</span>
              <span class="stat-unit">kg</span>
            </div>
            <div
              class="hero-stat"
              @click="addCustomWater"
            >
              <div class="stat-circle water">
                <ion-icon :icon="waterOutline"></ion-icon>
              </div>
              <span class="stat-value">{{ formatWater(todayProgress?.waterIntake || 0) }}</span>
              <span class="stat-unit">L</span>
            </div>
            <div
              class="hero-stat"
              @click="openEditModal('sleep')"
            >
              <div class="stat-circle sleep">
                <ion-icon :icon="moonOutline"></ion-icon>
              </div>
              <span class="stat-value">{{ todayProgress?.sleepHours ?? '--' }}</span>
              <span class="stat-unit">hrs</span>
            </div>
            <div
              class="hero-stat"
              @click="openEditModal('calories')"
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
            <ion-button size="small" fill="clear" class="btn-quick-water" @click="addWater(250)">+250ml</ion-button>
            <ion-button size="small" fill="clear" class="btn-quick-water" @click="addWater(500)">+500ml</ion-button>
            <ion-button size="small" fill="clear" class="btn-quick-water" @click="addWater(1000)">+1.0L</ion-button>
            <ion-button size="small" fill="clear" class="btn-quick-water btn-quick-water-custom" @click="addCustomWater">+ Otro</ion-button>
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

      <!-- Modal de Registro de Métrica Reutilizable -->
      <DashboardMetricModal
        :type="activeModal"
        v-model:inputValue="modalInputValue"
        v-model:bedtime="bedtime"
        v-model:waketime="waketime"
        v-model:sleepQuality="sleepQualityInModal"
        :isSaving="isSaving"
        :error="modalError"
        @close="closeEditModal"
        @save="saveModalMetric"
        @sync-smartwatch="syncSmartwatchSleep"
        @calculate-sleep="calculateSleepHoursFromTimes"
        @apply-preset="applyPresetHours($event)"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonRefresher, IonRefresherContent,
  onIonViewWillEnter, useIonRouter
} from '@ionic/vue';
import { useProgress } from '../composables/useProgress';
import DashboardMetricModal from '../components/DashboardMetricModal.vue';
import {
  add, scaleOutline, waterOutline, moonOutline, nutritionOutline, barbell, flame,
  chevronBack, chevronForward, statsChartOutline
} from 'ionicons/icons';

const router = useIonRouter();
const {
  progressData,
  progressStats,
  waterGoal,
  selectedDate,
  currentYear,
  currentMonth,
  monthNames,
  today,
  formattedSelectedDate,
  calendarDays,
  todayProgress,
  displayWeight,
  waterPercentage,
  waterStatusMessage,
  weightHistory,
  weightChange,
  weightTrend,
  caloricBalance,
  topExercises,
  muscleDistribution,
  cumulativeVolume,
  totalSessionsCount,
  formattedRecordsList,
  getGreeting,
  formatWater,
  formatVolume,
  formatShortDate,
  getBarHeight,
  loadAllData,
  selectDate,
  prevMonth,
  nextMonth,
  addWater,
  changeWaterGoal,
  addCustomWater,

  // Modal bindings
  activeModal,
  modalInputValue,
  modalError,
  isSaving,
  bedtime,
  waketime,
  sleepQualityInModal,
  openEditModal,
  closeEditModal,
  saveModalMetric,
  calculateSleepHoursFromTimes,
  applyPresetHours,
  syncSmartwatchSleep
} = useProgress();

function goToRmCalculator() {
  router.push('/tabs/rm');
}

async function handleRefresh(event: CustomEvent) {
  await loadAllData();
  (event.target as any).complete();
}

onIonViewWillEnter(() => {
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

.rm-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.rm-card:hover {
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
