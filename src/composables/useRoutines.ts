import { ref, computed } from 'vue';
import { useProfile } from '@/utils/useProfile';
import { toastController, alertController, actionSheetController } from '@ionic/vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { imageOutline, calendarOutline, star, starOutline, ellipsisVertical, albums } from 'ionicons/icons';
import type { Exercise, Routine, RoutineDetail } from '@/interfaces';
import { PREDEFINED_ROUTINE_IMAGES } from '@/constants/routines';
import { DAYS_OF_WEEK } from '@/constants/calendar';

export function useRoutines() {
  const { getHeaders, API_URL } = useProfile();

  const routines = ref<Routine[]>([]);
  const selectedRoutine = ref<RoutineDetail | null>(null);
  const isRoutineDetailOpen = ref(false);
  const isReorderMode = ref(false);
  const isImagePickerOpen = ref(false);
  const routineForImageChange = ref<Routine | null>(null);
  const isCreateRoutineModalOpen = ref(false);
  const isSavingRoutine = ref(false);
  const isSelectionModeActive = ref(false);
  const selectedRoutineIds = ref<string[]>([]);
  const allExercisesLight = ref<Exercise[]>([]);
  const isLoadingLight = ref(false);
  const routineViewStyle = ref<'grid' | 'calendar'>('grid');

  const newRoutineForm = ref({
    name: '',
    description: '',
    muscleFocus: 'Pecho',
    imageUrl: '',
    scheduledDays: [] as string[]
  });

  const predefinedImages = ref(PREDEFINED_ROUTINE_IMAGES);

  // Rutinas programadas por día (Local Storage fallback)
  const routineSchedule = ref<Record<string, string[]>>(
    JSON.parse(localStorage.getItem('forgy_routine_schedule') || '{}')
  );
  const routineImages = ref<Record<string, string>>(
    JSON.parse(localStorage.getItem('forgy_routine_images') || '{}')
  );
  const routineMuscles = ref<Record<string, string>>(
    JSON.parse(localStorage.getItem('forgy_routine_muscles') || '{}')
  );

  const daysOfWeek = DAYS_OF_WEEK;

  const showToast = async (message: string, color = 'success') => {
    const toast = await toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  };

  const loadCache = () => {
    try {
      const cached = localStorage.getItem('cache_routines');
      if (cached) {
        routines.value = JSON.parse(cached);
      }
    } catch (e) {
      console.error('Error loading routines cache', e);
    }
  };

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
        localStorage.setItem('cache_routines', JSON.stringify(routines.value));
      } else {
        console.error('La respuesta de la API para rutinas no es un array:', data);
        routines.value = [];
      }
    } catch (error) {
      console.error('Error fetching routines', error);
      if (routines.value.length === 0) routines.value = [];
    }
  };

  const createRoutine = () => {
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

  const saveNewRoutine = async () => {
    if (isSavingRoutine.value) return;
    if (!newRoutineForm.value.name) {
      await showToast('Por favor, dale un nombre a la rutina', 'warning');
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
      
      if (newRoutineForm.value.imageUrl) {
        routineImages.value[createdRoutine.id] = newRoutineForm.value.imageUrl;
        localStorage.setItem('forgy_routine_images', JSON.stringify(routineImages.value));
      }

      if (newRoutineForm.value.muscleFocus) {
        routineMuscles.value[createdRoutine.id] = newRoutineForm.value.muscleFocus;
        localStorage.setItem('forgy_routine_muscles', JSON.stringify(routineMuscles.value));
      }

      if (newRoutineForm.value.scheduledDays && newRoutineForm.value.scheduledDays.length > 0) {
        routineSchedule.value[createdRoutine.id] = newRoutineForm.value.scheduledDays;
        localStorage.setItem('forgy_routine_schedule', JSON.stringify(routineSchedule.value));
      }

      await showToast('Rutina creada con éxito');
      await loadRoutines();
      isCreateRoutineModalOpen.value = false;
    } catch (e) {
      await showToast('Error al crear la rutina', 'danger');
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

  const isRoutineScheduledOnDay = (routineId: string, dayName: string) => {
    const scheduled = routineSchedule.value[routineId];
    return Array.isArray(scheduled) && scheduled.includes(dayName);
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
              await showToast('Rutinas eliminadas con éxito', 'success');
              await loadRoutines();
              toggleSelectionMode();
            } catch (error) {
              console.error(error);
              await showToast('Error al eliminar las rutinas', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  };

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
              createRoutine();
            },
          },
        ],
      });
      await alert.present();
      return;
    }

    const availableRoutines = routines.value.filter(routine => {
      const exerciseIdsInRoutine = (routine.exercises || []).map(re => re.exerciseId);
      return !exerciseIdsInRoutine.includes(exercise.id);
    });

    if (availableRoutines.length === 0) {
      await showToast('Este ejercicio ya está en todas tus rutinas.', 'info');
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
                // Ignore if parsing fails
              }
              throw new Error(errorMessage);
            }

            await showToast(`Agregado a rutina`, 'success');
            await loadRoutines();
          } catch (error: any) {
            console.error(error);
            await showToast((error as Error).message, 'danger');
          }
        }
      }
      ]
    });
    await alert.present();
  };

  const loadAllExercisesLight = async () => {
    if (isLoadingLight.value) return;
    isLoadingLight.value = true;
    try {
      const response = await fetch(`${API_URL}/exercises?paginate=false`);
      if (response.ok) {
        const data = await response.json();
        allExercisesLight.value = Array.isArray(data) ? data : (data.data ?? []);
      }
    } catch (e) {
      console.error('Error loading light exercises:', e);
    } finally {
      isLoadingLight.value = false;
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

      selectedRoutine.value.exercises.push({ ...exercise, order: newOrder });

      const routineInList = routines.value.find(r => r.id === routineId);
      if (routineInList) {
        if (!routineInList.exercises) routineInList.exercises = [];
        routineInList.exercises.push({ exerciseId: exercise.id, order: newOrder });
      }

      await showToast(`${exercise.name} agregado a la rutina`, 'success');
    } catch (error: any) {
      console.error('Error adding exercise to routine:', error);
      await showToast(error.message || 'Error al agregar', 'danger');
    }
  };

  const handleExerciseReorder = async (event: CustomEvent) => {
    if (!selectedRoutine.value) return;

    const reorderedExercises = event.detail.complete(selectedRoutine.value.exercises);
    selectedRoutine.value.exercises = reorderedExercises;

    const exercisesWithOrder = reorderedExercises.map((ex: Exercise & { order: number }, index: number) => ({
      exerciseId: ex.id,
      order: index,
    }));

    try {
      const routineId = selectedRoutine.value.id;
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
      console.error('Error reordering exercises:', error);
      await showToast('Error al guardar el nuevo orden', 'danger');
    }
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
        throw new Error('No se pudo eliminar el ejercicio de la rutina.');
      }

      selectedRoutine.value.exercises = selectedRoutine.value.exercises.filter(ex => ex.id !== exerciseId);

      const routineInList = routines.value.find(r => r.id === routineId);
      if (routineInList) {
        routineInList.exercises = (routineInList.exercises || []).filter(re => re.exerciseId !== exerciseId);
      }

      await showToast('Ejercicio eliminado de la rutina', 'success');
    } catch (error: any) {
      console.error(error);
      await showToast(error.message || 'Error al eliminar', 'danger');
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

  const openRoutineDetail = async (routine: Routine, cachedExercisesList?: Exercise[]) => {
    isRoutineDetailOpen.value = true;
    selectedRoutine.value = null; // show loader
    
    // Ensure we have all exercises loaded (light list) for hydration
    if (allExercisesLight.value.length === 0) {
      await loadAllExercisesLight();
    }

    const hydratedExercises = (routine.exercises || [])
      .map(routineExercise => {
        const fullExercise = allExercisesLight.value.find(e => e.id === routineExercise.exerciseId)
                          || cachedExercisesList?.find(e => e.id === routineExercise.exerciseId);
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
  };

  // Rutinas favoritas y menú de opciones
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
      await showToast(nextFavoriteState ? 'Añadida a favoritos' : 'Eliminada de favoritos', 'success');
    } catch (e) {
      console.error(e);
      await showToast('No se pudo actualizar favoritos', 'danger');
    }
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
        { text: 'Cancelar', role: 'cancel' },
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
              await showToast('Rutina eliminada', 'success');
              await loadRoutines();
            } catch (error: any) {
              console.error(error);
              await showToast(error.message, 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  };

  const openImagePicker = (routine: Routine | null) => {
    routineForImageChange.value = routine;
    isImagePickerOpen.value = true;
  };

  const updateRoutineImage = async (imageUrl: string) => {
    if (routineForImageChange.value) {
      const routine = routineForImageChange.value;
      try {
        routineImages.value[routine.id] = imageUrl;
        localStorage.setItem('forgy_routine_images', JSON.stringify(routineImages.value));

        const response = await fetch(`${API_URL}/routines/${routine.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ imageUrl: imageUrl }),
        });
        if (!response.ok) throw new Error('Error al cambiar la imagen');

        const routineInList = routines.value.find(r => r.id === routine.id);
        if (routineInList) {
          routineInList.imageUrl = imageUrl;
        }
        isImagePickerOpen.value = false;
        await showToast('Imagen de rutina actualizada', 'success');
      } catch (error) {
        console.error(error);
        isImagePickerOpen.value = false;
        await showToast('Imagen actualizada de forma local', 'success');
      }
    } else {
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
        source: CameraSource.Prompt,
        promptLabelHeader: 'Seleccionar Imagen',
        promptLabelPhoto: 'Desde la Galería',
        promptLabelPicture: 'Tomar Foto'
      });

      if (image.webPath) {
        await updateRoutineImage(image.webPath);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen', error);
      await showToast('No se pudo seleccionar la imagen. Revisa los permisos.', 'warning');
    }
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
            openImagePicker(routine);
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

  // Carga inicial
  loadCache();

  return {
    routines,
    selectedRoutine,
    isRoutineDetailOpen,
    isReorderMode,
    isImagePickerOpen,
    routineForImageChange,
    isCreateRoutineModalOpen,
    isSavingRoutine,
    isSelectionModeActive,
    selectedRoutineIds,
    allExercisesLight,
    isLoadingLight,
    routineSchedule,
    routineImages,
    routineMuscles,
    newRoutineForm,
    predefinedImages,
    routineViewStyle,
    daysOfWeek,
    loadRoutines,
    createRoutine,
    saveNewRoutine,
    toggleFormDay,
    toggleRoutineDay,
    isRoutineScheduledOnDay,
    toggleSelectionMode,
    toggleRoutineSelection,
    bulkScheduleDays,
    bulkDeleteRoutines,
    addToRoutine,
    loadAllExercisesLight,
    addExerciseToCurrentRoutine,
    handleExerciseReorder,
    deleteExerciseFromRoutine,
    confirmDeleteExerciseFromRoutine,
    openRoutineDetail,
    toggleFavoriteRoutine,
    presentRoutineOptions,
    renameRoutine,
    confirmDeleteRoutine,
    scheduleRoutineDays,
    openImagePicker,
    updateRoutineImage,
    selectImageFromDevice
  };
}
