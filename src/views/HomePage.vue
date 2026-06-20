<script setup lang="ts">
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon,
    onIonViewWillEnter, toastController, useIonRouter, alertController
} from '@ionic/vue';
import { ref, computed } from 'vue'
import { useProfile } from '../utils/useProfile'
import {
    flame, water, barbell, scaleOutline, resizeOutline,
    moonOutline, nutritionOutline, pencilOutline, calculatorOutline, addOutline,
    bookOutline, flameOutline, waterOutline, barbellOutline,
    trophyOutline, ribbonOutline, flashOutline, heartOutline, speedometerOutline,
    statsChartOutline, shieldCheckmarkOutline, fitnessOutline, alertCircleOutline,
    bodyOutline, timeOutline, chevronBack, chevronForward, pulseOutline
} from 'ionicons/icons';

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
const allProgress = ref<any[]>([]);
const todayProgress = ref<any | null>(null);
const userProfile = ref<any | null>(null);
const userPlan = ref<any | null>(null);
const quoteIndex = ref(0);

const bedtime = ref('23:00');
const waketime = ref('07:00');

const calculateSleepHoursFromTimes = () => {
    if (!bedtime.value || !waketime.value) return;
    const [bedH, bedM] = bedtime.value.split(':').map(Number);
    const [wakeH, wakeM] = waketime.value.split(':').map(Number);
    
    let diffMins = (wakeH * 60 + wakeM) - (bedH * 60 + bedM);
    if (diffMins < 0) {
        diffMins += 24 * 60; // crossed midnight
    }
    const hours = diffMins / 60;
    modalInputValue.value = hours.toFixed(1);
};

const syncSmartwatchSleep = () => {
    if (!isHealthDeviceConnected.value) {
        showToast('Conecta un dispositivo de salud en tu perfil primero', 'warning');
        return;
    }
    bedtime.value = '22:45';
    waketime.value = '07:00';
    modalInputValue.value = '8.3';
    showToast('Datos sincronizados de tu reloj inteligente: 8.3 horas de sueño.');
};

function getLocalDateKey(date = new Date()) {
    return date.toLocaleDateString('en-CA');
}

function toDateKey(value: string) {
    if (!value) return '';
    return value.includes('T') ? value.split('T')[0] : value;
}

const today = getLocalDateKey();
const currentDate = ref(today);
const isHealthDeviceConnected = ref(false);

const checkDeviceConnection = () => {
    isHealthDeviceConnected.value = localStorage.getItem('health_devices_connected') === 'true';
};

const motivationalQuotes = [
    { text: "La felicidad de tu vida depende de la calidad de tus pensamientos.", author: "Marco Aurelio" },
    { text: "No es que tengamos poco tiempo, sino que perdemos mucho.", author: "Séneca" },
    { text: "Solo podemos ver una corta distancia delante de nosotros, pero podemos ver que hay mucho por hacer.", author: "Alan Turing" },
    { text: "Cuando crees que has terminado, solo estás al cuarenta por ciento de tu capacidad real.", author: "David Goggins" },
    { text: "La disciplina es el amor propio en acción.", author: "Lex Fridman" },
    { text: "Una vida no examinada no vale la pena vivirla.", author: "Sócrates" },
    { text: "No basta con tener una buena mente; lo principal es aplicarla bien.", author: "René Descartes" },
    { text: "La vida es como montar en bicicleta. Para mantener el equilibrio debes seguir moviéndote.", author: "Albert Einstein" },
    { text: "Quien tiene un porqué para vivir puede soportar casi cualquier cómo.", author: "Friedrich Nietzsche" },
    { text: "La disciplina es libertad.", author: "Jocko Willink" },
    { text: "Un cuerpo sano es la base para una mente clara.", author: "Naval Ravikant" },
    { text: "El sabio no se aflige por lo que no tiene, sino que se alegra por lo que tiene.", author: "Epicteto" },
    { text: "La perseverancia es el trabajo duro que haces después del trabajo duro que ya hiciste.", author: "Anaxágoras" },
    { text: "El conocimiento es la herramienta más poderosa para la autotransformación.", author: "Pitágoras" },
    { text: "El hombre es lo que hace con lo que hicieron de él.", author: "Jean-Paul Sartre" },
    { text: "Asóciate con personas que te hagan mejor.", author: "Séneca" },
    { text: "La disciplina supera al talento cuando el talento no tiene disciplina.", author: "Anónimo" },
    { text: "La excelencia no es un acto, sino un hábito.", author: "Aristóteles" },
    { text: "El secreto para salir adelante es comenzar.", author: "Mark Twain" },
    { text: "No hay viento favorable para el barco que no sabe a qué puerto se dirige.", author: "Séneca" }
];

