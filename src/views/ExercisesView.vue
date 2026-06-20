<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonButton, IonCheckbox,
  IonSearchbar, IonSegment, IonSegmentButton, IonChip, IonGrid, IonRow, IonCol, IonReorder, IonReorderGroup, IonItemSliding, IonItemOptions, IonItemOption,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonFab, IonFabButton, IonModal, IonButtons, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonRefresher, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent, actionSheetController,
  IonSkeletonText, IonBadge,
  onIonViewWillEnter, onIonViewWillLeave, alertController, toastController
} from '@ionic/vue';
import { useProfile } from '../utils/useProfile'
import { ref, computed } from 'vue';
import { io } from 'socket.io-client';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  add, fitness, barbell, closeCircle, videocam, list, bookmark, albums, reorderThreeOutline, ellipsisVertical, imageOutline, camera, addCircleOutline, trash, removeCircleOutline
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
const currentTrainingSessionId = ref<string | null>(null);
const workoutLogs = ref<Record<string, {
  sets: { reps: string; weight: string; completed: boolean }[];
  notes: string;
  duration: string;
}>>({});
const newRoutineForm = ref({ name: '', description: '' });
const predefinedImages = ref([
    // Imágenes prediseñadas
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80',
    'https://images.unsplash.com/photo-1581009137042-c552e485697a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=869&q=80',
    'https://images.unsplash.com/photo-1599058917212-d750089bc07e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=869&q=80',
    'https://images.unsplash.com/photo-1574680096145-f846b5a6abc4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=869&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80',
    // Imágenes locales
    '/src/assets/rm/rutina1.jpg',
    '/src/assets/rm/rutina2.jpg',
    '/src/assets/rm/rutina3.jpg',
    '/src/assets/rm/rutina4.jpg',
    '/src/assets/rm/rutina5.jpg'
]);

let socket: any = null;

const musclesWithEmoji = [
  { name: 'Todos', emoji: '🏋️' },
  { name: 'Pecho', emoji: '💪' },
  { name: 'Espalda', emoji: '🔙' },
  { name: 'Piernas', emoji: '🦵' },
  { name: 'Hombros', emoji: '🤷' },
  { name: 'Bíceps', emoji: '💪' },
  { name: 'Tríceps', emoji: '💪' },
  { name: 'Abdomen', emoji: '🎯' }
];
const muscles = musclesWithEmoji.map(m => m.name);
const difficulties = ['Principiante', 'Intermedio', 'Avanzado'];
const difficultyEmoji = { 'Principiante': '🟢', 'Intermedio': '🟡', 'Avanzado': '🔴' };

// Obtener emoji del músculo
const getMuscleEmoji = (muscle: string) => {
  return musclesWithEmoji.find(m => m.name === muscle)?.emoji || '💪';
};

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


const allExercisesLight = ref<Exercise[]>([]);
const isLoadingLight = ref(false);

