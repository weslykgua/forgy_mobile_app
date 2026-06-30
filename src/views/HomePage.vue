<script setup lang="ts">
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon,
    onIonViewWillEnter, useIonRouter
} from '@ionic/vue';
import { useProfile } from '../utils/useProfile';
import { useDashboard } from '../composables/useDashboard';
import DashboardMetricModal from '../components/DashboardMetricModal.vue';
import { SLEEP_QUALITY_LABELS, STRESS_LABELS, ENERGY_LABELS, SORENESS_LABELS } from '@/constants/calendar';
import {
    flame, water, barbell, scaleOutline, resizeOutline,
    moonOutline, nutritionOutline, pencilOutline, addOutline,
    bookOutline, flameOutline, waterOutline, barbellOutline,
    trophyOutline, ribbonOutline, flashOutline, heartOutline, speedometerOutline,
    statsChartOutline, shieldCheckmarkOutline, fitnessOutline, alertCircleOutline,
    bodyOutline, timeOutline, chevronBack, chevronForward, pulseOutline
} from 'ionicons/icons';

const router = useIonRouter();
const { userName, loadProfileData } = useProfile();
const {
    metrics,
    todayProgress,
    userProfile,
    userPlan,
    workoutHistory,
    personalRecords,
    currentDate,
    isHealthDeviceConnected,
    bedtime,
    waketime,
    sleepQualityInModal,
    timeSlots,
    sleepQualityOptions,
    currentQuote,
    streakOffset,
    waterOffset,
    workoutsOffset,
    waterStreak,
    formattedCurrentDate,
    summary,
    levelProgressPercent,
    achievements,
    waterPercent,
    activeModal,
    modalInputValue,
    modalError,
    isSaving,
    changeHomeDate,
    resetHomeDate,
    addWater,
    updateProfileData,
    saveProgressField,
    loadMetrics,
    checkDeviceConnection,
    syncSmartwatchSleep,
    getGreeting,
    getTimeEmoji,
    calculateSleepHoursFromTimes,
    applyPresetHours,
    openEditModal,
    closeEditModal,
    saveModalMetric,
    userLevel,
    currentXP,
    nextLevelXP
} = useDashboard();

onIonViewWillEnter(() => {
    checkDeviceConnection();
    loadProfileData();
    loadMetrics();
});

