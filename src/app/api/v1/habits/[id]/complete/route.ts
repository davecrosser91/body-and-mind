import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  notFoundError,
  conflictError,
  internalError,
  badRequestError,
} from '@/lib/api-response'
import {
  completeHabit,
  uncompleteHabit,
  HabitNotFoundError,
  HabitanimalNotFoundError,
  AlreadyCompletedTodayError,
  NoCompletionTodayError,
} from '@/lib/services/habit-completion'
import { getEvolutionStageName } from '@/lib/xp'
import { getMood } from '@/lib/habitanimal-health'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/v1/habits/[id]/complete
 * Complete a habit for today
 *
 * Request body (optional):
 * - details: string - Optional notes about the completion
 *
 * Returns:
 * - completion: The created completion record
 * - xpEarned: Amount of XP earned for this completion
 * - habitanimal: Updated habitanimal state with level-up/evolution info
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id: habitId } = await context.params

    if (!habitId) {
      return badRequestError('Habit ID is required')
    }

    // Parse request body
    let details: string | undefined
    try {
      const body = await request.json()
      details = body.details
    } catch {
      // Empty body is allowed
    }

    // Call the completion service
    const result = await completeHabit(habitId, user.id, details)

    // Get full habitanimal data for the response
    const habitanimal = await prisma.habitanimal.findUnique({
      where: { id: result.habitanimal.id },
    })

    return successResponse({
      completion: {
        id: result.completion.id,
        completedAt: result.completion.completedAt,
        details: result.completion.details,
        xpEarned: result.completion.xpEarned,
        source: result.completion.source,
      },
      xpEarned: result.xpEarned,
      habitanimal: {
        id: result.habitanimal.id,
        name: habitanimal?.name,
        species: habitanimal?.species,
        type: habitanimal?.type,
        level: result.habitanimal.newLevel,
        xp: result.habitanimal.newXP,
        health: result.habitanimal.newHealth,
        evolutionStage: result.habitanimal.newEvolutionStage,
        evolutionStageName: getEvolutionStageName(result.habitanimal.newEvolutionStage),
        mood: getMood(result.habitanimal.newHealth),
        stateChanges: {
          previousLevel: result.habitanimal.previousLevel,
          newLevel: result.habitanimal.newLevel,
          leveledUp: result.habitanimal.leveledUp,
          previousXP: result.habitanimal.previousXP,
          newXP: result.habitanimal.newXP,
          xpGained: result.xpEarned,
          previousEvolutionStage: result.habitanimal.previousEvolutionStage,
          newEvolutionStage: result.habitanimal.newEvolutionStage,
          evolved: result.habitanimal.evolved,
          previousHealth: result.habitanimal.previousHealth,
          newHealth: result.habitanimal.newHealth,
          healthRecovered: result.habitanimal.newHealth - result.habitanimal.previousHealth,
        },
      },
    })
  } catch (error) {
    if (error instanceof HabitNotFoundError) {
      return notFoundError('Habit not found')
    }
    if (error instanceof HabitanimalNotFoundError) {
      return notFoundError('Habitanimal not found for this habit category')
    }
    if (error instanceof AlreadyCompletedTodayError) {
      return conflictError('Habit already completed today')
    }

    console.error('Habit completion error:', error)
    return internalError('Failed to complete habit')
  }
}

/**
 * DELETE /api/v1/habits/[id]/complete
 * Remove today's completion for a habit
 *
 * Returns:
 * - habitanimal: Updated habitanimal state after reversing XP
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id: habitId } = await context.params

    if (!habitId) {
      return badRequestError('Habit ID is required')
    }

    // Call the uncomplete service
    const result = await uncompleteHabit(habitId, user.id)

    // Get full habitanimal data for the response
    const habitanimal = await prisma.habitanimal.findUnique({
      where: { id: result.habitanimal.id },
    })

    return successResponse({
      message: 'Completion removed successfully',
      habitanimal: {
        id: result.habitanimal.id,
        name: habitanimal?.name,
        species: habitanimal?.species,
        type: habitanimal?.type,
        level: result.habitanimal.newLevel,
        xp: result.habitanimal.newXP,
        health: result.habitanimal.newHealth,
        evolutionStage: result.habitanimal.newEvolutionStage,
        evolutionStageName: getEvolutionStageName(result.habitanimal.newEvolutionStage),
        mood: getMood(result.habitanimal.newHealth),
        stateChanges: {
          previousLevel: result.habitanimal.previousLevel,
          newLevel: result.habitanimal.newLevel,
          leveledUp: result.habitanimal.leveledUp,
          previousXP: result.habitanimal.previousXP,
          newXP: result.habitanimal.newXP,
          xpLost: result.habitanimal.previousXP - result.habitanimal.newXP,
          previousEvolutionStage: result.habitanimal.previousEvolutionStage,
          newEvolutionStage: result.habitanimal.newEvolutionStage,
          evolved: result.habitanimal.evolved,
        },
      },
    })
  } catch (error) {
    if (error instanceof HabitNotFoundError) {
      return notFoundError('Habit not found')
    }
    if (error instanceof HabitanimalNotFoundError) {
      return notFoundError('Habitanimal not found for this habit category')
    }
    if (error instanceof NoCompletionTodayError) {
      return notFoundError('No completion found for today')
    }

    console.error('Habit uncomplete error:', error)
    return internalError('Failed to remove completion')
  }
}
