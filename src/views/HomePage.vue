<script setup lang="ts">
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton,
    onIonViewWillEnter, toastController, useIonRouter
} from '@ionic/vue';
import { ref, computed } from 'vue'
import { useProfile } from '../utils/useProfile'

interface DashboardMetrics {
    totalWorkouts: number;
    last30DaysWorkouts: number;
    avgDuration: number;
    currentStreak: number;
    longestStreak: number;
    totalVolume: number;
    recentRecords: any[];
    activityCalendar: any[];
}

const router = useIonRouter();
const { userName, loadProfileData, logout, getHeaders, API_URL } = useProfile();

const metrics = ref<DashboardMetrics | null>(null);
const todayProgress = ref<any | null>(null);
const userProfile = ref<any | null>(null);
const userPlan = ref<any | null>(null);
const quoteIndex = ref(0);
function getLocalDateKey(date = new Date()) {
    return date.toLocaleDateString('en-CA');
}

function toDateKey(value: string) {
    if (!value) return value;
    return value.includes('T') ? getLocalDateKey(new Date(value)) : value;
}

const today = getLocalDateKey();

const motivationalQuotes = [
    { text: "El dolor que sientes hoy será la fuerza que sentirás mañana", author: "Arnold Schwarzenegger" },
    { text: "No cuentes los días, haz que los días cuenten", author: "Muhammad Ali" },
    { text: "El único mal entrenamiento es el que no hiciste", author: "Anónimo" },
    { text: "Tu cuerpo puede hacer casi todo. Es tu mente la que debes convencer", author: "Anónimo" },
    { text: "El éxito no se mide por lo que logras sino por los obstáculos que superas", author: "Booker T. Washington" },
    { text: "La disciplina es el puente entre las metas y los logros", author: "Jim Rohn" },
    { text: "Cada repetición te acerca más a tu mejor versión", author: "Anónimo" },
    { text: "No te detengas cuando estés cansado, detente cuando hayas terminado", author: "Anónimo" }
];

const currentQuote = computed(() => motivationalQuotes[quoteIndex.value]);

const circumference = 2 * Math.PI * 45; // ~283

const streakOffset = computed(() => {
    if (!metrics.value) return circumference;
    const goal = 30; // Meta de 30 días de racha para el círculo completo
    const progress = Math.min(metrics.value.currentStreak / goal, 1);
    return circumference * (1 - progress);
});

const waterOffset = computed(() => {
    const water = todayProgress.value?.waterIntake || 0;
    const goal = 5000;
    const progress = Math.min(water / goal, 1);
    return circumference * (1 - progress);
});

const workoutsOffset = computed(() => {
    if (!metrics.value) return circumference;
    // Meta de entrenamientos en los últimos 30 días
    const goal = 20; // Ej: 20 entrenos en un mes
    const progress = Math.min(metrics.value.last30DaysWorkouts / goal, 1);
    return circumference * (1 - progress);
});

function formatVolumeShort(volume: number): string {
    if (!volume) return '0';
    if (volume >= 1000000) {
        return (volume / 1000000).toFixed(1) + 'M';
    }
    if (volume >= 1000) {
        return (volume / 1000).toFixed(1) + 'k';
    }
    return volume.toString();
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
}

function getTimeEmoji() {
    const hour = new Date().getHours();
    if (hour < 7) return '🌙';
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    if (hour < 21) return '🌅';
    return '🌙';
}

function changeQuote() {
    quoteIndex.value = (quoteIndex.value + 1) % motivationalQuotes.length;
}

function goToPlan() {
    router.push('/tabs/plan');
}

function formatWater(ml: number | null | undefined) {
    if (!ml) return '--';
    return (ml / 1000).toFixed(1);
}

const summary = computed(() => {
    const weight = todayProgress.value?.weight ?? userProfile.value?.weight ?? null;
    const height = userProfile.value?.height ?? null;
    const sleep = todayProgress.value?.sleepHours ?? null;
    const calories = todayProgress.value?.caloriesConsumed ?? null;
    const water = todayProgress.value?.waterIntake ?? 0;
    return { weight, height, sleep, calories, water };
});

const waterPercent = computed(() => {
    const goal = 5000;
    const progress = Math.min((summary.value.water || 0) / goal, 1);
    return Math.round(progress * 100);
});

