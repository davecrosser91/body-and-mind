import { prisma } from '@/lib/db';
import { CueType, SubCategory } from '@prisma/client';

// ============ TYPES ============

export interface HabitStackInput {
  name: string;
  description?: string;
  activities: SubCategory[];
  cueType?: CueType;
  cueValue?: string;
  isActive?: boolean;
}

export interface HabitStackUpdateInput {
  name?: string;
  description?: string | null;
  activities?: SubCategory[];
  cueType?: CueType | null;
  cueValue?: string | null;
  isActive?: boolean;
}

export interface HabitStack {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  activities: string[];
  cueType: CueType | null;
  cueValue: string | null;
  isPreset: boolean;
  presetKey: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============ PRESET STACKS ============

interface PresetStack {
  key: string;
  name: string;
  description: string;
  activities: SubCategory[];
  cueType?: CueType;
  cueValue?: string;
}

export const PRESET_STACKS: PresetStack[] = [
  {
    key: 'morning_momentum',
    name: 'Morning Momentum',
    description: 'Start your day with movement and mindfulness',
    activities: [SubCategory.TRAINING, SubCategory.MEDITATION],
    cueType: CueType.TIME,
    cueValue: '07:00',
  },
  {
    key: 'evening_wind_down',
    name: 'Evening Wind-Down',
    description: 'Calm your mind before bed with reading and reflection',
    activities: [SubCategory.READING, SubCategory.JOURNALING],
    cueType: CueType.TIME,
    cueValue: '21:00',
  },
  {
    key: 'two_minute_start',
    name: 'The 2-Minute Start',
    description: 'A quick stack to build momentum throughout the day',
    activities: [SubCategory.TRAINING, SubCategory.MEDITATION, SubCategory.READING],
  },
  {
    key: 'recovery_day',
    name: 'Recovery Day',
    description: 'Focus on rest and mental rejuvenation',
    activities: [SubCategory.SLEEP, SubCategory.MEDITATION, SubCategory.READING, SubCategory.LEARNING],
  },
];

// ============ HELPER FUNCTIONS ============

/**
 * Validate that all activities are valid SubCategory values
 */
function validateActivities(activities: string[]): activities is SubCategory[] {
  const validValues = Object.values(SubCategory);
  return activities.every((a) => validValues.includes(a as SubCategory));
}

/**
 * Validate time format (HH:mm)
 */
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

/**
 * Validate cue value based on cue type
 */
function validateCueValue(cueType: CueType | null, cueValue: string | null): boolean {
  if (!cueType) {
    return true; // No cue type means cue value is optional
  }

  if (cueType === CueType.TIME) {
    return cueValue !== null && isValidTimeFormat(cueValue);
  }

  if (cueType === CueType.LOCATION || cueType === CueType.AFTER_ACTIVITY) {
    return cueValue !== null && cueValue.trim().length > 0;
  }

  return true;
}

// ============ SERVICE FUNCTIONS ============

/**
 * Get all habit stacks for a user
 */
export async function getStacks(userId: string): Promise<HabitStack[]> {
  const stacks = await prisma.habitStack.findMany({
    where: { userId },
    orderBy: [
      { isPreset: 'desc' }, // Presets first
      { isActive: 'desc' }, // Active stacks first
      { createdAt: 'asc' },
    ],
  });

  return stacks;
}

/**
 * Get a single habit stack by ID
 */
export async function getStackById(
  userId: string,
  stackId: string
): Promise<HabitStack | null> {
  const stack = await prisma.habitStack.findFirst({
    where: {
      id: stackId,
      userId,
    },
  });

  return stack;
}

/**
 * Create a new habit stack
 */
export async function createStack(
  userId: string,
  input: HabitStackInput
): Promise<HabitStack> {
  // Validate activities
  if (!validateActivities(input.activities)) {
    throw new Error('Invalid activities. Must be valid SubCategory values.');
  }

  if (input.activities.length < 2) {
    throw new Error('A habit stack must have at least 2 activities.');
  }

  // Validate cue value if cue type is provided
  if (!validateCueValue(input.cueType ?? null, input.cueValue ?? null)) {
    throw new Error('Invalid cue value for the specified cue type.');
  }

  const stack = await prisma.habitStack.create({
    data: {
      userId,
      name: input.name,
      description: input.description ?? null,
      activities: input.activities,
      cueType: input.cueType ?? null,
      cueValue: input.cueValue ?? null,
      isPreset: false,
      isActive: input.isActive ?? true,
    },
  });

  return stack;
}

/**
 * Update an existing habit stack
 */
export async function updateStack(
  userId: string,
  stackId: string,
  input: HabitStackUpdateInput
): Promise<HabitStack | null> {
  // First, check if the stack exists and belongs to the user
  const existingStack = await prisma.habitStack.findFirst({
    where: {
      id: stackId,
      userId,
    },
  });

  if (!existingStack) {
    return null;
  }

  // Validate activities if provided
  if (input.activities !== undefined) {
    if (!validateActivities(input.activities)) {
      throw new Error('Invalid activities. Must be valid SubCategory values.');
    }

    if (input.activities.length < 2) {
      throw new Error('A habit stack must have at least 2 activities.');
    }
  }

  // Determine final cue type and value for validation
  const finalCueType = input.cueType !== undefined ? input.cueType : existingStack.cueType;
  const finalCueValue = input.cueValue !== undefined ? input.cueValue : existingStack.cueValue;

  // Validate cue value
  if (!validateCueValue(finalCueType, finalCueValue)) {
    throw new Error('Invalid cue value for the specified cue type.');
  }

  // Build update data
  const updateData: {
    name?: string;
    description?: string | null;
    activities?: SubCategory[];
    cueType?: CueType | null;
    cueValue?: string | null;
    isActive?: boolean;
  } = {};

  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }
  if (input.activities !== undefined) {
    updateData.activities = input.activities;
  }
  if (input.cueType !== undefined) {
    updateData.cueType = input.cueType;
  }
  if (input.cueValue !== undefined) {
    updateData.cueValue = input.cueValue;
  }
  if (input.isActive !== undefined) {
    updateData.isActive = input.isActive;
  }