// Navigation
function goToWorkout() {
    router.push('/tabs/train');
}
function goToProgress() {
    router.push('/tabs/progress');
}
function goToExercises() {
    router.push('/tabs/exercises');
}
function formatWater(ml: number | null | undefined) {
    if (!ml) return '0.0';
    return (ml / 1000).toFixed(1);
}
const getSleepQualityLabel = (score: string | number | null) => {
    if (score === null || score === undefined) return '--';
    const num = typeof score === 'string' ? parseInt(score) : score;
    return SLEEP_QUALITY_LABELS[num - 1] || '--';
};
const getStressLabel = (score: number | null) => {
    if (!score) return '--';
    return STRESS_LABELS[score - 1] || '--';
};
const getEnergyLabel = (score: number | null) => {
    if (!score) return '--';
    return ENERGY_LABELS[score - 1] || '--';
};
const getSorenessLabel = (score: number | null) => {
    if (!score) return '--';
    return SORENESS_LABELS[score - 1] || '--';
};
const editWeight = () => openEditModal('weight');
</script>
<template>
    <ion-page>
        <ion-header class="forgy-header">
            <ion-toolbar>
                <ion-title class="forgy-title">
                    FORGY
                </ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content
            :fullscreen="true"
            class="home-content"
        >
            <!-- Date Switcher Banner (Below Header) -->
            <div class="home-date-switcher-container">
                <div class="header-date-switcher">
                    <ion-button fill="clear" size="small" class="date-nav-btn" @click="changeHomeDate(-1)">
                        <ion-icon :icon="chevronBack" slot="icon-only"></ion-icon>
                    </ion-button>
                    <span class="header-date-title" @click="resetHomeDate">
                        {{ formattedCurrentDate }}
                    </span>
                    <ion-button fill="clear" size="small" class="date-nav-btn" @click="changeHomeDate(1)">
                        <ion-icon :icon="chevronForward" slot="icon-only"></ion-icon>
                    </ion-button>
                </div>
            </div>
            <div class="hero-section">
                <div class="hero-content">
                    <div class="greeting-section">
                        <div class="greeting-text">
                            <span class="greeting-time">{{ getGreeting() }}</span>
                            <span class="greeting-name">{{ userName }}</span>
                        </div>
                    </div>

                    <div
                        class="motivation-card"
                    >
                        <p class="quote-text">"{{ currentQuote.text }}"</p>
                        <span class="quote-author">— {{ currentQuote.author }}</span>
                    </div>
                </div>
            </div>

            <div
                class="quick-stats"
                v-if="metrics"
            >
                <div
                    class="stat-ring"
                    @click="goToProgress"
                >
                    <svg
                        viewBox="0 0 100 100"
                        class="ring-svg"
                    >
                        <circle
                            cx="50"
                            cy="50"
                            r="46"
                            class="ring-bg"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="46"
                            class="ring-progress"
                            :style="{ strokeDashoffset: streakOffset }"
                        />
                    </svg>
                    <div class="ring-content">
                        <span class="ring-value">{{ metrics.currentStreak }}</span>
                        <span class="ring-label">días</span>
                    </div>
                    <span class="ring-title">Racha</span>
                </div>

                <div
                    class="stat-ring"
                    @click="goToProgress"
                >
                    <svg
                        viewBox="0 0 100 100"
                        class="ring-svg"
                    >
                        <circle
                            cx="50"
                            cy="50"
                            r="46"
                            class="ring-bg"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="46"
                            class="ring-progress water"
                            :style="{ strokeDashoffset: waterOffset }"
                        />
                    </svg>
                    <div class="ring-content">
                        <span class="ring-value">{{ formatWater(summary.water) }}</span>
                        <span class="ring-label">L</span>
                    </div>
                    <span class="ring-title">Agua</span>
                </div>

                <div
                    class="stat-ring"
                    @click="goToWorkout"
                >
                    <svg
                        viewBox="0 0 100 100"
                        class="ring-svg"
                    >
                        <circle
                            cx="50"
                            cy="50"
                            r="46"
                            class="ring-bg"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="46"
                            class="ring-progress workouts"
                            :style="{ strokeDashoffset: workoutsOffset }"
                        />
                    </svg>
                    <div class="ring-content">
                        <span class="ring-value">{{ metrics.totalWorkouts }}</span>
                        <span class="ring-label">total</span>
                    </div>
                    <span class="ring-title">Entrenos</span>
                </div>
            </div>

            <!-- Quick Actions (Acciones rápidas - Seccion 3) -->
            <div class="section-container">
                <div class="section-title">
                    <span>Acciones rápidas</span>
                </div>

                <div class="quick-actions">
                    <div
                        class="action-card"
                        @click="goToWorkout"
                    >
                        <ion-icon :icon="barbellOutline" class="action-icon"></ion-icon>
                        <span class="action-label">Nuevo entreno</span>
                    </div>
                    <div
                        class="action-card"
                        @click="editWeight"
                    >
                        <ion-icon :icon="scaleOutline" class="action-icon"></ion-icon>
                        <span class="action-label">Registrar peso</span>
                    </div>

                    <div
                        class="action-card"
                        @click="goToExercises"
                    >
                        <ion-icon :icon="bookOutline" class="action-icon"></ion-icon>
                        <span class="action-label">Ejercicios</span>
                    </div>
                </div>
            </div>

            <!-- Fatiga y recuperación -->
            <div class="section-container">
                <div class="section-title">
                    <span>Fatiga y recuperación</span>
                </div>
                <div class="summary-grid">
                    <!-- Sueño -->
                    <div class="summary-card interactive-card" style="grid-column: span 2;" @click="openEditModal('sleep')">
                        <div class="card-header-row">
                            <span class="summary-label">Sueño</span>
                            <ion-icon :icon="moonOutline" class="edit-icon"></ion-icon>
                        </div>
                        <div style="display:flex; align-items:baseline; gap:6px;">
                            <span class="summary-value">{{ summary.sleep ?? '--' }} <small>hrs</small></span>
                            <span v-if="summary.mood" class="summary-meta" style="margin-left:auto;">Calidad: {{ getSleepQualityLabel(summary.mood) }}</span>
                        </div>
                        <span class="summary-meta">Registrar sueño y calidad</span>
                    </div>

                    <!-- Estrés -->
                    <div class="summary-card interactive-card" @click="openEditModal('stress')">
                        <div class="card-header-row">
                            <span class="summary-label">Estrés</span>
                            <ion-icon :icon="alertCircleOutline" class="edit-icon"></ion-icon>
                        </div>
                        <span class="summary-value">
                            {{ summary.stress ?? '--' }} <small v-if="summary.stress">/ 5</small>
                        </span>
                        <span class="summary-meta">{{ getStressLabel(summary.stress) }}</span>
                    </div>

                    <!-- Energía -->
                    <div class="summary-card interactive-card" @click="openEditModal('energy')">
                        <div class="card-header-row">
                            <span class="summary-label">Energía</span>
                            <ion-icon :icon="flashOutline" class="edit-icon"></ion-icon>
                        </div>
                        <span class="summary-value">
                            {{ summary.energy ?? '--' }} <small v-if="summary.energy">/ 5</small>
                        </span>
                        <span class="summary-meta">{{ getEnergyLabel(summary.energy) }}</span>
                    </div>

                    <!-- Dolor Muscular -->
                    <div class="summary-card interactive-card" @click="openEditModal('muscleSoreness')" style="grid-column: span 2;">
                        <div class="card-header-row">
                            <span class="summary-label">Dolor Muscular</span>
                            <ion-icon :icon="fitnessOutline" class="edit-icon"></ion-icon>
                        </div>
                        <span class="summary-value">
                            {{ summary.muscleSoreness ?? '--' }} <small v-if="summary.muscleSoreness">/ 5</small>
                        </span>
                        <span class="summary-meta">{{ getSorenessLabel(summary.muscleSoreness) }}</span>
                    </div>
                </div>
            </div>

            <!-- Nutrición inteligente -->
            <div class="section-container">
                <div class="section-title">
                    <span>Nutrición inteligente</span>
                </div>
                <div class="nutrition-container">
                    <!-- Agua (Con botones rápidos de ingesta) -->
                    <div class="summary-card summary-water" style="width: 100%; box-sizing: border-box;">
                        <div class="summary-water-header">
                            <span class="summary-label">Ingesta de Agua</span>
                            <span class="water-streak-badge" v-if="waterStreak > 0">Racha: {{ waterStreak }} días</span>
                            <span class="summary-value">{{ formatWater(summary.water) }} <small>L</small></span>
                        </div>
                        <div class="summary-water-bar">
                            <div class="summary-water-fill" :style="{ width: waterPercent + '%' }"></div>
                        </div>
                        <div class="summary-water-meta-row">
                            <span class="summary-meta">{{ waterPercent }}% de la meta (2.0L)</span>
                        </div>
                        <div class="water-quick-buttons">
                            <ion-button size="small" fill="clear" class="btn-quick-water" @click="addWater(250)">+250ml</ion-button>
                            <ion-button size="small" fill="clear" class="btn-quick-water" @click="addWater(500)">+500ml</ion-button>
                            <ion-button size="small" fill="clear" class="btn-quick-water" @click="addWater(1000)">+1.0L</ion-button>
                        </div>
                    </div>

                    <div class="summary-grid" style="margin-top: 12px;">
                        <!-- Calorías -->
                        <div class="summary-card interactive-card" @click="openEditModal('calories')">
                            <div class="card-header-row">
                                <span class="summary-label">Calorías</span>
                                <ion-icon :icon="pencilOutline" class="edit-icon"></ion-icon>
                            </div>
                            <span class="summary-value">{{ summary.calories ?? '--' }} <small>kcal</small></span>
                            <span class="summary-meta" v-if="userPlan && userPlan.caloriesTarget">Meta: {{ userPlan.caloriesTarget }} kcal</span>
                            <span class="summary-meta" v-else>Añadir calorías</span>
                        </div>

                        <!-- Proteínas -->
                        <div class="summary-card interactive-card" @click="openEditModal('protein')">
                            <div class="card-header-row">
                                <span class="summary-label">Proteínas</span>
                                <ion-icon :icon="pencilOutline" class="edit-icon"></ion-icon>
                            </div>
                            <span class="summary-value">{{ summary.protein ?? '--' }} <small>g</small></span>
                            <span class="summary-meta" v-if="userPlan && userPlan.proteinTarget">Meta: {{ userPlan.proteinTarget }} g</span>
                            <span class="summary-meta" v-else>Registrar proteína</span>
                        </div>

                        <!-- Carbohidratos -->
                        <div class="summary-card interactive-card" @click="openEditModal('carbs')">
                            <div class="card-header-row">
                                <span class="summary-label">Carbohidratos</span>
                                <ion-icon :icon="pencilOutline" class="edit-icon"></ion-icon>
                            </div>
                            <span class="summary-value">{{ summary.carbs ?? '--' }} <small>g</small></span>
                            <span class="summary-meta" v-if="userPlan && userPlan.carbsTarget">Meta: {{ userPlan.carbsTarget }} g</span>
                            <span class="summary-meta" v-else>Registrar carbos</span>
                        </div>

                        <!-- Grasas -->
                        <div class="summary-card interactive-card" @click="openEditModal('fat')">
                            <div class="card-header-row">
                                <span class="summary-label">Grasas</span>
                                <ion-icon :icon="pencilOutline" class="edit-icon"></ion-icon>
                            </div>
                            <span class="summary-value">{{ summary.fat ?? '--' }} <small>g</small></span>
                            <span class="summary-meta" v-if="userPlan && userPlan.fatTarget">Meta: {{ userPlan.fatTarget }} g</span>
                            <span class="summary-meta" v-else>Registrar grasas</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dashboard corporal -->
            <div class="section-container">
                <div class="section-title">
                    <span>Dashboard corporal</span>
                </div>
                <div class="summary-grid">
                    <!-- Peso -->
                    <div class="summary-card interactive-card" @click="openEditModal('weight')">
                        <div class="card-header-row">
                            <span class="summary-label">Peso</span>
                            <ion-icon :icon="scaleOutline" class="edit-icon"></ion-icon>
                        </div>
                        <span class="summary-value">{{ summary.weight ?? '--' }} <small>kg</small></span>
                        <span class="summary-meta">Registrar peso</span>
                    </div>

                    <!-- Altura -->
                    <div class="summary-card interactive-card" @click="openEditModal('height')">
                        <div class="card-header-row">
                            <span class="summary-label">Altura</span>
                            <ion-icon :icon="resizeOutline" class="edit-icon"></ion-icon>
                        </div>
                        <span class="summary-value">{{ summary.height ?? '--' }} <small>cm</small></span>
                        <span class="summary-meta">Registrar altura</span>
                    </div>

                    <!-- Grasa Corporal -->
                    <div v-if="isHealthDeviceConnected" class="summary-card interactive-card" @click="openEditModal('bodyFat')">
                        <div class="card-header-row">
                            <span class="summary-label">Grasa Corporal</span>
                            <ion-icon :icon="pencilOutline" class="edit-icon"></ion-icon>
                        </div>
                        <span class="summary-value">{{ summary.bodyFat ?? '--' }} <small>%</small></span>
                        <span class="summary-meta">Registrar grasa</span>
                    </div>

                    <!-- Masa Muscular -->
                    <div v-if="isHealthDeviceConnected" class="summary-card interactive-card" @click="openEditModal('muscleMass')">
                        <div class="card-header-row">
                            <span class="summary-label">Masa Muscular</span>
                            <ion-icon :icon="pencilOutline" class="edit-icon"></ion-icon>
                        </div>
                        <span class="summary-value">{{ summary.muscleMass ?? '--' }} <small>kg</small></span>
                        <span class="summary-meta">Registrar masa</span>
                    </div>

                    <!-- Frecuencia Cardíaca -->
                    <div v-if="isHealthDeviceConnected" class="summary-card interactive-card" @click="openEditModal('heartRate')">
                        <div class="card-header-row">
                            <span class="summary-label">Frec. Cardíaca</span>
                            <ion-icon :icon="heartOutline" class="edit-icon"></ion-icon>
                        </div>
                        <span class="summary-value">{{ summary.heartRate ?? '--' }} <small>lpm</small></span>
                        <span class="summary-meta">Ritmo cardíaco</span>
                    </div>

                    <!-- VO2 Max -->
                    <div v-if="isHealthDeviceConnected" class="summary-card interactive-card" @click="openEditModal('vo2Max')">
                        <div class="card-header-row">
                            <span class="summary-label">VO2 Max</span>
                            <ion-icon :icon="speedometerOutline" class="edit-icon"></ion-icon>
                        </div>
                        <span class="summary-value">{{ summary.vo2Max ?? '--' }}</span>
                        <span class="summary-meta">Registrar VO2 Max</span>
                    </div>
                </div>
            </div>

            <!-- Logros y Gamificación -->
            <div class="section-container">
                <div class="section-title">
                    <span>Logros y Gamificación</span>
                </div>
                <div class="gamification-card">
                    <!-- Nivel & XP -->
                    <div class="level-status-row">
                        <div class="level-badge">
                            <span class="level-number">Lvl {{ userLevel }}</span>
                        </div>
                        <div class="xp-bar-container">
                            <div class="xp-labels">
                                <span class="xp-label-primary">Atleta Disciplinado</span>
                                <span class="xp-label-secondary">{{ currentXP }} / {{ nextLevelXP }} XP</span>
                            </div>
                            <div class="xp-progress-bg">
                                <div class="xp-progress-fill" :style="{ width: levelProgressPercent + '%' }"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Racha visual -->
                    <div class="gamification-streaks">
                        <div class="streak-mini-card">
                            <ion-icon :icon="flashOutline" class="streak-icon active"></ion-icon>
                            <div class="streak-data">
                                <span class="streak-value">{{ metrics?.currentStreak || 0 }}</span>
                                <span class="streak-label">Racha actual</span>
                            </div>
                        </div>
                        <div class="streak-mini-card">
                            <ion-icon :icon="trophyOutline" class="streak-icon best"></ion-icon>
                            <div class="streak-data">
                                <span class="streak-value">{{ metrics?.longestStreak || 0 }}</span>
                                <span class="streak-label">Racha máxima</span>
                            </div>
                        </div>
                    </div>

                    <!-- Insignias / Logros -->
                    <div class="achievements-section">
                        <span class="achievements-title">Insignias Destacadas</span>
                        <div class="achievements-list">
                            <div
                                v-for="ach in achievements"
                                :key="ach.id"
                                class="achievement-row"
                                :class="{ locked: !ach.unlocked }"
                            >
                                <div class="achievement-icon-box">
                                    <ion-icon :icon="ach.unlocked ? ach.icon : ribbonOutline" class="ach-icon"></ion-icon>
                                </div>
                                <div class="achievement-content">
                                    <div class="ach-title-row">
                                        <span class="ach-name">{{ ach.title }}</span>
                                        <span class="ach-status">{{ ach.status }}</span>
                                    </div>
                                    <span class="ach-subtitle">{{ ach.subtitle }}</span>
                                    <div v-if="ach.progress < 100" class="ach-progress-bar">
                                        <div class="ach-progress-fill" :style="{ width: ach.progress + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            <!-- Seccion removida de aqui y movida arriba -->

            <!-- Bottom Spacing -->
            <div class="bottom-space"></div>
        </ion-content>

        <!-- Modal Personalizado Minimalista -->
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
    </ion-page>
