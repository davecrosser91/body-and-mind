/**
 * Activity Auto-Trigger API
 *
 * GET /api/v1/activities/[id]/trigger - Get the trigger config for an activity
 * PUT /api/v1/activities/[id]/trigger - Create or update the trigger for an activity
 * DELETE /api/v1/activities/[id]/trigger - Remove the trigger from an activity
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  badRequestError,
  notFoundError,
  internalError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { AutoTriggerType } from '@prisma/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/activities/[id]/trigger
 * Returns the auto-trigger configuration for an activity (if any)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id: activityId } = await context.params

    // Verify activity exists and belongs to user
    const activity = await prisma.activity.findFirst({
      where: { id: activityId, userId: user.id },
      include: {
        autoTrigger: {
          include: {
            triggerActivity: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!activity) {
      return notFoundError('Activity not found')
    }

    if (!activity.autoTrigger) {
      return successResponse(null)
    }

    return successResponse({
      id: activity.autoTrigger.id,
      triggerType: activity.autoTrigger.triggerType,
      thresholdValue: activity.autoTrigger.thresholdValue,
      workoutTypeId: activity.autoTrigger.workoutTypeId,
      triggerActivityId: activity.autoTrigger.triggerActivityId,
      triggerActivityName: activity.autoTrigger.triggerActivity?.name,
      isActive: activity.autoTrigger.isActive,
    })
  } catch (error) {
    console.error('Trigger fetch error:', error)
    return internalError('Failed to fetch trigger')
  }
}

/**
 * PUT /api/v1/activities/[id]/trigger
 * Create or update the auto-trigger for an activity
 *
 * Request body:
 * - triggerType: AutoTriggerType (required)
 * - thresholdValue?: number (required for numeric triggers)
 * - workoutTypeId?: number (required for WHOOP_WORKOUT_TYPE)
 * - triggerActivityId?: string (required for ACTIVITY_COMPLETED)
 * - isActive?: boolean (optional, defaults to true)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id: activityId } = await context.params

    // Verify activity exists and belongs to user
    const activity = await prisma.activity.findFirst({
      where: { id: activityId, userId: user.id },
    })

    if (!activity) {
      return notFoundError('Activity not found')
    }

    // Parse request body
    let body: {
      triggerType?: string
      thresholdValue?: number
      workoutTypeId?: number
      triggerActivityId?: string
      isActive?: boolean
    }

    try {
      body = await request.json()
    } catch {
      return badRequestError('Invalid JSON in request body')
    }

    const { triggerType, thresholdValue, workoutTypeId, triggerActivityId, isActive = true } = body

    // Validate trigger type
    if (!triggerType) {
      return badRequestError('triggerType is required')
    }

    const validTriggerTypes = Object.values(AutoTriggerType)
    if (!validTriggerTypes.includes(triggerType as AutoTriggerType)) {
      return badRequestError(
        `Invalid triggerType. Must be one of: ${validTriggerTypes.join(', ')}`
      )
    }

    // Validate threshold for numeric trigger types
    const numericTriggerTypes: AutoTriggerType[] = [
      'WHOOP_RECOVERY_ABOVE',
      'WHOOP_RECOVERY_BELOW',
      'WHOOP_SLEEP_ABOVE',
      'WHOOP_STRAIN_ABOVE',
    ]
    if (numericTriggerTypes.includes(triggerType as AutoTriggerType)) {
      if (thresholdValue === undefined || thresholdValue === null) {
        return badRequestError('thresholdValue is required for this trigger type')
      }
    }

    // Validate workoutTypeId for workout trigger
    if (triggerType === 'WHOOP_WORKOUT_TYPE') {
      if (workoutTypeId === undefined || workoutTypeId === null) {
        return badRequestError('workoutTypeId is required for WHOOP_WORKOUT_TYPE trigger')
      }
    }

    // Validate triggerActivityId for activity trigger
    if (triggerType === 'ACTIVITY_COMPLETED') {
      if (!triggerActivityId) {
        return badRequestError('triggerActivityId is required for ACTIVITY_COMPLETED trigger')
      }
      // Verify the trigger activity exists and belongs to the user
      const triggerActivity = await prisma.activity.findFirst({
        where: { id: triggerActivityId, userId: user.id },
      })
      if (!triggerActivity) {
        return badRequestError('Trigger activity not found')
      }
      // Prevent self-referencing trigger
      if (triggerActivityId === activityId) {
        return badRequestError('An activity cannot trigger itself')
      }
    }

    // Upsert the trigger
    const trigger = await prisma.autoTrigger.upsert({
      where: { activityId },
      create: {
        activityId,
        triggerType: triggerType as AutoTriggerType,
        thresholdValue: thresholdValue ?? null,
        workoutTypeId: workoutTypeId ?? null,
        triggerActivityId: triggerActivityId ?? null,
        isActive,
      },
      update: {
        triggerType: triggerType as AutoTriggerType,
        thresholdValue: thresholdValue ?? null,
        workoutTypeId: workoutTypeId ?? null,
        triggerActivityId: triggerActivityId ?? null,
        isActive,
      },
      include: {
        triggerActivity: {
          select: { id: true, name: true },
        },
      },
    })

    return successResponse({
      id: trigger.id,
      triggerType: trigger.triggerType,
      thresholdValue: trigger.thresholdValue,
      workoutTypeId: trigger.workoutTypeId,
      triggerActivityId: trigger.triggerActivityId,
      triggerActivityName: trigger.triggerActivity?.name,
      isActive: trigger.isActive,
    })
  } catch (error) {
    console.error('Trigger update error:', error)
    return internalError('Failed to update trigger')
  }
}

/**
 * DELETE /api/v1/activities/[id]/trigger
 * Remove the auto-trigger from an activity
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id: activityId } = await context.params

    // Verify activity exists and belongs to user
    const activity = await prisma.activity.findFirst({
      where: { id: activityId, userId: user.id },
      include: { autoTrigger: true },
    })

    if (!activity) {
      return notFoundError('Activity not found')
    }

    if (!activity.autoTrigger) {
      return notFoundError('Activity has no trigger configured')
    }

    // Delete the trigger
    await prisma.autoTrigger.delete({
      where: { id: activity.autoTrigger.id },
    })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error('Trigger delete error:', error)
    return internalError('Failed to delete trigger')
  }
}
