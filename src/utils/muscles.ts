import {
  muscleImages,
  muscleGroups,
  mainMuscles,
  muscleIcons,
  musclesWithEmoji
} from '@/constants/muscles';

export {
  muscleImages,
  muscleGroups,
  mainMuscles,
  muscleIcons,
  musclesWithEmoji
};

/**
 * Returns an HTML string for the muscle icon (SVG or IMG), with optional inline styling.
 */
export function getMuscleIcon(muscle: string, styleAttr = ''): string {
  const styleString = styleAttr ? ` style="${styleAttr}"` : '';

  if (muscle === 'Todos') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="muscle-svg"${styleString}><path d="M6.5 6.5 11 11"/><path d="M21 21-1.5-1.5"/><path d="M3 3 1.5 1.5"/><path d="M18.5 5.5 3-3"/><path d="M2.5 21.5 3-3"/><path d="M14 5s.5 1.5 3 3"/><path d="M5 14s1.5.5 3 3"/><path d="M10 5.5A3.5 3.5 0 0 0 5.5 10"/><path d="M18.5 14a3.5 3.5 0 0 1-4.5 4.5"/></svg>`;
  }

  if (muscle === 'Cardio') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="muscle-svg"${styleString}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
  }

  const map: Record<string, string> = {
    'Brazos': muscleImages.biceps,
    'Piernas': muscleImages.cuadriceps,
    'Espalda': muscleImages.dorsales,
    'Abdomen': muscleImages.abs,
    'Pecho': muscleImages.pecho,
    'Hombros': muscleImages.hombros,
    'Pantorrillas': muscleImages.pantorillas,
    'Antebrazos': muscleImages.antebrazo,
    'Cuello': muscleImages.trapecio
  };

  const imgPath = map[muscle];
  if (imgPath) {
    return `<img src="${imgPath}" class="muscle-icon-img"${styleString} alt="${muscle}" />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="muscle-svg"${styleString}><path d="M12 20h.01M12 4h.01M4 12h.01M20 12h.01"/></svg>`;
}
