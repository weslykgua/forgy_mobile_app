import { ref, computed, nextTick } from 'vue';
import { useProfile } from '@/utils/useProfile';
import { toastController, alertController } from '@ionic/vue';
import { pulseOutline } from 'ionicons/icons';
import type { DailyProgress, UserProfile, ProgressStats } from '@/interfaces';
import { MONTH_NAMES, TIME_SLOTS, SLEEP_QUALITY_OPTIONS } from '@/constants/calendar';

export function useProgress() {
  const { getHeaders, API_URL, logout } = useProfile();

  // Core State
  const progressData = ref<DailyProgress[]>([]);
  const progressStats = ref<ProgressStats>({
    totalWorkouts: 0,
    totalVolume: 0,
    avgWater: 0,
    weightHistory: [],
    currentWeight: 0,
    streakDays: 0
  });
  const userProfile = ref<UserProfile>({});
  const exercises = ref<any[]>([]);
  const workoutCalendarDates = ref<Record<string, boolean>>({});
  const workoutHistory = ref<any[]>([]);
  const personalRecords = ref<Record<string, any>>({});
  const waterGoal = ref(Number(localStorage.getItem('forgy_water_goal') || '2500'));

  // Calendar State
  const getLocalDateKey = (date = new Date()) => date.toLocaleDateString('en-CA');
  const today = getLocalDateKey();
  const selectedDate = ref(today);

  const now = new Date();
  const currentYear = ref(now.getFullYear());
  const currentMonth = ref(now.getMonth());

  const monthNames = MONTH_NAMES;

  // Modal State
  const activeModal = ref<string | null>(null);
  const modalInputValue = ref<string>('');
  const modalError = ref<string>('');
  const isSaving = ref(false);

  const bedtime = ref('23:00');
  const waketime = ref('07:00');
  const sleepQualityInModal = ref<string>('');

  const timeSlots = TIME_SLOTS;

  const sleepQualityOptions = SLEEP_QUALITY_OPTIONS;

  // Helper formatting / mapping
  const toDateKey = (value: string) => {
    if (!value) return '';
    return value.includes('T') ? value.split('T')[0] : value;
  };

  const formatWater = (ml: number) => (ml / 1000).toFixed(1);
  
  const formatVolume = (vol: number | undefined | null) => {
    if (vol === undefined || vol === null) return '0';
    return vol >= 1000 ? (vol / 1000).toFixed(1) + 'k' : vol.toString();
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 18) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  };

  // Toast / Alert helpers
  let activeToast: HTMLIonToastElement | null = null;
  const showToast = async (message: string, color = 'success') => {
    if (activeToast) {
      try {
        await activeToast.dismiss();
      } catch (e) {}
    }
    const toast = await toastController.create({ message, duration: 1500, color, position: 'bottom' });
    activeToast = toast;
    await toast.present();
  };

  // Calendar actions
  const selectDate = (dateKey: string) => {
    selectedDate.value = dateKey;
  };

  const prevMonth = () => {
    if (currentMonth.value === 0) {
      currentMonth.value = 11;
      currentYear.value--;
    } else {
      currentMonth.value--;
    }
  };

  const nextMonth = () => {
    if (currentMonth.value === 11) {
      currentMonth.value = 0;
      currentYear.value++;
    } else {
      currentMonth.value++;
    }
  };

  const formattedSelectedDate = computed(() => {
    if (selectedDate.value === today) return 'Hoy';
    const d = new Date(selectedDate.value + 'T12:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  });

  const checkIfDateHasData = (dateKey: string) => {
    const hasProgress = progressData.value.some(
      p => p.date === dateKey && (p.waterIntake || p.weight || p.sleepHours || p.caloriesConsumed || p.caloriesBurned)
    );
    const hasWorkout = workoutCalendarDates.value[dateKey] || false;
    return hasProgress || hasWorkout;
  };

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
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYearIdx = month === 0 ? year - 1 : year;
      const dateKey = `${prevYearIdx}-${(prevMonthIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
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
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYearIdx = month === 11 ? year + 1 : year;
      const dateKey = `${nextYearIdx}-${(nextMonthIdx + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
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

  const getBarHeight = (weight: number) => {
    const weights = weightHistory.value.map(w => w.weight);
    if (weights.length === 0) return 50;
    const min = Math.min(...weights) - 2;
    const max = Math.max(...weights) + 2;
    return Math.max(20, ((weight - min) / (max - min)) * 100);
  };

  const mergeLocalWorkouts = () => {
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
  };

  // API loading
  const loadAllData = async () => {
    try {
      const headers = getHeaders();
      if (!headers.Authorization || headers.Authorization === 'Bearer null') {
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
      console.error('Error loading progress data:', error);
    }
  };

  // Water Actions
  const addWater = async (amount: number) => {
    try {
      const headers = getHeaders();
      if (!headers.Authorization || headers.Authorization === 'Bearer null') {
        showToast('Inicia sesión para guardar', 'danger');
        return;
      }

      const currentWater = todayProgress.value?.waterIntake || 0;
      const newWater = Math.max(0, currentWater + amount);
      const addRes = await fetch(`${API_URL}/progress`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: selectedDate.value,
          waterIntake: newWater
        })
      });
      if (!addRes.ok) {
        throw new Error('No se pudo guardar el agua');
      }
      if (amount > 0) {
        showToast(`+${amount}ml 💧`);
      } else {
        showToast(`${amount}ml 💧`, 'warning');
      }
      loadAllData();
    } catch (error) {
      showToast('Error', 'danger');
    }
  };

  const changeWaterGoal = async () => {
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
  };

  const addCustomWater = async () => {
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
  };

  // Edit Metric Modal actions (compatible with DashboardMetricModal)
  const openEditModal = (type: string) => {
    activeModal.value = type;
    modalError.value = '';

    const summaryFields: Record<string, string> = {
      weight: 'weight',
      sleep: 'sleepHours',
      calories: 'caloriesConsumed'
    };

    const targetField = summaryFields[type] || type;
    const val = todayProgress.value ? (todayProgress.value as any)[targetField] : null;

    modalInputValue.value = val !== null && val !== undefined ? val.toString() : '';

    if (type === 'sleep') {
      sleepQualityInModal.value = (todayProgress.value?.mood ?? '').toString();
      if (val && !isNaN(parseFloat(val.toString()))) {
        const hours = parseFloat(val.toString());
        const bedH = 23;
        const wakeH = (bedH + Math.floor(hours)) % 24;
        const wakeM = Math.round((hours % 1) * 60);
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

  const normalizeNumber = (value: unknown, { asInt = false } = {}) => {
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
  };

  const saveModalMetric = async () => {
    if (isSaving.value) return;
    isSaving.value = true;
    setTimeout(() => { isSaving.value = false; }, 1500);

    modalError.value = '';
    const val = parseFloat(modalInputValue.value);
    const type = activeModal.value;
    if (!type) return;

    try {
      const headers = getHeaders();
      if (!headers.Authorization || headers.Authorization === 'Bearer null') {
        showToast('Inicia sesión para guardar', 'danger');
        return;
      }

      // Build payload matching progress schema
      const current: any = todayProgress.value || {};
      const payload: Record<string, any> = {
        weight: current.weight,
        waterIntake: current.waterIntake,
        caloriesConsumed: current.caloriesConsumed,
        caloriesBurned: current.caloriesBurned,
        sleepHours: current.sleepHours,
        mood: current.mood
      };

      if (type === 'weight') {
        if (!isNaN(val) && val > 0) {
          payload.weight = normalizeNumber(val);
        } else {
          modalError.value = 'Debe ser un número mayor a 0.';
          return;
        }
      } else if (type === 'sleep') {
        if (!isNaN(val) && val >= 0 && val <= 24) {
          payload.sleepHours = normalizeNumber(val);
          if (sleepQualityInModal.value) {
            const score = parseInt(sleepQualityInModal.value);
            if (!isNaN(score) && score >= 1 && score <= 5) {
              payload.mood = score.toString();
            }
          }
        } else {
          modalError.value = 'Las horas de sueño deben estar entre 0 y 24.';
          return;
        }
      } else if (type === 'calories') {
        if (!isNaN(val) && val >= 0) {
          payload.caloriesConsumed = normalizeNumber(val, { asInt: true });
        } else {
          modalError.value = 'Debe ser un número mayor o igual a 0.';
          return;
        }
      }

      const saveRes = await fetch(`${API_URL}/progress`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ date: selectedDate.value, ...payload })
      });

      if (!saveRes.ok) {
        throw new Error('No se pudo guardar el progreso');
      }

      showToast('¡Progreso guardado! 💪');
      closeEditModal();
      loadAllData();
    } catch (error) {
      showToast('Error al guardar', 'danger');
    }
  };

  const calculateSleepHoursFromTimes = () => {
    if (!bedtime.value || !waketime.value) return;
    const [bedH, bedM] = bedtime.value.split(':').map(Number);
    const [wakeH, wakeM] = waketime.value.split(':').map(Number);

    let diffMins = (wakeH * 60 + wakeM) - (bedH * 60 + bedM);
    if (diffMins < 0) {
      diffMins += 24 * 60;
    }
    const hours = diffMins / 60;
    modalInputValue.value = hours.toFixed(1);
  };

  const applyPresetHours = (hours: number) => {
    modalInputValue.value = hours.toString();
    if (!bedtime.value) return;
    const [bedH, bedM] = bedtime.value.split(':').map(Number);
    const totalMins = bedH * 60 + bedM + Math.round(hours * 60);
    const wakeH = Math.floor((totalMins % (24 * 60)) / 60);
    const wakeM = totalMins % 60;
    const snappedM = wakeM < 15 ? 0 : wakeM < 45 ? 30 : 0;
    const snappedH = wakeM >= 45 ? (wakeH + 1) % 24 : wakeH;
    waketime.value = `${snappedH.toString().padStart(2, '0')}:${snappedM.toString().padStart(2, '0')}`;
  };

  const syncSmartwatchSleep = () => {
    // Check local connects or simulate
    const isHealthConnected = localStorage.getItem('health_devices_connected') === 'true';
    if (!isHealthConnected) {
      showToast('Conecta un dispositivo de salud en tu perfil primero', 'warning');
      return;
    }
    bedtime.value = '22:45';
    waketime.value = '07:00';
    modalInputValue.value = '8.3';
    showToast('Datos sincronizados de tu reloj inteligente: 8.3 horas de sueño.');
  };

  // Cache loading helper
  const initCache = () => {
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
  };

  initCache();

  return {
    progressData,
    progressStats,
    userProfile,
    exercises,
    workoutCalendarDates,
    workoutHistory,
    personalRecords,
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
    displayHeight,
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

    // Modal exposes
    activeModal,
    modalInputValue,
    modalError,
    isSaving,
    bedtime,
    waketime,
    sleepQualityInModal,
    timeSlots,
    sleepQualityOptions,
    openEditModal,
    closeEditModal,
    saveModalMetric,
    calculateSleepHoursFromTimes,
    applyPresetHours,
    syncSmartwatchSleep
  };
}
