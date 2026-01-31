/**
 * Habit Completion Service
 *
 * Core business logic for completing and uncompleting habits.
 * Handles XP calculation, habitanimal updates, level-ups, and evolution detection.
 */

import { prisma } from '@/lib/db'
import { calculateHabitXP, calculateLevel, calculateEvolutionStage } from '@/lib/xp'
import { recoverHealth } from '@/lib/habitanimal-health'
import { HabitCompletion, Habitanimal, Habit, Pillar, SubCategory, Category, Source, Frequency } from '@prisma/client'
import { updateDailyGoal } from '@/lib/daily-status'
import { updateStreak } from '@/lib/streaks'

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
  completion: HabitCompletion
  xpEarned: number
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
  habitId: string
  completionId: string
  isNew: boolean
}

export interface UncompleteResult {
  habitanimal: HabitanimalStateChange
}

// Custom Errors

export class HabitNotFoundError extends Error {
  constructor(habitId: string) {
    super(`Habit not found: ${habitId}`)
    this.name = 'HabitNotFoundError'
  }
}

export class HabitanimalNotFoundError extends Error {
  constructor(category: string) {
    super(`Habitanimal not found for category: ${category}`)
    this.name = 'HabitanimalNotFoundError'
  }
}

export class AlreadyCompletedTodayError extends Error {
  constructor(habitId: string) {
    super(`Habit already completed today: ${habitId}`)
    this.name = 'AlreadyCompletedTodayError'
  }
}

export class NoCompletionTodayError extends Error {
  constructor(habitId: string) {
    super(`No completion found today for habit: ${habitId}`)
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
 * Check if a habit has been completed today
 */
async function isCompletedToday(habitId: string): Promise<HabitCompletion | null> {
  const { start, end } = getTodayBounds()

  return prisma.habitCompletion.findFirst({
    where: {
      habitId,
      completedAt: {
        gte: start,
        lte: end,
      },
    },
  })
}

/**
 * Verify habit exists and belongs to user
 */
async function verifyHabitOwnership(
  habitId: string,
  userId: string
): Promise<Habit> {
  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId,
      archived: false,
    },
  })

  if (!habit) {
    throw new HabitNotFoundError(habitId)
  }

  return habit
}

/**
 * Get the habitanimal for a habit's category
 */
async function getHabitanimalForCategory(
  userId: string,
  category: string
): Promise<Habitanimal> {
  const habitanimal = await prisma.habitanimal.findFirst({
    where: {
      userId,
      type: category as Habitanimal['type'],
    },
  })

  if (!habitanimal) {
    throw new HabitanimalNotFoundError(category)
  }

  return habitanimal
}

// Main Service Functions

/**
 * Complete a habit for today
 *
 * @param habitId - The ID of the habit to complete
 * @param userId - The ID of the user completing the habit
 * @param details - Optional details about the completion
 * @returns CompletionResult with completion record, XP earned, and habitanimal state changes
 * @throws HabitNotFoundError if habit doesn't exist or doesn't belong to user
 * @throws HabitanimalNotFoundError if no habitanimal exists for the habit's category
 * @throws AlreadyCompletedTodayError if habit was already completed today
 */
