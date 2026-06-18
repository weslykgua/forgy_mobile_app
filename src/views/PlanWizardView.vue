<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Crear rutina</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="plan-content">
      <div class="plan-card">
        <h2>Cuéntanos sobre ti</h2>
        <p>Usaremos estos datos para crear tu rutina y tu plan nutricional.</p>

        <div class="input-row">
          <label>Edad</label>
          <input type="number" v-model.number="form.age" min="12" max="90" />
        </div>
        <div class="input-row">
          <label>Peso (kg)</label>
          <input type="number" v-model.number="form.weight" min="30" max="250" />
        </div>
        <div class="input-row">
          <label>Estatura (cm)</label>
          <input type="number" v-model.number="form.height" min="120" max="230" />
        </div>
        <div class="input-row">
          <label>Sexo</label>
          <select v-model="form.sex">
            <option value="male">Hombre</option>
            <option value="female">Mujer</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div class="input-row">
          <label>Objetivo</label>
          <select v-model="form.goal">
            <option value="lose_weight">Bajar grasa</option>
            <option value="maintain">Mantener</option>
            <option value="gain_muscle">Ganar músculo</option>
          </select>
        </div>
        <div class="input-row">
          <label>Días por semana</label>
          <input type="number" v-model.number="form.daysPerWeek" min="1" max="6" />
        </div>
        <div class="input-row">
          <label>Tiempo por día (min)</label>
          <input type="number" v-model.number="form.minutesPerDay" min="20" max="120" />
        </div>

        <div class="input-row">
          <label>Equipo disponible</label>
          <div class="chips">
            <button type="button" class="chip" :class="{ active: form.equipment.includes('gimnasio') }" @click="toggleEquip('gimnasio')">Gimnasio</button>
            <button type="button" class="chip" :class="{ active: form.equipment.includes('mancuernas') }" @click="toggleEquip('mancuernas')">Mancuernas</button>
            <button type="button" class="chip" :class="{ active: form.equipment.includes('bandas') }" @click="toggleEquip('bandas')">Bandas</button>
            <button type="button" class="chip" :class="{ active: form.equipment.includes('peso_corporal') }" @click="toggleEquip('peso_corporal')">Peso corporal</button>
          </div>
        </div>
        <div class="input-row">
          <label>Lesiones (opcional)</label>
          <input type="text" v-model="form.injuries" placeholder="Rodilla, hombro, espalda..." />
        </div>

        <ion-button expand="block" @click="savePlan">Generar rutina</ion-button>
      </div>

      <div class="plan-card" v-if="plan">
        <h3>Tu plan</h3>
        <p class="plan-summary">{{ plan.routineSummary }}</p>
        <div class="plan-macros">
          <div class="macro">
            <span class="macro-label">Calorías</span>
            <span class="macro-value">{{ plan.caloriesTarget }} kcal</span>
          </div>
          <div class="macro">
            <span class="macro-label">Proteína</span>
            <span class="macro-value">{{ plan.proteinTarget }} g</span>
          </div>
          <div class="macro">
            <span class="macro-label">Carbs</span>
            <span class="macro-value">{{ plan.carbsTarget }} g</span>
          </div>
          <div class="macro">
            <span class="macro-label">Grasas</span>
            <span class="macro-value">{{ plan.fatTarget }} g</span>
          </div>
        </div>
        <div class="plan-actions">
          <ion-button fill="outline" @click="savePlan">Editar</ion-button>
          <ion-button color="danger" @click="deletePlan">Eliminar</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, toastController, onIonViewWillEnter
} from '@ionic/vue';
import { ref } from 'vue';
import { useProfile } from '../utils/useProfile';

const { getHeaders, API_URL } = useProfile();

const form = ref({
  age: 25,
  weight: 70,
  height: 170,
  sex: 'male',
  goal: 'maintain',
  daysPerWeek: 3,
  minutesPerDay: 45,
  equipment: ['peso_corporal'],
  injuries: ''
});

const plan = ref<any | null>(null);

function toggleEquip(value: string) {
  if (form.value.equipment.includes(value)) {
    form.value.equipment = form.value.equipment.filter((e) => e !== value);
  } else {
    form.value.equipment.push(value);
  }
}

async function savePlan() {
  try {
    const res = await fetch(`${API_URL}/goals/plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(form.value)
    });
    plan.value = await res.json();
    showToast('Plan guardado');
  } catch (error) {
    console.error(error);
    showToast('Error al guardar', 'danger');
  }
}

async function deletePlan() {
  try {
    await fetch(`${API_URL}/goals/plan`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    plan.value = null;
    showToast('Plan eliminado');
  } catch (error) {
    console.error(error);
    showToast('Error al eliminar', 'danger');
  }
}

async function loadPlan() {
  try {
    const res = await fetch(`${API_URL}/goals/plan`, { headers: getHeaders() });
    plan.value = await res.json();
    if (plan.value?.planData) {
      form.value = { ...form.value, ...plan.value.planData };
    }
  } catch (error) {
    console.error(error);
  }
}

async function showToast(message: string, color = 'success') {
  const toast = await toastController.create({ message, duration: 2000, color, position: 'bottom' });
  await toast.present();
}

onIonViewWillEnter(() => loadPlan());
</script>

<style scoped>
.plan-content {
  --background: var(--forgy-content-bg);
}

.plan-card {
  background: var(--forgy-card-bg);
  margin: 16px;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  color: var(--forgy-text-primary);
}

.plan-card h2,
.plan-card h3 {
  margin: 0 0 6px;
}

.plan-card p {
  margin: 0 0 16px;
  color: var(--forgy-text-secondary);
  font-size: 13px;
}

.input-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.input-row label {
  font-size: 13px;
  font-weight: 600;
}

.input-row input,
.input-row select {
  border: 1px solid var(--forgy-border);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--forgy-content-bg);
  color: var(--forgy-text-primary);
  font-size: 16px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--forgy-border);
  background: var(--forgy-input-bg);
  font-size: 12px;
  cursor: pointer;
}

.chip.active {
  background: rgba(var(--ion-color-primary-rgb), 0.15);
  border-color: var(--ion-color-primary);
}

.plan-summary {
  font-weight: 600;
}

.plan-macros {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.macro {
  background: var(--forgy-input-bg);
  padding: 10px;
  border-radius: 12px;
  text-align: center;
}

.macro-label {
  font-size: 11px;
  color: var(--forgy-text-secondary);
}

.macro-value {
  font-size: 14px;
  font-weight: 700;
}

.plan-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
</style>
