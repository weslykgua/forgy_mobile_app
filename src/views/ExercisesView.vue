<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonButton, IonCheckbox,
  IonSearchbar, IonSegment, IonSegmentButton, IonChip, IonGrid, IonRow, IonCol, IonReorder, IonReorderGroup, IonItemSliding, IonItemOptions, IonItemOption,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonFab, IonFabButton, IonModal, IonButtons, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonRefresher, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent, actionSheetController,
  IonSkeletonText, IonBadge, IonSpinner,
  onIonViewWillEnter, onIonViewWillLeave, alertController, toastController
} from '@ionic/vue';
import { useProfile } from '../utils/useProfile'

import absImg from '../assets/abs.png';
import antebrazoImg from '../assets/antebrazo.png';
import bicepsImg from '../assets/biceps.png';
import cuadricepsImg from '../assets/cuadriceps.png';
import dorsalesImg from '../assets/dorsales.png';
import hombrosImg from '../assets/hombros.png';
import pantorillasImg from '../assets/pantorillas.png';
import pechoImg from '../assets/pecho.png';
import trapecioImg from '../assets/trapecio.png';
import { ref, computed } from 'vue';
import { io } from 'socket.io-client';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  add, fitness, barbell, closeCircle, videocam, list, bookmark, albums, reorderThreeOutline, ellipsisVertical, imageOutline, camera, addCircleOutline, trash, removeCircleOutline, calendarOutline, starOutline, star, timeOutline
} from 'ionicons/icons';

interface Exercise {
  id: string;
  name: string;
  muscle: string;
  video: string;
  description: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  equipment: string;
  instructions: string[];
  gifUrl?: string | null;
  createdAt: string;
}

// Interfaz para la respuesta de la API (relación ligera)
interface Routine {
  id: string;
  name: string;
  exercises: { exerciseId: string; order: number }[];
  imageUrl?: string;
  isFavorite?: boolean;
  difficulty?: string;
  description?: string;
  estimatedDuration?: number;
}

// Interfaz para el detalle (ejercicios completos)
interface RoutineDetail extends Omit<Routine, 'exercises'> {
  exercises: (Exercise & { order: number })[];
}

const { getHeaders, API_URL } = useProfile();

const exercises = ref<Exercise[]>([]);
const routines = ref<Routine[]>([]);
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
const viewMode = ref<'exercises' | 'routines'>('exercises');
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const selectedRoutine = ref<RoutineDetail | null>(null);
const isRoutineDetailOpen = ref(false);
const isReorderMode = ref(false);
const isImagePickerOpen = ref(false);
const routineForImageChange = ref<Routine | null>(null);
const isCreateRoutineModalOpen = ref(false);
const isTrainingMode = ref(false);
const isExerciseLogModalOpen = ref(false);
const exerciseToLog = ref<Exercise | null>(null);
const isAddExerciseModalOpen = ref(false);
const addExerciseSearchText = ref('');
const addExerciseSelectedMuscle = ref<string>('Todos');
const currentTrainingSessionId = ref<string | null>(null);
const workoutLogs = ref<Record<string, {
  sets: { reps: string; weight: string; completed: boolean }[];
  notes: string;
  duration: string;
}>>({});
const routineViewStyle = ref<'grid' | 'calendar'>('grid');
const routineImages = ref<Record<string, string>>({});
const routineMuscles = ref<Record<string, string>>({});
const isSavingRoutine = ref(false);
const isSelectionModeActive = ref(false);
const selectedRoutineIds = ref<string[]>([]);
const newRoutineForm = ref({
  name: '',
  description: '',
  muscleFocus: 'Pecho',
  imageUrl: '',
  scheduledDays: [] as string[]
});
const predefinedImages = ref([
    // Imágenes prediseñadas
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80',
    'https://images.unsplash.com/photo-1581009137042-c552e485697a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=869&q=80',
    'https://images.unsplash.com/photo-1599058917212-d750089bc07e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=869&q=80',
    'https://images.unsplash.com/photo-1574680096145-f846b5a6abc4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=869&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80'
]);

let socket: any = null;

const muscleIcons: Record<string, string> = {
  'Todos': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="muscle-svg"><path d="M6.5 6.5 11 11"/><path d="M21 21-1.5-1.5"/><path d="M3 3 1.5 1.5"/><path d="M18.5 5.5 3-3"/><path d="M2.5 21.5 3-3"/><path d="M14 5s.5 1.5 3 3"/><path d="M5 14s1.5.5 3 3"/><path d="M10 5.5A3.5 3.5 0 0 0 5.5 10"/><path d="M18.5 14a3.5 3.5 0 0 1-4.5 4.5"/></svg>`,
  'Brazos': `<img src="${bicepsImg}" class="muscle-icon-img" alt="Brazos" />`,
  'Piernas': `<img src="${cuadricepsImg}" class="muscle-icon-img" alt="Piernas" />`,
  'Espalda': `<img src="${dorsalesImg}" class="muscle-icon-img" alt="Espalda" />`,
  'Abdomen': `<img src="${absImg}" class="muscle-icon-img" alt="Abdomen" />`,
  'Pecho': `<img src="${pechoImg}" class="muscle-icon-img" alt="Pecho" />`,
  'Hombros': `<img src="${hombrosImg}" class="muscle-icon-img" alt="Hombros" />`,
  'Pantorrillas': `<img src="${pantorillasImg}" class="muscle-icon-img" alt="Pantorrillas" />`,
  'Antebrazos': `<img src="${antebrazoImg}" class="muscle-icon-img" alt="Antebrazos" />`,
  'Cardio': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="muscle-svg"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  'Cuello': `<img src="${trapecioImg}" class="muscle-icon-img" alt="Cuello" />`
};

const musclesWithEmoji = Object.keys(muscleIcons).map(name => ({ name }));
const muscles = musclesWithEmoji.map(m => m.name);
const isExpandedMuscles = ref(false);
const isExpandedAddExerciseMuscles = ref(false);
const mainMuscles = ['Todos', 'Brazos', 'Piernas', 'Espalda', 'Abdomen', 'Pecho', 'Hombros'];

const visibleMusclesWithEmoji = computed(() => {
  if (isExpandedMuscles.value) return musclesWithEmoji;
  return musclesWithEmoji.filter(m => mainMuscles.includes(m.name));
});

const visibleAddExerciseMusclesWithEmoji = computed(() => {
  if (isExpandedAddExerciseMuscles.value) return musclesWithEmoji;
  return musclesWithEmoji.filter(m => mainMuscles.includes(m.name));
});
const difficulties = ['Principiante', 'Intermedio', 'Avanzado'];

// Días de la semana para programación
const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const selectedRoutineDay = ref<string>('Todos');
const routineSchedule = ref<Record<string, string[]>>({});

const form = ref({
  name: '',
  muscle: 'Pecho',
  video: '',
  description: '',
  difficulty: 'Principiante' as 'Principiante' | 'Intermedio' | 'Avanzado',
  equipment: '',
  instructions: ''
});

// Manejar selección de filtros de músculo (ahora con reset de paginación)
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
  // Reset and reload from server
  currentPage.value = 1;
  exercises.value = [];
  hasMore.value = false;
  loadExercises();
};

// The exercises array IS the filtered result (filtering is done server-side)
const filteredExercises = computed(() => exercises.value);

const filteredRoutines = computed(() => {
  if (selectedRoutineDay.value === 'Todos') {
    return routines.value;
  }
  return routines.value.filter(r => isRoutineScheduledOnDay(r.id, selectedRoutineDay.value));
});

const dayLabels = [
  { label: 'L', name: 'Lunes' },
  { label: 'M', name: 'Martes' },
  { label: 'M', name: 'Miércoles' },
  { label: 'J', name: 'Jueves' },
  { label: 'V', name: 'Viernes' },
  { label: 'S', name: 'Sábado' },
  { label: 'D', name: 'Domingo' }
];


const allExercisesLight = ref<Exercise[]>([]);
const isLoadingLight = ref(false);

const exercisesAvailableToAdd = computed(() => {
  if (!selectedRoutine.value) return [];

  const exerciseIdsInRoutine = selectedRoutine.value.exercises.map(ex => ex.id);

  let available = allExercisesLight.value.filter(ex => !exerciseIdsInRoutine.includes(ex.id));

  // Filtrado por músculo
  if (addExerciseSelectedMuscle.value !== 'Todos') {
    available = available.filter(ex => ex.muscle === addExerciseSelectedMuscle.value);
  }

  // Filtrado por búsqueda
  if (addExerciseSearchText.value) {
    const search = addExerciseSearchText.value.toLowerCase();
    available = available.filter(ex =>
      ex.name.toLowerCase().includes(search) ||
      ex.muscle?.toLowerCase().includes(search) ||
      ex.description?.toLowerCase().includes(search) ||
      ex.equipment?.toLowerCase().includes(search)
    );
  }

  return available;
});

// Colores por dificultad
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Principiante': return 'success';
    case 'Intermedio': return 'warning';
    case 'Avanzado': return 'danger';
    default: return 'medium';
  }
};

// Cargar ejercicios (paginado, server-side filtrado)
const loadExercises = async (append = false) => {
  if (!append) {
    isLoading.value = exercises.value.length === 0; // Only show main loading spinner if no cached data
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

    // Guardar en cache local
    localStorage.setItem('cache_exercises', JSON.stringify(exercises.value));
    localStorage.setItem('cache_exercises_page', String(currentPage.value));
    localStorage.setItem('cache_exercises_total', String(totalExercises.value));
    localStorage.setItem('cache_exercises_has_more', String(hasMore.value));

  } catch (error) {
    console.error("Error fetching exercises", error);
    if (!append && exercises.value.length === 0) exercises.value = [];
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
};

// Load more for infinite scroll
const loadMoreExercises = async (event: CustomEvent) => {
  if (!hasMore.value) {
    (event.target as any).complete();
    return;
  }
  currentPage.value++;
  await loadExercises(true);
  (event.target as any).complete();
};

// Debounced search
const onSearchInput = (event: CustomEvent) => {
  searchText.value = (event.detail.value as string) || '';
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1;
    exercises.value = [];
    loadExercises();
  }, 400);
};

// Cargar rutinas
const loadRoutines = async () => {
  try {
    const response = await fetch(`${API_URL}/routines`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} al cargar rutinas`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      routines.value = data;
      // Guardar en cache local
      localStorage.setItem('cache_routines', JSON.stringify(routines.value));
    } else {
      console.error("La respuesta de la API para rutinas no es un array:", data);
      routines.value = []; // Asegurarse de que siempre sea un array
    }
  } catch (error) {
    console.error("Error fetching routines", error);
    if (routines.value.length === 0) routines.value = []; // Resetear solo si no hay cache
  }
};

const showToast = async (
  message: string,
  color: string = 'success'
) => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: 'bottom'
  });
  await toast.present();
};

// Abrir modal para crear
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


// Abrir modal de detalles
const openDetailModal = (exercise: Exercise) => {
  (document.activeElement as HTMLElement)?.blur();
  selectedExercise.value = exercise;
  isDetailModalOpen.value = true;
};

const openVideo = (url: string) => {
  window.open(url, '_blank');
};

