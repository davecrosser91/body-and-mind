export const PREDEFINED_SUBCATEGORIES = {
  BODY: ['TRAINING', 'SLEEP', 'NUTRITION'] as const,
  MIND: ['MEDITATION', 'READING', 'LEARNING', 'JOURNALING'] as const,
};

export type PredefinedBodySubcategory = typeof PREDEFINED_SUBCATEGORIES.BODY[number];
export type PredefinedMindSubcategory = typeof PREDEFINED_SUBCATEGORIES.MIND[number];
export type PredefinedSubcategory = PredefinedBodySubcategory | PredefinedMindSubcategory;

export interface SubcategoryConfig {
  key: string;
  label: string;
  pillar: 'BODY' | 'MIND';
  icon: string; // SVG path
  color: string;
  hasWhoopIntegration: boolean;
}

const SUBCATEGORY_CONFIGS: Record<PredefinedSubcategory, SubcategoryConfig> = {
  TRAINING: {
    key: 'TRAINING',
    label: 'Training',
    pillar: 'BODY',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    color: '#EF4444',
    hasWhoopIntegration: true,
  },
  SLEEP: {
    key: 'SLEEP',
    label: 'Sleep',
    pillar: 'BODY',
    icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
    color: '#6366F1',
    hasWhoopIntegration: true,
  },
  NUTRITION: {
    key: 'NUTRITION',
    label: 'Nutrition',
    pillar: 'BODY',
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    color: '#22C55E',
    hasWhoopIntegration: false,
  },
  MEDITATION: {
    key: 'MEDITATION',
    label: 'Meditation',
    pillar: 'MIND',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#8B5CF6',
    hasWhoopIntegration: false,
  },
  READING: {
    key: 'READING',
    label: 'Reading',
    pillar: 'MIND',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    color: '#F59E0B',
    hasWhoopIntegration: false,
  },
  LEARNING: {
    key: 'LEARNING',
    label: 'Learning',
    pillar: 'MIND',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    color: '#06B6D4',
    hasWhoopIntegration: false,
  },
  JOURNALING: {
    key: 'JOURNALING',
    label: 'Journaling',
    pillar: 'MIND',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    color: '#EC4899',
    hasWhoopIntegration: false,
  },
};

const ALL_PREDEFINED = [
  ...PREDEFINED_SUBCATEGORIES.BODY,
  ...PREDEFINED_SUBCATEGORIES.MIND,
];

export function isPredefined(subCategory: string): boolean {
  return ALL_PREDEFINED.includes(subCategory.toUpperCase() as PredefinedSubcategory);
}

export function getSubcategoryPillar(subCategory: string): 'BODY' | 'MIND' | null {
  const upper = subCategory.toUpperCase();
  if (PREDEFINED_SUBCATEGORIES.BODY.includes(upper as PredefinedBodySubcategory)) {
    return 'BODY';
  }
  if (PREDEFINED_SUBCATEGORIES.MIND.includes(upper as PredefinedMindSubcategory)) {
    return 'MIND';
  }
  return null;
}

export function getSubcategoryConfig(subCategory: string): SubcategoryConfig | null {
  const upper = subCategory.toUpperCase() as PredefinedSubcategory;
  return SUBCATEGORY_CONFIGS[upper] ?? null;
}

export function getSubcategoriesForPillar(pillar: 'BODY' | 'MIND'): readonly string[] {
  return PREDEFINED_SUBCATEGORIES[pillar];
}
