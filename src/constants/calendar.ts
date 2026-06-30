export const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

export const SLEEP_QUALITY_OPTIONS = [
  { value: '1', label: 'Pésimo' },
  { value: '2', label: 'Malo' },
  { value: '3', label: 'Regular' },
  { value: '4', label: 'Bueno' },
  { value: '5', label: 'Excelente' },
];

export const SLEEP_QUALITY_LABELS = ['Pésima', 'Mala', 'Regular', 'Buena', 'Excelente'];

export const STRESS_LABELS = ['Relajado', 'Leve', 'Moderado', 'Alto', 'Muy Alto'];

export const ENERGY_LABELS = ['Muy baja', 'Baja', 'Normal', 'Alta', 'Excelente'];

export const SORENESS_LABELS = ['Ninguno', 'Leve', 'Moderado', 'Doloroso', 'Extremo'];
