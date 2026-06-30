<template>
  <div class="muscle-filter-scroll">
    <div class="muscle-filter">
      <ion-chip
        v-for="muscle in visibleGroups"
        :key="muscle"
        :color="isSelected(muscle) ? 'primary' : 'medium'"
        :outline="!isSelected(muscle)"
        @click="selectMuscle(muscle)"
        class="muscle-chip"
      >
        <span class="chip-svg-icon" v-html="getMuscleIcon(muscle)"></span>
        <span class="chip-text">{{ muscle }}</span>
      </ion-chip>
      
      <ion-chip
        class="muscle-chip expand-chip"
        color="medium"
        @click="isExpanded = !isExpanded"
        :outline="!isExpanded"
      >
        <ion-icon :icon="isExpanded ? removeCircleOutline : addCircleOutline" class="expand-icon"></ion-icon>
        <span class="chip-text">{{ isExpanded ? 'Ver menos' : 'Ver más' }}</span>
      </ion-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonChip, IonIcon } from '@ionic/vue';
import { addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import { getMuscleIcon, muscleGroups, mainMuscles } from '@/utils/muscles';

const props = withDefaults(defineProps<{
  modelValue: string | string[];
  multiple?: boolean;
}>(), {
  multiple: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[]): void;
}>();

const isExpanded = ref(false);

const visibleGroups = computed(() => {
  if (isExpanded.value) return muscleGroups;
  return muscleGroups.filter(m => mainMuscles.includes(m));
});

const isSelected = (muscle: string) => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(muscle);
  }
  return props.modelValue === muscle;
};

const selectMuscle = (muscle: string) => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    let newValue = [...props.modelValue];
    if (muscle === 'Todos') {
      newValue = ['Todos'];
    } else {
      newValue = newValue.filter(m => m !== 'Todos');
      const idx = newValue.indexOf(muscle);
      if (idx > -1) {
        newValue.splice(idx, 1);
      } else {
        newValue.push(muscle);
      }
      if (newValue.length === 0) newValue = ['Todos'];
    }
    emit('update:modelValue', newValue);
  } else {
    emit('update:modelValue', muscle);
  }
};
</script>

<style scoped>
.muscle-filter-scroll {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.muscle-filter-scroll::-webkit-scrollbar {
  display: none;
}

.muscle-filter {
  display: flex;
  gap: 8px;
  padding: 8px 4px;
  width: max-content;
}

.muscle-chip {
  --background: var(--forgy-input-bg, rgba(var(--ion-border-color-rgb, 0,0,0), 0.15));
  --color: var(--forgy-text-secondary, var(--ion-color-step-600, #666));
  margin: 0;
  height: 38px;
  --border-radius: 12px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.muscle-chip.chip-active {
  --background: var(--ion-color-primary);
  --color: var(--ion-color-primary-contrast);
}

.chip-text {
  font-size: 13px;
  font-weight: 600;
}

.chip-svg-icon {
  display: flex;
  align-items: center;
  margin-right: 4px;
}

.chip-svg-icon :deep(.muscle-svg) {
  width: 18px;
  height: 18px;
  stroke: currentColor;
}

.chip-svg-icon :deep(.muscle-icon-img) {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.expand-chip {
  opacity: 0.85;
}

.expand-icon {
  font-size: 16px;
  margin-right: 4px;
}
</style>