// Navigation
function goToWorkout() {
    router.push('/tabs/exercises');
}

function goToProgress() {
    router.push('/tabs/progress');
}

function goToRecords() {
    router.push('/tabs/progress');
}

function goToExercises() {
    router.push('/tabs/exercises');
}

async function showToast(message: string, color = 'success') {
    const toast = await toastController.create({ message, duration: 2000, color, position: 'bottom' });
    await toast.present();
}

const loadMetrics = async () => {
    try {
        const headers = getHeaders();
        const [dashboardRes, progressRes, profileRes, planRes] = await Promise.all([
            fetch(`${API_URL}/dashboard`, { headers }),
            fetch(`${API_URL}/progress`, { headers }),
            fetch(`${API_URL}/user/profile`, { headers }),
            fetch(`${API_URL}/goals/plan`, { headers })
        ]);
        if (!dashboardRes.ok) {
            if (dashboardRes.status === 401 || dashboardRes.status === 403) logout();
            throw new Error('No se pudo cargar las métricas');
        }
        if (!progressRes.ok) {
            throw new Error('No se pudo cargar el progreso');
        }
        if (!profileRes.ok) {
            throw new Error('No se pudo cargar el perfil');
        }
        if (!planRes.ok) {
            throw new Error('No se pudo cargar el plan');
        }
        metrics.value = await dashboardRes.json();
        const progressData = await progressRes.json();
        todayProgress.value = Array.isArray(progressData)
            ? progressData.find((p: any) => toDateKey(p.date) === today)
            : null;
        userProfile.value = await profileRes.json();
        userPlan.value = await planRes.json();
    } catch (error) {
        console.error(error);
        showToast('Error al cargar datos del dashboard', 'danger');
    }
};

