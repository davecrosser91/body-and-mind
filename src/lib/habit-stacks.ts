import { prisma } from '@/lib/db';
import { CueType } from '@prisma/client';

// ============ TYPES ============

export interface ActivityInStack {
  id: string;
  name: string;
  pillar: 'BODY' | 'MIND';
  subCategory: string;
  points: number;
}

export interface HabitStackWithActivities {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  activityIds: string[];
  activities: ActivityInStack[]; // Populated activity details
  cueType: CueType | null;
  cueValue: string | null;
  isPreset: boolean;
  presetKey: string | null;
  isActive: boolean;
  completionBonus: number;
  currentStreak: number; // Calculated from completions
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitStackInput {
  name: string;
  description?: string;
  activityIds: string[];
  cueType?: CueType;
  cueValue?: string;
  isActive?: boolean;
  completionBonus?: number;
}

export interface HabitStackUpdateInput {
  name?: string;
  description?: string | null;
  activityIds?: string[];
  cueType?: CueType | null;
  cueValue?: string | null;
  isActive?: boolean;
  completionBonus?: number;
}

// ============ HELPER FUNCTIONS ============

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
    return true;
  }

  if (cueType === CueType.TIME) {
    return cueValue !== null && isValidTimeFormat(cueValue);
  }

  if (cueType === CueType.LOCATION || cueType === CueType.AFTER_ACTIVITY) {
    return cueValue !== null && cueValue.trim().length > 0;
  }

  return true;
}

/**
 * Calculate current streak for a stack
 */
