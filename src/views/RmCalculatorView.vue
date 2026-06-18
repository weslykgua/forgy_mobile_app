<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab3"></ion-back-button>
        </ion-buttons>
        <ion-title>Calculadora de RM</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="rm-content">
      <div class="rm-card">
        <h2>Calcula tu RM estimada</h2>
        <p>Ingresa el peso y repeticiones. No se guarda nada.</p>

        <div class="input-row">
          <label>Unidad</label>
          <ion-segment v-model="unit" mode="ios">
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
          <input type="number" v-model.number="weight" min="1" max="1000" />
        </div>
        <div class="input-row">
          <label>Repeticiones</label>
          <input type="number" v-model.number="reps" min="1" max="30" />
        </div>

        <div class="result-card" v-if="rmValue">
          <div class="result-value">{{ rmValue }} {{ unit }}</div>
          <div class="result-label">RM estimada (1 repetición)</div>
          <p class="result-message">{{ rmMessage }}</p>
          <div class="result-compare">
            <img class="compare-image" :src="compareImage.src" :alt="compareImage.label" />
            <span class="compare-text">{{ compareText }}</span>
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
  if (value < 25) return 'Sería como levantar un garrafón de agua lleno.';
  if (value < 40) return 'Sería como levantar una maleta grande de viaje.';
  if (value < 60) return 'Sería como levantar un saco de arena pesado.';
  if (value < 80) return 'Sería como levantar una llanta grande de auto.';
  if (value < 100) return 'Sería como levantar una caja grande de mudanza.';
  if (value < 120) return 'Sería como levantar un sillón individual robusto.';
  if (value < 140) return 'Sería como levantar una lavadora doméstica.';
  if (value < 170) return 'Sería como levantar un sofá de 2 plazas.';
  if (value < 200) return 'Sería como levantar un barril de acero lleno.';
  if (value < 230) return 'Sería como levantar una moto ligera.';
  return 'Sería como levantar un piano vertical.';
});
</script>

<style scoped>
.rm-content {
  --background: var(--forgy-content-bg);
}

.rm-card {
  background: var(--forgy-card-bg);
  margin: 16px;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  color: var(--forgy-text-primary);
}

.rm-card h2 {
  margin: 0 0 6px;
  font-size: 20px;
}

.rm-card p {
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
.input-row select,
.input-row ion-segment {
  border: 1px solid var(--forgy-border);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--forgy-content-bg);
  color: var(--forgy-text-primary);
  font-size: 16px;
}

.input-row ion-segment {
  padding: 4px;
}

.result-card {
  background: var(--forgy-input-bg);
  border-radius: 16px;
  padding: 16px;
  margin: 10px 0 6px;
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

.result-compare {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.compare-emoji {
  font-size: 20px;
}

.compare-image {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.compare-text {
  font-size: 12px;
  color: var(--forgy-text-secondary);
}
</style>