onIonViewWillEnter(() => {
    loadProfileData();
    loadMetrics();
    quoteIndex.value = Math.floor(Math.random() * motivationalQuotes.length);
});
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

            <div class="hero-section">
                <div class="hero-background"></div>
                <div class="hero-content">
                    <div class="greeting-section">
                        <span class="greeting-emoji">{{ getTimeEmoji() }}</span>
                        <div class="greeting-text">
                            <span class="greeting-time">{{ getGreeting() }}</span>
                            <span class="greeting-name">{{ userName }}</span>
                        </div>
                    </div>

                    <div
                        class="motivation-card"
                        @click="changeQuote"
                    >
                        <span class="quote-icon">💬</span>
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
                            r="45"
                            class="ring-bg"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            class="ring-progress"
                            :style="{ strokeDashoffset: streakOffset }"
                        />
                    </svg>
                    <div class="ring-content">
                        <span class="ring-value">{{ metrics.currentStreak }}</span>
                        <span class="ring-label">días</span>
                    </div>
                    <span class="ring-title">🔥 Racha</span>
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
                            r="45"
                            class="ring-bg"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            class="ring-progress water"
                            :style="{ strokeDashoffset: waterOffset }"
                        />
                    </svg>
                    <div class="ring-content">
                        <span class="ring-value">{{ formatWater(summary.water) }}</span>
                        <span class="ring-label">L</span>
                    </div>
                    <span class="ring-title">💧 Agua</span>
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
                            r="45"
                            class="ring-bg"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            class="ring-progress workouts"
                            :style="{ strokeDashoffset: workoutsOffset }"
                        />
                    </svg>
                    <div class="ring-content">
                        <span class="ring-value">{{ metrics.totalWorkouts }}</span>
                        <span class="ring-label">total</span>
                    </div>
                    <span class="ring-title">🏋️ Entrenos</span>
                </div>
            </div>

            <!-- Resumen diario -->
            <div class="section-container">
                <div class="section-title">
                    <span>🧾 Resumen de hoy</span>
                </div>
                <div class="summary-grid">
                    <div class="summary-card">
                        <span class="summary-label">Peso</span>
                        <span class="summary-value">{{ summary.weight ?? '--' }} kg</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">Estatura</span>
                        <span class="summary-value">{{ summary.height ?? '--' }} cm</span>
                    </div>
                    <div class="summary-card summary-water">
                        <div class="summary-water-header">
                            <span class="summary-label">Agua hoy</span>
                            <span class="summary-value">{{ formatWater(summary.water) }} L</span>
                        </div>
                        <div class="summary-water-bar">
                            <div class="summary-water-fill" :style="{ width: waterPercent + '%' }"></div>
                        </div>
                        <span class="summary-meta">{{ waterPercent }}% de 5L</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">Sueño hoy</span>
                        <span class="summary-value">{{ summary.sleep ?? '--' }} hrs</span>
                        <span class="summary-meta">Último registro del día</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-label">Calorías</span>
                        <span class="summary-value">{{ summary.calories ?? '--' }} kcal</span>
                    </div>
                </div>
            </div>

            <!-- Plan personalizado -->
            <div class="section-container">
                <div class="section-title">
                    <span>🎯 Tu plan</span>
                </div>
                <div v-if="!userPlan || !userPlan.id" class="plan-cta" @click="goToPlan">
                    <div class="plan-cta-text">
                        <h4>Crea tu rutina y nutrición</h4>
                        <p>Responde unas preguntas y te damos tu plan completo.</p>
                    </div>
                    <ion-button size="small" fill="outline">Crear plan</ion-button>
                </div>
                <div v-else class="plan-summary-card">
                    <div class="plan-summary-header">
                        <span class="plan-title">Rutina y nutrición</span>
                        <ion-button size="small" fill="clear" @click="goToPlan">Editar</ion-button>
                    </div>
                    <p class="plan-summary-text">{{ userPlan.routineSummary }}</p>
                    <div class="plan-summary-macros">
                        <div class="macro">
                            <span class="macro-label">Calorías</span>
                            <span class="macro-value">{{ userPlan.caloriesTarget }} kcal</span>
                        </div>
                        <div class="macro">
                            <span class="macro-label">Proteína</span>
                            <span class="macro-value">{{ userPlan.proteinTarget }} g</span>
                        </div>
                        <div class="macro">
                            <span class="macro-label">Carbs</span>
                            <span class="macro-value">{{ userPlan.carbsTarget }} g</span>
                        </div>
                        <div class="macro">
                            <span class="macro-label">Grasas</span>
                            <span class="macro-value">{{ userPlan.fatTarget }} g</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="section-container">
                <div class="section-title">
                    <span>⚡ Acciones rápidas</span>
                </div>

                <div class="quick-actions">
                    <div
                        class="action-card"
                        @click="goToWorkout"
                    >
                        <span class="action-icon">🏋️</span>
                        <span class="action-label">Nuevo entreno</span>
                    </div>
                    <div
                        class="action-card"
                        @click="goToProgress"
                    >
                        <span class="action-icon">⚖️</span>
                        <span class="action-label">Registrar peso</span>
                    </div>
                    <div
                        class="action-card"
                        @click="goToExercises"
                    >
                        <span class="action-icon">📚</span>
                        <span class="action-label">Ver ejercicios</span>
                    </div>
                </div>
            </div>

            <!-- Bottom Spacing -->
            <div class="bottom-space"></div>
        </ion-content>
    </ion-page>
</template>
<style scoped>
/* Header Styles */
.forgy-header {
    backdrop-filter: blur(12px);
}

