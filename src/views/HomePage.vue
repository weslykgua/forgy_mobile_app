<template>
    <ion-page>
        <ion-header class="ion-no-border">
            <ion-toolbar color="primary">
                <ion-title>
                    <div class="header-brand">
                        <span class="brand-icon">💪</span>
                        <span class="brand-name">Forgy</span>
                    </div>
                </ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="refreshData">
                        <ion-icon :icon="refreshOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content
            :fullscreen="true"
            class="home-content"
        >
            <ion-refresher
                slot="fixed"
                @ionRefresh="handleRefresh($event)"
            >
                <ion-refresher-content></ion-refresher-content>
            </ion-refresher>

            <!-- Hero Section con saludo -->
            <div class="hero-section">
                <div class="hero-background"></div>
                <div class="hero-content">
                    <div class="greeting-section">
                        <span class="greeting-emoji">{{ getTimeEmoji() }}</span>
                        <div class="greeting-text">
                            <span class="greeting-time">{{ getGreeting() }}</span>
                            <span class="greeting-name">Atleta 🏆</span>
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

            <!-- Quick Stats Ring -->
            <div class="quick-stats">
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
                        <span class="ring-value">{{ stats.streakDays }}</span>
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
                        <span class="ring-value">{{ formatLiters(todayWater) }}</span>
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
                        <span class="ring-value">{{ stats.totalWorkouts }}</span>
                        <span class="ring-label">total</span>
                    </div>
                    <span class="ring-title">🏋️ Entrenos</span>
                </div>
            </div>

            <!-- Today's Goal Card -->
            <div class="section-container">
                <div class="section-title">
                    <span>🎯 Meta del día</span>
                    <ion-chip
                        color="success"
                        v-if="goalProgress >= 100"
                    >
                        <ion-icon :icon="checkmarkCircle"></ion-icon>
                        <ion-label>Completado</ion-label>
                    </ion-chip>
                </div>

                <div class="goal-card">
                    <div class="goal-header">
                        <div class="goal-info">
                            <h3>{{ todayGoal.title }}</h3>
                            <p>{{ todayGoal.description }}</p>
                        </div>
                        <div class="goal-progress-ring">
                            <span class="goal-percent">{{ Math.round(goalProgress) }}%</span>
                        </div>
                    </div>
                    <div class="goal-bar">
                        <div
                            class="goal-fill"
                            :style="{ width: Math.min(goalProgress, 100) + '%' }"
                        ></div>
                    </div>
                    <div class="goal-actions">
                        <ion-button
                            fill="outline"
                            size="small"
                            @click="goToWorkout"
                        >
                            <ion-icon
                                :icon="add"
                                slot="start"
                            ></ion-icon>
                            Registrar entreno
                        </ion-button>
                    </div>
                </div>
            </div>

            <!-- Weekly Summary -->
            <div class="section-container">
                <div class="section-title">
                    <span>📅 Esta semana</span>
                </div>

                <div class="week-summary">
                    <div
                        v-for="(day, idx) in weekSummary"
                        :key="idx"
                        class="week-day"
                        :class="{
                            'active': day.hasWorkout,
                            'today': day.isToday,
                            'future': day.isFuture
                        }"
                    >
                        <span class="day-letter">{{ day.letter }}</span>
                        <div class="day-indicator">
                            <ion-icon
                                v-if="day.hasWorkout"
                                :icon="checkmarkCircle"
                                color="success"
                            ></ion-icon>
                            <span
                                v-else-if="day.isToday"
                                class="today-dot"
                            ></span>
                        </div>
                    </div>
                </div>

                <div class="week-stats">
                    <div class="week-stat">
                        <span class="ws-value">{{ weekWorkouts }}</span>
                        <span class="ws-label">entrenos</span>
                    </div>
                    <div class="week-stat">
                        <span class="ws-value">{{ formatVolume(weekVolume) }}</span>
                        <span class="ws-label">kg levantados</span>
                    </div>
                    <div class="week-stat">
                        <span class="ws-value">{{ weekDuration }}</span>
                        <span class="ws-label">minutos</span>
                    </div>
                </div>
            </div>

            <!-- Personal Records Highlight -->
            <div
                class="section-container"
                v-if="topPRs.length > 0"
            >
                <div class="section-title">
                    <span>🏆 Tus Records</span>
                    <ion-button
                        fill="clear"
                        size="small"
                        @click="goToRecords"
                    >Ver todos</ion-button>
                </div>

                <div class="pr-showcase">
                    <div
                        v-for="(pr, idx) in topPRs"
                        :key="idx"
                        class="pr-item"
                    >
                        <div class="pr-medal">{{ getMedal(idx) }}</div>
                        <div class="pr-details">
                            <span class="pr-exercise">{{ pr.exerciseName }}</span>
                            <span class="pr-weight">{{ pr.maxWeight }} kg</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recommended Workout -->
            <div class="section-container">
                <div class="section-title">
                    <span>💡 Recomendación de hoy</span>
                </div>

                <div
                    class="recommendation-card"
                    @click="goToWorkout"
                >
                    <div class="rec-icon">{{ recommendation.icon }}</div>
                    <div class="rec-content">
                        <h4>{{ recommendation.title }}</h4>
                        <p>{{ recommendation.description }}</p>
                        <div class="rec-tags">
                            <span
                                class="rec-tag"
                                v-for="tag in recommendation.tags"
                                :key="tag"
                            >{{ tag }}</span>
                        </div>
                    </div>
                    <ion-icon
                        :icon="chevronForward"
                        class="rec-arrow"
                    ></ion-icon>
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
                        @click="quickAddWater"
                    >
                        <span class="action-icon">💧</span>
                        <span class="action-label">+500ml agua</span>
                    </div>
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

            <!-- Achievement Unlock Animation -->
            <div
                class="achievement-toast"
                v-if="showAchievement"
                @click="showAchievement = false"
            >
                <div class="achievement-content">
                    <span class="achievement-icon">🎉</span>
                    <div class="achievement-text">
                        <span class="achievement-title">¡Logro desbloqueado!</span>
                        <span class="achievement-desc">{{ achievementText }}</span>
                    </div>
                </div>
            </div>

            <!-- Bottom Spacing -->
            <div class="bottom-space"></div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon, IonChip, IonLabel,
    IonRefresher, IonRefresherContent,
    onIonViewWillEnter, toastController, useIonRouter
} from '@ionic/vue';
import { ref, computed } from 'vue';
import { refreshOutline, checkmarkCircle, add, chevronForward } from 'ionicons/icons';