  const updatedStack = await prisma.habitStack.update({
    where: { id: stackId },
    data: updateData,
  });

  return updatedStack;
}

/**
 * Delete a habit stack
 */
export async function deleteStack(
  userId: string,
  stackId: string
): Promise<boolean> {
  // First, check if the stack exists and belongs to the user
  const existingStack = await prisma.habitStack.findFirst({
    where: {
      id: stackId,
      userId,
    },
  });

  if (!existingStack) {
    return false;
  }

  await prisma.habitStack.delete({
    where: { id: stackId },
  });

  return true;
}

/**
 * Initialize preset stacks for a new user
 * Creates all preset stacks as inactive by default
 */
export async function initializePresetStacks(userId: string): Promise<HabitStack[]> {
  // Check if user already has preset stacks
  const existingPresets = await prisma.habitStack.findMany({
    where: {
      userId,
      isPreset: true,
    },
  });

  // Get keys of existing presets
  const existingKeys = new Set(existingPresets.map((p) => p.presetKey));

  // Create missing presets
  const presetsToCreate = PRESET_STACKS.filter((p) => !existingKeys.has(p.key));

  if (presetsToCreate.length === 0) {
    return existingPresets;
  }

  const createdPresets = await prisma.$transaction(
    presetsToCreate.map((preset) =>
      prisma.habitStack.create({
        data: {
          userId,
          name: preset.name,
          description: preset.description,
          activities: preset.activities,
          cueType: preset.cueType ?? null,
          cueValue: preset.cueValue ?? null,
          isPreset: true,
          presetKey: preset.key,
          isActive: false, // Preset stacks are inactive by default
        },
      })
    )
  );

  return [...existingPresets, ...createdPresets];
}

/**
 * Check if user has any stacks initialized
 */
export async function hasStacks(userId: string): Promise<boolean> {
  const count = await prisma.habitStack.count({
    where: { userId },
  });

  return count > 0;
}

/**
 * Get active stacks for a user (for displaying in daily flow)
 */
export async function getActiveStacks(userId: string): Promise<HabitStack[]> {
  const stacks = await prisma.habitStack.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: [
      { cueType: 'asc' }, // TIME cues first
      { cueValue: 'asc' }, // Earlier times first
      { createdAt: 'asc' },
    ],
  });

  return stacks;
}

/**
 * Get stacks with a specific cue time
 */
export async function getStacksByTime(
  userId: string,
  time: string
): Promise<HabitStack[]> {
  const stacks = await prisma.habitStack.findMany({
    where: {
      userId,
      isActive: true,
      cueType: CueType.TIME,
      cueValue: time,
    },
  });

  return stacks;
}
