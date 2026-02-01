/**
 * Activity Completion Service
 *
 * Core business logic for completing and uncompleting activities.
 * Handles points calculation, habitanimal updates, level-ups, and evolution detection.
 */

import { prisma } from '@/lib/db'
import { calculateHabitXP, calculateLevel, calculateEvolutionStage } from '@/lib/xp'
import { recoverHealth } from '@/lib/habitanimal-health'
import { ActivityCompletion, Habitanimal, Activity, Pillar, Source, Frequency } from '@prisma/client'
import { updateDailyGoal } from '@/lib/daily-status'
import { updateStreaksForDate } from '@/lib/streaks'

// Types

export interface HabitanimalStateChange {
  id: string
  previousLevel: number
  newLevel: number
  previousXP: number
  newXP: number
  leveledUp: boolean
  evolved: boolean
  previousEvolutionStage: number
  newEvolutionStage: number
  previousHealth: number
  newHealth: number
}

export interface CompletionResult {
  completion: ActivityCompletion
  pointsEarned: number
  habitanimal: HabitanimalStateChange
}

export interface LogActivityInput {
  pillar: 'BODY' | 'MIND'
  category: string // SubCategory value
  duration?: number // minutes
  details?: string
  source?: 'manual' | 'whoop' | 'api'
}

export interface LogActivityResult {
  activityId: string
  completionId: string
  isNew: boolean
}

export interface UncompleteResult {
  habitanimal: HabitanimalStateChange
}

// Custom Errors

export class ActivityNotFoundError extends Error {
  constructor(activityId: string) {
    super(`Activity not found: ${activityId}`)
    this.name = 'ActivityNotFoundError'
  }
}

// Legacy alias
export const HabitNotFoundError = ActivityNotFoundError

export class HabitanimalNotFoundError extends Error {
  constructor(category: string) {
    super(`Habitanimal not found for category: ${category}`)
    this.name = 'HabitanimalNotFoundError'
  }
}

export class AlreadyCompletedTodayError extends Error {
  constructor(activityId: string) {
    super(`Activity already completed today: ${activityId}`)
    this.name = 'AlreadyCompletedTodayError'
  }
}

export class NoCompletionTodayError extends Error {
  constructor(activityId: string) {
    super(`No completion found today for activity: ${activityId}`)
    this.name = 'NoCompletionTodayError'
  }
}

// Helper Functions

/**
 * Get the start and end of today in the user's timezone (using UTC as default)
 */
function getTodayBounds(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

/**
 * Check if an activity has been completed today
 */
async function isCompletedToday(activityId: string): Promise<ActivityCompletion | null> {
  const { start, end } = getTodayBounds()

  return prisma.activityCompletion.findFirst({
    where: {
      activityId,
      completedAt: {
        gte: start,
        lte: end,
      },
    },
  })
}

/**
 * Verify activity exists and belongs to user
 */
async function verifyActivityOwnership(
  activityId: string,
  userId: string
): Promise<Activity> {
  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      userId,
      archived: false,
    },
  })

  if (!activity) {
    throw new ActivityNotFoundError(activityId)
  }

  return activity
}

/**
 * Get the habitanimal for a pillar
 */
async function getHabitanimalForPillar(
  userId: string,
  pillar: string
): Promise<Habitanimal | null> {
  // Map pillar to habitanimal type
  // BODY pillars: FITNESS, SLEEP, NUTRITION
  // MIND pillars: MINDFULNESS, LEARNING
  const typeMapping: Record<string, string[]> = {
    BODY: ['FITNESS', 'NUTRITION', 'SLEEP'],
    MIND: ['MINDFULNESS', 'LEARNING'],
  }

  const types = typeMapping[pillar] || []
  if (types.length === 0) {
    return null
  }

  // Get the first matching habitanimal
  const habitanimal = await prisma.habitanimal.findFirst({
    where: {
      userId,
      type: {
        in: types as Habitanimal['type'][],
      },
    },
  })

  return habitanimal
}

// Main Service Functions