const API_URL = 'http://localhost:3000';
const router = useIonRouter();

interface ProgressStats {
    totalWorkouts: number;
    totalVolume: number;
    streakDays: number;
    currentWeight: number;
}

interface PersonalRecord {
    exerciseName: string;
    maxWeight: number;
    date: string;
}

const stats = ref<ProgressStats>({ totalWorkouts: 0, totalVolume: 0, streakDays: 0, currentWeight: 0 });
const todayWater = ref(0);
const topPRs = ref<PersonalRecord[]>([]);
const workoutHistory = ref<any[]>([]);
const showAchievement = ref(false);
const achievementText = ref('');
const quoteIndex = ref(0);

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

const muscleGroups = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Abdomen'];
const muscleIcons: Record<string, string> = {
    'Pecho': '💪', 'Espalda': '🔙', 'Piernas': '🦵', 'Hombros': '🤷',
    'Bíceps': '💪', 'Tríceps': '💪', 'Abdomen': '🎯'
};

const currentQuote = computed(() => motivationalQuotes[quoteIndex.value]);
const today = new Date().toISOString().split('T')[0];

// Goal calculations
const todayGoal = computed(() => {
    const dayOfWeek = new Date().getDay();
    const goals = [
        { title: 'Día de descanso activo', description: 'Estiramientos y movilidad', target: 1 },
        { title: 'Entrena tu tren superior', description: 'Pecho, hombros y tríceps', target: 1 },
        { title: 'Día de piernas', description: 'Cuádriceps, isquios y glúteos', target: 1 },
        { title: 'Push day', description: 'Empujes y press', target: 1 },
        { title: 'Pull day', description: 'Jalones y remos', target: 1 },
        { title: 'Full body', description: 'Entrenamiento completo', target: 1 },
        { title: 'Descanso merecido', description: 'Recuperación y nutrición', target: 0 }
    ];
    return goals[dayOfWeek];
});

const goalProgress = computed(() => {
    const todayWorkouts = workoutHistory.value.filter(w => w.date === today).length;
    if (todayGoal.value.target === 0) return 100;
    return (todayWorkouts / todayGoal.value.target) * 100;
});

// Ring calculations
const circumference = 2 * Math.PI * 45;
const streakOffset = computed(() => {
    const progress = Math.min(stats.value.streakDays / 30, 1);
    return circumference * (1 - progress);
});
const waterOffset = computed(() => {
    const progress = Math.min(todayWater.value / 3000, 1);
    return circumference * (1 - progress);
});
const workoutsOffset = computed(() => {
    const progress = Math.min(stats.value.totalWorkouts / 100, 1);
    return circumference * (1 - progress);
});

// Week summary
const weekSummary = computed(() => {
    const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const result = [];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const hasWorkout = workoutHistory.value.some(w => w.date === dateStr);

        result.push({
            letter: days[i],
            date: dateStr,
            hasWorkout,
            isToday: dateStr === today,
            isFuture: date > now
        });
    }
    return result;
});

const weekWorkouts = computed(() => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startStr = startOfWeek.toISOString().split('T')[0];
    return workoutHistory.value.filter(w => w.date >= startStr).length;
});

const weekVolume = computed(() => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startStr = startOfWeek.toISOString().split('T')[0];
    return workoutHistory.value
        .filter(w => w.date >= startStr)
        .reduce((sum, w) => {
            const vol = w.sets?.reduce((s: number, set: any) => s + (set.reps * set.weight), 0) || 0;
            return sum + vol;
        }, 0);
});

