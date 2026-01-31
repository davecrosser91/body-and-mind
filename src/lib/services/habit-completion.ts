/**
 * Habit Completion Service
 *
 * Core business logic for completing and uncompleting habits.
 * Handles XP calculation, habitanimal updates, level-ups, and evolution detection.
 */

import { prisma } from '@/lib/db'
import { calculateHabitXP, calculateLevel, calculateEvolutionStage } from '@/lib/xp'
import { recoverHealth } from '@/lib/habitanimal-health'
import { HabitCompletion, Habitanimal, Habit } from '@prisma/client'

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