// Guardar ejercicio (crear o editar)
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
    showToast('¡Ejercicio creado!', 'success');

    isModalOpen.value = false;
    loadExercises();
  } catch (error) {
    console.error(error);
    showToast('Error al guardar', 'danger');
  }
};

// Crear nueva rutina
const createRoutine = async () => {
  // DEBUG: Verifica el token antes de enviar
  const token = localStorage.getItem('token')
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      console.log('Token payload en frontend:', payload)
    } catch (e) {
      console.error('Error decodificando token:', e)
    }
  }
  (document.activeElement as HTMLElement)?.blur();
  newRoutineForm.value = {
    name: '',
    description: '',
    muscleFocus: 'Pecho',
    imageUrl: '',
    scheduledDays: []
  };
  isCreateRoutineModalOpen.value = true;
};

// Guardar la nueva rutina creada desde el modal
const saveNewRoutine = async () => {
  if (isSavingRoutine.value) return;
  if (!newRoutineForm.value.name) {
    showToast('Por favor, dale un nombre a la rutina', 'warning');
    return;
  }
  isSavingRoutine.value = true;
  try {
    const response = await fetch(`${API_URL}/routines`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: newRoutineForm.value.name,
        description: newRoutineForm.value.description
      })
    });
    if (!response.ok) throw new Error('Error en la respuesta del servidor');
    
    const createdRoutine = await response.json();
    
    // Si se seleccionó una imagen durante la creación, guardarla localmente
    if (newRoutineForm.value.imageUrl) {
      routineImages.value[createdRoutine.id] = newRoutineForm.value.imageUrl;
      localStorage.setItem('forgy_routine_images', JSON.stringify(routineImages.value));
    }

    // Guardar el foco muscular localmente
    if (newRoutineForm.value.muscleFocus) {
      routineMuscles.value[createdRoutine.id] = newRoutineForm.value.muscleFocus;
      localStorage.setItem('forgy_routine_muscles', JSON.stringify(routineMuscles.value));
    }

    // Guardar la programación de días locales
    if (newRoutineForm.value.scheduledDays && newRoutineForm.value.scheduledDays.length > 0) {
      routineSchedule.value[createdRoutine.id] = newRoutineForm.value.scheduledDays;
      localStorage.setItem('forgy_routine_schedule', JSON.stringify(routineSchedule.value));
    }

    showToast('Rutina creada con éxito');
    loadRoutines();
    isCreateRoutineModalOpen.value = false;
  } catch (e) {
    showToast('Error al crear la rutina', 'danger');
  } finally {
    isSavingRoutine.value = false;
  }
};

const toggleFormDay = (day: string) => {
  const index = newRoutineForm.value.scheduledDays.indexOf(day);
  if (index > -1) {
    newRoutineForm.value.scheduledDays.splice(index, 1);
  } else {
    newRoutineForm.value.scheduledDays.push(day);
  }
};

const toggleRoutineDay = (routineId: string, dayName: string) => {
  if (!routineSchedule.value[routineId]) {
    routineSchedule.value[routineId] = [];
  }
  const index = routineSchedule.value[routineId].indexOf(dayName);
  if (index > -1) {
    routineSchedule.value[routineId].splice(index, 1);
  } else {
    routineSchedule.value[routineId].push(dayName);
  }
  localStorage.setItem('forgy_routine_schedule', JSON.stringify(routineSchedule.value));
  showToast('Programación de días actualizada', 'success');
};

const toggleSelectionMode = () => {
  isSelectionModeActive.value = !isSelectionModeActive.value;
  selectedRoutineIds.value = [];
};

const toggleRoutineSelection = (routineId: string) => {
  const index = selectedRoutineIds.value.indexOf(routineId);
  if (index > -1) {
    selectedRoutineIds.value.splice(index, 1);
  } else {
    selectedRoutineIds.value.push(routineId);
  }
};

const bulkScheduleDays = async () => {
  if (selectedRoutineIds.value.length === 0) return;
  const alert = await alertController.create({
    header: 'Programar Rutinas',
    subHeader: `Asignar días para ${selectedRoutineIds.value.length} rutinas:`,
    inputs: daysOfWeek.map(day => ({
      type: 'checkbox',
      label: day,
      value: day,
      checked: false
    })),
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Guardar',
        handler: (selectedDays: string[]) => {
          selectedRoutineIds.value.forEach(id => {
            routineSchedule.value[id] = selectedDays;
          });
          localStorage.setItem('forgy_routine_schedule', JSON.stringify(routineSchedule.value));
          showToast('Programación masiva guardada', 'success');
          toggleSelectionMode();
        }
      }
    ]
  });
  await alert.present();
};

const bulkDeleteRoutines = async () => {
  if (selectedRoutineIds.value.length === 0) return;
  const alert = await alertController.create({
    header: 'Eliminar Rutinas',
    message: `¿Estás seguro de que quieres eliminar las ${selectedRoutineIds.value.length} rutinas seleccionadas? Esta acción no se puede deshacer.`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          try {
            const deletePromises = selectedRoutineIds.value.map(id =>
              fetch(`${API_URL}/routines/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
              })
            );
            await Promise.all(deletePromises);
            showToast('Rutinas eliminadas con éxito', 'success');
            loadRoutines();
            toggleSelectionMode();
          } catch (error) {
            console.error(error);
            showToast('Error al eliminar las rutinas', 'danger');
          }
        }
      }
    ]
  });
  await alert.present();
};

// Agregar ejercicio a rutina
const addToRoutine = async (exercise: Exercise) => {
  if (!Array.isArray(routines.value) || routines.value.length === 0) {
    const alert = await alertController.create({
      header: 'No Tienes Rutinas',
      message: 'Para guardar un ejercicio, primero necesitas una rutina. ¿Quieres crear una ahora?',
      buttons: [
        {
          text: 'Ahora no',
          role: 'cancel',
        },
        {
          text: 'Crear Rutina',
          handler: () => {
            isDetailModalOpen.value = false; // Cierra el modal de detalle del ejercicio
            createRoutine(); // Abre el modal para crear una nueva rutina
          },
        },
      ],
    });
    await alert.present();
    return; // Detiene la ejecución aquí
  }

  const availableRoutines = routines.value.filter(routine => {
    // A routine's `exercises` property is an array of join-table objects like { exerciseId: '...' }
    const exerciseIdsInRoutine = (routine.exercises || []).map(re => re.exerciseId);
    // We only want to show routines that DO NOT already include the exercise.
    return !exerciseIdsInRoutine.includes(exercise.id);
  });

  if (availableRoutines.length === 0) {
    showToast('Este ejercicio ya está en todas tus rutinas.', 'info');
    return;
  }

  const alert = await alertController.create({
    header: 'Guardar en Rutina',
    inputs: availableRoutines.map(r => ({
      type: 'radio',
      label: r.name,
      value: r.id
    })),
    buttons: ['Cancelar', {
      text: 'Guardar',
      handler: async (routineId) => {
        if (!routineId) return;
        const targetRoutine = routines.value.find(r => r.id === routineId);
        const newOrder = targetRoutine?.exercises?.length || 0;

        try {
          const response = await fetch(`${API_URL}/routines/${routineId}/exercises`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ exerciseId: exercise.id, order: newOrder })
          });
          if (!response.ok) {
            let errorMessage = 'No se pudo agregar el ejercicio a la rutina.';
            try {
              const errorData = await response.json();
              if (errorData && errorData.message) errorMessage = errorData.message;
            } catch (e) {
              // Ignore if parsing fails, use generic message
            }
            throw new Error(errorMessage);
          }

          showToast(`Agregado a rutina`, 'success');
          isDetailModalOpen.value = false;
          loadRoutines(); // Recargar las rutinas para actualizar el contador
        } catch (error: any) {
          console.error(error);
          showToast((error as Error).message, 'danger');
        }
      }
    }
    ]
  });
  await alert.present();
};

const openAddExerciseModal = () => {
  addExerciseSearchText.value = ''; // Reset search on open
  isAddExerciseModalOpen.value = true;
  // Load light exercise list for adding to routine if not already loaded
  if (allExercisesLight.value.length === 0) {
    loadAllExercisesLight();
  }
};

const addExerciseToCurrentRoutine = async (exercise: Exercise) => {
  if (!selectedRoutine.value) return;

  const routineId = selectedRoutine.value.id;
  const newOrder = selectedRoutine.value.exercises.length;

  try {
    const response = await fetch(`${API_URL}/routines/${routineId}/exercises`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ exerciseId: exercise.id, order: newOrder })
    });

    if (!response.ok) {
      throw new Error('No se pudo agregar el ejercicio.');
    }

    // Update UI immediately
    selectedRoutine.value.exercises.push({ ...exercise, order: newOrder });

    const routineInList = routines.value.find(r => r.id === routineId);
    if (routineInList) {
      routineInList.exercises.push({ exerciseId: exercise.id, order: newOrder });
    }

    showToast(`${exercise.name} agregado a la rutina`, 'success');

  } catch (error) {
    console.error('Error adding exercise to routine:', error);
    showToast((error as Error).message || 'Error al agregar', 'danger');
  }
};

// Refrescar
const handleRefresh = async (event: CustomEvent) => {
  currentPage.value = 1;
  exercises.value = [];
  hasMore.value = false;
  await loadExercises();
  await loadRoutines();
  (event.target as any).complete();
};

// Load lightweight exercise list for routine building
const loadAllExercisesLight = async () => {
  if (isLoadingLight.value) return;
  isLoadingLight.value = true;
  try {
    const response = await fetch(`${API_URL}/exercises?paginate=false`);
    if (response.ok) {
      const data = await response.json();
      allExercisesLight.value = Array.isArray(data) ? data : (data.data ?? []);
      localStorage.setItem('cache_all_exercises_light', JSON.stringify(allExercisesLight.value));
    }
  } catch (e) {
    console.error('Error loading light exercises:', e);
  } finally {
    isLoadingLight.value = false;
  }
};

// Reordenar ejercicios en una rutina
const handleExerciseReorder = async (event: CustomEvent) => {
  if (!selectedRoutine.value) return;

  // Aplica el reordenamiento al array local y lo devuelve
  const reorderedExercises = event.detail.complete(selectedRoutine.value.exercises);
  selectedRoutine.value.exercises = reorderedExercises;

  // Extrae la lista ordenada de IDs de ejercicios
  const exercisesWithOrder = reorderedExercises.map((ex: Exercise & { order: number }, index: number) => ({
    exerciseId: ex.id,
    order: index,
  }));

  try {
    const routineId = selectedRoutine.value.id;
    // Actualizamos la rutina principal con la nueva lista ordenada de ejercicios
    const response = await fetch(`${API_URL}/routines/${routineId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ exercises: exercisesWithOrder })
    });

    if (!response.ok) {
      throw new Error('Falló al guardar el nuevo orden');
    }

    await showToast('Orden de ejercicios actualizado', 'success');
  } catch (error) {
    console.error("Error reordenando ejercicios:", error);
    await showToast('Error al guardar el nuevo orden', 'danger');
  }
};

const confirmDeleteExerciseFromRoutine = async (exerciseId: string) => {
  const alert = await alertController.create({
    header: 'Confirmar',
    message: '¿Seguro que quieres eliminar este ejercicio de la rutina?',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
        handler: () => {
          // Close sliding item if it exists
          const slidingItem = document.querySelector('ion-item-sliding.item-sliding-active');
          if (slidingItem) {
            (slidingItem as any).close();
          }
        }
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => {
          deleteExerciseFromRoutine(exerciseId);
        }
      }
    ]
  });
  await alert.present();
};

