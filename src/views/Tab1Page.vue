<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonThumbnail, IonButton,
  IonSearchbar, IonSegment, IonSegmentButton, IonChip,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonFab, IonFabButton, IonModal, IonButtons, IonInput,
  IonTextarea, IonSelect, IonSelectOption, IonAlert,
  IonRefresher, IonRefresherContent, IonSkeletonText,
  IonBadge, IonItemSliding, IonItemOptions, IonItemOption,
  onIonViewWillEnter, onIonViewWillLeave, alertController, toastController
} from '@ionic/vue';
import { ref, computed } from 'vue';
import { io } from 'socket.io-client';
import {
  add, trash, create, fitness, barbell,
  search, filterOutline, closeCircle, checkmarkCircle,
  bodyOutline, chevronDown, videocam, list, bookmark
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
  createdAt: string;
}

interface Routine {
  id: string;
  name: string;
  exercises: Exercise[];
}

const API_URL = 'http://localhost:3000';
const exercises = ref<Exercise[]>([]);
const routines = ref<Routine[]>([]);
const isLoading = ref(true);
const searchText = ref('');
const selectedMuscle = ref<string[]>(['Todos']);
const isModalOpen = ref(false);
const isDetailModalOpen = ref(false);
const selectedExercise = ref<Exercise | null>(null);
const viewMode = ref<'exercises' | 'routines'>('exercises');
const selectedRoutine = ref<Routine | null>(null);
const isRoutineDetailOpen = ref(false);

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

// Manejar selección de filtros de músculo
const toggleMuscleFilter = (muscleName: string) => {
  // Si se hace clic en 'Todos', se convierte en la única selección.
  if (muscleName === 'Todos') {
    selectedMuscle.value = ['Todos'];
    return;
  }

  const newSelection = [...selectedMuscle.value];

  // Eliminar 'Todos' si está presente y estamos agregando un músculo específico.
  const todosIndex = newSelection.indexOf('Todos');
  if (todosIndex > -1) {
    newSelection.splice(todosIndex, 1);
  }

  const muscleIndex = newSelection.indexOf(muscleName);
  if (muscleIndex > -1) {
    // Deseleccionar: eliminarlo del array.
    newSelection.splice(muscleIndex, 1);
  } else {
    // Seleccionar: agregarlo al array.
    newSelection.push(muscleName);
  }

  // Si el array queda vacío, volver a 'Todos'.
  selectedMuscle.value = newSelection.length > 0 ? newSelection : ['Todos'];
};

// Filtrar ejercicios
const filteredExercises = computed(() => {
  let result = exercises.value;

  if (!selectedMuscle.value.includes('Todos') && selectedMuscle.value.length > 0) {
    result = result.filter(ex => selectedMuscle.value.includes(ex.muscle));
  }

  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter(ex =>
      ex.name.toLowerCase().includes(search) ||
      ex.description?.toLowerCase().includes(search)
    );
  }

  return result;
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

// Icono por músculo
const getMuscleIcon = (muscle: string) => {
  return bodyOutline;
};

// Cargar ejercicios
const loadExercises = async () => {
  try {
    isLoading.value = true;
    const response = await fetch(`${API_URL}/exercises`);
    exercises.value = await response.json();
  } catch (error) {
    console.error("Error fetching", error);
    showToast('Error al cargar ejercicios', 'danger');
  } finally {
    isLoading.value = false;
  }
};

// Cargar rutinas
const loadRoutines = async () => {
  try {
    const response = await fetch(`${API_URL}/routines`);
    routines.value = await response.json();
  } catch (error) {
    console.error("Error fetching routines", error);
  }
};

// Mostrar toast
const showToast = async (message: string, color: string = 'success') => {
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
      headers: { 'Content-Type': 'application/json' },
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
  const alert = await alertController.create({
    header: 'Nueva Rutina',
    inputs: [
      {
        name: 'name',
        type: 'text',
        placeholder: 'Nombre de la rutina (ej. Pierna Lunes)'
      }
    ],
    buttons: [
      'Cancelar',
      {
        text: 'Crear',
        handler: async (data) => {
          if (!data.name) return;
          try {
            const response = await fetch(`${API_URL}/routines`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: data.name })
            });
            if (response.ok) {
              showToast('Rutina creada');
              loadRoutines();
            }
          } catch (e) {
            showToast('Error al crear rutina', 'danger');
          }
        }
      }
    ]
  });
  await alert.present();
};

