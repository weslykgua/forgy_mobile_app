import { ref, computed } from 'vue';
import { useProfile } from '@/utils/useProfile';
import { toastController } from '@ionic/vue';
import type { Exercise } from '@/interfaces';

export function useExercises() {
  const { getHeaders, API_URL } = useProfile();

  const exercises = ref<Exercise[]>([]);
  const isLoading = ref(true);
  const isLoadingMore = ref(false);
  const searchText = ref('');
  const selectedMuscle = ref<string[]>(['Todos']);
  const currentPage = ref(1);
  const totalExercises = ref(0);
  const hasMore = ref(false);
  const isModalOpen = ref(false);
  const isDetailModalOpen = ref(false);
  const selectedExercise = ref<Exercise | null>(null);
  const isFetching = ref(false);
  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const form = ref({
    name: '',
    muscle: 'Pecho',
    video: '',
    description: '',
    difficulty: 'Principiante' as 'Principiante' | 'Intermedio' | 'Avanzado',
    equipment: '',
    instructions: ''
  });

  const showToast = async (message: string, color = 'success') => {
    const toast = await toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  };

  // Cargar caché local al inicializar si existe
  const loadCache = () => {
    try {
      const cached = localStorage.getItem('cache_exercises');
      const cachedPage = localStorage.getItem('cache_exercises_page');
      const cachedTotal = localStorage.getItem('cache_exercises_total');
      const cachedHasMore = localStorage.getItem('cache_exercises_has_more');

      if (cached) exercises.value = JSON.parse(cached);
      if (cachedPage) currentPage.value = Number(cachedPage);
      if (cachedTotal) totalExercises.value = Number(cachedTotal);
      if (cachedHasMore) hasMore.value = cachedHasMore === 'true';
      if (exercises.value.length > 0) isLoading.value = false;
    } catch (e) {
      console.error('Error al cargar caché de ejercicios', e);
    }
  };

  const loadExercises = async (append = false) => {
    if (isFetching.value) return;
    isFetching.value = true;

    if (!append) {
      isLoading.value = exercises.value.length === 0;
    } else {
      isLoadingMore.value = true;
    }

    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage.value));
      params.set('limit', '30');
      if (searchText.value) params.set('search', searchText.value);
      const muscles = selectedMuscle.value.filter(m => m !== 'Todos');
      if (muscles.length === 1) params.set('muscle', muscles[0]);

      const response = await fetch(`${API_URL}/exercises?${params.toString()}`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const result = await response.json();

      const newExercises: Exercise[] = result.data || [];
      totalExercises.value = result.total || 0;
      hasMore.value = result.hasMore || false;

      if (append) {
        exercises.value = [...exercises.value, ...newExercises];
      } else {
        exercises.value = newExercises;
      }

      localStorage.setItem('cache_exercises', JSON.stringify(exercises.value));
      localStorage.setItem('cache_exercises_page', String(currentPage.value));
      localStorage.setItem('cache_exercises_total', String(totalExercises.value));
      localStorage.setItem('cache_exercises_has_more', String(hasMore.value));
    } catch (error) {
      console.error('Error fetching exercises', error);
      if (!append && exercises.value.length === 0) exercises.value = [];
    } finally {
      isLoading.value = false;
      isLoadingMore.value = false;
      isFetching.value = false;
    }
  };

  const loadMoreExercises = async (event: CustomEvent) => {
    if (!hasMore.value) {
      (event.target as any).complete();
      return;
    }
    currentPage.value++;
    await loadExercises(true);
    (event.target as any).complete();
  };

  const onSearchInput = (event: CustomEvent) => {
    searchText.value = (event.detail.value as string) || '';
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentPage.value = 1;
      exercises.value = [];
      loadExercises();
    }, 400);
  };

  const toggleMuscleFilter = (muscleName: string) => {
    if (muscleName === 'Todos') {
      selectedMuscle.value = ['Todos'];
    } else {
      const newSelection = selectedMuscle.value.filter(m => m !== 'Todos');
      const muscleIndex = newSelection.indexOf(muscleName);
      if (muscleIndex > -1) {
        newSelection.splice(muscleIndex, 1);
      } else {
        newSelection.push(muscleName);
      }
      selectedMuscle.value = newSelection.length > 0 ? newSelection : ['Todos'];
    }
    currentPage.value = 1;
    exercises.value = [];
    hasMore.value = false;
    loadExercises();
  };

  const openCreateModal = () => {
    (document.activeElement as HTMLElement)?.blur();
    form.value = {
      name: '',
      muscle: 'Pecho',
      video: '',
      description: '',
      difficulty: 'Principiante',
      equipment: '',
      instructions: ''
    };
    isModalOpen.value = true;
  };

  const openDetailModal = (exercise: Exercise) => {
    (document.activeElement as HTMLElement)?.blur();
    selectedExercise.value = exercise;
    isDetailModalOpen.value = true;
  };

  const saveExercise = async () => {
    try {
      const exerciseData = {
        ...form.value,
        instructions: form.value.instructions.split('\n').filter(i => i.trim())
      };

      const response = await fetch(`${API_URL}/exercises`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(exerciseData)
      });

      if (!response.ok) throw new Error('Error al crear');
      await showToast('¡Ejercicio creado!', 'success');

      isModalOpen.value = false;
      await loadExercises();
    } catch (error) {
      console.error(error);
      await showToast('Error al guardar', 'danger');
    }
  };

  // Carga inicial
  loadCache();

  return {
    exercises: computed(() => exercises.value),
    isLoading,
    isLoadingMore,
    searchText,
    selectedMuscle,
    currentPage,
    totalExercises,
    hasMore,
    isModalOpen,
    isDetailModalOpen,
    selectedExercise,
    form,
    loadExercises,
    loadMoreExercises,
    onSearchInput,
    toggleMuscleFilter,
    openCreateModal,
    openDetailModal,
    saveExercise
  };
}