async function calculateStackStreak(stackId: string): Promise<number> {
  const completions = await prisma.stackCompletion.findMany({
    where: { stackId },
    orderBy: { date: 'desc' },
    take: 30, // Check last 30 days max
  });

  if (completions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < completions.length; i++) {
    const completion = completions[i];
    if (!completion) break;

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    const completionDate = new Date(completion.date);
    completionDate.setHours(0, 0, 0, 0);

    if (completionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Populate activity details for a stack
 */
async function populateActivities(activityIds: string[], userId: string): Promise<ActivityInStack[]> {
  if (activityIds.length === 0) return [];

  const activities = await prisma.activity.findMany({
    where: {
      id: { in: activityIds },
      userId,
      archived: false,
    },
    select: {
      id: true,
      name: true,
      pillar: true,
      subCategory: true,
      points: true,
    },
  });

  // Maintain order from activityIds
  const activityMap = new Map(activities.map(a => [a.id, a]));
  return activityIds
    .map(id => activityMap.get(id))
    .filter((a): a is typeof activities[0] => a !== undefined)
    .map(a => ({
      id: a.id,
      name: a.name,
      pillar: a.pillar as 'BODY' | 'MIND',
      subCategory: a.subCategory as string,
      points: a.points,
    }));
}

// ============ SERVICE FUNCTIONS ============

/**
 * Get all habit stacks for a user with populated activity details
 */
export async function getStacks(userId: string): Promise<HabitStackWithActivities[]> {
  const stacks = await prisma.habitStack.findMany({
    where: { userId },
    orderBy: [
      { isActive: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  // Populate activities and streaks for each stack
  const stacksWithDetails = await Promise.all(
    stacks.map(async (stack) => {
      const activities = await populateActivities(stack.activityIds, userId);
      const currentStreak = await calculateStackStreak(stack.id);

      return {
        ...stack,
        activities,
        currentStreak,
      };
    })
  );

  return stacksWithDetails;
}

/**
 * Get a single habit stack by ID with populated activity details
 */
export async function getStackById(
  userId: string,
  stackId: string
): Promise<HabitStackWithActivities | null> {
  const stack = await prisma.habitStack.findFirst({
    where: {
      id: stackId,
      userId,
    },
  });

  if (!stack) return null;

  const activities = await populateActivities(stack.activityIds, userId);
  const currentStreak = await calculateStackStreak(stack.id);

  return {
    ...stack,
    activities,
    currentStreak,
  };
}

/**
 * Validate that activity IDs belong to the user
 */
async function validateActivityIds(userId: string, activityIds: string[]): Promise<boolean> {
  const count = await prisma.activity.count({
    where: {
      id: { in: activityIds },
      userId,
      archived: false,
    },
  });

  return count === activityIds.length;
}

/**
 * Create a new habit stack
 */
export async function createStack(
  userId: string,
  input: HabitStackInput
): Promise<HabitStackWithActivities> {
  // Validate activity IDs
  if (input.activityIds.length < 2) {
    throw new Error('A habit stack must have at least 2 activities.');
  }

  const activitiesValid = await validateActivityIds(userId, input.activityIds);
  if (!activitiesValid) {
    throw new Error('One or more activity IDs are invalid or do not belong to you.');
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
      activityIds: input.activityIds,
      cueType: input.cueType ?? null,
      cueValue: input.cueValue ?? null,
      isPreset: false,
      isActive: input.isActive ?? true,
      completionBonus: input.completionBonus ?? 20,
    },
  });

  const activities = await populateActivities(stack.activityIds, userId);

  return {
    ...stack,
    activities,
    currentStreak: 0,
  };
}

/**
 * Update an existing habit stack
 */
export async function updateStack(
  userId: string,
  stackId: string,
  input: HabitStackUpdateInput
): Promise<HabitStackWithActivities | null> {
  const existingStack = await prisma.habitStack.findFirst({
    where: {
      id: stackId,
      userId,
    },
  });

  if (!existingStack) {
    return null;
  }

  // Validate activity IDs if provided
  if (input.activityIds !== undefined) {
    if (input.activityIds.length < 2) {
      throw new Error('A habit stack must have at least 2 activities.');
    }

    const activitiesValid = await validateActivityIds(userId, input.activityIds);
    if (!activitiesValid) {
      throw new Error('One or more activity IDs are invalid or do not belong to you.');
    }
  }

  // Determine final cue type and value for validation
  const finalCueType = input.cueType !== undefined ? input.cueType : existingStack.cueType;
  const finalCueValue = input.cueValue !== undefined ? input.cueValue : existingStack.cueValue;

  if (!validateCueValue(finalCueType, finalCueValue)) {
    throw new Error('Invalid cue value for the specified cue type.');
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.activityIds !== undefined) updateData.activityIds = input.activityIds;
  if (input.cueType !== undefined) updateData.cueType = input.cueType;
  if (input.cueValue !== undefined) updateData.cueValue = input.cueValue;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.completionBonus !== undefined) updateData.completionBonus = input.completionBonus;

  const updatedStack = await prisma.habitStack.update({
    where: { id: stackId },
    data: updateData,
  });

  const activities = await populateActivities(updatedStack.activityIds, userId);
  const currentStreak = await calculateStackStreak(updatedStack.id);

  return {
    ...updatedStack,
    activities,
    currentStreak,
  };
}

/**
 * Delete a habit stack
 */
export async function deleteStack(
  userId: string,
  stackId: string
): Promise<boolean> {
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
 * Check if user has any stacks
 */
export async function hasStacks(userId: string): Promise<boolean> {
  const count = await prisma.habitStack.count({
    where: { userId },
  });

  return count > 0;
}

/**
 * Get active stacks for a user
 */
export async function getActiveStacks(userId: string): Promise<HabitStackWithActivities[]> {
  const stacks = await prisma.habitStack.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: [
      { cueType: 'asc' },
      { cueValue: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  const stacksWithDetails = await Promise.all(
    stacks.map(async (stack) => {
      const activities = await populateActivities(stack.activityIds, userId);
      const currentStreak = await calculateStackStreak(stack.id);

      return {
        ...stack,
        activities,
        currentStreak,
      };
    })
  );

  return stacksWithDetails;
}

/**
 * Mark a stack as completed for today
 * Returns bonus points earned
 */
export async function completeStack(
  userId: string,
  stackId: string
): Promise<{ bonusPoints: number; streakDay: number } | null> {
  const stack = await prisma.habitStack.findFirst({
    where: {
      id: stackId,
      userId,
      isActive: true,
    },
  });

  if (!stack) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already completed today
  const existing = await prisma.stackCompletion.findUnique({
    where: {
      stackId_date: {
        stackId,
        date: today,
      },
    },
  });

  if (existing) {
    return {
      bonusPoints: existing.bonusPointsEarned,
      streakDay: existing.streakDay,
    };
  }

  // Calculate streak
  const currentStreak = await calculateStackStreak(stackId);
  const newStreakDay = currentStreak + 1;

  // Calculate bonus points with streak multiplier
  // Base bonus + 5% extra per streak day (max 50% extra at 10 days)
  const streakMultiplier = Math.min(1 + (newStreakDay - 1) * 0.05, 1.5);
  const bonusPoints = Math.round(stack.completionBonus * streakMultiplier);

  await prisma.stackCompletion.create({
    data: {
      stackId,
      date: today,
      bonusPointsEarned: bonusPoints,
      streakDay: newStreakDay,
    },
  });

  return {
    bonusPoints,
    streakDay: newStreakDay,
  };
}

/**
 * Check if all activities in a stack are completed today
 */
export async function isStackCompleted(
  userId: string,
  stackId: string
): Promise<boolean> {
  const stack = await prisma.habitStack.findFirst({
    where: {
      id: stackId,
      userId,
    },
  });

  if (!stack || stack.activityIds.length === 0) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Count completions for today for each activity in the stack
  const completions = await prisma.activityCompletion.count({
    where: {
      activityId: { in: stack.activityIds },
      completedAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return completions >= stack.activityIds.length;
}