// Agregar ejercicio a rutina
const addToRoutine = async (exercise: Exercise) => {
  if (routines.value.length === 0) {
    showToast('Crea una rutina primero', 'warning');
    return;
  }

  const alert = await alertController.create({
    header: 'Guardar en Rutina',
    inputs: routines.value.map(r => ({
      type: 'radio',
      label: r.name,
      value: r.id
    })),
    buttons: ['Cancelar', {
      text: 'Guardar',
      handler: async (routineId) => {
        if (!routineId) return;
        await fetch(`${API_URL}/routines/${routineId}/exercises`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exerciseId: exercise.id })
        });
        showToast(`Agregado a rutina`, 'success');
        isDetailModalOpen.value = false;
      }
    }]
  });
  await alert.present();
};

// Refrescar
const handleRefresh = async (event: CustomEvent) => {
  await loadExercises();
  await loadRoutines();
  (event.target as any).complete();
};

onIonViewWillEnter(() => {
  loadExercises();
  loadRoutines();
  selectedMuscle.value = ['Todos']; // Opcional: Reinicia los filtros
  searchText.value = ''; // Opcional: Limpia la búsqueda
  socket = io(API_URL);
  socket.on('exercises-updated', () => {
    console.log("🔔 Datos actualizados");
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
          v-model="searchText"
          placeholder="Buscar ejercicios..."
          :animated="true"
          show-clear-button="focus"
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
          @click="selectedMuscle = ['Todos']"
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
        <ion-badge color="primary">{{ filteredExercises.length }}</ion-badge>
        <span>ejercicios encontrados</span>
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
            </div>
          </ion-card-header>

          <ion-card-content>
            <p class="exercise-description">{{ ex.description || 'Sin descripción' }}</p>

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
        <p>Agrega tu primer ejercicio con el botón +</p>
      </div>

      <!-- FAB para agregar -->
      <ion-fab
        slot="fixed"
        vertical="bottom"
        horizontal="end"
      >
        <ion-fab-button
          @click="openCreateModal"
          color="primary"
        >
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
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

      <div v-if="routines.length > 0">
        <ion-card
          v-for="routine in routines"
          :key="routine.id"
          button
          @click="selectedRoutine = routine; isRoutineDetailOpen = true"
        >
          <ion-card-header>
            <ion-card-title>{{ routine.name }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-icon
              :icon="list"
              style="vertical-align: middle;"
            ></ion-icon>
            {{ routine.exercises?.length || 0 }} ejercicios
          </ion-card-content>
        </ion-card>
      </div>

      <div
        v-else
        class="empty-state"
      >
        <ion-icon
          :icon="list"
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
            <ion-button
              strong
              @click="saveExercise"
            >Guardar</ion-button>
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
      @didDismiss="isRoutineDetailOpen = false"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ selectedRoutine?.name }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="isRoutineDetailOpen = false">Cerrar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list v-if="selectedRoutine?.exercises && selectedRoutine.exercises.length > 0">
          <ion-item
            v-for="ex in selectedRoutine.exercises"
            :key="ex.id"
          >
            <ion-label>
              <h2>{{ ex.name }}</h2>
              <p>{{ ex.muscle }} • {{ ex.difficulty }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
        <div
          v-else
          class="ion-text-center ion-padding"
        >
          <p>Esta rutina está vacía.</p>
          <ion-button
            fill="clear"
            @click="isRoutineDetailOpen = false; viewMode = 'exercises'"
          >
            Ir a agregar ejercicios
          </ion-button>
        </div>
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
</style>