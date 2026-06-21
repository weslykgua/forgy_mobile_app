<template>
  <ion-page>
    <!-- Header unificado con clase Forgy -->
    <ion-header class="forgy-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab3" :icon="chevronBack" text="" class="custom-back-btn"></ion-back-button>
        </ion-buttons>
        <ion-title class="forgy-title">Calculadora de IMC</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content
      :fullscreen="true"
      class="bmi-content"
    >
      <div class="bmi-container">
        <div class="bmi-card">
          <h2>Ingresa tus datos</h2>
          <p>Calcula tu índice de masa corporal y realiza un seguimiento diario de tu progreso.</p>

          <div class="disclaimer-banner">
            <ion-icon :icon="alertCircleOutline" class="disclaimer-icon"></ion-icon>
            <span>Estos resultados no tienen ninguna validez científica.</span>
          </div>

          <div class="input-row">
            <label>Altura (cm)</label>
            <input
              type="number"
              v-model.number="heightCm"
              min="50"
              max="250"
              placeholder="Ej. 175"
            />
          </div>
          <div class="input-row">
            <label>Peso (kg)</label>
            <input
              type="number"
              v-model.number="weightKg"
              min="20"
              max="300"
              placeholder="Ej. 70"
            />
          </div>

          <!-- Escala Visual de IMC -->
          <div class="bmi-scale-container" v-if="bmiValue">
            <span class="scale-title">Escala de Clasificación</span>
            <div class="bmi-scale-bar">
              <div class="scale-segment underweight"></div>
              <div class="scale-segment normal"></div>
              <div class="scale-segment overweight"></div>
              <div class="scale-segment obese"></div>
              
              <!-- Cursor indicador -->
              <div 
                class="scale-cursor" 
                :style="{ left: bmiPositionPercent + '%' }"
              >
                <div class="cursor-pointer"></div>
                <div class="cursor-label">{{ bmiValue }}</div>
              </div>
            </div>
            <div class="scale-labels">
              <span>Bajo</span>
              <span>Normal</span>
              <span>Sobrepeso</span>
              <span>Obeso</span>
            </div>
          </div>

          <div
            class="result-card"
            v-if="bmiValue"
          >
            <div class="result-label">Tu IMC actual es:</div>
            <div class="result-value">{{ bmiValue }}</div>
            <div class="result-badge" :class="bmiLabel.toLowerCase().replace(' ', '-')">
              {{ bmiLabel }}
            </div>
            <p class="result-message">{{ bmiMessage }}</p>
          </div>

          <ion-button
            expand="block"
            class="save-btn"
            @click="saveBmi"
          >
            Guardar en mi perfil
          </ion-button>
        </div>
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
  IonIcon,
  toastController,
  useIonRouter,
  onIonViewWillEnter
} from '@ionic/vue';
import { computed, ref } from 'vue';
import { alertCircleOutline, chevronBack } from 'ionicons/icons';

const API_URL = import.meta.env.VITE_API_URL || 'https://forgybackendapi-production.up.railway.app'
const router = useIonRouter();

const heightCm = ref<number | null>(null);
const weightKg = ref<number | null>(null);

const bmiValue = computed(() => {
  if (!heightCm.value || !weightKg.value) return '';
  const heightM = heightCm.value / 100;
  const bmi = weightKg.value / (heightM * heightM);
  return bmi.toFixed(1);
});

const bmiPositionPercent = computed(() => {
  const val = Number(bmiValue.value);
  if (!val) return 0;
  // Rango de IMC a mostrar: de 15 a 35
  const minBmi = 15;
  const maxBmi = 35;
  const percent = ((val - minBmi) / (maxBmi - minBmi)) * 100;
  return Math.min(Math.max(percent, 0), 100);
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
    return 'Vas bien, solo se necesita un poco más de energía y nutrición. ¡Tú puedes!';
  }
  if (value < 25) {
    return 'Vas muy bien, la hidratación y constancia te mantienen en un rango saludable.';
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

.bmi-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

.bmi-card {
  background: var(--forgy-card-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  color: var(--forgy-text-primary);
}

.bmi-card h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
}

.bmi-card p {
  margin: 0 0 24px;
  color: var(--forgy-text-secondary);
  font-size: 13px;
  line-height: 1.4;
}

.input-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.input-row label {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--forgy-text-secondary);
}

.input-row input {
  border: 1px solid var(--forgy-border);
  border-radius: 12px;
  padding: 12px 14px;
  background: var(--forgy-input-bg);
  color: var(--forgy-text-primary);
  font-size: 16px;
  transition: all 0.2s ease;
}

.input-row input:focus {
  outline: none;
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.12);
}

/* Escala Visual */
.bmi-scale-container {
  margin: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scale-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--forgy-text-secondary);
}

.bmi-scale-bar {
  height: 12px;
  display: flex;
  border-radius: 6px;
  position: relative;
  overflow: visible;
  margin-bottom: 8px;
}

.scale-segment {
  flex: 1;
}

.scale-segment.underweight {
  background: #56ccf2;
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.scale-segment.normal {
  background: #2dd36f;
}

.scale-segment.overweight {
  background: #ffc409;
}

.scale-segment.obese {
  background: #eb445a;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

.scale-cursor {
  position: absolute;
  top: -8px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  transition: left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.cursor-pointer {
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 10px solid var(--forgy-text-primary);
}

.cursor-label {
  background: var(--forgy-text-primary);
  color: var(--forgy-card-bg);
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
  margin-top: 4px;
}

.scale-labels {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--forgy-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Tarjeta de Resultados */
.result-card {
  background: var(--forgy-input-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 16px;
  padding: 20px;
  margin: 16px 0 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.result-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--forgy-text-secondary);
}

.result-value {
  font-size: 38px;
  font-weight: 800;
  color: var(--ion-color-primary);
}

.result-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: white;
}

.result-badge.bajo-peso {
  background: #56ccf2;
}

.result-badge.peso-normal {
  background: #2dd36f;
}

.result-badge.sobrepeso {
  background: #ffc409;
}

.result-badge.obesidad {
  background: #eb445a;
}

.result-message {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--forgy-text-secondary);
  line-height: 1.45;
}

.save-btn {
  margin-top: 8px;
  --border-radius: 12px;
  font-weight: 600;
}

.custom-back-btn {
  --color: var(--ion-color-primary);
  margin-left: 8px;
}

.disclaimer-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(var(--ion-color-warning-rgb), 0.08);
  border: 1px solid rgba(var(--ion-color-warning-rgb), 0.2);
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 24px;
  color: var(--ion-color-warning-shade, #b8860b);
  font-size: 12px;
  font-weight: 600;
}

.disclaimer-icon {
  font-size: 16px;
  flex-shrink: 0;
}
</style>