const exercisesAvailableToAdd = computed(() => {
  if (!selectedRoutine.value) return [];

  const exerciseIdsInRoutine = selectedRoutine.value.exercises.map(ex => ex.id);

  let available = allExercisesLight.value.filter(ex => !exerciseIdsInRoutine.includes(ex.id));

  if (addExerciseSearchText.value) {
    const search = addExerciseSearchText.value.toLowerCase();
    available = available.filter(ex =>
      ex.name.toLowerCase().includes(search) ||
      ex.muscle?.toLowerCase().includes(search)
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
    isLoading.value = true;
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
  } catch (error) {
    console.error("Error fetching exercises", error);
    showToast('Error al cargar ejercicios', 'danger');
    if (!append) exercises.value = [];
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
    } else {
      console.error("La respuesta de la API para rutinas no es un array:", data);
      routines.value = []; // Asegurarse de que siempre sea un array
    }
  } catch (error) {
    console.error("Error fetching routines", error);
    routines.value = []; // Resetear en caso de error de red
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
  newRoutineForm.value = { name: '', description: '' };
  isCreateRoutineModalOpen.value = true;
};

// Guardar la nueva rutina creada desde el modal
const saveNewRoutine = async () => {
  if (!newRoutineForm.value.name) {
    showToast('Por favor, dale un nombre a la rutina', 'warning');
    return;
  }
  try {
    const response = await fetch(`${API_URL}/routines`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...newRoutineForm.value
      })
    });
    if (!response.ok) throw new Error('Error en la respuesta del servidor');

    showToast('Rutina creada con éxito');
    loadRoutines();
    isCreateRoutineModalOpen.value = false;
  } catch (e) {
    showToast('Error al crear la rutina', 'danger');
  }
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
      allExercisesLight.value = Array.isArray(data) ? data : [];
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
      const response = await fetch(`${API_URL}/routines/${routine.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ imageUrl: imageUrl }),
      });
      if (!response.ok) throw new Error('Error al cambiar la imagen');

      // Actualizar datos locales para feedback inmediato
      const routineInList = routines.value.find(r => r.id === routine.id);
      if (routineInList) {
        routineInList.imageUrl = imageUrl;
      }
      isImagePickerOpen.value = false;
    } catch (error) {
      console.error(error);
      await showToast('No se pudo cambiar la imagen', 'danger');
    }
  } else {
    // Si no, estamos creando una nueva rutina. Solo actualizamos el formulario.
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

onIonViewWillEnter(() => {
  // Reset and load first page
  currentPage.value = 1;
  exercises.value = [];
  hasMore.value = false;
  selectedMuscle.value = ['Todos'];
  searchText.value = '';
  loadExercises();
  loadRoutines();
  socket = io(API_URL.replace('/api', ''), {
    auth: { token: localStorage.getItem('token') }
  });
  socket.on('exercises-updated', () => {
    console.log('Datos actualizados');
    currentPage.value = 1;
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
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon
            :icon="fitness"
            style="margin-right: 8px;"
          ></ion-icon>
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
          placeholder="Buscar entre 1,500+ ejercicios..."
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

      <!-- Filtros por músculo mejorados -->
      <div class="muscle-chips">
        <ion-chip
          v-for="m in musclesWithEmoji"
          :key="m.name"
          :color="selectedMuscle.includes(m.name) ? 'primary' : undefined"
          @click="toggleMuscleFilter(m.name)"
          class="muscle-chip"
          :class="{ 'chip-inactive': !selectedMuscle.includes(m.name) }"
        >
          <span class="chip-emoji">{{ m.emoji }}</span>
          <ion-label>{{ m.name }}</ion-label>
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
                    <span class="chip-emoji-small">{{ getMuscleEmoji(ex.muscle) }}</span>
                    <ion-label>{{ ex.muscle }}</ion-label>
                  </ion-chip>
                  <ion-chip
                    size="small"
                    :color="getDifficultyColor(ex.difficulty)"
                  >
                    <span class="chip-emoji-small">{{ difficultyEmoji[ex.difficulty] }}</span>
                    <ion-label>{{ ex.difficulty }}</ion-label>
                  </ion-chip>
                </div>
              </div>
              <!-- GIF thumbnail -->
              <div v-if="ex.gifUrl" class="exercise-gif-thumb">
                <img :src="ex.gifUrl" :alt="ex.name" loading="lazy" />
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

      <!-- FAB para agregar eliminado -->
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

      <ion-grid v-if="routines.length > 0">
        <ion-row>
          <ion-col
            size="6"
            v-for="routine in routines"
            :key="routine.id"
          >
            <ion-card
              button
              @click="openRoutineDetail(routine)"
              class="routine-card"
            >
              <ion-button
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
                :src="routine.imageUrl || 'https://ionicframework.com/docs/img/demos/card-media.png'"
              />
              <ion-card-header>
                <ion-card-title>{{ routine.name }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-icon
                  :icon="albums"
                  style="vertical-align: middle;"
                ></ion-icon>
                {{ routine.exercises?.length || 0 }} ejercicios
              </ion-card-content>
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
        <h3>No tienes rutinas</h3>
        <p>Crea una playlist de ejercicios para organizar tus entrenamientos.</p>
      </div>

      <ion-fab
        slot="fixed"
        vertical="bottom"
        horizontal="end"
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
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start">
            <ion-button @click="isCreateRoutineModalOpen = false">Cancelar</ion-button>
          </ion-buttons>
          <ion-title>Nueva Rutina</ion-title>
          <ion-buttons slot="end">
            <ion-button
              strong
              @click="saveNewRoutine"
            >Crear</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div class="routine-image-preview-container">
          <div
            class="routine-image-preview"
            @click="openImagePicker(null)"
          >
            <img
              :src="'./assets/placeholder-image.png'"
              alt="Routine preview"
            />
            <div class="edit-overlay">Elegir Imagen</div>
          </div>
        </div>
        <ion-list>
          <ion-item>
            <ion-input
              v-model="newRoutineForm.name"
              label="Nombre de la rutina"
              label-placement="stacked"
              placeholder="Ej: Día de Piernas"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-textarea
              v-model="newRoutineForm.description"
              label="Descripción (opcional)"
              label-placement="stacked"
              placeholder="Describe brevemente la rutina..."
              :auto-grow="true"
            ></ion-textarea>
          </ion-item>
        </ion-list>
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
      :initial-breakpoint="0.85"
      :breakpoints="[0, 0.5, 0.85, 1]"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Detalles</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="isDetailModalOpen = false">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content
        class="ion-padding"
        v-if="selectedExercise"
      >
        <div class="ion-text-center ion-margin-bottom">
          <!-- Exercise GIF -->
          <div v-if="selectedExercise.gifUrl" class="exercise-gif-modal">
            <img :src="selectedExercise.gifUrl" :alt="selectedExercise.name" />
          </div>
          <h1>{{ selectedExercise.name }}</h1>
          <ion-chip color="tertiary">
            {{ getMuscleEmoji(selectedExercise.muscle) }} {{ selectedExercise.muscle }}
          </ion-chip>
          <ion-chip :color="getDifficultyColor(selectedExercise.difficulty)">
            {{ difficultyEmoji[selectedExercise.difficulty] }} {{ selectedExercise.difficulty }}
          </ion-chip>
        </div>

        <div class="ion-margin-bottom">
          <h3>Descripción</h3>
          <p style="line-height: 1.6; color: var(--forgy-text-secondary);">
            {{ selectedExercise.description || 'Sin descripción detallada.' }}
          </p>
        </div>

        <div
          v-if="selectedExercise.equipment"
          class="ion-margin-bottom"
        >
          <h3><ion-icon
              :icon="barbell"
              style="vertical-align: text-bottom;"
            ></ion-icon> Equipamiento</h3>
          <p>{{ selectedExercise.equipment }}</p>
        </div>

        <div
          v-if="selectedExercise.instructions && selectedExercise.instructions.length"
          class="ion-margin-bottom"
        >
          <h3>Instrucciones</h3>
          <ol style="padding-left: 20px; line-height: 1.6;">
            <li
              v-for="(step, i) in selectedExercise.instructions"
              :key="i"
              style="margin-bottom: 8px;"
            >
              {{ step }}
            </li>
          </ol>
        </div>

        <div class="ion-margin-top">
          <ion-button
            expand="block"
            @click="openVideo(selectedExercise.video || 'https://www.youtube.com/results?search_query=' + selectedExercise.name + ' exercise')"
          >
            <ion-icon
              slot="start"
              :icon="videocam"
            ></ion-icon>
            {{ selectedExercise.video ? 'Ver Video Tutorial' : 'Buscar Video en YouTube' }}
          </ion-button>

          <div class="ion-text-center ion-margin-top">
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
        </div>
      </ion-content>
    </ion-modal>

    <!-- Modal Detalle de Rutina -->
    <ion-modal
      :is-open="isRoutineDetailOpen"
      @didDismiss="onRoutineDetailDismiss"
      :can-dismiss="canDismissRoutineDetail"
    >
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button
              v-if="selectedRoutine?.exercises && selectedRoutine.exercises.length > 0"
              @click="isReorderMode = !isReorderMode"
              :disabled="isTrainingMode"
            >
              {{ isReorderMode ? 'Hecho' : 'Ordenar' }}
            </ion-button>
          </ion-buttons>
          <ion-title>{{ selectedRoutine?.name }}</ion-title>
          <ion-buttons slot="end">
            <ion-button
              v-if="isTrainingMode"
              @click="finishWorkout"
              color="success"
              strong
            >Finalizar</ion-button>
            <ion-button @click="isRoutineDetailOpen = false">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <template v-if="selectedRoutine">
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
                >
                  {{ getMuscleEmoji(ex.muscle) }}
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
      <ion-header>
        <ion-toolbar>
          <ion-title>Agregar Ejercicio</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="isAddExerciseModalOpen = false">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar>
          <ion-searchbar
            v-model="addExerciseSearchText"
            placeholder="Buscar ejercicio para agregar..."
          ></ion-searchbar>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list>
          <ion-item
            v-for="ex in exercisesAvailableToAdd"
            :key="ex.id"
            lines="full"
          >
            <div
              slot="start"
              class="exercise-avatar"
            >{{ getMuscleEmoji(ex.muscle) }}</div>
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
}

.chip-inactive {
  --background: #f2f4f8;
  --color: #111111;
  border: 1px solid rgba(0, 0, 0, 0.08);
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

.chip-emoji {
  font-size: 16px;
  margin-right: 4px;
}

.chip-emoji-small {
  font-size: 12px;
  margin-right: 2px;
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

.routine-card {
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.routine-options-button {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
  --color: white;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  --padding-start: 0;
  --padding-end: 0;
}

.routine-card ion-card-header {
  padding-bottom: 8px;
}

.routine-card ion-card-content {
  flex-grow: 1;
}

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

/* Full GIF in detail modal */
.exercise-gif-modal {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--forgy-input-bg);
}

.exercise-gif-modal img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>