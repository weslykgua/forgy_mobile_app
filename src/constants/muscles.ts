import absImg from '@/assets/abs.png';
import antebrazoImg from '@/assets/antebrazo.png';
import bicepsImg from '@/assets/biceps.png';
import cuadricepsImg from '@/assets/cuadriceps.png';
import dorsalesImg from '@/assets/dorsales.png';
import hombrosImg from '@/assets/hombros.png';
import pantorillasImg from '@/assets/pantorillas.png';
import pechoImg from '@/assets/pecho.png';
import trapecioImg from '@/assets/trapecio.png';

export const muscleImages = {
  abs: absImg,
  antebrazo: antebrazoImg,
  biceps: bicepsImg,
  cuadriceps: cuadricepsImg,
  dorsales: dorsalesImg,
  hombros: hombrosImg,
  pantorillas: pantorillasImg,
  pecho: pechoImg,
  trapecio: trapecioImg
};

export const muscleGroups = [
  'Todos',
  'Brazos',
  'Piernas',
  'Espalda',
  'Abdomen',
  'Pecho',
  'Hombros',
  'Pantorrillas',
  'Antebrazos',
  'Cardio',
  'Cuello'
];

export const mainMuscles = [
  'Todos',
  'Brazos',
  'Piernas',
  'Espalda',
  'Abdomen',
  'Pecho',
  'Hombros'
];

export const muscleIcons: Record<string, string> = {
  'Todos': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="muscle-svg"><path d="M6.5 6.5 11 11"/><path d="M21 21-1.5-1.5"/><path d="M3 3 1.5 1.5"/><path d="M18.5 5.5 3-3"/><path d="M2.5 21.5 3-3"/><path d="M14 5s.5 1.5 3 3"/><path d="M5 14s1.5.5 3 3"/><path d="M10 5.5A3.5 3.5 0 0 0 5.5 10"/><path d="M18.5 14a3.5 3.5 0 0 1-4.5 4.5"/></svg>`,
  'Brazos': `<img src="${bicepsImg}" class="muscle-icon-img" alt="Brazos" />`,
  'Piernas': `<img src="${cuadricepsImg}" class="muscle-icon-img" alt="Piernas" />`,
  'Espalda': `<img src="${dorsalesImg}" class="muscle-icon-img" alt="Espalda" />`,
  'Abdomen': `<img src="${absImg}" class="muscle-icon-img" alt="Abdomen" />`,
  'Pecho': `<img src="${pechoImg}" class="muscle-icon-img" alt="Pecho" />`,
  'Hombros': `<img src="${hombrosImg}" class="muscle-icon-img" alt="Hombros" />`,
  'Pantorrillas': `<img src="${pantorillasImg}" class="muscle-icon-img" alt="Pantorrillas" />`,
  'Antebrazos': `<img src="${antebrazoImg}" class="muscle-icon-img" alt="Antebrazos" />`,
  'Cardio': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="muscle-svg"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  'Cuello': `<img src="${trapecioImg}" class="muscle-icon-img" alt="Cuello" />`
};

export const musclesWithEmoji = Object.keys(muscleIcons).map(name => ({ name }));