const deleteExerciseFromRoutine = async (exerciseId: string) => {
  if (!selectedRoutine.value) return;

  const routineId = selectedRoutine.value.id;

  try {
    const response = await fetch(`${API_URL}/routines/${routineId}/exercises/${exerciseId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('No se pudo eliminar el ejercicio.');
    }

    // Update UI immediately
    selectedRoutine.value.exercises = selectedRoutine.value.exercises.filter(ex => ex.id !== exerciseId);
    const routineInList = routines.value.find(r => r.id === routineId);
    if (routineInList) {
      routineInList.exercises = routineInList.exercises.filter(re => re.exerciseId !== exerciseId);
    }
    showToast('Ejercicio eliminado de la rutina', 'success');
  } catch (error) {
    console.error('Error deleting exercise from routine:', error);
    showToast((error as Error).message || 'Error al eliminar', 'danger');
  }
};

const startTrainingSession = () => {
  if (!selectedRoutine.value) return;

  // Initialize logs for each exercise
  const initialLogs: Record<string, any> = {};
  selectedRoutine.value.exercises.forEach(ex => {
    initialLogs[ex.id] = {
      sets: [{ reps: '', weight: '', completed: false }],
      notes: '',
      duration: ''
    };
  });
  workoutLogs.value = initialLogs;

  isTrainingMode.value = true;
  isReorderMode.value = false; // Ensure reorder mode is off
  currentTrainingSessionId.value = null; // We don't have a session ID at the start anymore.
};

const addSet = (exerciseId: string) => {
  if (workoutLogs.value[exerciseId]) {
    workoutLogs.value[exerciseId].sets.push({ reps: '', weight: '', completed: false });
  }
};

const removeSet = (exerciseId: string, setIndex: number) => {
  if (workoutLogs.value[exerciseId] && workoutLogs.value[exerciseId].sets.length > 1) {
    workoutLogs.value[exerciseId].sets.splice(setIndex, 1);
  } else {
    showToast('Cada ejercicio debe tener al menos una serie.', 'warning');
  }
};

const validateSetCompletion = (event: CustomEvent, set: { reps: string; weight: string; completed: boolean }) => {
  const isChecked = event.detail.checked;
  if (isChecked) {
    if (!set.weight || !set.reps || Number(set.weight) <= 0 || Number(set.reps) <= 0) {
      showToast('Ingresa peso y repeticiones válidos antes de marcar.', 'warning');
      // Revert the checkbox state if validation fails
      setTimeout(() => {
        set.completed = false;
      }, 10);
    }
  }
};

const finishWorkout = async () => {
  if (!isTrainingMode.value) return;

  const alert = await alertController.create({
    header: 'Finalizar Entreno',
    message: '¿Quieres guardar este entrenamiento?',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Guardar',
        handler: async () => {
          try {
            const finalLogs = Object.entries(workoutLogs.value)
              .map(([exerciseId, logData]) => {
                const completedSets = logData.sets
                  .filter(set => set.reps && set.weight && set.completed)
                  .map(set => ({
                    reps: Number(set.reps),
                    weight: Number(set.weight),
                    completed: set.completed,
                  }));

                if (completedSets.length > 0) {
                  return {
                    exerciseId: exerciseId,
                    sets: completedSets,
                    notes: logData.notes,
                    duration: logData.duration ? parseInt(logData.duration, 10) : null,
                  };
                }
                return null;
              })
              .filter(Boolean);

            if (finalLogs.length === 0) {
              showToast('No se registraron series completas.', 'info');
              // Still reset the state
              isTrainingMode.value = false;
              isRoutineDetailOpen.value = false;
              workoutLogs.value = {};
              currentTrainingSessionId.value = null;
              return;
            }

            const totalDuration = finalLogs.reduce((sum, log) => sum + (log?.duration || 0), 0);

            const workoutPayload = {
              routineId: selectedRoutine.value?.id,
              duration: totalDuration > 0 ? totalDuration : null,
              workouts: finalLogs,
            };

            const response = await fetch(`${API_URL}/workouts`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify(workoutPayload),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({})); // Handle cases where response is not json
              console.error("Backend error details:", errorData);
              const errorMessage = errorData.details || errorData.error || `Error: ${response.statusText}`;
              throw new Error(errorMessage);
            }

            await showToast('¡Entrenamiento guardado con éxito!', 'success');

            // Bypass the canDismiss confirmation by resetting training mode before closing
            isTrainingMode.value = false;

            isRoutineDetailOpen.value = false;

          } catch (error) {
            console.error('Error finishing workout:', error);
            showToast((error as Error).message || 'Error al guardar el entrenamiento.', 'danger');
          }
        },
      },
    ],
  });
  await alert.present();
};

const onRoutineDetailDismiss = () => {
  isReorderMode.value = false;
  isTrainingMode.value = false;
  workoutLogs.value = {};
  currentTrainingSessionId.value = null;
};

const canDismissRoutineDetail = async () => {
  if (!isTrainingMode.value) {
    return true;
  }

  const alert = await alertController.create({
    header: 'Salir sin Guardar',
    message: 'Tienes un entrenamiento en progreso. Si sales, no se guardarán los registros. ¿Estás seguro?',
    buttons: [
      { text: 'Continuar Entreno', role: 'cancel' },
      { text: 'Salir', role: 'destructive' }
    ]
  });
  await alert.present();
  const { role } = await alert.onDidDismiss();

  // Only allow dismiss if the user explicitly chose to exit ('destructive' role)
  return role === 'destructive';
};

const handleExerciseClick = (exercise: Exercise) => {
  // Do nothing if we are in reorder mode
  if (isReorderMode.value) {
    return;
  }

  // If training session has not started, start it now.
  if (!isTrainingMode.value) {
    startTrainingSession();
  }

  // Now that session is started, open the log modal for the exercise.
  openExerciseLogModal(exercise);
};

const openExerciseLogModal = (exercise: Exercise) => {
  exerciseToLog.value = exercise;
  isExerciseLogModalOpen.value = true;
};

const presentRoutineOptions = async (routine: Routine) => {
  (document.activeElement as HTMLElement)?.blur();
  const actionSheet = await actionSheetController.create({
    header: routine.name,
    buttons: [
      {
        text: 'Renombrar',
        handler: () => {
          renameRoutine(routine);
        },
      },
      {
        text: 'Cambiar Imagen',
        icon: imageOutline,
        handler: () => {
          openImagePicker(routine); // Pasamos la rutina para editarla
        },
      },
      {
        text: 'Cambiar Días',
        icon: calendarOutline,
        handler: () => {
          scheduleRoutineDays(routine);
        },
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => {
          confirmDeleteRoutine(routine);
        },
      },
      {
        text: 'Cancelar',
        role: 'cancel',
      },
    ],
  });
  await actionSheet.present();
};

const renameRoutine = async (routine: Routine) => {
  const alert = await alertController.create({
    header: 'Renombrar Rutina',
    inputs: [
      {
        name: 'name',
        type: 'text',
        value: routine.name,
        placeholder: 'Nuevo nombre de la rutina',
      },
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
      },
      {
        text: 'Guardar',
        handler: async (data) => {
          if (!data.name || data.name === routine.name) return;
          try {
            const response = await fetch(`${API_URL}/routines/${routine.id}`, {
              method: 'PUT',
              headers: getHeaders(),
              body: JSON.stringify({ name: data.name }),
            });
            if (!response.ok) throw new Error('Error al renombrar');
            await showToast('Rutina renombrada con éxito', 'success');
            await loadRoutines();
          } catch (error) {
            console.error(error);
            await showToast('No se pudo renombrar la rutina', 'danger');
          }
        },
      },
    ],
  });
  await alert.present();
};

const confirmDeleteRoutine = async (routine: Routine) => {
  const alert = await alertController.create({
    header: 'Confirmar Eliminación',
    message: `¿Estás seguro de que quieres eliminar la rutina "${routine.name}"? Esta acción no se puede deshacer.`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: async () => {
          try {
            const response = await fetch(`${API_URL}/routines/${routine.id}`, {
              method: 'DELETE',
              headers: getHeaders()
            });
            if (!response.ok) throw new Error('No se pudo eliminar la rutina.');
            showToast('Rutina eliminada', 'success');
            loadRoutines();
          } catch (error: any) {
            console.error(error);
            showToast(error.message, 'danger');
          }
        },
      },
    ],
  });
  await alert.present();
};

const openRoutineDetail = async (routine: Routine) => {
  (document.activeElement as HTMLElement)?.blur();

  // Ensure we have all exercises loaded (light list) for hydration
  if (allExercisesLight.value.length === 0) {
    await loadAllExercisesLight();
  }

  // The 'routine' object from the list has an 'exercises' array of {exerciseId, order}.
  // We need to map these to the full Exercise objects from our allExercisesLight ref.
  const hydratedExercises = (routine.exercises || [])
    .map(routineExercise => {
      const fullExercise = allExercisesLight.value.find(e => e.id === routineExercise.exerciseId)
                        || exercises.value.find(e => e.id === routineExercise.exerciseId);
      if (fullExercise) {
        return { ...fullExercise, order: routineExercise.order };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => (a?.order || 0) - (b?.order || 0));

  selectedRoutine.value = {
    ...routine,
    exercises: hydratedExercises as (Exercise & { order: number })[],
  };
  isRoutineDetailOpen.value = true;
};

const openImagePicker = (routine: Routine | null) => {
  routineForImageChange.value = routine;
  isImagePickerOpen.value = true;
};

const updateRoutineImage = async (imageUrl: string) => {
  // Si 'routineForImageChange' tiene valor, estamos editando una rutina existente.
  if (routineForImageChange.value) {
    const routine = routineForImageChange.value;
    try {
      // Guardar la imagen localmente
      routineImages.value[routine.id] = imageUrl;
      localStorage.setItem('forgy_routine_images', JSON.stringify(routineImages.value));

      const response = await fetch(`${API_URL}/routines/${routine.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ imageUrl: imageUrl }), // Note: backend ignores imageUrl but we try for future compatibility
      });
      if (!response.ok) throw new Error('Error al cambiar la imagen');

      // Actualizar datos locales para feedback inmediato
      const routineInList = routines.value.find(r => r.id === routine.id);
      if (routineInList) {
        routineInList.imageUrl = imageUrl;
      }
      isImagePickerOpen.value = false;
      showToast('Imagen de rutina actualizada', 'success');
    } catch (error) {
      console.error(error);
      // Aún si la red falla, lo dejamos guardado en local y cerramos
      isImagePickerOpen.value = false;
      showToast('Imagen actualizada de forma local', 'success');
    }
  } else {
    // Si no, estamos creando una nueva rutina. Solo actualizamos el formulario.
    newRoutineForm.value.imageUrl = imageUrl;
    isImagePickerOpen.value = false;
  }
};

