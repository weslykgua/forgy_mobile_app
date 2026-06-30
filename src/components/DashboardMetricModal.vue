<template>
  <div v-if="type" class="custom-modal-overlay" @click.self="$emit('close')">
    <div class="custom-modal-container">
      <div class="custom-modal-header">
        <h3 class="custom-modal-title">
          {{ title }}
        </h3>
      </div>
      
      <div class="custom-modal-body">
        <!-- Reloj Interactivo de Sueño -->
        <div v-if="type === 'sleep'" class="sleep-clock-picker">
          <div class="clock-section">
            <div class="clock-labels-row">
              <!-- Bedtime selector -->
              <div class="clock-label-group">
                <span class="clock-label">Acostarse</span>
                <div class="drum-picker-wrapper">
                  <select :value="bedtime" class="drum-select" @change="onBedtimeChange">
                    <option v-for="slot in timeSlots" :key="slot" :value="slot">{{ slot }}</option>
                  </select>
                </div>
              </div>
              
              <!-- Arc display -->
              <div class="clock-arc-display">
                <svg viewBox="0 0 120 120" class="sleep-arc-svg">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--forgy-input-bg, #f4f5f8)" stroke-width="10"/>
                  <circle cx="60" cy="60" r="50" fill="none"
                    stroke="var(--ion-color-secondary)"
                    stroke-width="10"
                    stroke-linecap="round"
                    :stroke-dasharray="314.16"
                    :stroke-dashoffset="314.16 * (1 - parseFloat(inputValue || '0') / 24)"
                    transform="rotate(-90 60 60)"
                    style="transition: stroke-dashoffset 0.4s ease;"
                  />
                  <text x="60" y="55" text-anchor="middle" class="clock-svg-hours">{{ inputValue || '0' }}</text>
                  <text x="60" y="71" text-anchor="middle" class="clock-svg-unit">horas</text>
                </svg>
              </div>
              
              <!-- Waketime selector -->
              <div class="clock-label-group">
                <span class="clock-label">Levantarse</span>
                <div class="drum-picker-wrapper">
                  <select :value="waketime" class="drum-select" @change="onWaketimeChange">
                    <option v-for="slot in timeSlots" :key="slot" :value="slot">{{ slot }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Quick presets -->
          <div class="sleep-presets">
            <button v-for="h in [6, 7, 7.5, 8, 9]" :key="h"
              type="button"
              class="sleep-preset-btn"
              :class="{ active: inputValue === h.toString() }"
              @click="$emit('apply-preset', h)"
            >{{ h }}h</button>
          </div>
          
          <!-- Smartwatch sync -->
          <ion-button expand="block" size="small" fill="outline" class="sync-smartwatch-btn" @click="$emit('sync-smartwatch')">
            <ion-icon :icon="pulseOutline" slot="start"></ion-icon>
            Sincronizar Smartwatch
          </ion-button>
          
          <!-- Calidad del sueño integrada -->
          <div class="sleep-quality-section">
            <span class="sleep-quality-title">Calidad del descanso</span>
            <p class="sleep-quality-hint">1 = Pésima &nbsp;·&nbsp; 5 = Excelente</p>
            <div class="sleep-quality-picker">
              <button
                v-for="item in sleepQualityOptions"
                :key="item.value"
                type="button"
                class="sleep-quality-option"
                :class="{ active: sleepQuality === item.value, [`q-${item.value}`]: true }"
                @click="$emit('update:sleepQuality', item.value)"
              >
                <span class="sq-num">{{ item.value }}</span>
                <span class="sq-desc">{{ item.label }}</span>
              </button>
            </div>
            <span v-if="sleepQuality" class="sleep-quality-label">{{ getSleepQualityLabel(sleepQuality) }}</span>
          </div>
        </div>

        <!-- Selector de Escala 1-5 (Estrés, Energía, Dolor Muscular) -->
        <div v-else-if="['stress', 'energy', 'muscleSoreness'].includes(type)" class="scale-selector">
          <p class="scale-subtitle">
            {{ scaleSubtitle }}
          </p>
          <div class="scale-buttons">
            <button
              v-for="num in 5"
              :key="num"
              type="button"
              class="scale-btn"
              :class="{ active: inputValue === num.toString() }"
              @click="$emit('update:inputValue', num.toString())"
            >
              {{ num }}
            </button>
          </div>
        </div>
        
        <!-- Entrada Numérica Estándar -->
        <div v-else class="input-container">
          <input
            :value="inputValue"
            @input="onInputValueChange"
            type="number"
            step="any"
            class="custom-modal-input"
            :placeholder="placeholder"
            @keyup.enter="$emit('save')"
            ref="inputRef"
          />
          <span class="custom-modal-unit">
            {{ unit }}
          </span>
        </div>
        <p v-if="error" class="custom-modal-error">{{ error }}</p>
      </div>
      
      <div class="custom-modal-footer">
        <button class="custom-modal-btn btn-cancel" @click="$emit('close')" :disabled="isSaving">Cancelar</button>
        <button
          class="custom-modal-btn btn-save"
          @click="$emit('save')"
          :disabled="isSaving"
          :class="{ 'btn-saving': isSaving }"
        >{{ isSaving ? 'Guardando...' : 'Guardar' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { IonButton, IonIcon } from '@ionic/vue';
import { pulseOutline } from 'ionicons/icons';

const props = defineProps<{
  type: string | null;
  inputValue: string;
  isSaving: boolean;
  error: string;
  bedtime: string;
  waketime: string;
  sleepQuality: string;
}>();

const emit = defineEmits<{
  (e: 'update:inputValue', val: string): void;
  (e: 'update:bedtime', val: string): void;
  (e: 'update:waketime', val: string): void;
  (e: 'update:sleepQuality', val: string): void;
  (e: 'close'): void;
  (e: 'save'): void;
  (e: 'sync-smartwatch'): void;
  (e: 'calculate-sleep'): void;
  (e: 'apply-preset', hours: number): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const sleepQualityOptions = [
  { value: '1', label: 'Pésimo' },
  { value: '2', label: 'Malo' },
  { value: '3', label: 'Regular' },
  { value: '4', label: 'Bueno' },
  { value: '5', label: 'Excelente' },
];

const title = computed(() => {
  const titles: Record<string, string> = {
    weight: 'Registrar Peso',
    height: 'Registrar Estatura',
    sleep: 'Registrar Sueño',
    calories: 'Registrar Calorías',
    protein: 'Registrar Proteínas',
    carbs: 'Registrar Carbohidratos',
    fat: 'Registrar Grasas',
    stress: 'Nivel de Estrés',
    energy: 'Nivel de Energía',
    muscleSoreness: 'Dolor Muscular',
    heartRate: 'Ritmo Cardíaco',
    vo2Max: 'Registrar VO2 Max',
    bodyFat: 'Grasa Corporal',
    muscleMass: 'Masa Muscular'
  };
  return titles[props.type || ''] || '';
});

const placeholder = computed(() => {
  const placeholders: Record<string, string> = {
    weight: 'Ej: 75.5',
    height: 'Ej: 175',
    calories: 'Ej: 2200',
    protein: 'Ej: 140',
    carbs: 'Ej: 250',
    fat: 'Ej: 70',
    heartRate: 'Ej: 68',
    vo2Max: 'Ej: 48.5',
    bodyFat: 'Ej: 14.5',
    muscleMass: 'Ej: 36.2'
  };
  return placeholders[props.type || ''] || '';
});

const unit = computed(() => {
  const units: Record<string, string> = {
    weight: 'kg',
    height: 'cm',
    calories: 'kcal',
    protein: 'g',
    carbs: 'g',
    fat: 'g',
    heartRate: 'lpm',
    vo2Max: '',
    bodyFat: '%',
    muscleMass: 'kg'
  };
  return units[props.type || ''] || '';
});

const scaleSubtitle = computed(() => {
  if (props.type === 'stress') return '1 = Relajado, 5 = Muy Estresado';
  if (props.type === 'energy') return '1 = Muy Agotado, 5 = Energía Máxima';
  if (props.type === 'muscleSoreness') return '1 = Sin Dolor, 5 = Dolor Extremo';
  return '';
});

const getSleepQualityLabel = (score: string | number | null) => {
  if (score === null || score === undefined) return '--';
  const num = typeof score === 'string' ? parseInt(score) : score;
  const labels = ['Pésima', 'Mala', 'Regular', 'Buena', 'Excelente'];
  return labels[num - 1] || '--';
};

const onInputValueChange = (event: Event) => {
  emit('update:inputValue', (event.target as HTMLInputElement).value);
};

const onBedtimeChange = (event: Event) => {
  emit('update:bedtime', (event.target as HTMLSelectElement).value);
  nextTick(() => emit('calculate-sleep'));
};

const onWaketimeChange = (event: Event) => {
  emit('update:waketime', (event.target as HTMLSelectElement).value);
  nextTick(() => emit('calculate-sleep'));
};

watch(() => props.type, (newType) => {
  if (newType && newType !== 'sleep' && !['stress', 'energy', 'muscleSoreness'].includes(newType)) {
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});
</script>

<style scoped>
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.custom-modal-container {
  background: var(--forgy-card-bg, #fff);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 16px;
  width: 92%;
  max-width: 380px;
  max-height: 88vh;
  padding: 20px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
}

.custom-modal-header {
  margin-bottom: 16px;
}

.custom-modal-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--forgy-text-primary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.custom-modal-body {
  margin-bottom: 16px;
  overflow-y: auto;
  flex: 1;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--forgy-input-bg, #f4f5f8);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 6px;
  padding: 2px 12px;
}

.input-container:focus-within {
  border-color: var(--ion-color-primary);
}

.custom-modal-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--forgy-text-primary);
  font-size: 16px;
  font-weight: 600;
  padding: 10px 0;
}

.custom-modal-input::-webkit-outer-spin-button,
.custom-modal-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.custom-modal-input[type=number] {
  -moz-appearance: textfield;
}

.custom-modal-unit {
  color: var(--forgy-text-secondary, #666);
  font-size: 13px;
  font-weight: 600;
  margin-left: 8px;
}

.custom-modal-error {
  color: var(--ion-color-danger, #eb445a);
  font-size: 11px;
  margin: 6px 0 0 0;
  font-weight: 500;
}

.custom-modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.custom-modal-btn {
  background: transparent;
  border: none;
  outline: none;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
}

.btn-cancel {
  color: var(--forgy-text-secondary, #666);
  border: 1px solid transparent;
}

.btn-cancel:active {
  background: var(--forgy-input-bg, #f4f5f8);
}

.btn-save {
  background: var(--ion-color-primary);
  color: white;
}

.btn-save:active {
  background: var(--ion-color-primary-shade);
}

/* Scale Selector 1-5 */
.scale-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.scale-subtitle {
  font-size: 11px;
  color: var(--forgy-text-secondary, #666);
  margin: 0;
  text-align: center;
}
.scale-buttons {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.scale-btn {
  flex: 1;
  height: 38px;
  background: var(--forgy-input-bg, #f4f5f8);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 6px;
  color: var(--forgy-text-primary);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.scale-btn:active {
  background: var(--ion-color-primary-shade);
  color: white;
}
.scale-btn.active {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: white;
}

/* Sleep Clock Picker */
.sleep-clock-picker {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
}
.clock-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.clock-labels-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  justify-content: space-between;
}
.clock-label-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  flex: 1;
}
.clock-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--forgy-text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}
.clock-arc-display {
  flex-shrink: 0;
}
.sleep-arc-svg {
  width: 110px;
  height: 110px;
}
.clock-svg-hours {
  font-size: 24px;
  font-weight: 800;
  fill: var(--forgy-text-primary);
}
.clock-svg-unit {
  font-size: 9px;
  fill: var(--forgy-text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.sleep-presets {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
.sleep-preset-btn {
  background: var(--forgy-input-bg, #f4f5f8);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--forgy-text-secondary, #666);
  cursor: pointer;
  transition: all 0.2s ease;
}
.sleep-preset-btn.active {
  background: var(--ion-color-secondary);
  color: #fff;
  border-color: var(--ion-color-secondary);
}
.sleep-quality-section {
  background: var(--forgy-input-bg, #f4f5f8);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.sleep-quality-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--forgy-text-primary);
}
.sleep-quality-hint {
  font-size: 11px;
  color: var(--forgy-text-secondary, #666);
  margin: 0;
}
.sleep-quality-picker {
  display: flex;
  gap: 6px;
  width: 100%;
}
.sleep-quality-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 70px;
  background: var(--forgy-input-bg, #f4f5f8);
  border: 1.5px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 12px;
  cursor: pointer;
  padding: 8px 4px;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}
.sleep-quality-option:active {
  transform: scale(0.93);
}
.sq-num {
  font-size: 20px;
  font-weight: 800;
  color: var(--forgy-text-secondary, #666);
  line-height: 1;
}
.sq-desc {
  font-size: 8px;
  font-weight: 600;
  color: var(--forgy-text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1;
}
.sleep-quality-option.active.q-1 {
  background: rgba(239, 68, 68, 0.12);
  border-color: #ef4444;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.25);
  transform: translateY(-2px);
}
.sleep-quality-option.active.q-1 .sq-num,
.sleep-quality-option.active.q-1 .sq-desc { color: #ef4444; }
.sleep-quality-option.active.q-2 {
  background: rgba(249, 115, 22, 0.12);
  border-color: #f97316;
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.25);
  transform: translateY(-2px);
}
.sleep-quality-option.active.q-2 .sq-num,
.sleep-quality-option.active.q-2 .sq-desc { color: #f97316; }
.sleep-quality-option.active.q-3 {
  background: rgba(234, 179, 8, 0.12);
  border-color: #eab308;
  box-shadow: 0 0 12px rgba(234, 179, 8, 0.25);
  transform: translateY(-2px);
}
.sleep-quality-option.active.q-3 .sq-num,
.sleep-quality-option.active.q-3 .sq-desc { color: #eab308; }
.sleep-quality-option.active.q-4 {
  background: rgba(34, 197, 94, 0.12);
  border-color: #22c55e;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.25);
  transform: translateY(-2px);
}
.sleep-quality-option.active.q-4 .sq-num,
.sleep-quality-option.active.q-4 .sq-desc { color: #22c55e; }
.sleep-quality-option.active.q-5 {
  background: rgba(var(--ion-color-secondary-rgb, 61, 194, 255), 0.12);
  border-color: var(--ion-color-secondary);
  box-shadow: 0 0 12px rgba(var(--ion-color-secondary-rgb, 61, 194, 255), 0.3);
  transform: translateY(-2px);
}
.sleep-quality-option.active.q-5 .sq-num,
.sleep-quality-option.active.q-5 .sq-desc { color: var(--ion-color-secondary); }

.sleep-quality-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--forgy-text-primary);
  margin-top: 4px;
}

.drum-picker-wrapper {
  width: 100%;
}
.drum-select {
  width: 100%;
  background: var(--forgy-input-bg, #f4f5f8);
  border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
  border-radius: 8px;
  padding: 9px 10px;
  color: var(--forgy-text-primary);
  font-size: 14px;
  font-weight: 700;
  outline: none;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.drum-select:focus {
  border-color: var(--ion-color-secondary);
}

.sync-smartwatch-btn {
  --border-radius: 20px;
  font-weight: 700;
  margin: 0;
}

.btn-saving {
  opacity: 0.65;
  cursor: not-allowed;
}
.custom-modal-btn:disabled {
  pointer-events: none;
  opacity: 0.55;
}
</style>
