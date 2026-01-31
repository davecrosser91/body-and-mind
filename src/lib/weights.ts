import { prisma } from './db';
import { WeightPreset } from '@prisma/client';

// ============ TYPES ============

export interface BodyWeights {
  training: number;
  sleep: number;
  nutrition: number;
}

export interface MindWeights {
  meditation: number;
  reading: number;
  learning: number;
}

export interface WeightConfiguration {
  preset: WeightPreset;
  body: BodyWeights;
  mind: MindWeights;
}

// ============ PRESETS ============

export const WEIGHT_PRESETS: Record<WeightPreset, { body: BodyWeights; mind: MindWeights }> = {
  BALANCED: {
    body: { training: 35, sleep: 35, nutrition: 30 },
    mind: { meditation: 40, reading: 30, learning: 30 },
  },
  ATHLETE: {
    body: { training: 50, sleep: 35, nutrition: 15 },
    mind: { meditation: 50, reading: 25, learning: 25 },
  },
  RECOVERY: {
    body: { training: 20, sleep: 50, nutrition: 30 },
    mind: { meditation: 50, reading: 30, learning: 20 },
  },
  KNOWLEDGE: {
    body: { training: 30, sleep: 40, nutrition: 30 },
    mind: { meditation: 20, reading: 40, learning: 40 },
  },
  CUSTOM: {
    // Default to BALANCED values for CUSTOM preset
    body: { training: 35, sleep: 35, nutrition: 30 },
    mind: { meditation: 40, reading: 30, learning: 30 },
  },
};

// ============ VALIDATION ============

const REQUIRED_SUM = 100;

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates that body weights sum to 100
 */
export function validateBodyWeights(weights: BodyWeights): ValidationError | null {
  const sum = weights.training + weights.sleep + weights.nutrition;
  if (sum !== REQUIRED_SUM) {
    return {
      field: 'body',
      message: `Body weights must sum to ${REQUIRED_SUM}, got ${sum}`,
    };
  }

  // Check for negative values
  if (weights.training < 0 || weights.sleep < 0 || weights.nutrition < 0) {
    return {
      field: 'body',
      message: 'Body weights cannot be negative',
    };
  }

  return null;
}

/**
 * Validates that mind weights sum to 100
 */
export function validateMindWeights(weights: MindWeights): ValidationError | null {
  const sum = weights.meditation + weights.reading + weights.learning;
  if (sum !== REQUIRED_SUM) {
    return {
      field: 'mind',
      message: `Mind weights must sum to ${REQUIRED_SUM}, got ${sum}`,
    };
  }

  // Check for negative values
  if (weights.meditation < 0 || weights.reading < 0 || weights.learning < 0) {
    return {
      field: 'mind',
      message: 'Mind weights cannot be negative',
    };
  }

  return null;
}

/**
 * Validates both body and mind weights
 */
export function validateWeights(
  body: BodyWeights,
  mind: MindWeights
): ValidationError[] {
  const errors: ValidationError[] = [];

  const bodyError = validateBodyWeights(body);
  if (bodyError) errors.push(bodyError);

  const mindError = validateMindWeights(mind);
  if (mindError) errors.push(mindError);

  return errors;
}

// ============ SERVICE FUNCTIONS ============

/**
 * Gets the current weight configuration for a user
 * Returns default BALANCED weights if no configuration exists
 */
export async function getWeights(userId: string): Promise<WeightConfiguration> {
  const config = await prisma.weightConfig.findUnique({
    where: { userId },
  });

  if (!config) {
    // Return default BALANCED preset
    return {
      preset: 'BALANCED',
      body: WEIGHT_PRESETS.BALANCED.body,
      mind: WEIGHT_PRESETS.BALANCED.mind,
    };
  }

  return {
    preset: config.preset,
    body: {
      training: config.trainingWeight,
      sleep: config.sleepWeight,
      nutrition: config.nutritionWeight,
    },
    mind: {
      meditation: config.meditationWeight,
      reading: config.readingWeight,
      learning: config.learningWeight,
    },
  };
}

export interface SetWeightsOptions {
  preset: WeightPreset;
  body?: BodyWeights;
  mind?: MindWeights;
}

export interface SetWeightsResult {
  success: true;
  data: WeightConfiguration;
}

export interface SetWeightsError {
  success: false;
  errors: ValidationError[];
}

/**
 * Sets the weight configuration for a user
 *
 * - If preset is not CUSTOM, uses predefined weights for that preset
 * - If preset is CUSTOM, requires body and mind weights to be provided
 * - Validates that weights sum to 100 per pillar
 * - Uses upsert for atomic create/update
 */
export async function setWeights(
  userId: string,
  options: SetWeightsOptions
): Promise<SetWeightsResult | SetWeightsError> {
  const { preset } = options;

  let bodyWeights: BodyWeights;
  let mindWeights: MindWeights;

  if (preset === 'CUSTOM') {
    // For CUSTOM preset, use provided weights or fall back to BALANCED defaults
    bodyWeights = options.body ?? WEIGHT_PRESETS.BALANCED.body;
    mindWeights = options.mind ?? WEIGHT_PRESETS.BALANCED.mind;
  } else {
    // For predefined presets, use the preset values (ignore any provided weights)
    bodyWeights = WEIGHT_PRESETS[preset].body;
    mindWeights = WEIGHT_PRESETS[preset].mind;
  }

  // Validate weights
  const validationErrors = validateWeights(bodyWeights, mindWeights);
  if (validationErrors.length > 0) {
    return {
      success: false,
      errors: validationErrors,
    };
  }

  // Upsert the configuration
  const config = await prisma.weightConfig.upsert({
    where: { userId },
    create: {
      userId,
      preset,
      trainingWeight: bodyWeights.training,
      sleepWeight: bodyWeights.sleep,
      nutritionWeight: bodyWeights.nutrition,
      meditationWeight: mindWeights.meditation,
      readingWeight: mindWeights.reading,
      learningWeight: mindWeights.learning,
    },
    update: {
      preset,
      trainingWeight: bodyWeights.training,
      sleepWeight: bodyWeights.sleep,
      nutritionWeight: bodyWeights.nutrition,
      meditationWeight: mindWeights.meditation,
      readingWeight: mindWeights.reading,
      learningWeight: mindWeights.learning,
    },
  });

  return {
    success: true,
    data: {
      preset: config.preset,
      body: {
        training: config.trainingWeight,
        sleep: config.sleepWeight,
        nutrition: config.nutritionWeight,
      },
      mind: {
        meditation: config.meditationWeight,
        reading: config.readingWeight,
        learning: config.learningWeight,
      },
    },
  };
}

/**
 * Gets all available presets with their weight values
 */
export function getPresets(): Record<WeightPreset, { body: BodyWeights; mind: MindWeights }> {
  return WEIGHT_PRESETS;
}