</template>

<style scoped>
/* Home Content background */
.home-content {
    --background: var(--ion-background-color);
}

/* Hero Section */
.hero-section {
    position: relative;
    padding: 20px 16px;
    background: var(--ion-background-color);
    border-bottom: 1px solid var(--ion-border-color);
    margin-bottom: 24px;
}

.greeting-section {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
}

.greeting-text {
    display: flex;
    flex-direction: column;
}

.greeting-time {
    color: var(--forgy-text-secondary);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.greeting-name {
    color: var(--forgy-text-primary);
    font-size: 22px;
    font-weight: 700;
}

.motivation-card {
    background: var(--forgy-card-bg);
    border: 1px solid var(--ion-border-color);
    border-radius: 8px;
    padding: 14px;
    cursor: pointer;
}

.quote-text {
    color: var(--forgy-text-primary);
    font-size: 13px;
    line-height: 1.4;
    margin: 0 0 6px 0;
}

.quote-author {
    color: var(--forgy-text-secondary);
    font-size: 11px;
    font-weight: 500;
}

/* Quick Stats Rings */
.quick-stats {
    display: flex;
    justify-content: space-around;
    padding: 0 16px;
    margin-bottom: 24px;
    gap: 12px;
}

.stat-ring {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    position: relative;
    flex: 1;
}

.ring-svg {
    width: 68px;
    height: 68px;
    transform: rotate(-90deg);
    background: var(--forgy-card-bg);
    border-radius: 50%;
}

.ring-bg {
    fill: none;
    stroke: var(--forgy-input-bg);
    stroke-width: 4;
}

.ring-progress {
    fill: none;
    stroke: var(--ion-color-primary);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-dasharray: 289.02; /* 2 * PI * 46 */
    transition: stroke-dashoffset 0.5s ease;
}

.ring-progress.water {
    stroke: var(--ion-color-secondary);
}

.ring-progress.workouts {
    stroke: var(--ion-color-medium);
}

.ring-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -64%);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.ring-value {
    font-size: 15px;
    font-weight: 700;
    color: var(--forgy-text-primary);
    line-height: 1;
}