const currentQuote = computed(() => {
    const dateStr = currentDate.value || today;
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % motivationalQuotes.length;
    return motivationalQuotes[idx];
});

const circumference = 2 * Math.PI * 45; // ~283

const streakOffset = computed(() => {
    if (!metrics.value) return circumference;
    const goal = 30; // Meta de 30 días de racha para el círculo completo
    const progress = Math.min(metrics.value.currentStreak / goal, 1);
    return circumference * (1 - progress);
});

const waterOffset = computed(() => {
    const water = todayProgress.value?.waterIntake || 0;
    const goal = 2000; // Meta estándar de 2 Litros (2000 ml)
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

// Racha de agua calculada dinámicamente desde el historial de progreso (consecutivos >= 2000 ml)
const waterStreak = computed(() => {
    if (!Array.isArray(allProgress.value) || allProgress.value.length === 0) return 0;

    const waterDays = allProgress.value
        .filter(p => p.waterIntake !== null && p.waterIntake !== undefined)
        .map(p => ({
            dateStr: toDateKey(p.date),
            water: p.waterIntake
        }))
        .sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());

    if (waterDays.length === 0) return 0;

    let streak = 0;
    let expectedDate = new Date();
    expectedDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < waterDays.length; i++) {
        const day = waterDays[i];
        const dayDate = new Date(day.dateStr);
        dayDate.setHours(0, 0, 0, 0);

        const diffTime = expectedDate.getTime() - dayDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            if (day.water >= 2000) {
                streak++;
                expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
                // Si hoy no se ha alcanzado la meta, permitimos continuar racha si ayer se cumplió
                expectedDate.setDate(expectedDate.getDate() - 1);
            }
        } else if (diffDays === 1) {
            if (day.water >= 2000) {
                streak++;
                expectedDate = new Date(dayDate.getTime() - 24 * 60 * 60 * 1000);
            } else {
                break;
            }
        } else if (diffDays > 1) {
            break;
        }
    }
    return streak;
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

const changeHomeDate = (direction: number) => {
    const d = new Date(currentDate.value + 'T12:00:00');
    d.setDate(d.getDate() + direction);
    currentDate.value = getLocalDateKey(d);
    
    // Sincronizar el progreso del día seleccionado
    todayProgress.value = allProgress.value.find((p: any) => toDateKey(p.date) === currentDate.value) || null;
};

const resetHomeDate = () => {
    currentDate.value = getLocalDateKey();
    todayProgress.value = allProgress.value.find((p: any) => toDateKey(p.date) === currentDate.value) || null;
};

const formattedCurrentDate = computed(() => {
    if (currentDate.value === today) return 'Hoy';
    const d = new Date(currentDate.value + 'T12:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
});

function goToPlan() {
    router.push('/tabs/plan');
}

function formatWater(ml: number | null | undefined) {
    if (!ml) return '0.0';
    return (ml / 1000).toFixed(1);
}

const summary = computed(() => {
    const weight = todayProgress.value?.weight ?? userProfile.value?.weight ?? null;
    const height = userProfile.value?.height ?? null;
    const sleep = todayProgress.value?.sleepHours ?? null;
    const calories = todayProgress.value?.caloriesConsumed ?? null;
    const water = todayProgress.value?.waterIntake ?? 0;
    
    // Nuevos campos para fatiga, nutrición y corporal
    const stress = todayProgress.value?.stress ?? null;
    const energy = todayProgress.value?.energy ?? null;
    const muscleSoreness = todayProgress.value?.muscleSoreness ?? null;
    
    const protein = todayProgress.value?.proteinConsumed ?? null;
    const carbs = todayProgress.value?.carbsConsumed ?? null;
    const fat = todayProgress.value?.fatConsumed ?? null;
    
    const heartRate = todayProgress.value?.heartRate ?? null;
    const vo2Max = todayProgress.value?.vo2Max ?? null;
    const bodyFat = todayProgress.value?.bodyFat ?? null;
    const muscleMass = todayProgress.value?.muscleMass ?? null;
    
    return { 
        weight, height, sleep, calories, water,
        stress, energy, muscleSoreness,
        protein, carbs, fat,
        heartRate, vo2Max, bodyFat, muscleMass
    };
});

const calculatedImc = computed(() => {
    const weight = summary.value.weight;
    const height = summary.value.height;
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
});

const imcClassification = computed(() => {
    const imc = parseFloat(calculatedImc.value || '0');
    if (imc === 0) return '';
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Saludable';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
});

const getStressLabel = (score: number | null) => {
    if (!score) return '--';
    const labels = ['Relajado', 'Leve', 'Moderado', 'Alto', 'Muy Alto'];
    return labels[score - 1] || '--';
};

const getEnergyLabel = (score: number | null) => {
    if (!score) return '--';
    const labels = ['Muy baja', 'Baja', 'Normal', 'Alta', 'Excelente'];
    return labels[score - 1] || '--';
};

const getSorenessLabel = (score: number | null) => {
    if (!score) return '--';
    const labels = ['Ninguno', 'Leve', 'Moderado', 'Doloroso', 'Extremo'];
    return labels[score - 1] || '--';
};

// Datos de Gamificación para estética premium
const userLevel = ref(4);
const currentXP = ref(2450);
const nextLevelXP = ref(3000);

const levelProgressPercent = computed(() => {
    return Math.round((currentXP.value / nextLevelXP.value) * 100);
});

// Logros / Insignias
const achievements = ref([
    {
        id: 'bench100',
        title: 'Poder Absoluto',
        subtitle: 'Primeros 100 kg en banca',
        status: 'Conseguido',
        unlocked: true,
        progress: 100,
        desc: 'Hito de fuerza pura en press de banca horizontal.'
    },
    {
        id: 'streak30',
        title: 'Constancia Estoica',
        subtitle: '30 días consecutivos',
        status: 'Conseguido',
        unlocked: true,
        progress: 100,
        desc: 'Racha impecable de registro diario de bienestar.'
    },
    {
        id: 'volume1m',
        title: 'Hércules',
        subtitle: '1M kg levantados',
        status: '850k / 1M kg',
        unlocked: false,
        progress: 85,
        desc: 'Volumen total acumulado a lo largo de tu historial.'
    }
]);

const waterPercent = computed(() => {
    const goal = 2000;
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

// Guardar campos del progreso diario
const saveProgressField = async (fieldName: string, value: any) => {
    // Respaldar valor anterior en caso de error
    const originalValue = todayProgress.value ? todayProgress.value[fieldName] : undefined;

    // Actualización local inmediata para respuesta instantánea de la UI
    todayProgress.value = {
        ...(todayProgress.value || {}),
        [fieldName]: value
    };

    try {
        const headers = getHeaders();
        const currentData = todayProgress.value || {};
        const bodyData = {
            date: currentDate.value,
            ...currentData,
            [fieldName]: value
        };
        
        if ('token' in bodyData) {
            delete bodyData.token;
        }

        const response = await fetch(`${API_URL}/progress`, {
            method: 'POST',
            headers,
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
            throw new Error('No se pudo guardar el progreso');
        }

        await loadMetrics();
    } catch (error) {
        console.error(error);
        showToast('Error al registrar progreso diario', 'danger');

        // Revertir el cambio local en caso de error
        if (todayProgress.value) {
            if (originalValue === undefined) {
                delete todayProgress.value[fieldName];
            } else {
                todayProgress.value[fieldName] = originalValue;
            }
            todayProgress.value = { ...todayProgress.value };
        }
    }
};

// Incrementar ingesta de agua
const addWater = async (amountMl: number) => {
    const currentWater = todayProgress.value?.waterIntake || 0;
    const newWater = currentWater + amountMl;
    await saveProgressField('waterIntake', newWater);
    showToast(`+${amountMl}ml de agua registrados`);
};

// Guardar Peso / Altura en el perfil
const updateProfileData = async (weight: number | null, height: number | null) => {
    try {
        const headers = getHeaders();
        const bodyData: any = {};
        if (weight !== null) bodyData.weight = weight;
        if (height !== null) bodyData.height = height;

        const response = await fetch(`${API_URL}/user/profile`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
            throw new Error('No se pudo actualizar el perfil');
        }

        if (weight !== null) {
            await saveProgressField('weight', weight);
        }

        await loadMetrics();
        showToast('Perfil actualizado correctamente');
    } catch (error) {
        console.error(error);
        showToast('Error al actualizar perfil', 'danger');
    }
};

// Modal Personalizado Lógica de Estado
const activeModal = ref<'weight' | 'height' | 'sleep' | 'calories' | 'stress' | 'energy' | 'muscleSoreness' | 'protein' | 'carbs' | 'fat' | 'heartRate' | 'vo2Max' | 'bodyFat' | 'muscleMass' | null>(null);
const modalInputValue = ref<string>('');
const modalError = ref<string>('');

const openEditModal = (type: 'weight' | 'height' | 'sleep' | 'calories' | 'stress' | 'energy' | 'muscleSoreness' | 'protein' | 'carbs' | 'fat' | 'heartRate' | 'vo2Max' | 'bodyFat' | 'muscleMass') => {
    activeModal.value = type;
    modalError.value = '';
    
    // Mapear campos actuales del resumen
    const mapFields: Record<string, keyof typeof summary.value> = {
        weight: 'weight',
        height: 'height',
        sleep: 'sleep',
        calories: 'calories',
        stress: 'stress',
        energy: 'energy',
        muscleSoreness: 'muscleSoreness',
        protein: 'protein',
        carbs: 'carbs',
        fat: 'fat',
        heartRate: 'heartRate',
        vo2Max: 'vo2Max',
        bodyFat: 'bodyFat',
        muscleMass: 'muscleMass'
    };
    
    const summaryField = mapFields[type] || type;
    const val = summary.value[summaryField];
    modalInputValue.value = val !== null && val !== undefined ? val.toString() : '';
    
    if (type === 'sleep') {
        if (val && !isNaN(parseFloat(val.toString()))) {
            const hours = parseFloat(val.toString());
            const bedH = 23;
            let wakeH = (bedH + Math.floor(hours)) % 24;
            let wakeM = Math.round((hours % 1) * 60);
            bedtime.value = '23:00';
            waketime.value = `${wakeH.toString().padStart(2, '0')}:${wakeM.toString().padStart(2, '0')}`;
        } else {
            bedtime.value = '23:00';
            waketime.value = '07:00';
            modalInputValue.value = '8.0';
        }
    }
};

const closeEditModal = () => {
    activeModal.value = null;
    modalInputValue.value = '';
    modalError.value = '';
};

const saveModalMetric = async () => {
    modalError.value = '';
    const val = parseFloat(modalInputValue.value);
    const type = activeModal.value;
    if (!type) return;

    if (type === 'weight' || type === 'height' || type === 'vo2Max' || type === 'bodyFat' || type === 'muscleMass') {
        if (!isNaN(val) && val > 0) {
            if (type === 'weight' || type === 'height') {
                const w = type === 'weight' ? val : null;
                const h = type === 'height' ? val : null;
                await updateProfileData(w, h);
            } else {
                await saveProgressField(type, val);
            }
            closeEditModal();
        } else {
            modalError.value = 'Debe ser un número mayor a 0.';
        }
    } else if (type === 'sleep') {
        if (!isNaN(val) && val >= 0 && val <= 24) {
            await saveProgressField('sleepHours', val);
            showToast(`${val} hrs de sueño registradas`);
            closeEditModal();
        } else {
            modalError.value = 'Las horas de sueño deben estar entre 0 y 24.';
        }
    } else if (type === 'calories' || type === 'protein' || type === 'carbs' || type === 'fat' || type === 'heartRate') {
        const intVal = parseInt(modalInputValue.value);
        const nameMap: Record<string, string> = {
            calories: 'caloriesConsumed',
            protein: 'proteinConsumed',
            carbs: 'carbsConsumed',
            fat: 'fatConsumed',
            heartRate: 'heartRate'
        };
        const dbField = nameMap[type] || type;
        if (!isNaN(intVal) && intVal >= 0) {
            await saveProgressField(dbField, intVal);
            const units: Record<string, string> = { calories: 'kcal', protein: 'g', carbs: 'g', fat: 'g', heartRate: 'lpm' };
            showToast(`${intVal} ${units[type]} registrados`);
            closeEditModal();
        } else {
            modalError.value = 'Debe ser un número mayor o igual a 0.';
        }
    } else if (type === 'stress' || type === 'energy' || type === 'muscleSoreness') {
        const score = parseInt(modalInputValue.value);
        if (!isNaN(score) && score >= 1 && score <= 5) {
            await saveProgressField(type, score);
            showToast(`Nivel ${score}/5 registrado`);
            closeEditModal();
        } else {
            modalError.value = 'Selecciona una puntuación válida de 1 a 5.';
        }
    }
};

const editWeight = () => openEditModal('weight');
const editHeight = () => openEditModal('height');
const editSleep = () => openEditModal('sleep');
const editCalories = () => openEditModal('calories');

// Calculadora IMC
const calculateIMC = async () => {
    const weight = summary.value.weight;
    const height = summary.value.height;

    if (!weight || !height) {
        const alert = await alertController.create({
            header: 'Datos incompletos',
            message: 'Por favor, registra tu Peso y Estatura antes de calcular tu IMC.',
            buttons: ['Entendido']
        });
        await alert.present();
        return;
    }

    const heightInMeters = height / 100;
    const imc = weight / (heightInMeters * heightInMeters);
    const imcFormatted = imc.toFixed(1);

    let classification = '';
    let color = '';
    if (imc < 18.5) {
        classification = 'Bajo peso';
        color = '#f59e0b';
    } else if (imc < 25) {
        classification = 'Peso Saludable';
        color = '#10b981';
    } else if (imc < 30) {
        classification = 'Sobrepeso';
        color = '#f59e0b';
    } else {
        classification = 'Obesidad';
        color = '#ef4444';
    }

    const alert = await alertController.create({
        header: 'Cálculo de IMC',
        message: `
            <div style="text-align: center; margin-bottom: 12px;">
                <p style="font-size: 14px; margin: 4px 0;">Tu Índice de Masa Corporal es:</p>
                <h1 style="font-size: 38px; font-weight: 800; margin: 6px 0; color: ${color};">${imcFormatted}</h1>
                <p style="font-size: 16px; font-weight: 700; margin: 4px 0;">Clasificación: ${classification}</p>
            </div>
            <hr style="opacity: 0.15; margin: 12px 0;" />
            <p style="font-size: 11px; color: var(--ion-color-medium); text-align: justify; line-height: 1.35; margin: 0;">
                <b>Aviso Importante:</b> Este cálculo es puramente orientativo y de uso deportivo general. No representa ningún tipo de diagnóstico clínico, médico o nutricional personalizado. Por favor, consulta a un médico matriculado o nutricionista profesional para evaluaciones terapéuticas.
            </p>
        `,
        buttons: ['Entendido']
    });
    await alert.present();
};

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
        allProgress.value = Array.isArray(progressData) ? progressData : [];
        todayProgress.value = allProgress.value.find((p: any) => toDateKey(p.date) === currentDate.value) || null;
        userProfile.value = await profileRes.json();
        userPlan.value = await planRes.json();

        // Guardar en la caché local
        localStorage.setItem('cache_metrics', JSON.stringify(metrics.value));
        localStorage.setItem('cache_all_progress', JSON.stringify(allProgress.value));
        localStorage.setItem('cache_user_profile', JSON.stringify(userProfile.value));
        localStorage.setItem('cache_user_plan', JSON.stringify(userPlan.value));
    } catch (error) {
        console.error(error);
        showToast('Error al cargar datos del dashboard', 'danger');
    }
};

onIonViewWillEnter(() => {
    checkDeviceConnection();
    loadProfileData();

    // Cargar caché local para 0ms de carga en transiciones
    const cachedMetrics = localStorage.getItem('cache_metrics');
    const cachedProgress = localStorage.getItem('cache_all_progress');
    const cachedProfile = localStorage.getItem('cache_user_profile');
    const cachedPlan = localStorage.getItem('cache_user_plan');

    if (cachedMetrics) metrics.value = JSON.parse(cachedMetrics);
    if (cachedProgress) {
        allProgress.value = JSON.parse(cachedProgress);
        todayProgress.value = allProgress.value.find((p: any) => toDateKey(p.date) === currentDate.value) || null;
    }
    if (cachedProfile) userProfile.value = JSON.parse(cachedProfile);
    if (cachedPlan) userPlan.value = JSON.parse(cachedPlan);

    loadMetrics();
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
                        @click="calculateIMC"
                    >
                        <ion-icon :icon="calculatorOutline" class="action-icon"></ion-icon>
                        <span class="action-label">Calculadora IMC</span>
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
                    <div class="summary-card interactive-card" @click="openEditModal('sleep')">
                        <div class="card-header-row">
                            <span class="summary-label">Sueño</span>
                            <ion-icon :icon="moonOutline" class="edit-icon"></ion-icon>
                        </div>
                        <span class="summary-value">{{ summary.sleep ?? '--' }} <small>hrs</small></span>
                        <span class="summary-meta">Registrar sueño</span>
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
                    <div class="summary-card interactive-card" @click="openEditModal('muscleSoreness')">
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

                    <!-- IMC -->
                    <div class="summary-card" style="cursor: default;">
                        <div class="card-header-row">
                            <span class="summary-label">IMC</span>
                            <ion-icon :icon="calculatorOutline" class="edit-icon" style="color: var(--forgy-text-secondary);"></ion-icon>
                        </div>
                        <span class="summary-value">{{ calculatedImc ?? '--' }}</span>
                        <span class="summary-meta">{{ imcClassification || 'Calculado' }}</span>
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
                                    <ion-icon :icon="ach.unlocked ? trophyOutline : ribbonOutline" class="ach-icon"></ion-icon>
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

            <!-- Plan personalizado -->
            <div class="section-container">
                <div class="section-title">
                    <span>Tu plan</span>
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

            <!-- Seccion removida de aqui y movida arriba -->

            <!-- Bottom Spacing -->
            <div class="bottom-space"></div>
        </ion-content>

        <!-- Modal Personalizado Minimalista -->
        <div v-if="activeModal" class="custom-modal-overlay" @click.self="closeEditModal">
            <div class="custom-modal-container">
                <div class="custom-modal-header">
                    <h3 class="custom-modal-title">
                        {{ 
                            activeModal === 'weight' ? 'Registrar Peso' :
                            activeModal === 'height' ? 'Registrar Estatura' :
                            activeModal === 'sleep' ? 'Registrar Sueño' :
                            activeModal === 'calories' ? 'Registrar Calorías' :
                            activeModal === 'protein' ? 'Registrar Proteínas' :
                            activeModal === 'carbs' ? 'Registrar Carbohidratos' :
                            activeModal === 'fat' ? 'Registrar Grasas' :
                            activeModal === 'stress' ? 'Nivel de Estrés' :
                            activeModal === 'energy' ? 'Nivel de Energía' :
                            activeModal === 'muscleSoreness' ? 'Dolor Muscular' :
                            activeModal === 'heartRate' ? 'Ritmo Cardíaco' :
                            activeModal === 'vo2Max' ? 'Registrar VO2 Max' :
                            activeModal === 'bodyFat' ? 'Grasa Corporal' :
                            activeModal === 'muscleMass' ? 'Masa Muscular' : ''
                        }}
                    </h3>
                </div>
                <div class="custom-modal-body">
                    <!-- Interfaz de Sueño Especial -->
                    <div v-if="activeModal === 'sleep'" class="sleep-time-picker">
                        <div class="time-inputs-row">
                            <div class="time-input-group">
                                <label class="time-input-label">Hora de acostarse</label>
                                <input
                                    v-model="bedtime"
                                    type="time"
                                    class="time-picker-input"
                                    @change="calculateSleepHoursFromTimes"
                                />
                            </div>
                            <div class="time-input-group">
                                <label class="time-input-label">Hora de levantarse</label>
                                <input
                                    v-model="waketime"
                                    type="time"
                                    class="time-picker-input"
                                    @change="calculateSleepHoursFromTimes"
                                />
                            </div>
                        </div>
                        <div class="smartwatch-sync-container">
                            <ion-button
                                expand="block"
                                size="small"
                                fill="outline"
                                class="sync-smartwatch-btn"
                                @click="syncSmartwatchSleep"
                            >
                                <ion-icon :icon="pulseOutline" slot="start"></ion-icon>
                                Sincronizar Smartwatch
                            </ion-button>
                        </div>
                        <div class="sleep-result-display">
                            <span class="sleep-result-label">Horas de sueño:</span>
                            <span class="sleep-result-value">{{ modalInputValue || '0.0' }} hrs</span>
                        </div>
                    </div>

                    <!-- Selector de Escala 1-5 (Estrés, Energía, Dolor Muscular) -->
                    <div v-else-if="['stress', 'energy', 'muscleSoreness'].includes(activeModal)" class="scale-selector">
                        <p class="scale-subtitle">
                            {{
                                activeModal === 'stress' ? '1 = Relajado, 5 = Muy Estresado' :
                                activeModal === 'energy' ? '1 = Muy Agotado, 5 = Energía Máxima' :
                                activeModal === 'muscleSoreness' ? '1 = Sin Dolor, 5 = Dolor Extremo' : ''
                            }}
                        </p>
                        <div class="scale-buttons">
                            <button
                                v-for="num in 5"
                                :key="num"
                                type="button"
                                class="scale-btn"
                                :class="{ active: modalInputValue === num.toString() }"
                                @click="modalInputValue = num.toString()"
                            >
                                {{ num }}
                            </button>
                        </div>
                    </div>
                    
                    <!-- Entrada Numérica Estándar -->
                    <div v-else class="input-container">
                        <input
                            v-model="modalInputValue"
                            type="number"
                            step="any"
                            class="custom-modal-input"
                            :placeholder="
                                activeModal === 'weight' ? 'Ej: 75.5' :
                                activeModal === 'height' ? 'Ej: 175' :
                                activeModal === 'calories' ? 'Ej: 2200' :
                                activeModal === 'protein' ? 'Ej: 140' :
                                activeModal === 'carbs' ? 'Ej: 250' :
                                activeModal === 'fat' ? 'Ej: 70' :
                                activeModal === 'heartRate' ? 'Ej: 68' :
                                activeModal === 'vo2Max' ? 'Ej: 48.5' :
                                activeModal === 'bodyFat' ? 'Ej: 14.5' :
                                activeModal === 'muscleMass' ? 'Ej: 36.2' : ''
                            "
                            @keyup.enter="saveModalMetric"
                            autofocus
                        />
                        <span class="custom-modal-unit">
                            {{
                                activeModal === 'weight' ? 'kg' :
                                activeModal === 'height' ? 'cm' :
                                activeModal === 'calories' ? 'kcal' :
                                activeModal === 'protein' ? 'g' :
                                activeModal === 'carbs' ? 'g' :
                                activeModal === 'fat' ? 'g' :
                                activeModal === 'heartRate' ? 'lpm' :
                                activeModal === 'vo2Max' ? '' :
                                activeModal === 'bodyFat' ? '%' :
                                activeModal === 'muscleMass' ? 'kg' : ''
                            }}
                        </span>
                    </div>
                    <p v-if="modalError" class="custom-modal-error">{{ modalError }}</p>
                </div>
                <div class="custom-modal-footer">
                    <button class="custom-modal-btn btn-cancel" @click="closeEditModal">Cancelar</button>
                    <button class="custom-modal-btn btn-save" @click="saveModalMetric">Guardar</button>
                </div>
            </div>
        </div>
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

/* Custom Minimalist Modal Overlay */
.custom-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.custom-modal-container {
    background: var(--forgy-card-bg);
    border: 1px solid var(--ion-border-color);
    border-radius: 8px;
    width: 90%;
    max-width: 340px;
    padding: 20px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.custom-modal-header {
    margin-bottom: 16px;
}

.custom-modal-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--forgy-text-primary);
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

.custom-modal-body {
    margin-bottom: 20px;
}

.input-container {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--forgy-input-bg);
    border: 1px solid var(--ion-border-color);
    border-radius: 6px;
    padding: 2px 12px;
}

.input-container:focus-within {
    border-color: var(--ion-color-primary);
}

.custom-modal-input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: var(--forgy-text-primary);
    font-size: 16px;
    font-weight: 600;
    padding: 10px 0;
}

/* Remove arrows from number input */
.custom-modal-input::-webkit-outer-spin-button,
.custom-modal-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
.custom-modal-input[type=number] {
    -moz-appearance: textfield;
}

.custom-modal-unit {
    color: var(--forgy-text-secondary);
    font-size: 13px;
    font-weight: 600;
    margin-left: 8px;
}

.custom-modal-error {
    color: var(--ion-color-danger);
    font-size: 11px;
    margin: 6px 0 0 0;
    font-weight: 500;
}

.custom-modal-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.custom-modal-btn {
    background: transparent;
    border: none;
    outline: none;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 4px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.2s ease;
}

.btn-cancel {
    color: var(--forgy-text-secondary);
    border: 1px solid transparent;
}

.btn-cancel:active {
    background: var(--forgy-input-bg);
}

.btn-save {
    background: var(--ion-color-primary);
    color: white;
}

.btn-save:active {
    background: var(--ion-color-primary-shade);
}

/* Scale Selector 1-5 */
.scale-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}
.scale-subtitle {
    font-size: 11px;
    color: var(--forgy-text-secondary);
    margin: 0;
    text-align: center;
}
.scale-buttons {
    display: flex;
    justify-content: space-between;
    gap: 8px;
}
.scale-btn {
    flex: 1;
    height: 38px;
    background: var(--forgy-input-bg);
    border: 1px solid var(--ion-border-color);
    border-radius: 6px;
    color: var(--forgy-text-primary);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}
.scale-btn:active {
    background: var(--ion-color-primary-shade);
    color: white;
}
.scale-btn.active {
    background: var(--ion-color-primary);
    border-color: var(--ion-color-primary);
    color: white;
}

/* Health Integrations */
.health-integrations-card {
    background: var(--forgy-card-bg);
    border: 1px solid var(--ion-border-color);
    border-radius: 8px;
    padding: 14px;
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.integrations-header {
    display: flex;
    align-items: center;
    gap: 10px;
}
.integration-main-icon {
    font-size: 20px;
    color: var(--ion-color-primary);
}
.integrations-title-group {
    display: flex;
    flex-direction: column;
}
.integrations-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--forgy-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.02em;
}
.integrations-subtitle {
    font-size: 9px;
    color: var(--forgy-text-secondary);
}
.integrations-pills {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}
.integration-pill {
    background: var(--forgy-input-bg);
    border: 1px solid var(--ion-border-color);
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    color: var(--forgy-text-secondary);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.integration-pill.active {
    color: var(--forgy-text-primary);
    border-color: rgba(var(--ion-color-primary-rgb), 0.3);
}
.integration-pill small {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
}
.integration-pill.active small {
    color: var(--ion-color-primary);
}

/* Gamification */
.gamification-card {
    background: var(--forgy-card-bg);
    border: 1px solid var(--ion-border-color);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.level-status-row {
    display: flex;
    align-items: center;
    gap: 12px;
}
.level-badge {
    background: var(--ion-color-primary);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.level-number {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.02em;
}
.xp-bar-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.xp-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.xp-label-primary {
    font-size: 11px;
    font-weight: 700;
    color: var(--forgy-text-primary);
}
.xp-label-secondary {
    font-size: 9px;
    font-weight: 600;
    color: var(--forgy-text-secondary);
}
.xp-progress-bg {
    height: 6px;
    background: var(--forgy-input-bg);
    border-radius: 3px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.03);
}
.xp-progress-fill {
    height: 100%;
    background: var(--ion-color-primary);
    border-radius: 3px;
    transition: width 0.4s ease;
}
.gamification-streaks {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}
.streak-mini-card {
    background: var(--forgy-input-bg);
    border: 1px solid var(--ion-border-color);
    border-radius: 6px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
}
.streak-icon {
    font-size: 18px;
}
.streak-icon.active {
    color: var(--ion-color-primary);
}
.streak-icon.best {
    color: var(--ion-color-warning);
}
.streak-data {
    display: flex;
    flex-direction: column;
}
.streak-value {
    font-size: 14px;
    font-weight: 800;
    color: var(--forgy-text-primary);
    line-height: 1.1;
}
.streak-label {
    font-size: 8px;
    color: var(--forgy-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.02em;
}
.achievements-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-top: 1px solid var(--ion-border-color);
    padding-top: 14px;
}
.achievements-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--forgy-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
.achievements-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.achievement-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--forgy-input-bg);
    border: 1px solid var(--ion-border-color);
    border-radius: 6px;
    padding: 10px;
}
.achievement-row.locked {
    opacity: 0.6;
}
.achievement-icon-box {
    width: 32px;
    height: 32px;
    background: rgba(var(--ion-color-primary-rgb), 0.1);
    border: 1px solid rgba(var(--ion-color-primary-rgb), 0.2);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.ach-icon {
    font-size: 16px;
    color: var(--ion-color-primary);
}
.achievement-row.locked .achievement-icon-box {
    background: transparent;
    border-color: var(--ion-border-color);
}
.achievement-row.locked .ach-icon {
    color: var(--forgy-text-secondary);
}
.achievement-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.ach-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.ach-name {
    font-size: 11px;
    font-weight: 700;
    color: var(--forgy-text-primary);
}
.ach-status {
    font-size: 9px;
    font-weight: 700;
    color: var(--ion-color-primary);
    text-transform: uppercase;
}
.achievement-row.locked .ach-status {
    color: var(--forgy-text-secondary);
}
.ach-subtitle {
    font-size: 9px;
    color: var(--forgy-text-secondary);
}
.ach-progress-bar {
    height: 4px;
    background: var(--forgy-card-bg);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 4px;
}
.ach-progress-fill {
    height: 100%;
    background: var(--ion-color-primary);
    border-radius: 2px;
}

/* Date Switcher Header */
.date-switcher-toolbar {
    --background: var(--ion-background-color);
    --border-color: var(--ion-border-color);
}
.header-date-switcher {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 0 4px;
}
.date-nav-btn {
    --color: var(--forgy-text-secondary);
    margin: 0;
    --padding-start: 8px;
    --padding-end: 8px;
}
.header-date-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--forgy-text-primary);
    text-transform: capitalize;
    min-width: 140px;
    text-align: center;
    cursor: pointer;
}

/* Sleep Time Picker Styles */
.sleep-time-picker {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 8px 0;
}
.time-inputs-row {
    display: flex;
    gap: 16px;
}
.time-input-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.time-input-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--forgy-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
.time-picker-input {
    background: var(--forgy-input-bg);
    border: 1px solid var(--ion-border-color);
    border-radius: 6px;
    padding: 10px 12px;
    color: var(--forgy-text-primary);
    font-size: 16px;
    font-weight: 600;
    width: 100%;
    outline: none;
    box-sizing: border-box;
}
.smartwatch-sync-container {
    margin-top: 4px;
}
.sync-smartwatch-btn {
    --border-color: var(--ion-color-secondary);
    --color: var(--ion-color-secondary);
    margin: 0;
    font-weight: 600;
}
.sleep-result-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(var(--ion-color-secondary-rgb), 0.08);
    border: 1px dashed rgba(var(--ion-color-secondary-rgb), 0.25);
    border-radius: 6px;
    padding: 10px 12px;
    margin-top: 4px;
}
.sleep-result-label {
    font-size: 12px;
    color: var(--forgy-text-primary);
    font-weight: 500;
}
.sleep-result-value {
    font-size: 14px;
    color: var(--ion-color-secondary);
    font-weight: 700;
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