.forgy-header ion-toolbar {

    --background: transparent;
    background: transparent;
    --background: linear-gradient(135deg,
            #ff6a00,
            #ff8c1a);
    --color: rgb(255, 254, 254);
    font-family: 'Permanent Marker', cursive;
    box-shadow: 0 6px 20px rgba(77, 75, 75, 0.966);
}

/* TÍTULO */
.forgy-title {

    font-size: 24px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    text-align: center;
}

/* BOTONES HEADER */
.icon-btn {
    --color: white;
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.icon-btn:active {
    transform: scale(0.9);
    opacity: 0.8;
}

/* ICONOS */
ion-icon {
    font-size: 26px;
}

/* LOGO EMOJI */
.logo-emoji {
    font-size: 26px;
}

/*FINDE DEL HEADER*/
.header-title {
    text-align: center;
    font-weight: 800;
    letter-spacing: 1px;
}

.home-content {
    --background: var(--forgy-content-bg);
}

.header-brand {
    display: flex;
    align-items: center;
    gap: 8px;
}

.brand-icon {
    font-size: 24px;
}

.brand-name {
    font-weight: 800;
    font-size: 22px;
}

/* Hero Section */
.hero-section {
    position: relative;
    padding: 24px 16px;
    background: linear-gradient(135deg, var(--ion-color-primary) 0%, #ff6a00 100%);
    border-radius: 0 0 32px 32px;
    margin-bottom: 20px;
    overflow: hidden;
}

.hero-background {
    position: absolute;
    top: -50%;
    right: -20%;
    width: 200px;
    height: 200px;
    background: rgba(168, 15, 15, 0.1);
    border-radius: 50%;
}

.hero-content {
    position: relative;
    z-index: 1;
}

.greeting-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.greeting-emoji {
    font-size: 40px;
}

.greeting-text {
    display: flex;
    flex-direction: column;
}

.greeting-time {
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
}

.greeting-name {
    color: white;
    font-size: 26px;
    font-weight: 800;
}

.motivation-card {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 16px;
    cursor: pointer;
    transition: transform 0.2s;
}

.motivation-card:active {
    transform: scale(0.98);
}

.quote-icon {
    font-size: 20px;
}

.quote-text {
    color: white;
    font-size: 15px;
    font-style: italic;
    margin: 8px 0;
    line-height: 1.5;
}

.quote-author {
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
}

/* Quick Stats Rings */
.quick-stats {
    display: flex;
    justify-content: space-around;
    padding: 0 16px;
    margin-top: -40px;
    margin-bottom: 24px;
}

.stat-ring {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    position: relative;
}

.ring-svg {
    width: 80px;
    height: 80px;
    transform: rotate(-90deg);
    background: var(--forgy-card-bg);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.ring-bg {
    fill: none;
    stroke: #e0e0e0;
    stroke-width: 8;
}

.ring-progress {
    fill: none;
    stroke: var(--ion-color-danger);
    stroke-width: 8;
    stroke-linecap: round;
    stroke-dasharray: 283;
    transition: stroke-dashoffset 0.8s ease;
}

.ring-progress.water {
    stroke: #2196F3;
}

.ring-progress.workouts {
    stroke: var(--ion-color-success);
}

.ring-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: -10px;
}

.ring-value {
    font-size: 18px;
    font-weight: 800;
    color: var(--forgy-text-primary);
    line-height: 1;
}

.ring-label {
    font-size: 9px;
    color: var(--ion-color-medium);
}

.ring-title {
    font-size: 11px;
    font-weight: 600;
    margin-top: 6px;
}

/* Section Container */
.section-container {
    padding: 0 16px;
    margin-bottom: 24px;
}

.section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 18px;
    font-weight: 700;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.summary-card {
    background: var(--forgy-card-bg);
    padding: 14px;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.summary-card.summary-water {
    grid-column: span 2;
}

.summary-water-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.summary-water-bar {
    height: 10px;
    background: var(--forgy-input-bg);
    border-radius: 10px;
    overflow: hidden;
}

.summary-water-fill {
    height: 100%;
    background: linear-gradient(90deg, #56CCF2, #2F80ED);
    border-radius: 10px;
    transition: width 0.4s ease;
}

.summary-label {
    font-size: 12px;
    color: var(--ion-color-medium);
    font-weight: 600;
}

.summary-value {
    font-size: 18px;
    font-weight: 800;
    color: var(--forgy-text-primary);
}

.summary-meta {
    font-size: 11px;
    color: var(--forgy-text-secondary);
}

.plan-cta,
.plan-summary-card {
    background: var(--forgy-card-bg);
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.plan-cta {
    cursor: pointer;
}

.plan-cta-text h4 {
    margin: 0 0 4px;
    font-size: 16px;
}

.plan-cta-text p {
    margin: 0;
    color: var(--forgy-text-secondary);
    font-size: 12px;
}

.plan-summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.plan-title {
    font-weight: 700;
}

.plan-summary-text {
    margin: 0;
    color: var(--forgy-text-secondary);
    font-size: 12px;
}

.plan-summary-macros {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.plan-summary-macros .macro {
    background: var(--forgy-input-bg);
    padding: 10px;
    border-radius: 12px;
    text-align: center;
}

.plan-summary-macros .macro-label {
    font-size: 11px;
    color: var(--forgy-text-secondary);
}

.plan-summary-macros .macro-value {
    font-size: 14px;
    font-weight: 700;
}

.goal-card {
    background: var(--forgy-card-bg);
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    color: var(--forgy-text-primary);
}

.goal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.goal-info h3 {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 700;
}

.goal-info p {
    margin: 0;
    color: var(--ion-color-medium);
    font-size: 14px;
}

.goal-progress-ring {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-tertiary));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.goal-percent {
    color: white;
    font-size: 14px;
    font-weight: 700;
}

.goal-bar {
    height: 8px;
    background: var(--ion-color-light);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 16px;

}

.goal-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--ion-color-primary), var(--ion-color-tertiary));
    border-radius: 4px;
    transition: width 0.5s ease;

}

.goal-actions {
    display: flex;
    justify-content: flex-end;

}

.week-summary {
    display: flex;
    justify-content: space-between;
    background: var(--forgy-card-bg);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    color: var(--forgy-text-primary);

}

.week-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.day-letter {
    font-size: 12px;
    font-weight: 600;
    color: var(--ion-color-medium);
}

.day-indicator {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--ion-color-light);
    display: flex;
    align-items: center;
    justify-content: center;
}

.week-day.active .day-indicator {
    background: var(--ion-color-success-tint);
}

.week-day.today .day-letter {
    color: var(--ion-color-primary);
}

.week-day.today .day-indicator {
    border: 2px solid var(--ion-color-primary);
}

.week-day.future .day-indicator {
    opacity: 0.5;
}

.today-dot {
    width: 8px;
    height: 8px;
    background: var(--ion-color-primary);
    border-radius: 50%;
}

.week-stats {
    display: flex;
    justify-content: space-around;
    background: var(--forgy-card-bg);
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    color: var(--forgy-text-primary);
}

.week-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.ws-value {
    font-size: 24px;
    font-weight: 800;
    color: var(--ion-color-primary);
}

.ws-label {
    font-size: 12px;
    color: var(--ion-color-medium);
}

/* PR Showcase */
.pr-showcase {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px;
}

.pr-item {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--forgy-card-bg);
    padding: 16px;
    border-radius: 16px;
    min-width: 180px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    color: var(--forgy-text-primary);
}

.pr-medal {
    font-size: 28px;
}

.pr-details {
    display: flex;
    flex-direction: column;
}

.pr-exercise {
    font-size: 13px;
    color: var(--ion-color-medium);
}

.pr-weight {
    font-size: 20px;
    font-weight: 800;
    color: var(--ion-color-dark);
}

.recommendation-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--forgy-card-bg);
    padding: 20px;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    color: var(--forgy-text-primary);
}