/**
 * Complete an activity for today
 *
 * @param activityId - The ID of the activity to complete
 * @param userId - The ID of the user completing the activity
 * @param details - Optional details about the completion
 * @returns CompletionResult with completion record, points earned, and habitanimal state changes
 * @throws ActivityNotFoundError if activity doesn't exist or doesn't belong to user
 * @throws AlreadyCompletedTodayError if activity was already completed today
 */
export async function completeActivity(
  activityId: string,
  userId: string,
  details?: string
): Promise<CompletionResult> {
  // 1. Verify activity exists and belongs to user
  const activity = await verifyActivityOwnership(activityId, userId)

  // 2. Check not already completed today (for habits)
  if (activity.isHabit) {
    const existingCompletion = await isCompletedToday(activityId)
    if (existingCompletion) {
      throw new AlreadyCompletedTodayError(activityId)
    }
  }

  // 3. Calculate points
  const hasDetails = Boolean(details && details.trim().length > 0)
  const pointsEarned = hasDetails ? activity.points + 5 : activity.points // Bonus for details

  // 4. Get the habitanimal for this activity's pillar
  const habitanimal = await getHabitanimalForPillar(userId, activity.pillar)

  // 5. Calculate new state values for habitanimal (if found)
  let habitanimalStateChange: HabitanimalStateChange

  if (habitanimal) {
    const xpEarned = calculateHabitXP(hasDetails)
    const previousXP = habitanimal.xp
    const newXP = previousXP + xpEarned
    const previousLevel = calculateLevel(previousXP)
    const newLevel = calculateLevel(newXP)
    const previousEvolutionStage = calculateEvolutionStage(previousLevel)
    const newEvolutionStage = calculateEvolutionStage(newLevel)
    const previousHealth = habitanimal.health
    const newHealth = recoverHealth(previousHealth)

    // 6. Create completion and update habitanimal in a transaction
    const [completion, updatedHabitanimal] = await prisma.$transaction([
      // Create the completion record
      prisma.activityCompletion.create({
        data: {
          activityId,
          details: details || null,
          pointsEarned,
          source: 'MANUAL',
        },
      }),
      // Update the habitanimal
      prisma.habitanimal.update({
        where: { id: habitanimal.id },
        data: {
          xp: newXP,
          level: newLevel,
          evolutionStage: newEvolutionStage,
          health: newHealth,
          lastInteraction: new Date(),
        },
      }),
    ])

    habitanimalStateChange = {
      id: updatedHabitanimal.id,
      previousLevel,
      newLevel,
      previousXP,
      newXP,
      leveledUp: newLevel > previousLevel,
      evolved: newEvolutionStage > previousEvolutionStage,
      previousEvolutionStage,
      newEvolutionStage,
      previousHealth,
      newHealth,
    }

    return {
      completion,
      pointsEarned,
      habitanimal: habitanimalStateChange,
    }
  } else {
    // No habitanimal found - just create the completion
    const completion = await prisma.activityCompletion.create({
      data: {
        activityId,
        details: details || null,
        pointsEarned,
        source: 'MANUAL',
      },
    })

    return {
      completion,
      pointsEarned,
      habitanimal: {
        id: '',
        previousLevel: 0,
        newLevel: 0,
        previousXP: 0,
        newXP: 0,
        leveledUp: false,
        evolved: false,
        previousEvolutionStage: 0,
        newEvolutionStage: 0,
        previousHealth: 0,
        newHealth: 0,
      },
    }
  }
}

// Legacy alias
export const completeHabit = completeActivity

/**
 * Uncomplete an activity (remove today's completion)
 *
 * @param activityId - The ID of the activity to uncomplete
 * @param userId - The ID of the user
 * @returns UncompleteResult with updated habitanimal state
 * @throws ActivityNotFoundError if activity doesn't exist or doesn't belong to user
 * @throws NoCompletionTodayError if no completion exists for today
 */
