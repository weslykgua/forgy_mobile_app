export interface DailyProgress {
  id: string;
  date: string;
  weight?: number | null;
  waterIntake?: number | null;
  caloriesConsumed?: number | null;
  caloriesBurned?: number | null;
  sleepHours?: number | null;
  mood?: string | null;
  energy?: number | null;
  stress?: number | null;
  muscleSoreness?: number | null;
  proteinConsumed?: number | null;
  carbsConsumed?: number | null;
  fatConsumed?: number | null;
  heartRate?: number | null;
  vo2Max?: number | null;
  bodyFat?: number | null;
  muscleMass?: number | null;
}

export interface UserProfile {
  height?: number | null;
  weight?: number | null;
  name?: string | null;
  email?: string | null;
}

export interface ProgressStats {
  totalWorkouts: number;
  totalVolume: number;
  avgWater: number;
  weightHistory: { date: string; weight: number }[];
  currentWeight: number;
  streakDays: number;
}
