<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab3"></ion-back-button>
        </ion-buttons>
        <ion-title>Calculadora de IMC</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="bmi-content">
      <div class="bmi-card">
        <h2>Ingresa tus datos</h2>
        <p>Calcula tu IMC y recibe un mensaje amigable.</p>

        <div class="input-row">
          <label>Altura (cm)</label>
          <input type="number" v-model.number="heightCm" min="50" max="250" />
        </div>
        <div class="input-row">
          <label>Peso (kg)</label>
          <input type="number" v-model.number="weightKg" min="20" max="300" />
        </div>

        <div class="result-card" v-if="bmiValue">
          <div class="result-value">{{ bmiValue }}</div>
          <div class="result-label">{{ bmiLabel }}</div>
          <p class="result-message">{{ bmiMessage }}</p>
        </div>

        <ion-button expand="block" class="save-btn" @click="saveBmi">
          Guardar y usar estos datos
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  toastController,
  useIonRouter,
  onIonViewWillEnter
} from '@ionic/vue';
import { computed, ref } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const router = useIonRouter();

const heightCm = ref<number | null>(null);
const weightKg = ref<number | null>(null);

const bmiValue = computed(() => {
  if (!heightCm.value || !weightKg.value) return '';
  const heightM = heightCm.value / 100;
  const bmi = weightKg.value / (heightM * heightM);
  return bmi.toFixed(1);
});

const bmiLabel = computed(() => {
  const value = Number(bmiValue.value);
  if (!value) return '';
  if (value < 18.5) return 'Bajo peso';
  if (value < 25) return 'Peso normal';
  if (value < 30) return 'Sobrepeso';
  return 'Obesidad';
});

const bmiMessage = computed(() => {
  const value = Number(bmiValue.value);
  if (!value) return '';
  if (value < 18.5) {
    return 'Vas bien, solo necesita un poco más de energía y nutrición. ¡Tú puedes!';
  }
  if (value < 25) {
    return 'Vas muy bien, hidratación y constancia te mantienen en un rango saludable.';
  }
  if (value < 30) {
    return 'Estás cerca del rango saludable. Pasos pequeños diarios hacen una gran diferencia.';
  }
  return 'No estás solo: con hábitos pequeños y constancia puedes mejorar. ¡Vamos juntos!';
});

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function getLocalDateKey(date = new Date()) {
  return date.toLocaleDateString('en-CA');
}

async function saveBmi() {
  if (!heightCm.value || !weightKg.value) {
    showToast('Completa altura y peso', 'danger');
    return;
  }

  const authHeaders = getAuthHeaders();
  if (!authHeaders.Authorization) {
    showToast('Inicia sesión para guardar', 'danger');
    return;
  }

  try {
    await fetch(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ height: heightCm.value, weight: weightKg.value })
    });

    const today = getLocalDateKey();
    const saveRes = await fetch(`${API_URL}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ date: today, weight: weightKg.value })
    });
    if (!saveRes.ok) {
      throw new Error('No se pudo guardar el progreso');
    }

    showToast('Datos guardados correctamente');
    router.push('/tabs/tab3');
  } catch (error) {
    console.error(error);
    showToast('Error al guardar', 'danger');
  }
}

async function loadProfile() {
  const authHeaders = getAuthHeaders();
  if (!authHeaders.Authorization) return;

  try {
    const res = await fetch(`${API_URL}/user/profile`, { headers: authHeaders });
    const profile = await res.json();
    if (profile?.height) heightCm.value = Number(profile.height);
    if (profile?.weight) weightKg.value = Number(profile.weight);
  } catch (error) {
    console.error(error);
  }
}

async function showToast(message: string, color = 'success') {
  const toast = await toastController.create({ message, duration: 2000, color, position: 'bottom' });
  await toast.present();
}

onIonViewWillEnter(() => {
  loadProfile();
});
</script>

<style scoped>
.bmi-content {
  --background: var(--forgy-content-bg);
}

.bmi-card {
  background: var(--forgy-card-bg);
  margin: 16px;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  color: var(--forgy-text-primary);
}

.bmi-card h2 {
  margin: 0 0 6px;
  font-size: 20px;
}

.bmi-card p {
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

.input-row input {
  border: 1px solid var(--forgy-border);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--forgy-content-bg);
  color: var(--forgy-text-primary);
  font-size: 16px;
}

.result-card {
  background: var(--forgy-input-bg);
  border-radius: 16px;
  padding: 16px;
  margin: 10px 0 16px;
  text-align: center;
}

.result-value {
  font-size: 32px;
  font-weight: 800;
  color: var(--ion-color-primary);
}

.result-label {
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
}

.result-message {
  margin-top: 8px;
  font-size: 13px;
  color: var(--forgy-text-secondary);
}

.save-btn {
  margin-top: 8px;
}
</style>
