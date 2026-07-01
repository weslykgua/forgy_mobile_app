import { ref, computed } from 'vue';
import { useProfile } from '@/utils/useProfile';
import { toastController, alertController } from '@ionic/vue';
import { getMuscleIcon, muscleGroups, mainMuscles } from '@/utils/muscles';
import type { ExerciseSimple, WorkoutSet, Workout } from '@/interfaces';

export function useWorkouts() {
  const { getHeaders, API_URL } = useProfile();

  const exercises = ref<ExerciseSimple[]>([]);
  const workouts = ref<Workout[]>([]);
  const calendarData = ref<{ [date: string]: { hasWorkout: boolean } }>({});
  const selectedDate = ref(new Date().toISOString().split('T')[0]);

  const getWeekStart = (date: Date): string => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  };

  const currentWeekStart = ref(getWeekStart(new Date()));
  const isWorkoutModalOpen = ref(false);
  const editingWorkout = ref<Workout | null>(null);
  const selectedMuscle = ref('Todos');
  const modalSearchText = ref('');

  const workoutForm = ref({
    exerciseId: '',
    exerciseName: '',
    duration: 15,
    sets: [{ reps: 12, weight: 20, completed: false }] as WorkoutSet[],
    notes: ''
  });

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

  const changeWeek = (direction: number) => {
    const current = new Date(currentWeekStart.value);
    current.setDate(current.getDate() + (direction * 7));
    currentWeekStart.value = current.toISOString().split('T')[0];
  };

  const selectDate = async (date: string) => {
    selectedDate.value = date;
    await loadWorkouts();
  };

  const selectExercise = (ex: ExerciseSimple) => {
    workoutForm.value.exerciseId = ex.id;
    workoutForm.value.exerciseName = ex.name;
  };

  const incrementValue = (set: WorkoutSet, field: 'reps' | 'weight', step = 1) => {
    set[field] = Number((set[field] + step).toFixed(1));
  };

  const decrementValue = (set: WorkoutSet, field: 'reps' | 'weight', step = 1) => {
    if (set[field] > step) {
      set[field] = Number((set[field] - step).toFixed(1));
    }
  };

  const calculateVolume = () => {
    return workoutForm.value.sets.reduce((acc, s) => acc + (s.reps * s.weight), 0);
  };

  let cachedExercisesList: ExerciseSimple[] = [];

  const loadExercises = async () => {
    if (cachedExercisesList.length > 0) {
      exercises.value = cachedExercisesList;
      return;
    }
    try {
      const response = await fetch(`${API_URL}/exercises?paginate=false`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        cachedExercisesList = Array.isArray(data) ? data : (data.data ?? []);
        exercises.value = cachedExercisesList;
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const loadWorkouts = async () => {
    let backendWorkouts: Workout[] = [];
    try {
      const response = await fetch(`${API_URL}/workouts?date=${selectedDate.value}`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        backendWorkouts = Array.isArray(data) ? data : [];
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
    }

    const stored = localStorage.getItem('local_workouts');
    const allLocal: Workout[] = stored ? JSON.parse(stored) : [];
    const localWorkouts = allLocal.filter(w => w.date === selectedDate.value);

    workouts.value = [...backendWorkouts, ...localWorkouts];
  };

  const loadCalendarData = async () => {
    let backendCalendar: { [date: string]: { hasWorkout: boolean } } = {};
    try {
      const response = await fetch(`${API_URL}/workouts/calendar`, { headers: getHeaders() });
      if (response.ok) {
        backendCalendar = await response.json();
      }
    } catch (error) {
      console.error('Error loading calendar:', error);
    }

    const stored = localStorage.getItem('local_workouts');
    const allLocal: Workout[] = stored ? JSON.parse(stored) : [];
    const localCalendar: { [date: string]: { hasWorkout: boolean } } = {};
    allLocal.forEach(w => {
      localCalendar[w.date] = { hasWorkout: true };
    });

    calendarData.value = { ...backendCalendar, ...localCalendar };
  };

  const openAddWorkoutModal = () => {
    editingWorkout.value = null;
    selectedMuscle.value = 'Todos';
    modalSearchText.value = '';
    workoutForm.value = {
      exerciseId: '',
      exerciseName: '',
      duration: 15,
      sets: [{ reps: 12, weight: 20, completed: false }],
      notes: ''
    };
    isWorkoutModalOpen.value = true;
  };

  const addSet = () => {
    const lastSet = workoutForm.value.sets[workoutForm.value.sets.length - 1];
    workoutForm.value.sets.push({
      reps: lastSet?.reps || 12,
      weight: lastSet?.weight || 20,
      completed: false
    });
  };

  const removeSet = (index: number) => {
    workoutForm.value.sets.splice(index, 1);
  };

  const editWorkout = (workout: Workout) => {
    editingWorkout.value = workout;
    selectedMuscle.value = 'Todos';
    modalSearchText.value = '';
    workoutForm.value = {
      exerciseId: workout.exerciseId,
      exerciseName: workout.exerciseName,
      duration: workout.duration,
      sets: workout.sets.map(s => ({ ...s })),
      notes: workout.notes
    };
    isWorkoutModalOpen.value = true;
  };

  const saveWorkout = async () => {
    if (!workoutForm.value.exerciseId) {
      await showToast('Selecciona un ejercicio', 'warning');
      return;
    }

    const data = {
      date: selectedDate.value,
      exerciseId: workoutForm.value.exerciseId,
      exerciseName: workoutForm.value.exerciseName,
      sets: workoutForm.value.sets,
      duration: workoutForm.value.duration,
      notes: workoutForm.value.notes
    };

    try {
      let response;
      if (editingWorkout.value && !editingWorkout.value.id.startsWith('local_')) {
        response = await fetch(`${API_URL}/workouts/${editingWorkout.value.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
      } else {
        response = await fetch(`${API_URL}/workouts`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
      }

      if (!response.ok) throw new Error(`Error saving workout: ${response.status}`);
      await showToast(editingWorkout.value ? '¡Entrenamiento actualizado!' : '¡Ejercicio registrado! 💪');
      
      // If we successfully saved a previously local workout on the server, remove from local
      if (editingWorkout.value && editingWorkout.value.id.startsWith('local_')) {
        const stored = localStorage.getItem('local_workouts');
        let allLocal: Workout[] = stored ? JSON.parse(stored) : [];
        allLocal = allLocal.filter(w => w.id !== editingWorkout.value?.id);
        localStorage.setItem('local_workouts', JSON.stringify(allLocal));
      }
    } catch (error) {
      console.warn('Backend error, saving locally:', error);

      const stored = localStorage.getItem('local_workouts');
      const allLocal: Workout[] = stored ? JSON.parse(stored) : [];

      if (editingWorkout.value && editingWorkout.value.id.startsWith('local_')) {
        const index = allLocal.findIndex(w => w.id === editingWorkout.value?.id);
        if (index !== -1) {
          allLocal[index] = { ...allLocal[index], ...data, id: editingWorkout.value.id };
          localStorage.setItem('local_workouts', JSON.stringify(allLocal));
          await showToast('Actualizado en local', 'warning');
        } else {
          await showToast('No se pudo guardar en el servidor', 'danger');
          return;
        }
      } else {
        const newLocal = { ...data, id: 'local_' + Date.now().toString() };
        allLocal.push(newLocal);
        localStorage.setItem('local_workouts', JSON.stringify(allLocal));
        await showToast('Guardado localmente', 'warning');
      }
    }
    isWorkoutModalOpen.value = false;
    await loadWorkouts();
    await loadCalendarData();
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      if (workoutId.startsWith('local_')) {
        const stored = localStorage.getItem('local_workouts');
        let allLocal: Workout[] = stored ? JSON.parse(stored) : [];
        allLocal = allLocal.filter(w => w.id !== workoutId);
        localStorage.setItem('local_workouts', JSON.stringify(allLocal));
        await showToast('Entrenamiento eliminado en local');
      } else {
        const response = await fetch(`${API_URL}/workouts/${workoutId}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (!response.ok) throw new Error('Error al eliminar');
        await showToast('Entrenamiento eliminado');
      }
    } catch (e) {
      console.error(e);
      await showToast('Error al eliminar entrenamiento', 'danger');
    }
    await loadWorkouts();
    await loadCalendarData();
  };

  const confirmDeleteWorkout = async (workout: Workout) => {
    const alert = await alertController.create({
      header: '¿Eliminar entrenamiento?',
      message: `¿Eliminar "${workout.exerciseName}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            deleteWorkout(workout.id);
          }
        }
      ]
    });
    await alert.present();
  };

  const filteredExercises = computed(() => {
    let list = exercises.value;
    if (selectedMuscle.value !== 'Todos') {
      list = list.filter(e => e.muscle === selectedMuscle.value);
    }
    if (modalSearchText.value.trim() !== '') {
      const query = modalSearchText.value.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(query));
    }
    return list;
  });

  return {
    exercises,
    workouts,
    calendarData,
    selectedDate,
    currentWeekStart,
    isWorkoutModalOpen,
    editingWorkout,
    selectedMuscle,
    modalSearchText,
    workoutForm,
    filteredExercises,
    changeWeek,
    selectDate,
    selectExercise,
    incrementValue,
    decrementValue,
    calculateVolume,
    loadExercises,
    loadWorkouts,
    loadCalendarData,
    openAddWorkoutModal,
    addSet,
    removeSet,
    editWorkout,
    saveWorkout,
    confirmDeleteWorkout,
    deleteWorkout
  };
}