export async function completeHabit(
  habitId: string,
  userId: string,
  details?: string
): Promise<CompletionResult> {
  // 1. Verify habit exists and belongs to user
  const habit = await verifyHabitOwnership(habitId, userId)

  // 2. Check not already completed today
  const existingCompletion = await isCompletedToday(habitId)
  if (existingCompletion) {
    throw new AlreadyCompletedTodayError(habitId)
  }

  // 3. Calculate XP
  const hasDetails = Boolean(details && details.trim().length > 0)
  const xpEarned = calculateHabitXP(hasDetails)

  // 4. Get the habitanimal for this habit's category
  const habitanimal = await getHabitanimalForCategory(userId, habit.category)

  // 5. Calculate new state values
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
    prisma.habitCompletion.create({
      data: {
        habitId,
        details: details || null,
        xpEarned,
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

  // 7. Return all state changes
  return {
    completion,
    xpEarned,
    habitanimal: {
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
    },
  }
}

/**
 * Uncomplete a habit (remove today's completion)
 *
 * @param habitId - The ID of the habit to uncomplete
 * @param userId - The ID of the user
 * @returns UncompleteResult with updated habitanimal state
 * @throws HabitNotFoundError if habit doesn't exist or doesn't belong to user
 * @throws NoCompletionTodayError if no completion exists for today
 * @throws HabitanimalNotFoundError if no habitanimal exists for the habit's category
 */
export async function uncompleteHabit(
  habitId: string,
  userId: string
): Promise<UncompleteResult> {
  // 1. Verify habit exists and belongs to user
  const habit = await verifyHabitOwnership(habitId, userId)

  // 2. Find today's completion
  const todayCompletion = await isCompletedToday(habitId)
  if (!todayCompletion) {
    throw new NoCompletionTodayError(habitId)
  }

  // 3. Get the habitanimal for this habit's category
  const habitanimal = await getHabitanimalForCategory(userId, habit.category)

  // 4. Calculate reversed state values
  const xpToRemove = todayCompletion.xpEarned
  const previousXP = habitanimal.xp
  const newXP = Math.max(0, previousXP - xpToRemove)
  const previousLevel = calculateLevel(previousXP)
  const newLevel = calculateLevel(newXP)
  const previousEvolutionStage = calculateEvolutionStage(previousLevel)
  const newEvolutionStage = calculateEvolutionStage(newLevel)

  // Note: We don't reverse health recovery - that would be punitive
  // The habitanimal keeps its health but loses the XP
  const previousHealth = habitanimal.health
  const newHealth = habitanimal.health

  // 5. Delete completion and update habitanimal in a transaction
  const [, updatedHabitanimal] = await prisma.$transaction([
    // Delete the completion record
    prisma.habitCompletion.delete({
      where: { id: todayCompletion.id },
    }),
    // Update the habitanimal
    prisma.habitanimal.update({
      where: { id: habitanimal.id },
      data: {
        xp: newXP,
        level: newLevel,
        evolutionStage: newEvolutionStage,
        // Don't update lastInteraction on uncomplete
      },
    }),
  ])

  // 6. Return state changes
  return {
    habitanimal: {
      id: updatedHabitanimal.id,
      previousLevel,
      newLevel,
      previousXP,
      newXP,
      leveledUp: newLevel > previousLevel, // Will be false for uncomplete
      evolved: newEvolutionStage > previousEvolutionStage, // Will be false for uncomplete
      previousEvolutionStage,
      newEvolutionStage,
      previousHealth,
      newHealth,
    },
  }
}

/**
 * Get completion history for a habit
 *
 * @param habitId - The ID of the habit
 * @param userId - The ID of the user
 * @param limit - Maximum number of completions to return (default: 20)
 * @param offset - Number of completions to skip (default: 0)
 * @returns Array of completions with total count
 */
export async function getCompletionHistory(
  habitId: string,
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ completions: HabitCompletion[]; totalCount: number }> {
  // Verify habit exists and belongs to user
  await verifyHabitOwnership(habitId, userId)

  // Get completions with pagination
  const [completions, totalCount] = await prisma.$transaction([
    prisma.habitCompletion.findMany({
      where: { habitId },
      orderBy: { completedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.habitCompletion.count({
      where: { habitId },
    }),
  ])

  return { completions, totalCount }
}

// ============ ACTIVITY LOGGING ============

/**
 * Default habit names for auto-created habits by category
 */
const CATEGORY_HABIT_NAMES: Record<string, string> = {
  TRAINING: 'Workout',
  SLEEP: 'Sleep',
  NUTRITION: 'Healthy Eating',
  MEDITATION: 'Meditation',
  READING: 'Reading',
  LEARNING: 'Learning',
  JOURNALING: 'Journaling',
}

/**
 * Map subcategory to legacy Category enum for backward compatibility
 */
function mapSubCategoryToCategory(subCategory: SubCategory): Category {
  switch (subCategory) {
    case 'TRAINING':
      return Category.FITNESS
    case 'SLEEP':
      return Category.SLEEP
    case 'NUTRITION':
      return Category.NUTRITION
    case 'MEDITATION':
      return Category.MINDFULNESS
    case 'READING':
    case 'LEARNING':
    case 'JOURNALING':
      return Category.LEARNING
    default:
      return Category.FITNESS
  }
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
 * 1. Find existing habit for pillar+category, or create one
 * 2. Create completion with details (duration, notes, source)
 * 3. Update habitanimal XP and stats
 * 4. Update streak after logging
 * 5. Update daily goal after logging
 *
 * @param userId - The ID of the user
 * @param input - Activity input data
 * @returns LogActivityResult with habit ID, completion ID, and whether habit was newly created
 */
export async function logActivity(
  userId: string,
  input: LogActivityInput
): Promise<LogActivityResult> {
  const { pillar, category, duration, details, source } = input

  // Validate category is a valid SubCategory
  const validSubCategories = Object.values(SubCategory) as string[]
  if (!validSubCategories.includes(category)) {
    throw new Error(`Invalid category: ${category}`)
  }

  const subCategory = category as SubCategory

  // 1. Find existing habit for this pillar+category or create one
  let habit = await prisma.habit.findFirst({
    where: {
      userId,
      pillar: pillar as Pillar,
      subCategory,
      archived: false,
    },
  })

  let isNew = false

  if (!habit) {
    // Create a new habit for this category
    const habitName = CATEGORY_HABIT_NAMES[category] || category
    const legacyCategory = mapSubCategoryToCategory(subCategory)

    habit = await prisma.habit.create({
      data: {
        name: habitName,
        category: legacyCategory,
        pillar: pillar as Pillar,
        subCategory,
        frequency: Frequency.DAILY,
        userId,
      },
    })
    isNew = true
  }

  // 2. Check if already completed today
  const { start, end } = getTodayBounds()
  const existingCompletion = await prisma.habitCompletion.findFirst({
    where: {
      habitId: habit.id,
      completedAt: {
        gte: start,
        lte: end,
      },
    },
  })

  if (existingCompletion) {
    // Already completed today - return existing completion
    return {
      habitId: habit.id,
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

  // 4. Calculate XP
  const hasDetails = Boolean(completionDetails && completionDetails.trim().length > 0)
  const xpEarned = calculateHabitXP(hasDetails)

  // 5. Get habitanimal for this category (using legacy category mapping)
  const habitanimalType = habit.category as unknown as Habitanimal['type']
  const habitanimal = await prisma.habitanimal.findFirst({
    where: {
      userId,
      type: habitanimalType,
    },
  })

  // 6. Create completion and update habitanimal in a transaction
  const mappedSource = mapSource(source)

  let completion: HabitCompletion

  if (habitanimal) {
    // Calculate new state values for habitanimal
    const previousXP = habitanimal.xp
    const newXP = previousXP + xpEarned
    const newLevel = calculateLevel(newXP)
    const newEvolutionStage = calculateEvolutionStage(newLevel)
    const previousHealth = habitanimal.health
    const newHealth = recoverHealth(previousHealth)

    const [createdCompletion] = await prisma.$transaction([
      prisma.habitCompletion.create({
        data: {
          habitId: habit.id,
          details: completionDetails || null,
          xpEarned,
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
    completion = await prisma.habitCompletion.create({
      data: {
        habitId: habit.id,
        details: completionDetails || null,
        xpEarned,
        source: mappedSource,
      },
    })
  }

  // 7. Update daily goal (async, non-blocking)
  try {
    await updateDailyGoal(userId, pillar, habit.id)
  } catch (error) {
    console.error('Failed to update daily goal:', error)
    // Non-critical, continue
  }

  // 8. Update streak (async, non-blocking)
  try {
    await updateStreak(userId, pillar, new Date())
    await updateStreak(userId, 'OVERALL', new Date())
  } catch (error) {
    console.error('Failed to update streak:', error)
    // Non-critical, continue
  }

  return {
    habitId: habit.id,
    completionId: completion.id,
    isNew,
  }
}
