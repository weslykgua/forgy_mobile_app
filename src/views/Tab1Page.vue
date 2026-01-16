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
  bodyOutline, chevronDown
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

const API_URL = 'http://localhost:3000';
const exercises = ref<Exercise[]>([]);
const isLoading = ref(true);
const searchText = ref('');
const selectedMuscle = ref('Todos');
const isModalOpen = ref(false);
const isEditing = ref(false);
const currentExercise = ref<Exercise | null>(null);

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

// Filtrar ejercicios
const filteredExercises = computed(() => {
  let result = exercises.value;

  if (selectedMuscle.value !== 'Todos') {
    result = result.filter(ex => ex.muscle === selectedMuscle.value);
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
  isEditing.value = false;
  currentExercise.value = null;
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

// Abrir modal para editar
const openEditModal = (exercise: Exercise) => {
  isEditing.value = true;
  currentExercise.value = exercise;
  form.value = {
    name: exercise.name,
    muscle: exercise.muscle,
    video: exercise.video,
    description: exercise.description || '',
    difficulty: exercise.difficulty,
    equipment: exercise.equipment || '',
    instructions: exercise.instructions?.join('\n') || ''
  };
  isModalOpen.value = true;
};

// Guardar ejercicio (crear o editar)
const saveExercise = async () => {
  try {
    const exerciseData = {
      ...form.value,
      instructions: form.value.instructions.split('\n').filter(i => i.trim())
    };

    if (isEditing.value && currentExercise.value) {
      // Actualizar
      const response = await fetch(`${API_URL}/exercises/${currentExercise.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData)
      });

      if (!response.ok) throw new Error('Error al actualizar');
      showToast('¡Ejercicio actualizado!', 'success');
    } else {
      // Crear
      const response = await fetch(`${API_URL}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData)
      });

      if (!response.ok) throw new Error('Error al crear');
      showToast('¡Ejercicio creado!', 'success');
    }

    isModalOpen.value = false;
    loadExercises();
  } catch (error) {
    console.error(error);
    showToast('Error al guardar', 'danger');
  }
};

// Confirmar eliminación
const confirmDelete = async (exercise: Exercise) => {
  const alert = await alertController.create({
    header: '¿Eliminar ejercicio?',
    message: `¿Estás seguro de eliminar "${exercise.name}"?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => deleteExercise(exercise.id)
      }
    ]
  });
  await alert.present();
};

// Eliminar ejercicio
const deleteExercise = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/exercises/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Error al eliminar');

    showToast('Ejercicio eliminado', 'warning');
    loadExercises();
  } catch (error) {
    console.error(error);
    showToast('Error al eliminar', 'danger');
  }
};

// Refrescar
const handleRefresh = async (event: CustomEvent) => {
  await loadExercises();
  (event.target as any).complete();
};

onIonViewWillEnter(() => {
  loadExercises();
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
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon
            :icon="fitness"
            style="margin-right: 8px;"
          ></ion-icon>
          Ejercicios
        </ion-title>
      </ion-toolbar>

      <!-- Barra de búsqueda -->
      <ion-toolbar color="primary">
        <ion-searchbar
          v-model="searchText"
          placeholder="Buscar ejercicios..."
          :animated="true"
          show-clear-button="focus"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content
      :fullscreen="true"
      class="ion-padding"
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
          :color="selectedMuscle === m.name ? 'primary' : 'light'"
          @click="selectedMuscle = m.name"
          class="muscle-chip"
        >
          <span class="chip-emoji">{{ m.emoji }}</span>
          <ion-label>{{ m.name }}</ion-label>
        </ion-chip>
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

            <div class="card-actions">
              <ion-button
                fill="clear"
                size="small"
                @click="openEditModal(ex)"
              >
                <ion-icon
                  slot="start"
                  :icon="create"
                ></ion-icon>
                Editar
              </ion-button>
              <ion-button
                fill="clear"
                size="small"
                color="danger"
                @click="confirmDelete(ex)"
              >
                <ion-icon
                  slot="start"
                  :icon="trash"
                ></ion-icon>
                Eliminar
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Mensaje vacío -->
        <div
          v-if="filteredExercises.length === 0"
          class="empty-state"
        >
          <ion-icon
            :icon="fitness"
            size="large"
          ></ion-icon>
          <h3>No hay ejercicios</h3>
          <p>Agrega tu primer ejercicio con el botón +</p>
        </div>
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
            <ion-title>{{ isEditing ? 'Editar' : 'Nuevo' }} Ejercicio</ion-title>
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
    </ion-content>
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
  transition: all 0.2s ease;
}

.muscle-chip:active {
  transform: scale(0.95);
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
  color: var(--ion-color-medium);
  font-size: 14px;
}

.exercise-card {
  margin-bottom: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  color: var(--ion-color-medium);
  margin-bottom: 12px;
  line-height: 1.5;
}

.exercise-equipment {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ion-color-medium);
  font-size: 14px;
  margin-bottom: 12px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--ion-color-light);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: var(--ion-color-dark);
}

ion-card-title {
  font-size: 18px;
  font-weight: 600;
}
</style>