const weekDuration = computed(() => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startStr = startOfWeek.toISOString().split('T')[0];
    return workoutHistory.value
        .filter(w => w.date >= startStr)
        .reduce((sum, w) => sum + (w.duration || 0), 0);
});

// Recommendation
const recommendation = computed(() => {
    const dayOfWeek = new Date().getDay();
    const recommendations = [
        { icon: '🧘', title: 'Yoga y estiramientos', description: 'Perfecto para recuperación activa', tags: ['Flexibilidad', '20 min'] },
        { icon: '💪', title: 'Entrena pecho hoy', description: 'Press de banca, flexiones y aperturas', tags: ['Pecho', '45 min'] },
        { icon: '🦵', title: 'Día de piernas', description: 'Sentadillas, prensa y extensiones', tags: ['Piernas', '50 min'] },
        { icon: '🏋️', title: 'Hombros y tríceps', description: 'Press militar y fondos', tags: ['Push', '40 min'] },
        { icon: '🔙', title: 'Espalda y bíceps', description: 'Dominadas, remos y curls', tags: ['Pull', '45 min'] },
        { icon: '⚡', title: 'HIIT + Core', description: 'Circuito de alta intensidad', tags: ['Cardio', '30 min'] },
        { icon: '😴', title: 'Descansa hoy', description: 'Tu cuerpo necesita recuperarse', tags: ['Descanso', 'Nutrición'] }
    ];
    return recommendations[dayOfWeek];
});

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

function getMedal(idx: number) {
    return ['🥇', '🥈', '🥉'][idx] || '🏅';
}

function formatLiters(ml: number) {
    return (ml / 1000).toFixed(1);
}

function formatVolume(vol: number) {
    return vol >= 1000 ? (vol / 1000).toFixed(1) + 'k' : vol.toString();
}

// Navigation
function goToWorkout() {
    router.push('/tabs/tab2');
}

function goToProgress() {
    router.push('/tabs/tab3');
}

function goToRecords() {
    router.push('/tabs/tab3');
}

function goToExercises() {
    router.push('/tabs/tab1');
}

// Actions
async function quickAddWater() {
    try {
        const progressRes = await fetch(`${API_URL}/progress`);
        const progressData = await progressRes.json();
        const todayProgress = progressData.find((p: any) => p.date === today);

        await fetch(`${API_URL}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: today,
                waterIntake: (todayProgress?.waterIntake || 0) + 500,
                weight: todayProgress?.weight || 0,
                mood: todayProgress?.mood || 'Bien'
            })
        });

        todayWater.value += 500;
        showToast('+500ml 💧 ¡Sigue así!');
    } catch (error) {
        showToast('Error al registrar', 'danger');
    }
}

async function loadData() {
    try {
        const [statsRes, progressRes, historyRes, prsRes, workoutsRes] = await Promise.all([
            fetch(`${API_URL}/progress/stats`),
            fetch(`${API_URL}/progress`),
            fetch(`${API_URL}/workouts/history`),
            fetch(`${API_URL}/workouts/prs`),
            fetch(`${API_URL}/workouts`)
        ]);

        stats.value = await statsRes.json();
        const progressData = await progressRes.json();
        const todayProgress = progressData.find((p: any) => p.date === today);
        todayWater.value = todayProgress?.waterIntake || 0;

        topPRs.value = (await prsRes.json()).slice(0, 3);
        workoutHistory.value = await workoutsRes.json();

        // Check for achievements
        checkAchievements();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function checkAchievements() {
    if (stats.value.streakDays === 7) {
        achievementText.value = '¡7 días de racha! 🔥';
        showAchievement.value = true;
    } else if (stats.value.totalWorkouts === 10) {
        achievementText.value = '¡10 entrenamientos completados! 💪';
        showAchievement.value = true;
    }
}

async function refreshData() {
    await loadData();
    showToast('Datos actualizados ✓');
}

async function handleRefresh(event: CustomEvent) {
    await loadData();
    (event.target as any).complete();
}

async function showToast(message: string, color = 'success') {
    const toast = await toastController.create({ message, duration: 2000, color, position: 'bottom' });
    await toast.present();
}

onIonViewWillEnter(() => {
    loadData();
    // Random quote on enter
    quoteIndex.value = Math.floor(Math.random() * motivationalQuotes.length);
});
</script>

<style scoped>
.home-content {
    --background: #f8f9fa;
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
    background: linear-gradient(135deg, var(--ion-color-primary) 0%, #7c4dff 100%);
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
    background: rgba(255, 255, 255, 0.1);
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
    background: white;
    border-radius: 50%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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
    color: var(--ion-color-dark);
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

/* Goal Card */
.goal-card {
    background: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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

/* Week Summary */
.week-summary {
    display: flex;
    justify-content: space-between;
    background: white;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
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
    background: white;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
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
    background: white;
    padding: 16px;
    border-radius: 16px;
    min-width: 180px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
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

/* Recommendation Card */
.recommendation-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: white;
    padding: 20px;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: transform 0.2s;
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

/* Quick Actions */
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
    background: white;
    padding: 16px 8px;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: all 0.2s;
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
    color: var(--ion-color-dark);
}

/* Achievement Toast */
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
