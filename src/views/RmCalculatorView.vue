<template>
  <ion-page>
    <!-- Header unificado con clase Forgy -->
    <ion-header class="forgy-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab3" :icon="chevronBack" text="" class="custom-back-btn"></ion-back-button>
        </ion-buttons>
        <ion-title class="forgy-title">Calculadora de RM</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="rm-content">
      <div class="rm-container">
        <div class="rm-card">
          <h2>Calcula tu RM estimada</h2>
          <p>Ingresa el peso levantado y el número de repeticiones para estimar tu 1 Repetición Máxima (1RM).</p>

          <div class="input-row">
            <label>Unidad de medida</label>
            <ion-segment v-model="unit" mode="ios" class="custom-segment">
              <ion-segment-button value="kg">
                <ion-label>kg</ion-label>
              </ion-segment-button>
              <ion-segment-button value="lb">
                <ion-label>lb</ion-label>
              </ion-segment-button>
            </ion-segment>
          </div>

          <div class="input-row">
            <label>Peso levantado ({{ unit }})</label>
            <input type="number" v-model.number="weight" min="1" max="1000" placeholder="Ej. 80" />
          </div>
          <div class="input-row">
            <label>Repeticiones realizadas</label>
            <input type="number" v-model.number="reps" min="1" max="30" placeholder="Ej. 8" />
          </div>

          <!-- Tarjeta de Resultados -->
          <div class="result-card" v-if="rmValue">
            <div class="result-label">Tu 1RM Estimada es de:</div>
            <div class="result-value">{{ rmValue }} {{ unit }}</div>
            <p class="result-message">{{ rmMessage }}</p>
            
            <!-- Comparativa física -->
            <div class="result-compare">
              <div class="compare-image-container">
                <img class="compare-image" :src="compareImage.src" :alt="compareImage.label" />
              </div>
              <div class="compare-info">
                <span class="compare-header">Equivalente a levantar:</span>
                <span class="compare-text">{{ compareText }}</span>
              </div>
            </div>
          </div>
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
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/vue';
import { computed, ref } from 'vue';
import { chevronBack } from 'ionicons/icons';

const unit = ref<'kg' | 'lb'>('kg');
const weight = ref<number | null>(null);
const reps = ref<number | null>(null);

const repPercentages: Record<number, number> = {
  1: 100,
  2: 97,
  3: 94,
  4: 92,
  5: 89,
  6: 86,
  7: 83,
  8: 81,
  9: 78,
  10: 75,
  11: 73,
  12: 71,
  13: 70,
  14: 68,
  15: 67,
  16: 65,
  17: 64,
  18: 63,
  19: 61,
  20: 60,
  21: 59,
  22: 58,
  23: 57,
  24: 56,
  25: 55,
  26: 54,
  27: 53,
  28: 52,
  29: 51,
  30: 50
};

const rmValue = computed(() => {
  if (!weight.value || !reps.value) return '';
  const percentage = repPercentages[reps.value];
  if (!percentage) return '';
  const rm = weight.value / (percentage / 100);
  return rm.toFixed(1);
});

const rmMessage = computed(() => {
  const value = Number(rmValue.value);
  if (!value) return '';
  if (value < 60) return 'Buen comienzo. La técnica y constancia hacen magia.';
  if (value < 100) return '¡Vas fuerte! Cada repetición suma.';
  if (value < 140) return 'Nivel sólido. Estás construyendo fuerza real.';
  if (value < 180) return 'Muy fuerte. Estás cerca de nivel avanzado.';
  return 'Impresionante. Fuerza de élite, ¡sigue así!';
});

const comparisonWeightKg = computed(() => {
  const value = Number(rmValue.value);
  if (!value) return 0;
  return unit.value === 'kg' ? value : value / 2.20462;
});

const imageMap = {
  jug: new URL('../assets/rm/jug.svg', import.meta.url).href,
  sandbag: new URL('../assets/rm/sandbag.svg', import.meta.url).href,
  tire: new URL('../assets/rm/tire.svg', import.meta.url).href,
  box: new URL('../assets/rm/box.svg', import.meta.url).href,
  armchair: new URL('../assets/rm/armchair.svg', import.meta.url).href,
  washer: new URL('../assets/rm/washer.svg', import.meta.url).href,
  sofa: new URL('../assets/rm/sofa.svg', import.meta.url).href,
  barrel: new URL('../assets/rm/barrel.svg', import.meta.url).href,
  motorcycle: new URL('../assets/rm/motorcycle.svg', import.meta.url).href,
  piano: new URL('../assets/rm/piano.svg', import.meta.url).href
};

const compareImage = computed(() => {
  const value = comparisonWeightKg.value;
  if (!value) return { src: imageMap.box, label: 'Objeto' };
  if (value < 30) return { src: imageMap.jug, label: 'Garrafón' };
  if (value < 50) return { src: imageMap.sandbag, label: 'Saco de arena' };
  if (value < 70) return { src: imageMap.tire, label: 'Rueda de auto' };
  if (value < 90) return { src: imageMap.box, label: 'Caja grande' };
  if (value < 110) return { src: imageMap.armchair, label: 'Sillón' };
  if (value < 130) return { src: imageMap.washer, label: 'Lavadora' };
  if (value < 150) return { src: imageMap.sofa, label: 'Sofá' };
  if (value < 180) return { src: imageMap.barrel, label: 'Barril' };
  if (value < 210) return { src: imageMap.motorcycle, label: 'Moto ligera' };
  return { src: imageMap.piano, label: 'Piano vertical' };
});

const compareText = computed(() => {
  const value = comparisonWeightKg.value;
  if (!value) return 'Calcula tu RM para ver la comparación.';
  if (value < 25) return 'Un garrafón de agua de 20L lleno.';
  if (value < 40) return 'Una maleta de viaje grande y pesada.';
  if (value < 60) return 'Un saco de cemento o arena estándar.';
  if (value < 80) return 'La llanta de repuesto de un automóvil.';
  if (value < 100) return 'Una caja de mudanza repleta de libros.';
  if (value < 120) return 'Un sillón de sala de un cuerpo.';
  if (value < 140) return 'Una lavadora automática doméstica.';
  if (value < 170) return 'Un sofá de cuero de dos cuerpos.';
  if (value < 200) return 'Un barril de metal industrial lleno.';
  if (value < 230) return 'Una motocicleta urbana ligera.';
  return 'Un piano de cola o vertical grande.';
});
</script>

<style scoped>
.rm-content {
  --background: var(--forgy-content-bg);
}

.rm-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

.rm-card {
  background: var(--forgy-card-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  color: var(--forgy-text-primary);
}

.rm-card h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
}

.rm-card p {
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

.custom-segment {
  border: 1px solid var(--forgy-border);
  background: var(--forgy-input-bg);
  border-radius: 10px;
  padding: 2px;
}

/* Tarjeta de Resultados */
.result-card {
  background: var(--forgy-input-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 16px;
  padding: 20px;
  margin: 20px 0 6px;
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

.result-message {
  margin: 4px 0 12px;
  font-size: 13px;
  color: var(--forgy-text-secondary);
  line-height: 1.4;
}

/* Comparativa */
.result-compare {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--forgy-card-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 12px;
  padding: 12px 16px;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
}

.compare-image-container {
  background: var(--forgy-input-bg);
  border: 1px solid var(--forgy-border);
  border-radius: 10px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.compare-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.compare-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.compare-header {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--forgy-text-secondary);
  letter-spacing: 0.05em;
}

.compare-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}

.custom-back-btn {
  --color: var(--ion-color-primary);
  margin-left: 8px;
}
</style>
