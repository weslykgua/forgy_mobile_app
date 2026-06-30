export interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface Workout {
  id: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  duration: number;
  notes: string;
}