const selectImageFromDevice = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt, // Pregunta al usuario si quiere usar Cámara o Galería
      promptLabelHeader: 'Seleccionar Imagen',
      promptLabelPhoto: 'Desde la Galería',
      promptLabelPicture: 'Tomar Foto'
    });

    if (image.webPath) {
      // Esta función se encargará de si estamos creando o editando
      updateRoutineImage(image.webPath);
    }
  } catch (error) {
    console.error('Error al seleccionar imagen', error);
    showToast('No se pudo seleccionar la imagen. Revisa los permisos.', 'warning');
  }
};

// Toggle favoritar rutina
const toggleFavoriteRoutine = async (routine: Routine) => {
  try {
    const nextFavoriteState = !routine.isFavorite;
    const response = await fetch(`${API_URL}/routines/${routine.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ isFavorite: nextFavoriteState })
    });
    if (!response.ok) throw new Error('Error al favoritar rutina');
    
    routine.isFavorite = nextFavoriteState;
    const r = routines.value.find(item => item.id === routine.id);
    if (r) r.isFavorite = nextFavoriteState;
    
    localStorage.setItem('cache_routines', JSON.stringify(routines.value));
    showToast(nextFavoriteState ? 'Añadida a favoritos' : 'Eliminada de favoritos', 'success');
  } catch (e) {
    console.error(e);
    showToast('No se pudo actualizar favoritos', 'danger');
  }
};

// Programar rutina por días de la semana
const scheduleRoutineDays = async (routine: Routine) => {
  const currentDays = routineSchedule.value[routine.id] || [];
  const alert = await alertController.create({
    header: 'Programar Rutina',
    subHeader: 'Selecciona los días de entrenamiento:',
    inputs: daysOfWeek.map(day => ({
      type: 'checkbox',
      label: day,
      value: day,
      checked: currentDays.includes(day)
    })),
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Guardar',
        handler: (selectedDays: string[]) => {
          routineSchedule.value[routine.id] = selectedDays;
          localStorage.setItem('forgy_routine_schedule', JSON.stringify(routineSchedule.value));
          showToast('Programación guardada con éxito', 'success');
        }
      }
    ]
  });
  await alert.present();
};

const isRoutineScheduledOnDay = (routineId: string, dayName: string) => {
  const activeDays = routineSchedule.value[routineId] || [];
  return activeDays.includes(dayName);
};

const getRoutinesForDay = (dayName: string) => {
  return routines.value.filter(r => isRoutineScheduledOnDay(r.id, dayName));
};

const quickStartTraining = async (routine: Routine) => {
  await openRoutineDetail(routine);
  startTrainingSession();
};

// Manejo de errores de carga de imágenes
const onImageError = (event: Event, type: 'routine' | 'gif' | 'preview') => {
  const img = event.target as HTMLImageElement;
  if (type === 'routine' || type === 'preview') {
    img.src = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80';
  } else {
    let currentSrc = img.src;
    let modified = false;

    // Si la URL contiene /data/videos/ o /data/images/, limpiarla
    if (currentSrc.includes('/data/videos/')) {
      currentSrc = currentSrc.replace('/data/videos/', '/videos/');
      modified = true;
    } else if (currentSrc.includes('/data/images/')) {
      currentSrc = currentSrc.replace('/data/images/', '/images/');
      modified = true;
    }

    if (currentSrc.includes('/videos/') && currentSrc.endsWith('.gif')) {
      // Intentar cargar el JPG correspondiente de la carpeta images limpia
      img.src = currentSrc.replace('/videos/', '/images/').replace('.gif', '.jpg');
    } else if (modified) {
      // Si solo limpiamos el /data/ pero no es un gif (o ya es jpg), reintentar la URL limpia
      img.src = currentSrc;
    } else {
      // Si todo lo demás falla, ocultar la imagen
      img.style.display = 'none';
    }
  }
};

onIonViewWillEnter(() => {
  // Cargar caché local para 0ms de carga en transiciones
  const cachedExercises = localStorage.getItem('cache_exercises');
  const cachedRoutines = localStorage.getItem('cache_routines');
  const cachedAllExercisesLight = localStorage.getItem('cache_all_exercises_light');
  const savedSchedule = localStorage.getItem('forgy_routine_schedule');
  const savedImages = localStorage.getItem('forgy_routine_images');
  const savedMuscles = localStorage.getItem('forgy_routine_muscles');

  if (savedImages) {
    try {
      routineImages.value = JSON.parse(savedImages);
    } catch (e) {
      console.error('Error parseando forgy_routine_images', e);
    }
  }

  if (savedMuscles) {
    try {
      routineMuscles.value = JSON.parse(savedMuscles);
    } catch (e) {
      console.error('Error parseando forgy_routine_muscles', e);
    }
  }

  if (cachedExercises) {
    try {
      exercises.value = JSON.parse(cachedExercises);
      currentPage.value = Number(localStorage.getItem('cache_exercises_page') || '1');
      totalExercises.value = Number(localStorage.getItem('cache_exercises_total') || '0');
      hasMore.value = localStorage.getItem('cache_exercises_has_more') === 'true';
      isLoading.value = false;
    } catch (e) {
      console.error('Error parseando cache_exercises', e);
    }
  } else {
    currentPage.value = 1;
    exercises.value = [];
    hasMore.value = false;
  }

  if (cachedRoutines) {
    try {
      routines.value = JSON.parse(cachedRoutines);
    } catch (e) {
      console.error('Error parseando cache_routines', e);
    }
  }

  if (cachedAllExercisesLight) {
    try {
      allExercisesLight.value = JSON.parse(cachedAllExercisesLight);
    } catch (e) {
      console.error('Error parseando cache_all_exercises_light', e);
    }
  }

  if (savedSchedule) {
    try {
      routineSchedule.value = JSON.parse(savedSchedule);
    } catch (e) {
      console.error('Error parseando forgy_routine_schedule', e);
    }
  }

  selectedMuscle.value = ['Todos'];
  searchText.value = '';

  // Load from API in the background to ensure freshness
  loadExercises();
  loadRoutines();
  if (allExercisesLight.value.length === 0) {
    loadAllExercisesLight();
  }

  socket = io(API_URL.replace('/api', ''), {
    auth: { token: localStorage.getItem('token') }
  });
  socket.on('exercises-updated', () => {
    console.log('Datos actualizados');
    exercises.value = [];
    loadExercises();
  });
});

onIonViewWillLeave(() => {
  if (socket) socket.disconnect();
});
</script>

<template>
  <ion-page>
    <ion-header class="forgy-header">
      <ion-toolbar>
        <ion-title class="forgy-title">
          Biblioteca
        </ion-title>
      </ion-toolbar>

      <!-- Segmento para cambiar vista -->
      <ion-toolbar>
        <ion-segment v-model="viewMode">
          <ion-segment-button value="exercises">
            <ion-label>Ejercicios</ion-label>
          </ion-segment-button>
          <ion-segment-button value="routines">
            <ion-label>Mis Rutinas</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>

      <!-- Barra de búsqueda -->
      <ion-toolbar v-if="viewMode === 'exercises'">
        <ion-searchbar
          :value="searchText"
          @ionInput="onSearchInput"
          placeholder="Buscar ejercicios..."
          :animated="true"
          show-clear-button="always"
          class="custom-searchbar"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <!-- VISTA DE EJERCICIOS -->
    <ion-content
      :fullscreen="true"
      class="ion-padding"
      v-if="viewMode === 'exercises'"
    >
      <!-- Pull to refresh -->
      <ion-refresher
        slot="fixed"
        @ionRefresh="handleRefresh($event)"
      >
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Filtros por músculo mejorados (sin emojis, usando SVGs) -->
      <div class="muscle-chips">
        <ion-chip
          v-for="m in visibleMusclesWithEmoji"
          :key="m.name"
          :color="selectedMuscle.includes(m.name) ? 'primary' : undefined"
          @click="toggleMuscleFilter(m.name)"
          class="muscle-chip"
          :class="{ 'chip-inactive': !selectedMuscle.includes(m.name) }"
        >
          <span class="chip-svg-icon" v-html="muscleIcons[m.name]"></span>
          <ion-label class="chip-text">{{ m.name }}</ion-label>
        </ion-chip>
        <ion-chip
          class="muscle-chip expand-chip"
          color="medium"
          @click="isExpandedMuscles = !isExpandedMuscles"
          :outline="!isExpandedMuscles"
        >
          <ion-icon :icon="isExpandedMuscles ? removeCircleOutline : addCircleOutline" style="font-size: 16px; margin-right: 4px;"></ion-icon>
          <ion-label class="chip-text">{{ isExpandedMuscles ? 'Ver menos' : 'Ver más' }}</ion-label>
        </ion-chip>
      </div>

      <!-- Acciones de filtro -->
      <div
        v-if="!selectedMuscle.includes('Todos') && selectedMuscle.length > 0"
        class="filter-actions"
      >
        <ion-button
          fill="clear"
          size="small"
          @click="() => { selectedMuscle = ['Todos']; currentPage = 1; exercises = []; hasMore = false; loadExercises(); }"
        >
          <ion-icon
            slot="start"
            :icon="closeCircle"
          ></ion-icon>
          Eliminar filtros
        </ion-button>
      </div>

      <!-- Contador de resultados -->
      <div class="results-count">
        <ion-badge color="primary">{{ totalExercises }}</ion-badge>
        <span>ejercicios disponibles &middot; mostrando {{ filteredExercises.length }}</span>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading">
        <ion-card
          v-for="n in 3"
          :key="n"
        >
          <ion-card-header>
            <ion-skeleton-text
              :animated="true"
              style="width: 60%;"
            ></ion-skeleton-text>
          </ion-card-header>
          <ion-card-content>
            <ion-skeleton-text
              :animated="true"
              style="width: 80%;"
            ></ion-skeleton-text>
            <ion-skeleton-text
              :animated="true"
              style="width: 40%;"
            ></ion-skeleton-text>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Lista de ejercicios -->
      <div v-else>
        <ion-card
          v-for="ex in filteredExercises"
          :key="ex.id"
          class="exercise-card"
          button
          @click="openDetailModal(ex)"
        >
          <ion-card-header>
            <div class="card-header-content">
              <div class="exercise-info">
                <ion-card-title>{{ ex.name }}</ion-card-title>
                <div class="exercise-meta">
                  <ion-chip
                    size="small"
                    color="tertiary"
                  >
                    <span class="chip-svg-icon" v-html="muscleIcons[ex.muscle]"></span>
                    <ion-label class="chip-text">{{ ex.muscle }}</ion-label>
                  </ion-chip>
                  <ion-chip
                    size="small"
                    :color="getDifficultyColor(ex.difficulty)"
                    class="difficulty-chip"
                    :class="ex.difficulty.toLowerCase()"
                  >
                    <span class="difficulty-dot"></span>
                    <ion-label>{{ ex.difficulty }}</ion-label>
                  </ion-chip>
                </div>
              </div>
              <!-- GIF thumbnail con manejador de error -->
              <div v-if="ex.gifUrl" class="exercise-gif-thumb">
                <img :src="ex.gifUrl" :alt="ex.name" loading="lazy" @error="onImageError($event, 'gif')" />
              </div>
            </div>
          </ion-card-header>

          <ion-card-content>
            <p class="exercise-description">{{ ex.description || ex.equipment || 'Toca para ver detalles' }}</p>

            <div
              v-if="ex.equipment"
              class="exercise-equipment"
            >
              <ion-icon :icon="barbell"></ion-icon>
              <span>{{ ex.equipment }}</span>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Infinite Scroll -->
      <ion-infinite-scroll
        v-if="!isLoading"
        @ionInfinite="loadMoreExercises($event)"
        :disabled="!hasMore"
      >
        <ion-infinite-scroll-content
          loading-spinner="crescent"
          loading-text="Cargando más ejercicios..."
        ></ion-infinite-scroll-content>
      </ion-infinite-scroll>

      <!-- Mensaje vacío -->
      <div
        v-if="!isLoading && filteredExercises.length === 0"
        class="empty-state"
      >
        <ion-icon
          :icon="fitness"
          size="large"
        ></ion-icon>
        <h3>No hay ejercicios</h3>
      </div>
    </ion-content>

    <!-- VISTA DE RUTINAS -->
    <ion-content
      :fullscreen="true"
      class="ion-padding"
      v-if="viewMode === 'routines'"
    >
      <ion-refresher
        slot="fixed"
        @ionRefresh="handleRefresh($event)"
      >
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Selector de Vista: Lista / Calendario Semanal -->
      <div class="view-switcher-container">
        <div class="glass-segment-wrapper">
          <button 
            type="button"
            class="view-switch-btn" 
            :class="{ active: routineViewStyle === 'grid' }"
            @click="routineViewStyle = 'grid'"
          >
            <ion-icon :icon="list" class="switcher-icon"></ion-icon>
            <span>Lista</span>
          </button>
          <button 
            type="button"
            class="view-switch-btn" 
            :class="{ active: routineViewStyle === 'calendar' }"
            @click="routineViewStyle = 'calendar'"
          >
            <ion-icon :icon="calendarOutline" class="switcher-icon"></ion-icon>
            <span>Calendario</span>
          </button>
        </div>
      </div>

      <!-- VISTA EN CUADRÍCULA / LISTA -->
      <div v-if="routineViewStyle === 'grid'">
        <!-- Barra Semanal de Filtro -->
        <div class="weekly-schedule-bar">
          <span 
            class="schedule-day-chip" 
            :class="{ active: selectedRoutineDay === 'Todos' }" 
            @click="selectedRoutineDay = 'Todos'"
          >
            Todas
          </span>
          <span 
            v-for="day in daysOfWeek" 
            :key="day" 
            class="schedule-day-chip" 
            :class="{ active: selectedRoutineDay === day }" 
            @click="selectedRoutineDay = day"
          >
            {{ day.substring(0, 3) }}
          </span>
        </div>

        <!-- Botón Selección Múltiple debajo de los días de calendario -->
        <div class="grid-select-action-container">
          <ion-button 
            fill="clear" 
            size="small" 
            class="bulk-select-btn-grid"
            @click="toggleSelectionMode"
          >
            <ion-icon slot="start" :icon="isSelectionModeActive ? closeCircle : list" style="font-size: 16px;"></ion-icon>
            {{ isSelectionModeActive ? 'Cancelar Selección' : 'Seleccionar Múltiple' }}
          </ion-button>
        </div>

        <ion-grid v-if="filteredRoutines.length > 0">
          <ion-row>
            <ion-col
              size="6"
              v-for="routine in filteredRoutines"
              :key="routine.id"
            >
              <ion-card
                button
                @click="isSelectionModeActive ? toggleRoutineSelection(routine.id) : openRoutineDetail(routine)"
                class="routine-card"
                :class="{ 'is-selected': selectedRoutineIds.includes(routine.id) }"
              >
                <div class="routine-card-img-container">
                  <!-- Checkbox de selección múltiple -->
                  <div 
                    v-if="isSelectionModeActive" 
                    class="routine-card-selection-check"
                    @click.stop="toggleRoutineSelection(routine.id)"
                  >
                    <ion-checkbox 
                      :checked="selectedRoutineIds.includes(routine.id)"
                      aria-label="select-routine"
                      class="custom-checkbox"
                    ></ion-checkbox>
                  </div>
                  <!-- Botón de Favorito directo (solo si no estamos seleccionando) -->
                  <div 
                    v-if="!isSelectionModeActive"
                    class="routine-card-favorite-btn" 
                    :class="{ 'is-fav': routine.isFavorite }" 
                    @click.stop="toggleFavoriteRoutine(routine)"
                  >
                    <ion-icon :icon="routine.isFavorite ? star : starOutline"></ion-icon>
                  </div>
                  <!-- Botón de Opciones (solo si no estamos seleccionando) -->
                  <ion-button
                    v-if="!isSelectionModeActive"
                    fill="clear"
                    class="routine-options-button"
                    @click.stop="presentRoutineOptions(routine)"
                  >
                    <ion-icon
                      slot="icon-only"
                      :icon="ellipsisVertical"
                    ></ion-icon>
                  </ion-button>
                  <img
                    alt="Routine image"
                    :src="routineImages[routine.id] || routine.imageUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80'"
                    @error="onImageError($event, 'routine')"
                  />
                  <div class="routine-card-overlay"></div>
                </div>
                <ion-card-header>
                  <ion-card-title>{{ routine.name }}</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <div class="routine-meta-row">
                    <div class="routine-meta-item">
                      <ion-icon :icon="albums" style="font-size: 14px;"></ion-icon>
                      <span>{{ routine.exercises?.length || 0 }} ej.</span>
                    </div>
                    <div v-if="routineMuscles[routine.id]" class="routine-meta-item">
                      <span class="chip-svg-icon" v-html="muscleIcons[routineMuscles[routine.id]]"></span>
                      <span>{{ routineMuscles[routine.id] }}</span>
                    </div>
                  </div>
                </ion-card-content>

                <!-- Indicadores de Días Programados -->
                <div class="routine-schedule-dots">
                  <span 
                    v-for="d in dayLabels" 
                    :key="d.name" 
                    class="schedule-dot"
                    :class="{ active: isRoutineScheduledOnDay(routine.id, d.name) }"
                  >
                    {{ d.label }}
                  </span>
                </div>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <div
          v-else
          class="empty-state"
        >
          <ion-icon
            :icon="albums"
            size="large"
          ></ion-icon>
          <h3>No hay rutinas</h3>
          <p>No se encontraron rutinas programadas para este día.</p>
        </div>
      </div>

      <!-- VISTA EN CALENDARIO / PLANIFICADOR SEMANAL -->
      <div v-else-if="routineViewStyle === 'calendar'" class="calendar-planner-board">
        <div 
          v-for="day in daysOfWeek" 
          :key="day" 
          class="calendar-day-section"
        >
          <div class="calendar-day-header">
            <h3>{{ day }}</h3>
            <span class="day-dot-indicator" :class="{ 'has-routines': getRoutinesForDay(day).length > 0 }"></span>
          </div>

          <div class="calendar-routines-container">
            <div 
              v-for="routine in getRoutinesForDay(day)" 
              :key="routine.id"
              class="calendar-routine-item"
              @click="openRoutineDetail(routine)"
            >
              <img 
                :src="routineImages[routine.id] || routine.imageUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80'" 
                class="calendar-routine-cover"
                @error="onImageError($event, 'routine')"
              />
              <div class="calendar-routine-info">
                <h4 class="calendar-routine-name">{{ routine.name }}</h4>
                <div class="calendar-routine-details">
                  <span class="details-text">
                    <ion-icon :icon="barbell" style="font-size: 12px; vertical-align: middle; margin-right: 2px;"></ion-icon>
                    {{ routine.exercises?.length || 0 }} ej.
                  </span>
                  <span v-if="routineMuscles[routine.id]" class="details-text">
                    &middot; {{ routineMuscles[routine.id] }}
                  </span>
                </div>
              </div>
              
              <!-- Quick Train button -->
              <ion-button 
                fill="clear" 
                size="small" 
                color="success"
                class="quick-train-btn"
                @click.stop="quickStartTraining(routine)"
              >
                Entrenar
              </ion-button>
            </div>

            <!-- Empty State for Day -->
            <div v-if="getRoutinesForDay(day).length === 0" class="calendar-day-empty">
              <span>Día de descanso 🧘</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Barra Acciones Masivas -->
      <div v-if="isSelectionModeActive && selectedRoutineIds.length > 0" class="bulk-action-bar">
        <span class="bulk-selected-count">{{ selectedRoutineIds.length }} seleccionadas</span>
        <div class="bulk-action-buttons">
          <ion-button 
            size="small" 
            color="primary"
            fill="outline"
            @click="bulkScheduleDays"
          >
            <ion-icon slot="start" :icon="calendarOutline"></ion-icon>
            Cambiar Días
          </ion-button>
          <ion-button 
            size="small" 
            color="danger"
            fill="solid"
            @click="bulkDeleteRoutines"
          >
            <ion-icon slot="start" :icon="trash"></ion-icon>
            Eliminar
          </ion-button>
        </div>
      </div>

      <ion-fab
        slot="fixed"
        vertical="bottom"
        horizontal="end"
        v-if="!isSelectionModeActive"
      >
        <ion-fab-button
          @click="createRoutine"
          color="secondary"
        >
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- Modal Crear Rutina -->
    <ion-modal
      :is-open="isCreateRoutineModalOpen"
      @didDismiss="isCreateRoutineModalOpen = false"
    >
      <ion-header class="forgy-header">
        <ion-toolbar class="modal-header-toolbar">
          <ion-buttons slot="start">
            <ion-button 
              fill="clear" 
              color="medium" 
              class="modal-btn-cancel" 
              @click="isCreateRoutineModalOpen = false"
            >
              Cancelar
            </ion-button>
          </ion-buttons>
          <ion-title class="forgy-title">Nueva Rutina</ion-title>
          <ion-buttons slot="end">
            <ion-button
              fill="solid"
              color="primary"
              class="modal-btn-create"
              :disabled="isSavingRoutine"
              @click="saveNewRoutine"
            >
              <span v-if="!isSavingRoutine">Crear</span>
              <ion-spinner v-else name="crescent" size="small"></ion-spinner>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="routine-create-content">
        <div class="routine-image-preview-container">
          <div
            class="routine-image-preview"
            @click="openImagePicker(null)"
          >
            <img
              :src="newRoutineForm.imageUrl || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80'"
              alt="Routine preview"
              @error="onImageError($event, 'preview')"
            />
            <div class="preview-edit-badge">
              <ion-icon :icon="camera" style="font-size: 15px; margin-right: 4px;"></ion-icon>
              <span>Elegir Portada</span>
            </div>
            <div class="routine-image-overlay"></div>
          </div>
        </div>

        <div class="routine-form-container">
          <div class="form-group">
            <label class="form-label">Nombre de la Rutina</label>
            <ion-input
              v-model="newRoutineForm.name"
              placeholder="Ej: Día de Piernas"
              required
              class="clean-form-input"
              aria-label="Nombre de la rutina"
            ></ion-input>
          </div>
          
          <div class="form-group">
            <label class="form-label">Foco Muscular</label>
            <ion-select
              v-model="newRoutineForm.muscleFocus"
              placeholder="Selecciona el foco principal"
              interface="action-sheet"
              class="clean-form-select"
              aria-label="Foco Muscular"
            >
              <ion-select-option
                v-for="m in muscles.slice(1)"
                :key="m"
                :value="m"
              >
                {{ m }}
              </ion-select-option>
            </ion-select>
          </div>

          <div class="form-group">
            <label class="form-label">Descripción <span class="optional-text">(Opcional)</span></label>
            <ion-textarea
              v-model="newRoutineForm.description"
              placeholder="Describe brevemente la rutina..."
              :auto-grow="true"
              :rows="3"
              class="clean-form-textarea"
              aria-label="Descripción"
            ></ion-textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Programar Días de Entrenamiento</label>
            <div class="form-days-row">
              <span 
                v-for="day in daysOfWeek" 
                :key="day" 
                class="form-day-toggle-chip" 
                :class="{ active: newRoutineForm.scheduledDays.includes(day) }"
                @click="toggleFormDay(day)"
              >
                {{ day.substring(0, 3) }}
              </span>
            </div>
          </div>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Modal crear/editar -->
    <ion-modal
      :is-open="isModalOpen"
      @didDismiss="isModalOpen = false"
    >
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-button @click="isModalOpen = false">Cancelar</ion-button>
          </ion-buttons>
          <ion-title>Nuevo Ejercicio</ion-title>
          <ion-buttons slot="end">
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-input
              v-model="form.name"
              label="Nombre"
              label-placement="stacked"
              placeholder="Ej: Press de banca"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-select
              v-model="form.muscle"
              label="Músculo"
              label-placement="stacked"
              interface="action-sheet"
            >
              <ion-select-option
                v-for="m in muscles.slice(1)"
                :key="m"
                :value="m"
              >
                {{ m }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-select
              v-model="form.difficulty"
              label="Dificultad"
              label-placement="stacked"
              interface="action-sheet"
            >
              <ion-select-option
                v-for="d in difficulties"
                :key="d"
                :value="d"
              >
                {{ d }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-input
              v-model="form.equipment"
              label="Equipamiento"
              label-placement="stacked"
              placeholder="Ej: Barra y mancuernas"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-textarea
              v-model="form.description"
              label="Descripción"
              label-placement="stacked"
              placeholder="Describe el ejercicio..."
              :auto-grow="true"
            ></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-textarea
              v-model="form.instructions"
              label="Instrucciones (una por línea)"
              label-placement="stacked"
              placeholder="1. Primer paso&#10;2. Segundo paso..."
              :auto-grow="true"
              :rows="4"
            ></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-input
              v-model="form.video"
              label="URL del Video"
              label-placement="stacked"
              placeholder="https://youtube.com/..."
              type="url"
            ></ion-input>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

    <!-- Modal de Detalle -->
    <ion-modal
      :is-open="isDetailModalOpen"
      @didDismiss="isDetailModalOpen = false"
      :initial-breakpoint="0.75"
      :breakpoints="[0, 0.4, 0.75, 1]"
    >
      <ion-header class="forgy-header">
        <ion-toolbar>
          <ion-title class="forgy-title">Detalles</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="isDetailModalOpen = false">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content
        class="ion-padding"
        v-if="selectedExercise"
      >
        <!-- Compact info header (GIF left, title/meta right) -->
        <div class="exercise-detail-compact-header">
          <div class="detail-gif-container" v-if="selectedExercise.gifUrl">
            <img :src="selectedExercise.gifUrl" :alt="selectedExercise.name" @error="onImageError($event, 'gif')" />
          </div>
          <div class="detail-info-container">
            <h2 class="detail-title">{{ selectedExercise.name }}</h2>
            <div class="detail-badges-row">
              <span class="detail-badge muscle-badge">
                <span class="chip-svg-icon" v-html="muscleIcons[selectedExercise.muscle] || muscleIcons['Todos']"></span>
                <span>{{ selectedExercise.muscle }}</span>
              </span>
              <span class="detail-badge difficulty-badge" :class="selectedExercise.difficulty.toLowerCase()">
                <span class="difficulty-dot"></span>
                <span>{{ selectedExercise.difficulty }}</span>
              </span>
            </div>
            <div class="detail-equipment-row" v-if="selectedExercise.equipment">
              <ion-icon :icon="barbell" class="equipment-icon"></ion-icon>
              <span>{{ selectedExercise.equipment }}</span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="detail-section" v-if="selectedExercise.description">
          <h4 class="detail-section-title">Descripción</h4>
          <p class="detail-description-text">{{ selectedExercise.description }}</p>
        </div>

        <!-- Step-by-step instructions -->
        <div class="detail-section" v-if="selectedExercise.instructions && selectedExercise.instructions.length">
          <h4 class="detail-section-title">Instrucciones técnicas</h4>
          <div class="technical-steps">
            <div
              v-for="(step, idx) in selectedExercise.instructions"
              :key="idx"
              class="technical-step-row"
            >
              <span class="step-number-circle">{{ idx + 1 }}</span>
              <span class="step-text">{{ step }}</span>
            </div>
          </div>
        </div>

        <!-- Action buttons (compact and aligned) -->
        <div class="ion-margin-top" style="display: flex; flex-direction: column; gap: 8px;">
          <ion-button
            expand="block"
            color="primary"
            @click="openVideo(selectedExercise.video || 'https://www.youtube.com/results?search_query=' + selectedExercise.name + ' exercise')"
          >
            <ion-icon
              slot="start"
              :icon="videocam"
            ></ion-icon>
            {{ selectedExercise.video ? 'Ver Video Tutorial' : 'Buscar Video en YouTube' }}
          </ion-button>

          <ion-button
            expand="block"
            fill="outline"
            @click="addToRoutine(selectedExercise!)"
          >
            <ion-icon
              slot="start"
              :icon="bookmark"
            ></ion-icon>
            Guardar en Rutina
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Modal Detalle de Rutina -->
    <ion-modal
      :is-open="isRoutineDetailOpen"
      @didDismiss="onRoutineDetailDismiss"
      :can-dismiss="canDismissRoutineDetail"
    >
      <ion-header class="forgy-header">
        <ion-toolbar class="modal-header-toolbar">
          <ion-buttons slot="start">
            <ion-button
              v-if="selectedRoutine?.exercises && selectedRoutine.exercises.length > 0"
              fill="clear"
              color="primary"
              @click="isReorderMode = !isReorderMode"
              :disabled="isTrainingMode"
              class="modal-btn-order"
            >
              {{ isReorderMode ? 'Hecho' : 'Ordenar' }}
            </ion-button>
          </ion-buttons>
          <ion-title class="forgy-title">{{ selectedRoutine?.name }}</ion-title>
          <ion-buttons slot="end">
            <ion-button
              v-if="isTrainingMode"
              fill="solid"
              color="success"
              @click="finishWorkout"
              strong
              class="modal-btn-finish"
            >
              Finalizar
            </ion-button>
            <ion-button 
              fill="clear" 
              color="medium" 
              class="modal-btn-close" 
              @click="isRoutineDetailOpen = false"
            >
              Cerrar
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <template v-if="selectedRoutine">
          <!-- Modificación de días asignados (programación) -->
          <div class="detail-schedule-section">
            <h4 class="form-section-title">Asignar Días</h4>
            <div class="detail-days-row">
              <span
                v-for="day in daysOfWeek"
                :key="day"
                class="detail-day-toggle-chip"
                :class="{ active: isRoutineScheduledOnDay(selectedRoutine.id, day) }"
                @click="toggleRoutineDay(selectedRoutine.id, day)"
              >
                {{ day.substring(0, 3) }}
              </span>
            </div>
          </div>
          <ion-reorder-group
            v-if="selectedRoutine.exercises && selectedRoutine.exercises.length > 0"
            :disabled="!isReorderMode"
            @ionItemReorder="handleExerciseReorder($event)"
          >
            <ion-item-sliding
              v-for="ex in selectedRoutine.exercises"
              :key="ex.id"
              :disabled="isReorderMode"
            >
              <ion-item
                lines="full"
                class="exercise-list-item"
                :button="!isReorderMode"
                @click="handleExerciseClick(ex)"
                :detail="!isReorderMode"
              >
                <ion-button
                  v-if="isReorderMode"
                  slot="start"
                  fill="clear"
                  color="danger"
                  @click.stop="confirmDeleteExerciseFromRoutine(ex.id)"
                >
                  <ion-icon
                    :icon="removeCircleOutline"
                    slot="icon-only"
                  ></ion-icon>
                </ion-button>
                <div
                  v-if="!isReorderMode"
                  slot="start"
                  class="exercise-avatar"
                  v-html="muscleIcons[ex.muscle]"
                >
                </div>
                <ion-label>
                  <h2>{{ ex.name }}</h2>
                  <p v-if="isTrainingMode && workoutLogs[ex.id]">
                    {{workoutLogs[ex.id].sets.filter(s => s.completed).length}} de {{ workoutLogs[ex.id].sets.length
                    }} series
                  </p>
                  <p v-else>
                    {{ ex.muscle }}
                  </p>
                </ion-label>
                <ion-reorder
                  v-if="isReorderMode"
                  slot="end"
                >
                  <ion-icon :icon="reorderThreeOutline"></ion-icon>
                </ion-reorder>
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option
                  color="danger"
                  @click="confirmDeleteExerciseFromRoutine(ex.id)"
                >
                  <ion-icon
                    :icon="trash"
                    slot="icon-only"
                  ></ion-icon>
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-reorder-group>

          <div
            v-else
            class="ion-text-center ion-padding"
          >
            <p>Esta rutina está vacía.</p>
            <ion-button
              fill="clear"
              @click="openAddExerciseModal"
            >
              <ion-icon
                :icon="add"
                slot="start"
              ></ion-icon>
              Agregar Ejercicios
            </ion-button>
          </div>
        </template>
        <ion-fab
          v-if="selectedRoutine && selectedRoutine.exercises.length > 0 && !isReorderMode && !isTrainingMode"
          slot="fixed"
          vertical="bottom"
          horizontal="end"
        >
          <ion-fab-button @click="openAddExerciseModal">
            <ion-icon :icon="add"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </ion-content>
    </ion-modal>

    <!-- Modal para agregar ejercicio a la rutina -->
    <ion-modal
      :is-open="isAddExerciseModalOpen"
      @didDismiss="isAddExerciseModalOpen = false"
    >
      <ion-header class="forgy-header">
        <ion-toolbar>
          <ion-title class="forgy-title">Agregar Ejercicio</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="isAddExerciseModalOpen = false">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar>
          <ion-searchbar
            v-model="addExerciseSearchText"
            placeholder="Buscar ejercicio para agregar..."
            class="custom-searchbar"
          ></ion-searchbar>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <!-- Filtros por músculo locales -->
        <div class="muscle-chips" style="margin-bottom: 12px; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px;">
          <ion-chip
            v-for="m in visibleAddExerciseMusclesWithEmoji"
            :key="m.name"
            :color="addExerciseSelectedMuscle === m.name ? 'primary' : undefined"
            @click="addExerciseSelectedMuscle = m.name"
            class="muscle-chip"
            :class="{ 'chip-inactive': addExerciseSelectedMuscle !== m.name }"
          >
            <span class="chip-svg-icon" v-html="muscleIcons[m.name]"></span>
            <ion-label class="chip-text">{{ m.name }}</ion-label>
          </ion-chip>
          <ion-chip
            class="muscle-chip expand-chip"
            color="medium"
            @click="isExpandedAddExerciseMuscles = !isExpandedAddExerciseMuscles"
            :outline="!isExpandedAddExerciseMuscles"
          >
            <ion-icon :icon="isExpandedAddExerciseMuscles ? removeCircleOutline : addCircleOutline" style="font-size: 16px; margin-right: 4px;"></ion-icon>
            <ion-label class="chip-text">{{ isExpandedAddExerciseMuscles ? 'Ver menos' : 'Ver más' }}</ion-label>
          </ion-chip>
        </div>
        <ion-list>
          <ion-item
            v-for="ex in exercisesAvailableToAdd"
            :key="ex.id"
            lines="full"
          >
            <div
              slot="start"
              class="exercise-avatar"
              v-html="muscleIcons[ex.muscle]"
            ></div>
            <ion-label>
              <h2>{{ ex.name }}</h2>
              <p>{{ ex.muscle }}</p>
            </ion-label>
            <ion-button
              slot="end"
              fill="clear"
              @click="addExerciseToCurrentRoutine(ex)"
            >
              <ion-icon
                slot="icon-only"
                :icon="addCircleOutline"
              ></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
        <div
          v-if="exercisesAvailableToAdd.length === 0"
          class="empty-state"
        >
          <h3>Todo Agregado</h3>
          <p>No hay más ejercicios para agregar o que coincidan con tu búsqueda.</p>
        </div>
      </ion-content>
    </ion-modal>

    <!-- Modal para registrar series de un ejercicio -->
    <ion-modal
      :is-open="isExerciseLogModalOpen"
      @didDismiss="isExerciseLogModalOpen = false"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ exerciseToLog?.name }}</ion-title>
          <ion-buttons slot="end">
            <ion-button
              strong
              @click="isExerciseLogModalOpen = false"
            >Hecho</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content
        class="ion-padding"
        v-if="exerciseToLog && workoutLogs[exerciseToLog.id]"
      >
        <div class="sets-header">
          <ion-label>Set</ion-label>
          <ion-label>Peso (kg)</ion-label>
          <ion-label>Reps</ion-label>
          <ion-label>Hecho</ion-label>
          <span />
        </div>
        <div
          v-for="(set, index) in workoutLogs[exerciseToLog.id].sets"
          :key="index"
          class="set-row"
        >
          <ion-label class="set-number">{{ index + 1 }}</ion-label>
          <ion-input
            type="number"
            v-model="set.weight"
            placeholder="0"
          ></ion-input>
          <ion-input
            type="number"
            v-model="set.reps"
            placeholder="0"
          ></ion-input>
          <ion-checkbox
            v-model="set.completed"
            @ionChange="validateSetCompletion($event, set)"
          ></ion-checkbox>
          <ion-button
            fill="clear"
            color="danger"
            @click="removeSet(exerciseToLog!.id, index)"
          >
            <ion-icon
              slot="icon-only"
              :icon="trash"
            ></ion-icon>
          </ion-button>
        </div>
        <ion-button
          expand="block"
          fill="clear"
          @click="addSet(exerciseToLog!.id)"
          class="ion-margin-bottom"
        >
          <ion-icon
            slot="start"
            :icon="addCircleOutline"
          ></ion-icon>
          Añadir Serie
        </ion-button>

        <ion-item>
          <ion-input
            label="Duración (minutos)"
            label-placement="stacked"
            type="number"
            v-model="workoutLogs[exerciseToLog.id].duration"
            placeholder="Ej: 15"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-textarea
            label="Notas del ejercicio"
            label-placement="stacked"
            v-model="workoutLogs[exerciseToLog.id].notes"
            placeholder="¿Cómo te sentiste? ¿Alguna observación?"
            :auto-grow="true"
            :rows="3"
          ></ion-textarea>
        </ion-item>

      </ion-content>
    </ion-modal>

    <!-- Modal para seleccionar imagen -->
    <ion-modal
      :is-open="isImagePickerOpen"
      @didDismiss="isImagePickerOpen = false"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Elegir Fondo</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="isImagePickerOpen = false">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-button
          expand="block"
          @click="selectImageFromDevice"
          class="ion-margin-bottom"
        >
          <ion-icon
            slot="start"
            :icon="camera"
          ></ion-icon>
          Subir desde el dispositivo
        </ion-button>
        <ion-grid>
          <ion-row>
            <ion-col
              size="6"
              v-for="img in predefinedImages"
              :key="img"
            >
              <div
                class="image-picker-item"
                @click="updateRoutineImage(img)"
              >
                <img
                  :src="img"
                  alt="Imagen de rutina"
                  style="object-fit:cover;width:100%;height:100px;border-radius:12px;"
                />
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<style scoped>
.muscle-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
  padding: 0 4px;
}

.muscle-chip {
  margin: 0;
  font-weight: 600;
  --background: var(--forgy-input-bg);
  --color: var(--forgy-text-secondary);
  border: 1px solid var(--ion-border-color);
  transition: all 0.2s ease;
}

.muscle-chip[color="primary"] {
  --background: var(--ion-color-primary);
  --color: white;
  border-color: var(--ion-color-primary);
}

.chip-inactive {
  --background: var(--forgy-input-bg);
  --color: var(--forgy-text-secondary);
  border: 1px solid var(--ion-border-color);
}

.filter-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.filter-actions ion-button {
  --color: var(--ion-color-medium);
  font-weight: 600;
}

.chip-svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.chip-text {
  margin-left: 6px;
  vertical-align: middle;
}

.results-count {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--forgy-text-secondary);
  font-size: 14px;
}

.exercise-card {
  margin-bottom: 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  --background: var(--forgy-card-bg);
  color: var(--forgy-text-primary);
  border: 1px solid var(--ion-border-color);
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.exercise-info {
  flex: 1;
}

.exercise-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.exercise-meta ion-chip {
  height: 28px;
  font-size: 12px;
}

/* Mejorar contraste de la letra del músculo en tarjetas (modo claro y oscuro) */
.exercise-meta ion-chip[color="tertiary"] {
  --color: #5856d6 !important;
  --background: rgba(88, 86, 214, 0.1) !important;
  font-weight: 600;
}

body.dark .exercise-meta ion-chip[color="tertiary"],
@media (prefers-color-scheme: dark) {
  .exercise-meta ion-chip[color="tertiary"] {
    --color: #b3b1ff !important;
    --background: rgba(179, 177, 255, 0.2) !important;
  }
}

.difficulty-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--ion-color-medium);
  display: inline-block;
  margin-right: 4px;
}

.principiante .difficulty-dot {
  background-color: var(--ion-color-success);
}
.intermedio .difficulty-dot {
  background-color: var(--ion-color-warning);
}
.avanzado .difficulty-dot {
  background-color: var(--ion-color-danger);
}

.exercise-description {
  color: var(--forgy-text-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}

.exercise-equipment {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--forgy-text-secondary);
  font-size: 14px;
  margin-bottom: 12px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--forgy-border);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--forgy-text-secondary);
}

.empty-state ion-icon {
  font-size: large;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: var(--forgy-text-primary);
}

ion-card-title {
  font-size: 18px;
  font-weight: 600;
}

.custom-searchbar {
  padding-top: 0;
  padding-bottom: 10px;
}

/* Glassy header */
.forgy-header {
  background: transparent !important;
  border-bottom: 1px solid var(--ion-border-color) !important;
}
.forgy-header ion-toolbar {
  --background: rgba(var(--ion-background-color-rgb), 0.8) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  --border-style: none !important;
}
.forgy-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-align: center;
  color: var(--forgy-text-primary);
}

/* Weekly Schedule Bar */
.weekly-schedule-bar {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding: 8px 4px 16px;
  scrollbar-width: none;
}
.weekly-schedule-bar::-webkit-scrollbar {
  display: none;
}
.schedule-day-chip {
  padding: 8px 14px;
  background: var(--forgy-input-bg);
  border: 1px solid var(--ion-border-color);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--forgy-text-secondary);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}
.schedule-day-chip.active {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: white;
}

/* Custom segment design */
ion-segment {
  --background: var(--forgy-input-bg);
  border-radius: 8px;
  padding: 3px;
  margin: 8px 16px !important;
  width: calc(100% - 32px) !important;
  max-width: none !important;
  display: flex !important;
}
ion-segment-button {
  --background-checked: var(--ion-color-primary);
  --color-checked: white;
  --color: var(--forgy-text-secondary);
  border-radius: 6px;
  font-weight: 600;
  min-height: 36px;
}

/* Muscle SVG icon sizing */
:deep(.muscle-svg) {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  display: inline-block;
  vertical-align: middle;
}
:deep(.muscle-icon-img),
.muscle-icon-img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  display: inline-block;
  vertical-align: middle;
  transition: transform 0.2s ease;
}

/* Routine Card styles matching Home */
.routine-card {
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: 12px;
  border: 1px solid var(--ion-border-color);
  overflow: hidden;
  background: var(--forgy-card-bg);
  box-shadow: none;
}

.routine-card-img-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
}

.routine-card-img-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.routine-card:active .routine-card-img-container img {
  transform: scale(1.04);
}

.routine-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0) 50%);
}

.routine-card-favorite-btn {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: transform 0.2s ease;
}

.routine-card-favorite-btn.is-fav {
  color: var(--ion-color-warning);
}

.routine-card-favorite-btn:active {
  transform: scale(0.9);
}

.routine-options-button {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 10;
  --color: white;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  --padding-start: 0;
  --padding-end: 0;
  margin: 0;
}

.routine-card ion-card-header {
  padding: 10px 10px 4px 10px;
}

.routine-card ion-card-content {
  flex-grow: 1;
  padding: 0 10px 10px 10px;
}

/* Routine Schedule Dots */
.routine-schedule-dots {
  display: flex;
  gap: 3px;
  padding: 0 10px 10px 10px;
  margin-top: auto;
}

.schedule-dot {
  width: 16px;
  height: 16px;
  font-size: 8px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--forgy-input-bg);
  color: var(--forgy-text-secondary);
  border: 1px solid var(--ion-border-color);
}

.schedule-dot.active {
  background: var(--ion-color-primary);
  color: white;
  border-color: var(--ion-color-primary);
}

/* Image Picker */
.image-picker-item {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid transparent;
  transition: border-color 0.2s ease-in-out;
  aspect-ratio: 4 / 3;
}

.image-picker-item:hover {
  border-color: var(--ion-color-primary-tint);
}

.image-picker-item img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.routine-image-preview-container {
  padding: 16px;
}

.routine-image-preview {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background-color: var(--forgy-input-bg);
}

.routine-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.routine-image-preview:hover .edit-overlay {
  opacity: 1;
}

.exercise-list-item {
  --padding-start: 0;
}

.exercise-avatar {
  width: 50px;
  height: 50px;
  background-color: var(--forgy-input-bg);
  border-radius: 12px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.inline-chip {
  --padding-start: 6px;
  --padding-end: 6px;
  height: 20px;
  font-size: 10px;
  margin-left: 4px;
  vertical-align: middle;
}

.training-exercise-card {
  margin-bottom: 20px;
}

.sets-header,
.set-row {
  display: grid;
  grid-template-columns: 0.5fr 1fr 1fr 0.7fr 0.5fr;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.sets-header {
  font-weight: bold;
  color: var(--ion-color-medium);
  font-size: 12px;
  padding: 0 8px;
  border-bottom: 1px solid var(--ion-color-step-150, #e0e0e0);
  padding-bottom: 8px;
}

.set-row ion-input {
  background: var(--ion-color-step-100, #f2f2f2);
  border-radius: 6px;
  --padding-start: 8px;
  --padding-end: 8px;
  text-align: center;
}

.set-number {
  text-align: center;
  font-weight: bold;
  color: var(--ion-color-medium);
}

.set-row ion-checkbox {
  justify-self: center;
}

/* GIF thumbnail in exercise card */
.exercise-gif-thumb {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--forgy-input-bg);
}

.exercise-gif-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Compact exercise detail header */
.exercise-detail-compact-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
}

.detail-gif-container {
  width: 90px;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--ion-border-color);
  background: var(--forgy-input-bg);
  flex-shrink: 0;
}

.detail-gif-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-info-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.detail-badges-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  background: var(--forgy-input-bg);
  border: 1px solid var(--ion-border-color);
  color: var(--forgy-text-secondary);
}

.detail-badge :deep(.muscle-svg) {
  width: 12px;
  height: 12px;
}

.detail-badge.principiante {
  border-color: rgba(var(--ion-color-success-rgb), 0.3);
  color: var(--ion-color-success);
}

.detail-badge.intermedio {
  border-color: rgba(var(--ion-color-warning-rgb), 0.3);
  color: var(--ion-color-warning);
}

.detail-badge.avanzado {
  border-color: rgba(var(--ion-color-danger-rgb), 0.3);
  color: var(--ion-color-danger);
}

.detail-equipment-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--forgy-text-secondary);
}

.equipment-icon {
  font-size: 14px;
}

/* Detail Section style */
.detail-section {
  margin-bottom: 18px;
}

.detail-section-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--forgy-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-description-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--forgy-text-secondary);
}

/* Step rows style */
.technical-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.technical-step-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-number-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(var(--ion-color-primary-rgb), 0.15);
  border: 1px solid rgba(var(--ion-color-primary-rgb), 0.3);
  color: var(--ion-color-primary);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.step-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--forgy-text-primary);
}

/* Premium buttons override */
ion-button {
  --border-radius: 8px !important;
  font-weight: 600;
}

/* Custom View Switcher Style */
.view-switcher-container {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.glass-segment-wrapper {
  display: flex;
  background: var(--forgy-input-bg);
  border-radius: 20px;
  padding: 3px;
  border: 1px solid var(--ion-border-color);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  width: 100%;
  max-width: 320px;
}

.view-switch-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 17px;
  color: var(--forgy-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.view-switch-btn.active {
  background: var(--ion-color-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(var(--ion-color-primary-rgb), 0.3);
}

.switcher-icon {
  font-size: 16px;
}

/* Calendar Planner Board Styles */
.calendar-planner-board {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 80px;
}

.calendar-day-section {
  background: var(--forgy-card-bg);
  border-radius: 14px;
  border: 1px solid var(--ion-border-color);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.calendar-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(var(--ion-border-color-rgb), 0.5);
  padding-bottom: 6px;
}

.calendar-day-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--forgy-text-primary);
  letter-spacing: 0.02em;
}

.day-dot-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
}

.day-dot-indicator.has-routines {
  background: var(--ion-color-primary);
  box-shadow: 0 0 6px var(--ion-color-primary);
}

.calendar-routines-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.calendar-routine-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(var(--ion-border-color-rgb), 0.2);
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calendar-routine-item:active {
  transform: scale(0.98);
  border-color: rgba(var(--ion-color-primary-rgb), 0.3);
}

.calendar-routine-cover {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.calendar-routine-info {
  flex: 1;
  min-width: 0;
}

.calendar-routine-name {
  margin: 0 0 2px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--forgy-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-routine-details {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--forgy-text-secondary);
}

.details-text {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.calendar-diff-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--forgy-input-bg);
  border: 1px solid var(--ion-border-color);
  margin-left: auto;
}

.calendar-diff-badge.principiante {
  color: var(--ion-color-success);
  border-color: rgba(var(--ion-color-success-rgb), 0.2);
}

.calendar-diff-badge.intermedio {
  color: var(--ion-color-warning);
  border-color: rgba(var(--ion-color-warning-rgb), 0.2);
}

.calendar-diff-badge.avanzado {
  color: var(--ion-color-danger);
  border-color: rgba(var(--ion-color-danger-rgb), 0.2);
}

.quick-train-btn {
  margin: 0;
  --padding-start: 8px;
  --padding-end: 8px;
  font-weight: 700;
  font-size: 12px;
}

.calendar-day-empty {
  padding: 10px;
  text-align: center;
  font-size: 12px;
  color: var(--forgy-text-secondary);
  font-style: italic;
  background: rgba(var(--ion-border-color-rgb), 0.1);
  border-radius: 8px;
}

/* Routine Card Meta Styles */
.routine-meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--forgy-text-secondary);
  font-size: 13px;
  margin-bottom: 6px;
}

.routine-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.routine-difficulty-badge-container {
  margin-top: 4px;
  display: flex;
}

.routine-diff-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--forgy-input-bg);
  border: 1px solid var(--ion-border-color);
}

.routine-diff-badge.principiante {
  color: var(--ion-color-success);
  border-color: rgba(var(--ion-color-success-rgb), 0.3);
}

.routine-diff-badge.intermedio {
  color: var(--ion-color-warning);
  border-color: rgba(var(--ion-color-warning-rgb), 0.3);
}

.routine-diff-badge.avanzado {
  color: var(--ion-color-danger);
  border-color: rgba(var(--ion-color-danger-rgb), 0.3);
}

/* Premium Form Design overrides */
.modal-header-toolbar {
  --background: rgba(var(--ion-background-color-rgb), 0.95);
}

.modal-btn-cancel {
  font-weight: 500;
  font-size: 14px;
}

.modal-btn-create {
  --border-radius: 20px !important;
  --padding-start: 16px;
  --padding-end: 16px;
  font-size: 14px;
  font-weight: 700;
  height: 36px;
  margin-right: 8px;
}

.routine-create-content {
  --background: var(--ion-background-color) !important;
}

.routine-form-container {
  padding: 12px 20px 32px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--forgy-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-left: 2px;
}

.optional-text {
  font-size: 11px;
  text-transform: lowercase;
  font-weight: 500;
  opacity: 0.6;
}

.clean-form-input,
.clean-form-select,
.clean-form-textarea {
  --background: var(--forgy-input-bg) !important;
  --color: var(--forgy-text-primary) !important;
  --placeholder-color: var(--forgy-text-secondary) !important;
  --placeholder-opacity: 0.5 !important;
  --padding-start: 16px !important;
  --padding-end: 16px !important;
  border-radius: 14px !important;
  border: 1px solid var(--ion-border-color) !important;
  background: var(--forgy-input-bg) !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.clean-form-input {
  height: 52px;
}

.clean-form-select {
  --padding-top: 0 !important;
  --padding-bottom: 0 !important;
  height: 52px;
  display: flex;
  align-items: center;
}

.clean-form-textarea {
  --padding-top: 14px !important;
  --padding-bottom: 14px !important;
  min-height: 90px;
}

.clean-form-input:focus-within,
.clean-form-select:focus-within,
.clean-form-textarea:focus-within {
  border-color: var(--ion-color-primary) !important;
  box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.15) !important;
}

.form-days-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  width: 100%;
}

.form-day-toggle-chip {
  aspect-ratio: 1;
  flex: 1;
  max-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--forgy-input-bg);
  border: 1px solid var(--ion-border-color);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: var(--forgy-text-secondary);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.form-day-toggle-chip.active {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.35);
  transform: scale(1.08);
}

.form-day-toggle-chip:active {
  transform: scale(0.9);
}

.routine-image-preview-container {
  padding: 16px 20px 8px 20px;
}

.routine-image-preview {
  width: 100%;
  height: 130px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background-color: var(--forgy-input-bg);
  border: 1px solid var(--ion-border-color);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  transition: all 0.2s ease;
}

.routine-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.routine-image-preview:active {
  transform: scale(0.98);
}

.routine-image-preview:active img {
  transform: scale(1.05);
}

.preview-edit-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 20px;
  color: #ffffff;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.routine-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 60%);
  pointer-events: none;
}

/* Detail Schedule Styles */
.detail-schedule-section {
  background: var(--forgy-input-bg);
  border: 1px solid var(--ion-border-color);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
}

.detail-days-row {
  display: flex;
  overflow-x: auto;
  gap: 6px;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.detail-days-row::-webkit-scrollbar {
  display: none;
}

.detail-day-toggle-chip {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  background: rgba(var(--ion-border-color-rgb), 0.2);
  border: 1px solid var(--ion-border-color);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--forgy-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 36px;
}

.detail-day-toggle-chip.active {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: white;
  box-shadow: 0 2px 6px rgba(var(--ion-color-primary-rgb), 0.2);
}

/* Bulk Action Bar Styles */
.bulk-action-bar {
  position: fixed;
  bottom: 20px;
  left: 16px;
  right: 16px;
  background: rgba(var(--ion-background-color-rgb), 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--ion-border-color);
  border-radius: 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
  z-index: 1000;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.bulk-selected-count {
  font-size: 14px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.bulk-action-buttons {
  display: flex;
  gap: 8px;
}

.bulk-action-buttons ion-button {
  --border-radius: 10px !important;
  font-weight: 700;
  margin: 0;
}

.routine-card-selection-check {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-select-action-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
  padding: 0 4px;
}

.bulk-select-btn-grid {
  margin: 0;
  font-weight: 700;
  font-size: 13px;
  --color: var(--ion-color-primary);
}

.routine-card.is-selected {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 10px rgba(var(--ion-color-primary-rgb), 0.2);
}

/* Mobile-Focused Large Layout Overrides */
ion-segment-button {
  font-size: 15px;
  min-height: 44px;
}
ion-card-title {
  font-size: 20px;
  font-weight: 700;
}
.results-count {
  font-size: 15px;
  padding: 0 4px;
}
.muscle-chip {
  height: 38px;
  --border-radius: 12px;
}
.chip-text {
  font-size: 13px;
}
.chip-svg-icon :deep(.muscle-svg) {
  width: 18px;
  height: 18px;
}
.chip-svg-icon :deep(.muscle-icon-img),
.chip-svg-icon .muscle-icon-img {
  width: 20px;
  height: 20px;
}
.exercise-card {
  border-radius: 20px;
  margin-bottom: 20px;
}
.routine-card {
  border-radius: 18px;
}
.view-switch-btn {
  font-size: 14px;
  padding: 10px 16px;
}
.switcher-icon {
  font-size: 18px;
}
.calendar-day-header h3 {
  font-size: 17px;
}
.calendar-routine-name {
  font-size: 16px;
}
.calendar-routine-details {
  font-size: 13px;
}
.quick-train-btn {
  font-size: 13px;
  --padding-start: 12px;
  --padding-end: 12px;
}
</style>