export async function uncompleteActivity(
  activityId: string,
  userId: string
): Promise<UncompleteResult> {
  // 1. Verify activity exists and belongs to user
  const activity = await verifyActivityOwnership(activityId, userId)

  // 2. Find today's completion
  const todayCompletion = await isCompletedToday(activityId)
  if (!todayCompletion) {
    throw new NoCompletionTodayError(activityId)
  }

  // 3. Get the habitanimal for this activity's pillar
  const habitanimal = await getHabitanimalForPillar(userId, activity.pillar)

  if (habitanimal) {
    // 4. Calculate reversed state values
    const xpToRemove = Math.floor(todayCompletion.pointsEarned / 2) // Approximate XP from points
    const previousXP = habitanimal.xp
    const newXP = Math.max(0, previousXP - xpToRemove)
    const previousLevel = calculateLevel(previousXP)
    const newLevel = calculateLevel(newXP)
    const previousEvolutionStage = calculateEvolutionStage(previousLevel)
    const newEvolutionStage = calculateEvolutionStage(newLevel)

    // Note: We don't reverse health recovery - that would be punitive
    const previousHealth = habitanimal.health
    const newHealth = habitanimal.health

    // 5. Delete completion and update habitanimal in a transaction
    const [, updatedHabitanimal] = await prisma.$transaction([
      // Delete the completion record
      prisma.activityCompletion.delete({
        where: { id: todayCompletion.id },
      }),
      // Update the habitanimal
      prisma.habitanimal.update({
        where: { id: habitanimal.id },
        data: {
          xp: newXP,
          level: newLevel,
          evolutionStage: newEvolutionStage,
        },
      }),
    ])

    return {
      habitanimal: {
        id: updatedHabitanimal.id,
        previousLevel,
        newLevel,
        previousXP,
        newXP,
        leveledUp: false,
        evolved: false,
        previousEvolutionStage,
        newEvolutionStage,
        previousHealth,
        newHealth,
      },
    }
  } else {
    // No habitanimal - just delete the completion
    await prisma.activityCompletion.delete({
      where: { id: todayCompletion.id },
    })

    return {
      habitanimal: {
        id: '',
        previousLevel: 0,
        newLevel: 0,
        previousXP: 0,
        newXP: 0,
        leveledUp: false,
        evolved: false,
        previousEvolutionStage: 0,
        newEvolutionStage: 0,
        previousHealth: 0,
        newHealth: 0,
      },
    }
  }
}

// Legacy alias
export const uncompleteHabit = uncompleteActivity

/**
 * Get completion history for an activity
 *
 * @param activityId - The ID of the activity
 * @param userId - The ID of the user
 * @param limit - Maximum number of completions to return (default: 20)
 * @param offset - Number of completions to skip (default: 0)
 * @returns Array of completions with total count
 */