.ring-label {
    font-size: 8px;
    color: var(--forgy-text-secondary);
}

.ring-title {
    font-size: 11px;
    font-weight: 500;
    margin-top: 8px;
    color: var(--forgy-text-primary);
}

/* Section Container */
.section-container {
    padding: 0 16px;
    margin-bottom: 24px;
}

.section-title {
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 700;
    color: var(--forgy-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.summary-card {
    background: var(--forgy-card-bg);
    padding: 14px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border: 1px solid var(--ion-border-color);
}

.interactive-card {
    cursor: pointer;
}

.interactive-card:active {
    background: var(--forgy-input-bg);
}

.card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.edit-icon {
    font-size: 12px;
    color: var(--ion-color-primary);
    opacity: 0.8;
}

.summary-card.summary-water {
    grid-column: span 2;
    gap: 8px;
}

.summary-water-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.water-streak-badge {
    background: var(--forgy-input-bg);
    border: 1px solid var(--ion-border-color);
    color: var(--ion-color-primary);
    font-size: 9px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
}

.summary-water-bar {
    height: 6px;
    background: var(--forgy-input-bg);
    border-radius: 3px;
    overflow: hidden;
}

.summary-water-fill {
    height: 100%;
    background: var(--ion-color-primary);
    border-radius: 3px;
    transition: width 0.4s ease;
}

.summary-water-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.water-quick-buttons {
    display: flex;
    gap: 8px;
    justify-content: space-between;
    margin-top: 4px;
}

.btn-quick-water {
    flex: 1;
    --background: var(--forgy-input-bg);
    --color: var(--forgy-text-primary);
    --border-radius: 4px;
    --border-color: var(--ion-border-color);
    --border-style: solid;
    --border-width: 1px;
    font-size: 10px;
    font-weight: 600;
    margin: 0;
    height: 28px;
    text-transform: none;
}

.btn-quick-water::part(native) {
    padding: 0 4px;
}

.btn-quick-water:active {
    --background: var(--ion-color-primary);
    --color: white;
}

.summary-label {
    font-size: 11px;
    color: var(--forgy-text-secondary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.summary-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--forgy-text-primary);
}

.summary-value small {
    font-size: 11px;
    font-weight: 500;
    color: var(--forgy-text-secondary);
}

.summary-meta {
    font-size: 10px;
    color: var(--forgy-text-secondary);
}

/* Plan Personalizado */
.plan-cta,
.plan-summary-card {
    background: var(--forgy-card-bg);
    border: 1px solid var(--ion-border-color);
    border-radius: 8px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.plan-cta {
    cursor: pointer;
}

.plan-cta-text h4 {
    margin: 0 0 2px;
    font-size: 14px;
    font-weight: 700;
}

.plan-cta-text p {
    margin: 0;
    color: var(--forgy-text-secondary);
    font-size: 11px;
}

.plan-summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.plan-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.plan-summary-text {
    margin: 0;
    color: var(--forgy-text-secondary);
    font-size: 12px;
    line-height: 1.4;
}

.plan-summary-macros {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
}

.plan-summary-macros .macro {
    background: var(--forgy-input-bg);
    border: 1px solid var(--ion-border-color);
    padding: 8px 4px;
    border-radius: 4px;
    text-align: center;
}

.plan-summary-macros .macro-label {
    font-size: 9px;
    color: var(--forgy-text-secondary);
    text-transform: uppercase;
    display: block;
}

.plan-summary-macros .macro-value {
    font-size: 11px;
    font-weight: 700;
    color: var(--forgy-text-primary);
}

/* Quick Actions */
.quick-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
}

.action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: var(--forgy-card-bg);
    border: 1px solid var(--ion-border-color);
    padding: 12px 4px;
    border-radius: 8px;
    cursor: pointer;
}

.action-card:active {
    background: var(--forgy-input-bg);
}

.action-icon {
    font-size: 20px;
    color: var(--ion-color-primary);
}

.action-label {
    font-size: 10px;
    font-weight: 600;
    text-align: center;
    color: var(--forgy-text-primary);
}
.bottom-space {
    height: 80px;
}


.home-date-switcher-container {
    background: var(--forgy-card-bg);
    border-bottom: 1px solid var(--ion-border-color);
    padding: 10px 16px;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
