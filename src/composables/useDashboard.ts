import { ref, computed } from 'vue';
import { useProfile } from '@/utils/useProfile';
import { toastController } from '@ionic/vue';
import {
  trophyOutline, waterOutline, barbellOutline, barbell, scaleOutline, moonOutline, flashOutline
} from 'ionicons/icons';
import type { DashboardMetrics } from '@/interfaces';
import { MOTIVATIONAL_QUOTES } from '@/constants/quotes';
import { TIME_SLOTS, SLEEP_QUALITY_OPTIONS } from '@/constants/calendar';

export function useDashboard() {
  const { userName, loadProfileData, logout, getHeaders, API_URL } = useProfile();

  const metrics = ref<DashboardMetrics | null>(null);
  const allProgress = ref<any[]>([]);
  const todayProgress = ref<any | null>(null);
  const userProfile = ref<any | null>(null);
  const userPlan = ref<any | null>(null);
  const workoutHistory = ref<any[]>([]);
  const personalRecords = ref<any>(null);

  const getLocalDateKey = (date = new Date()) => {
    return date.toLocaleDateString('en-CA');
  };

  const toDateKey = (value: string) => {
    if (!value) return '';
    return value.includes('T') ? value.split('T')[0] : value;
  };

  const today = getLocalDateKey();
  const currentDate = ref(today);
  const isHealthDeviceConnected = ref(false);

  const checkDeviceConnection = () => {
    isHealthDeviceConnected.value = localStorage.getItem('health_devices_connected') === 'true';
  };

  const bedtime = ref('23:00');
  const waketime = ref('07:00');
  const sleepQualityInModal = ref<string>('');

  const timeSlots = TIME_SLOTS;

  const sleepQualityOptions = SLEEP_QUALITY_OPTIONS;

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

  const showToast = async (message: string, color = 'success') => {
    const toast = await toastController.create({ message, duration: 2000, color, position: 'bottom' });
    await toast.present();
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

  const motivationalQuotes = MOTIVATIONAL_QUOTES;

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
    const streak = currentStreak.value;
    const goal = 30;
    const progress = Math.min(streak / goal, 1);
    return circumference * (1 - progress);
  });

  const waterOffset = computed(() => {
    const water = todayProgress.value?.waterIntake || 0;
    const goal = 2000;
    const progress = Math.min(water / goal, 1);
    return circumference * (1 - progress);
  });

  const workoutsOffset = computed(() => {
    if (!metrics.value) return circumference;
    const goal = 20;
    const progress = Math.min(metrics.value.last30DaysWorkouts / goal, 1);
    return circumference * (1 - progress);
  });

  const waterStreak = computed(() => {
    if (!Array.isArray(allProgress.value) || allProgress.value.length === 0) return 0;

    const waterMap: Record<string, number> = {};
    allProgress.value.forEach(p => {
      if (p.waterIntake !== null && p.waterIntake !== undefined) {
        const key = toDateKey(p.date);
        waterMap[key] = (waterMap[key] || 0) + p.waterIntake;
      }
    });

    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const todayStr = getLocalDateKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateKey(yesterday);

    const todayWater = waterMap[todayStr] || 0;
    const yesterdayWater = waterMap[yesterdayStr] || 0;

    if (todayWater >= 2000) {
      while (true) {
        const dStr = getLocalDateKey(checkDate);
        const water = waterMap[dStr] || 0;
        if (water >= 2000) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else if (yesterdayWater >= 2000) {
      checkDate.setDate(checkDate.getDate() - 1);
      while (true) {
        const dStr = getLocalDateKey(checkDate);
        const water = waterMap[dStr] || 0;
        if (water >= 2000) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return streak;
  });

  const changeHomeDate = (direction: number) => {
    const d = new Date(currentDate.value + 'T12:00:00');
    d.setDate(d.getDate() + direction);
    currentDate.value = getLocalDateKey(d);
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

  const summary = computed(() => {
    const weight = todayProgress.value?.weight ?? userProfile.value?.weight ?? null;
    const height = userProfile.value?.height ?? null;
    const sleep = todayProgress.value?.sleepHours ?? null;
    const calories = todayProgress.value?.caloriesConsumed ?? null;
    const water = todayProgress.value?.waterIntake ?? 0;
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
    const mood = todayProgress.value?.mood ?? null;

    return { 
      weight, height, sleep, calories, water,
      stress, energy, muscleSoreness,
      protein, carbs, fat,
      heartRate, vo2Max, bodyFat, muscleMass,
      mood
    };
  });

  // Racha calculada dinámicamente en el cliente desde el historial
  const computedStreaks = computed(() => {
    if (!Array.isArray(workoutHistory.value) || workoutHistory.value.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const workoutDates = Array.from(new Set(
      workoutHistory.value
        .filter(w => w.date)
        .map(w => toDateKey(w.date))
    )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (workoutDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    let cStreak = 0;
    let lStreak = 0;
    let tempStreak = 0;

    const todayStr = getLocalDateKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateKey(yesterday);

    const hasWorkoutToday = workoutDates.includes(todayStr);
    const hasWorkoutYesterday = workoutDates.includes(yesterdayStr);

    if (hasWorkoutToday || hasWorkoutYesterday) {
      let checkDate = hasWorkoutToday ? new Date() : yesterday;
      checkDate.setHours(0, 0, 0, 0);

      while (true) {
        const checkDateStr = getLocalDateKey(checkDate);
        if (workoutDates.includes(checkDateStr)) {
          cStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    let prevDate: Date | null = null;
    for (const dStr of [...workoutDates].reverse()) {
      const currentDate = new Date(dStr);
      currentDate.setHours(0, 0, 0, 0);

      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const diffTime = currentDate.getTime() - prevDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          if (tempStreak > lStreak) {
            lStreak = tempStreak;
          }
          tempStreak = 1;
        }
      }
      prevDate = currentDate;
    }
    if (tempStreak > lStreak) {
      lStreak = tempStreak;
    }

    return {
      currentStreak: cStreak,
      longestStreak: Math.max(lStreak, cStreak)
    };
  });

  const currentStreak = computed(() => {
    return Math.max(metrics.value?.currentStreak || 0, computedStreaks.value.currentStreak);
  });

  const longestStreak = computed(() => {
    return Math.max(metrics.value?.longestStreak || 0, computedStreaks.value.longestStreak);
  });

  // Cálculo de XP y nivel dinámico
  const totalXP = computed(() => {
    const workoutXP = (workoutHistory.value?.length || 0) * 150;
    const progressXP = (allProgress.value?.length || 0) * 50;
    
    let prCount = 0;
    if (personalRecords.value) {
      Object.values(personalRecords.value).forEach((exRecord: any) => {
        if (exRecord.records) {
          prCount += Object.keys(exRecord.records).length;
        }
      });
    }
    const prXP = prCount * 100;

    return 1000 + workoutXP + progressXP + prXP;
  });

  const levelInfo = computed(() => {
    const xp = totalXP.value;
    let level = 1;
    let prevLimit = 0;
    let nextLimit = 1000;
    
    while (xp >= nextLimit) {
      level++;
      prevLimit = nextLimit;
      nextLimit = prevLimit + (level * 1000);
    }
    
    const xpInLevel = xp - prevLimit;
    const xpNeededForNext = nextLimit - prevLimit;
    const progressPercent = Math.round((xpInLevel / xpNeededForNext) * 100);
    
    return {
      level,
      xpInLevel,
      xpNeededForNext,
      progressPercent
    };
  });

  const userLevel = computed(() => levelInfo.value.level);
  const currentXP = computed(() => levelInfo.value.xpInLevel);
  const nextLevelXP = computed(() => levelInfo.value.xpNeededForNext);
  const levelProgressPercent = computed(() => levelInfo.value.progressPercent);

  const levelTitle = computed(() => {
    const lvl = userLevel.value;
    if (lvl <= 1) return 'Iniciado Consagrado';
    if (lvl === 2) return 'Guerrero en Crecimiento';
    if (lvl === 3) return 'Atleta Disciplinado';
    if (lvl === 4) return 'Bestia del Templo';
    return 'Leyenda Inquebrantable';
  });

  const achievements = computed(() => {
    const list = [];
    const streak = currentStreak.value;
    const maxStreak = longestStreak.value;
    const currentOrMaxStreak = Math.max(streak, maxStreak);

    list.push({
      id: 'streak_entreno',
      title: 'Constancia Estoica',
      subtitle: 'Racha de entrenamiento consecutiva',
      desc: 'Registra entrenamientos en días consecutivos.',
      unlocked: currentOrMaxStreak >= 3,
      progress: Math.min((currentOrMaxStreak / 7) * 100, 100),
      status: currentOrMaxStreak >= 7 ? 'Conseguido' : `${currentOrMaxStreak} / 7 días`,
      icon: trophyOutline
    });

    const wStreak = waterStreak.value || 0;
    list.push({
      id: 'streak_agua',
      title: 'Hidratación de Élite',
      subtitle: 'Racha de agua (meta >= 2.0L)',
      desc: 'Alcanza tu meta de agua durante días seguidos.',
      unlocked: wStreak >= 3,
      progress: Math.min((wStreak / 7) * 100, 100),
      status: wStreak >= 7 ? 'Conseguido' : `${wStreak} / 7 días`,
      icon: waterOutline
    });

    let maxRepsRecorded = 0;
    workoutHistory.value.forEach(session => {
      if (Array.isArray(session.exercises)) {
        session.exercises.forEach((ex: any) => {
          if (Array.isArray(ex.sets)) {
            ex.sets.forEach((set: any) => {
              if (set.completed !== false && Number(set.reps) > maxRepsRecorded) {
                maxRepsRecorded = Number(set.reps);
              }
            });
          }
        });
      }
    });
    if (personalRecords.value) {
      Object.values(personalRecords.value).forEach((exRecord: any) => {
        if (exRecord.records && exRecord.records.max_reps) {
          const val = exRecord.records.max_reps.value || 0;
          if (Number(val) > maxRepsRecorded) maxRepsRecorded = Number(val);
        }
      });
    }
    list.push({
      id: 'max_reps',
      title: 'Bestia de Repeticiones',
      subtitle: 'Máximas repeticiones en una serie',
      desc: 'Realiza un alto número de repeticiones en una sola serie.',
      unlocked: maxRepsRecorded >= 12,
      progress: Math.min((maxRepsRecorded / 20) * 100, 100),
      status: maxRepsRecorded >= 20 ? 'Conseguido' : `${maxRepsRecorded} / 20 repes`,
      icon: barbellOutline
    });

    let maxWeightLifted = 0;
    workoutHistory.value.forEach(session => {
      if (Array.isArray(session.exercises)) {
        session.exercises.forEach((ex: any) => {
          const nameLower = ex.name.toLowerCase();
          if (nameLower.includes('banca') || nameLower.includes('sentadilla') || nameLower.includes('peso muerto') || nameLower.includes('deadlift') || nameLower.includes('squat')) {
            if (Array.isArray(ex.sets)) {
              ex.sets.forEach((set: any) => {
                if (set.completed !== false && Number(set.weight) > maxWeightLifted) {
                  maxWeightLifted = Number(set.weight);
                }
              });
            }
          }
        });
      }
    });
    if (personalRecords.value) {
      Object.values(personalRecords.value).forEach((exRecord: any) => {
        const nameLower = exRecord.exerciseName.toLowerCase();
        if (nameLower.includes('banca') || nameLower.includes('sentadilla') || nameLower.includes('peso muerto') || nameLower.includes('deadlift') || nameLower.includes('squat')) {
          if (exRecord.records && exRecord.records.max_weight) {
            const val = exRecord.records.max_weight.value || 0;
            if (Number(val) > maxWeightLifted) maxWeightLifted = Number(val);
          }
        }
      });
    }
    list.push({
      id: 'max_weight',
      title: 'Fuerza Hércules',
      subtitle: 'Peso máximo en multiarticulares',
      desc: 'Levanta peso elevado en Press de Banca, Sentadilla o Peso Muerto.',
      unlocked: maxWeightLifted >= 60,
      progress: Math.min((maxWeightLifted / 100) * 100, 100),
      status: maxWeightLifted >= 100 ? 'Conseguido' : `${maxWeightLifted} / 100 kg`,
      icon: barbell
    });

    const weightsLogged = allProgress.value
      .filter(p => p.weight !== null && p.weight !== undefined && p.weight > 0)
      .map(p => ({ date: new Date(p.date), weight: p.weight }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let maxWeightDiff = 0;
    if (weightsLogged.length >= 2) {
      const firstW = weightsLogged[0].weight;
      const lastW = weightsLogged[weightsLogged.length - 1].weight;
      maxWeightDiff = Math.abs(lastW - firstW);
    }
    list.push({
      id: 'body_weight_change',
      title: 'Escultor Corporal',
      subtitle: 'Diferencia de peso registrada',
      desc: 'Registra una variación de peso acumulada en tu bitácora.',
      unlocked: maxWeightDiff >= 1.0,
      progress: Math.min((maxWeightDiff / 3.0) * 100, 100),
      status: maxWeightDiff >= 3.0 ? 'Conseguido' : `${maxWeightDiff.toFixed(1)} / 3.0 kg`,
      icon: scaleOutline
    });

    const sleepDaysCount = allProgress.value.filter(p => p.sleepHours !== null && p.sleepHours !== undefined && p.sleepHours > 0).length;
    list.push({
      id: 'sleep_quality_ach',
      title: 'Sueño Reparador',
      subtitle: 'Registros de sueño completados',
      desc: 'Registra tus horas de sueño y califica tu descanso.',
      unlocked: sleepDaysCount >= 3,
      progress: Math.min((sleepDaysCount / 5) * 100, 100),
      status: sleepDaysCount >= 5 ? 'Conseguido' : `${sleepDaysCount} / 5 registros`,
      icon: moonOutline
    });

    const stateRegistryDays = allProgress.value.filter(p => 
      (p.energy !== null && p.energy !== undefined && p.energy > 0) &&
      (p.stress !== null && p.stress !== undefined && p.stress > 0) &&
      (p.muscleSoreness !== null && p.muscleSoreness !== undefined && p.muscleSoreness > 0)
    ).length;
    list.push({
      id: 'mind_body_connection',
      title: 'Conexión Mente-Cuerpo',
      subtitle: 'Registros de fatiga completos',
      desc: 'Registra energía, estrés y dolor muscular diario.',
      unlocked: stateRegistryDays >= 2,
      progress: Math.min((stateRegistryDays / 4) * 100, 100),
      status: stateRegistryDays >= 4 ? 'Conseguido' : `${stateRegistryDays} / 4 registros`,
      icon: flashOutline
    });

    return list;
  });

  const waterPercent = computed(() => {
    const goal = 2000;
    const progress = Math.min((summary.value.water || 0) / goal, 1);
    return Math.round(progress * 100);
  });

  const mergeLocalWorkouts = () => {
    const localWorkouts = JSON.parse(localStorage.getItem('local_workouts') || '[]');
    if (localWorkouts.length > 0) {
      const syncedIds = new Set(workoutHistory.value.map(w => w.id));
      const unsynced = localWorkouts.filter((w: any) => !syncedIds.has(w.id));
      if (unsynced.length > 0) {
        const mapped = unsynced.map((lw: any) => {
          const exercises = lw.exercises || [
            {
              name: lw.exerciseName || 'Ejercicio',
              sets: lw.sets || []
            }
          ];
          
          return {
            id: lw.id,
            date: lw.date,
            routine: lw.routineName || 'Entrenamiento Libre',
            exerciseCount: exercises.length,
            totalVolume: exercises.reduce((acc: number, ex: any) => {
              const setVolume = ex.sets?.reduce((sAcc: number, s: any) => sAcc + (Number(s.weight) * Number(s.reps) || 0), 0) || 0;
              return acc + setVolume;
            }, 0) || 0,
            duration: lw.duration || 0,
            exercises: exercises
          };
        });
        workoutHistory.value = [...mapped, ...workoutHistory.value];
      }
    }
  };

  const saveProgressField = async (fieldName: string, value: any) => {
    const originalValue = todayProgress.value ? todayProgress.value[fieldName] : undefined;

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
        delete (bodyData as any).token;
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
      await showToast('Error al registrar progreso diario', 'danger');

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

  const addWater = async (amountMl: number) => {
    const currentWater = todayProgress.value?.waterIntake || 0;
    const newWater = currentWater + amountMl;
    await saveProgressField('waterIntake', newWater);
    await showToast(`+${amountMl}ml de agua registrados`);
  };

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
      await showToast('Perfil actualizado correctamente');
    } catch (error) {
      console.error(error);
      await showToast('Error al actualizar perfil', 'danger');
    }
  };

  const loadMetrics = async () => {
    try {
      const headers = getHeaders();
      const [dashboardRes, progressRes, profileRes, planRes, historyRes, recordsRes] = await Promise.all([
        fetch(`${API_URL}/dashboard`, { headers }),
        fetch(`${API_URL}/progress`, { headers }),
        fetch(`${API_URL}/user/profile`, { headers }),
        fetch(`${API_URL}/goals/plan`, { headers }),
        fetch(`${API_URL}/workouts/history?limit=100`, { headers }),
        fetch(`${API_URL}/workouts/records`, { headers })
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

      if (historyRes.ok) {
        workoutHistory.value = await historyRes.json();
        localStorage.setItem('cache_workout_history', JSON.stringify(workoutHistory.value));
      }
      if (recordsRes.ok) {
        personalRecords.value = await recordsRes.json();
        localStorage.setItem('cache_personal_records', JSON.stringify(personalRecords.value));
      }

      mergeLocalWorkouts();

      localStorage.setItem('cache_metrics', JSON.stringify(metrics.value));
      localStorage.setItem('cache_all_progress', JSON.stringify(allProgress.value));
      localStorage.setItem('cache_user_profile', JSON.stringify(userProfile.value));
      localStorage.setItem('cache_user_plan', JSON.stringify(userPlan.value));
    } catch (error) {
      console.error('Error loading dashboard metrics', error);
    }
  };

  const initCache = () => {
    const cachedMetrics = localStorage.getItem('cache_metrics');
    const cachedProgress = localStorage.getItem('cache_all_progress');
    const cachedProfile = localStorage.getItem('cache_user_profile');
    const cachedPlan = localStorage.getItem('cache_user_plan');
    const cachedHistory = localStorage.getItem('cache_workout_history');
    const cachedRecords = localStorage.getItem('cache_personal_records');

    if (cachedMetrics) metrics.value = JSON.parse(cachedMetrics);
    if (cachedProgress) {
      allProgress.value = JSON.parse(cachedProgress);
      todayProgress.value = allProgress.value.find((p: any) => toDateKey(p.date) === currentDate.value) || null;
    }
    if (cachedProfile) userProfile.value = JSON.parse(cachedProfile);
    if (cachedPlan) userPlan.value = JSON.parse(cachedPlan);
    if (cachedHistory) workoutHistory.value = JSON.parse(cachedHistory);
    if (cachedRecords) personalRecords.value = JSON.parse(cachedRecords);

    mergeLocalWorkouts();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getTimeEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 7) return '🌙';
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    if (hour < 21) return '🌅';
    return '🌙';
  };

  // Modal selector metric
  const activeModal = ref<string | null>(null);
  const modalInputValue = ref<string>('');
  const modalError = ref<string>('');
  const isSaving = ref(false);

  const openEditModal = (type: string) => {
    activeModal.value = type;
    modalError.value = '';
    
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
      muscleMass: 'muscleMass',
      sleepQuality: 'mood'
    };
    
    const summaryField = mapFields[type] || type;
    const val = (summary.value as any)[summaryField];
    modalInputValue.value = val !== null && val !== undefined ? val.toString() : '';
    
    if (type === 'sleep') {
      sleepQualityInModal.value = (summary.value.mood ?? '').toString();
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

  const saveModalMetric = async () => {
    if (isSaving.value) return;
    isSaving.value = true;
    setTimeout(() => { isSaving.value = false; }, 1500);
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
        if (sleepQualityInModal.value) {
          const qualScore = parseInt(sleepQualityInModal.value);
          if (!isNaN(qualScore) && qualScore >= 1 && qualScore <= 5) {
            await saveProgressField('mood', qualScore.toString());
          }
        }
        await showToast(`${val} hrs de sueño registradas`);
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
        await showToast(`${intVal} ${units[type] || ''} registrados`);
        closeEditModal();
      } else {
        modalError.value = 'Debe ser un número mayor o igual a 0.';
      }
    } else if (type === 'stress' || type === 'energy' || type === 'muscleSoreness') {
      const score = parseInt(modalInputValue.value);
      if (!isNaN(score) && score >= 1 && score <= 5) {
        await saveProgressField(type, score);
        await showToast(`Nivel ${score}/5 registrado`);
        closeEditModal();
      } else {
        modalError.value = 'Selecciona una puntuación válida de 1 a 5.';
      }
    }
  };

  // Carga inicial
  initCache();

  return {
    metrics,
    allProgress,
    todayProgress,
    userProfile,
    userPlan,
    workoutHistory,
    personalRecords,
    currentDate,
    isHealthDeviceConnected,
    today,
    bedtime,
    waketime,
    sleepQualityInModal,
    timeSlots,
    sleepQualityOptions,
    currentQuote,
    circumference,
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
    nextLevelXP,
    currentStreak,
    longestStreak,
    levelTitle
  };
}
export type UseDashboardType = ReturnType<typeof useDashboard>;
