import { Pillar, Frequency, CueType, AutoTriggerType } from '@prisma/client';

// SubCategory is now a string type (no longer a Prisma enum)
export type SubCategory = 'TRAINING' | 'SLEEP' | 'NUTRITION' | 'MEDITATION' | 'READING' | 'LEARNING' | 'JOURNALING';

export interface HabitStack {
  id: string;
  name: string;
  description: string | null;
  activities: string[];
  isActive: boolean;
}

export interface AutoTriggerConfig {
  triggerType: AutoTriggerType;
  thresholdValue?: number;
  workoutTypeId?: number;
  triggerActivityId?: string;
}

export interface CreateHabitFormData {
  // Step 1: Basic Info
  name: string;
  pillar: Pillar;
  subCategory: SubCategory;
  frequency: Frequency;
  description: string;
  points: number; // 5-100, contributes to daily goal

  // Step 2: Cue/Trigger
  cueType: CueType | null;
  cueValue: string;

  // Step 2b: Auto-Trigger (optional)
  autoTrigger: AutoTriggerConfig | null;

  // Step 3: Stacking
  addToStackId: string | null;
}

export const INITIAL_FORM_DATA: CreateHabitFormData = {
  name: '',
  pillar: 'BODY',
  subCategory: 'TRAINING',
  frequency: 'DAILY',
  description: '',
  points: 25,
  cueType: null,
  cueValue: '',
  autoTrigger: null,
  addToStackId: null,
};

export const POINTS_PRESETS = [
  { value: 10, label: 'Light', description: 'Quick task' },
  { value: 25, label: 'Regular', description: 'Standard habit' },
  { value: 50, label: 'Important', description: 'Key daily habit' },
  { value: 100, label: 'Essential', description: 'Complete pillar goal' },
];

export const BODY_SUBCATEGORIES: SubCategory[] = ['TRAINING', 'SLEEP', 'NUTRITION'];
export const MIND_SUBCATEGORIES: SubCategory[] = ['MEDITATION', 'READING', 'LEARNING', 'JOURNALING'];

export const SUBCATEGORY_CONFIG: Record<SubCategory, { label: string; icon: string }> = {
  TRAINING: {
    label: 'Training',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  SLEEP: {
    label: 'Sleep',
    icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  },
  NUTRITION: {
    label: 'Nutrition',
    icon: 'M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7z',
  },
  MEDITATION: {
    label: 'Meditation',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  },
  READING: {
    label: 'Reading',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  LEARNING: {
    label: 'Learning',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  },
  JOURNALING: {
    label: 'Journaling',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
};

export const CUE_TYPE_CONFIG: Record<CueType, { label: string; description: string; icon: string; placeholder: string }> = {
  TIME: {
    label: 'At a specific time',
    description: 'Set a daily reminder',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    placeholder: '07:00',
  },
  LOCATION: {
    label: 'At a location',
    description: 'When you arrive somewhere',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    placeholder: 'e.g., Home office, Gym, Kitchen',
  },
  AFTER_ACTIVITY: {
    label: 'After an activity',
    description: 'Chain to another habit',
    icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
    placeholder: 'e.g., After morning coffee, After brushing teeth',
  },
};

export const BODY_COLOR = '#E8A854';
export const MIND_COLOR = '#5BCCB3';
