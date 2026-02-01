/**
 * Activity Completion API
 *
 * POST /api/v1/activities/[id]/complete - Mark an activity as completed
 * DELETE /api/v1/activities/[id]/complete - Remove today's completion
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  createdResponse,
  notFoundError,
  badRequestError,
  conflictError,
  internalError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { Source } from '@prisma/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/v1/activities/[id]/complete
 * Complete an activity
 *
 * Request body (optional):
 * - details: string - Optional notes about the completion
 * - source: 'MANUAL' | 'WHOOP' | 'APPLE_HEALTH' (defaults to 'MANUAL')
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id: activityId } = await context.params

    if (!activityId) {
      return badRequestError('Activity ID is required')
    }

    // Find the activity
    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        userId: user.id,
        archived: false,
      },
    })

    if (!activity) {
      return notFoundError('Activity not found')
    }

    // Parse request body
    let details: string | undefined
    let source: Source = Source.MANUAL

    try {
      const body = await request.json()
      details = body.details
      if (body.source) {
        const validSources = Object.values(Source)
        if (!validSources.includes(body.source as Source)) {
          return badRequestError(
            `Invalid source. Must be one of: ${validSources.join(', ')}`
          )
        }
        source = body.source as Source
      }
    } catch {
      // Empty body is allowed - use defaults
    }

    // Check if already completed today (for habits)
    if (activity.isHabit) {
      const now = new Date()
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(now)
      todayEnd.setHours(23, 59, 59, 999)

      const existingCompletion = await prisma.activityCompletion.findFirst({
        where: {
          activityId: activity.id,
          completedAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      })

      if (existingCompletion) {
        return conflictError('Activity already completed today')
      }
    }

    // Create the completion
    const completion = await prisma.activityCompletion.create({
      data: {
        activityId: activity.id,
        pointsEarned: activity.points,
        details: details || null,
        source,
      },
    })

    return createdResponse({
      id: completion.id,
      activityId: completion.activityId,
      completedAt: completion.completedAt,
      pointsEarned: completion.pointsEarned,
      details: completion.details,
      source: completion.source,
    })
  } catch (error) {
    console.error('Activity completion error:', error)
    return internalError('Failed to complete activity')
  }
}

/**
 * DELETE /api/v1/activities/[id]/complete
 * Remove today's completion for an activity
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id: activityId } = await context.params

    if (!activityId) {
      return badRequestError('Activity ID is required')
    }

    // Find the activity
    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        userId: user.id,
        archived: false,
      },
    })

    if (!activity) {
      return notFoundError('Activity not found')
    }

    // Find today's completion
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    const completion = await prisma.activityCompletion.findFirst({
      where: {
        activityId: activity.id,
        completedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    })

    if (!completion) {
      return notFoundError('No completion found for today')
    }

    // Delete the completion
    await prisma.activityCompletion.delete({
      where: { id: completion.id },
    })

    return successResponse({
      message: 'Completion removed successfully',
      deletedCompletionId: completion.id,
    })
  } catch (error) {
    console.error('Activity uncomplete error:', error)
    return internalError('Failed to remove completion')
  }
}
