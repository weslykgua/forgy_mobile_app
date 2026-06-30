import type { Exercise } from './exercise';

export interface Routine {
  id: string;
  name: string;
  exercises: { exerciseId: string; order: number }[];
  imageUrl?: string;
  isFavorite?: boolean;
  difficulty?: string;
  description?: string;
  estimatedDuration?: number;
}

export interface RoutineDetail extends Omit<Routine, 'exercises'> {
  exercises: (Exercise & { order: number })[];
}
