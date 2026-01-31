import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  notFoundError,
  internalError,
  badRequestError,
} from '@/lib/api-response'
import {
  getCompletionHistory,
  HabitNotFoundError,
} from '@/lib/services/habit-completion'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/habits/[id]/history
 * Get paginated completion history for a habit
 *
 * Query parameters:
 * - limit: number (default: 20, max: 100) - Number of completions to return
 * - offset: number (default: 0) - Number of completions to skip
 *
 * Returns:
 * - completions: Array of completion records with XP earned
 * - pagination: { limit, offset, totalCount, hasMore }
 */
export async function GET(request: NextRequest, context: RouteContext) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    // Parse and validate limit
    let limit = 20
    if (limitParam !== null) {
      const parsedLimit = parseInt(limitParam, 10)
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return badRequestError('Limit must be a positive integer')
      }
      limit = Math.min(parsedLimit, 100) // Max 100 per request
    }

    // Parse and validate offset
    let offset = 0
    if (offsetParam !== null) {
      const parsedOffset = parseInt(offsetParam, 10)
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return badRequestError('Offset must be a non-negative integer')
      }
      offset = parsedOffset
    }

    // Get completion history from the service
    const { completions, totalCount } = await getCompletionHistory(
      habitId,
      user.id,
      limit,
      offset
    )

    // Format response
    return successResponse({
      completions: completions.map((completion) => ({
        id: completion.id,
        completedAt: completion.completedAt,
        details: completion.details,
        xpEarned: completion.xpEarned,
        source: completion.source,
      })),
      pagination: {
        limit,
        offset,
        totalCount,
        hasMore: offset + completions.length < totalCount,
      },
    })
  } catch (error) {
    if (error instanceof HabitNotFoundError) {
      return notFoundError('Habit not found')
    }

    console.error('Habit history fetch error:', error)
    return internalError('Failed to fetch habit history')
  }
}