.recommendation-card:active {
    transform: scale(0.98);
}

.rec-icon {
    font-size: 40px;
    width: 60px;
    height: 60px;
    background: var(--ion-color-light);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.rec-content {
    flex: 1;
}

.rec-content h4 {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 700;
}

.rec-content p {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--ion-color-medium);
}

.rec-tags {
    display: flex;
    gap: 6px;
}

.rec-tag {
    background: var(--ion-color-primary-tint);
    color: var(--ion-color-primary);
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
}

.rec-arrow {
    font-size: 24px;
    color: var(--ion-color-medium);
}

.quick-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

.action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    background: var(--forgy-card-bg);
    padding: 16px 8px;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    color: var(--forgy-text-primary);
}

.action-card:active {
    transform: scale(0.95);
    background: var(--ion-color-primary-tint);
}

.action-icon {
    font-size: 28px;
}

.action-label {
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    color: var(--forgy-text-primary);
}

.achievement-toast {
    position: fixed;
    top: 100px;
    left: 16px;
    right: 16px;
    z-index: 1000;
    animation: slideDown 0.5s ease, fadeOut 0.5s ease 3s forwards;
}

@keyframes slideDown {
    from {
        transform: translateY(-100%);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes fadeOut {
    to {
        opacity: 0;
        transform: translateY(-20px);
    }
}

.achievement-content {
    display: flex;
    align-items: center;
    gap: 12px;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    padding: 16px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(255, 165, 0, 0.4);
}

.achievement-icon {
    font-size: 36px;
}

.achievement-text {
    display: flex;
    flex-direction: column;
}

.achievement-title {
    color: white;
    font-size: 16px;
    font-weight: 700;
}

.achievement-desc {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
}

.bottom-space {
    height: 100px;
}
</style>