export async function getCompletionHistory(
  activityId: string,
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ completions: ActivityCompletion[]; totalCount: number }> {
  // Verify activity exists and belongs to user
  await verifyActivityOwnership(activityId, userId)

  // Get completions with pagination
  const [completions, totalCount] = await prisma.$transaction([
    prisma.activityCompletion.findMany({
      where: { activityId },
      orderBy: { completedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.activityCompletion.count({
      where: { activityId },
    }),
  ])

  return { completions, totalCount }
}

// ============ ACTIVITY LOGGING ============

/**
 * Default activity names for auto-created activities by category
 */
const CATEGORY_ACTIVITY_NAMES: Record<string, string> = {
  TRAINING: 'Workout',
  SLEEP: 'Sleep',
  NUTRITION: 'Healthy Eating',
  MEDITATION: 'Meditation',
  READING: 'Reading',
  LEARNING: 'Learning',
  JOURNALING: 'Journaling',
}

/**
 * Map subcategory to pillar
 */
function mapSubCategoryToPillar(subCategory: string): Pillar {
  const bodyCategories = ['TRAINING', 'SLEEP', 'NUTRITION', 'FITNESS']
  const mindCategories = ['MEDITATION', 'READING', 'LEARNING', 'JOURNALING', 'MINDFULNESS']

  if (bodyCategories.includes(subCategory.toUpperCase())) {
    return 'BODY'
  }
  if (mindCategories.includes(subCategory.toUpperCase())) {
    return 'MIND'
  }
  // Default to BODY for unknown categories
  return 'BODY'
}

/**
 * Map source string to Source enum
 */
function mapSource(source?: 'manual' | 'whoop' | 'api'): Source {
  switch (source) {
    case 'whoop':
      return Source.WHOOP
    case 'api':
      return Source.MANUAL // API source treated as manual for now
    case 'manual':
    default:
      return Source.MANUAL
  }
}

/**
 * Log an activity for a user
 *
 * This function handles the complete activity logging flow:
 * 1. Find existing activity for pillar+category, or create one
 * 2. Create completion with details (duration, notes, source)
 * 3. Update habitanimal XP and stats
 * 4. Update streak after logging
 * 5. Update daily goal after logging
 *
 * @param userId - The ID of the user
 * @param input - Activity input data
 * @returns LogActivityResult with activity ID, completion ID, and whether activity was newly created
 */
export async function logActivity(
  userId: string,
  input: LogActivityInput
): Promise<LogActivityResult> {
  const { pillar, category, duration, details, source } = input

  // 1. Find existing activity for this pillar+category or create one
  let activity = await prisma.activity.findFirst({
    where: {
      userId,
      pillar: pillar as Pillar,
      subCategory: category.toUpperCase(),
      archived: false,
    },
  })

  let isNew = false

  if (!activity) {
    // Create a new activity for this category
    const activityName = CATEGORY_ACTIVITY_NAMES[category.toUpperCase()] || category

    activity = await prisma.activity.create({
      data: {
        name: activityName,
        pillar: pillar as Pillar,
        subCategory: category.toUpperCase(),
        frequency: Frequency.DAILY,
        points: 25,
        isHabit: true,
        userId,
      },
    })
    isNew = true
  }

  // 2. Check if already completed today
  const { start, end } = getTodayBounds()
  const existingCompletion = await prisma.activityCompletion.findFirst({
    where: {
      activityId: activity.id,
      completedAt: {
        gte: start,
        lte: end,
      },
    },
  })

  if (existingCompletion) {
    // Already completed today - return existing completion
    return {
      activityId: activity.id,
      completionId: existingCompletion.id,
      isNew: false,
    }
  }

  // 3. Build details string including duration if provided
  let completionDetails = details || ''
  if (duration && duration > 0) {
    const durationNote = `Duration: ${duration} minutes`
    completionDetails = completionDetails
      ? `${completionDetails}\n${durationNote}`
      : durationNote
  }

  // 4. Calculate points
  const hasDetails = Boolean(completionDetails && completionDetails.trim().length > 0)
  const pointsEarned = hasDetails ? activity.points + 5 : activity.points

  // 5. Get habitanimal for this pillar
  const habitanimal = await getHabitanimalForPillar(userId, pillar)

  // 6. Create completion and update habitanimal in a transaction
  const mappedSource = mapSource(source)

  let completion: ActivityCompletion

  if (habitanimal) {
    const xpEarned = calculateHabitXP(hasDetails)
    const previousXP = habitanimal.xp
    const newXP = previousXP + xpEarned
    const newLevel = calculateLevel(newXP)
    const newEvolutionStage = calculateEvolutionStage(newLevel)
    const previousHealth = habitanimal.health
    const newHealth = recoverHealth(previousHealth)

    const [createdCompletion] = await prisma.$transaction([
      prisma.activityCompletion.create({
        data: {
          activityId: activity.id,
          details: completionDetails || null,
          pointsEarned,
          source: mappedSource,
        },
      }),
      prisma.habitanimal.update({
        where: { id: habitanimal.id },
        data: {
          xp: newXP,
          level: newLevel,
          evolutionStage: newEvolutionStage,
          health: newHealth,
          lastInteraction: new Date(),
        },
      }),
    ])
    completion = createdCompletion
  } else {
    // No habitanimal - just create the completion
    completion = await prisma.activityCompletion.create({
      data: {
        activityId: activity.id,
        details: completionDetails || null,
        pointsEarned,
        source: mappedSource,
      },
    })
  }

  // 7. Update daily goal (async, non-blocking)
  try {
    await updateDailyGoal(userId, pillar, activity.id)
  } catch (error) {
    console.error('Failed to update daily goal:', error)
    // Non-critical, continue
  }

  // 8. Update streak (async, non-blocking)
  try {
    await updateStreaksForDate(userId, new Date())
  } catch (error) {
    console.error('Failed to update streak:', error)
    // Non-critical, continue
  }

  return {
    activityId: activity.id,
    completionId: completion.id,
    isNew,
  }
}
