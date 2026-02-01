/**
 * Single Activity API
 *
 * GET /api/v1/activities/[id] - Get a single activity
 * PUT /api/v1/activities/[id] - Update an activity
 * DELETE /api/v1/activities/[id] - Archive an activity (soft delete)
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  noContentResponse,
  notFoundError,
  badRequestError,
  internalError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { Pillar, Frequency, CueType, AutoTriggerType } from '@prisma/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Check if a string is a valid Pillar enum value
 */
function isValidPillar(value: string): value is Pillar {
  return Object.values(Pillar).includes(value as Pillar)
}

/**
 * GET /api/v1/activities/[id]
 * Returns a single activity with completion statistics
 */
export async function GET(request: NextRequest, context: RouteContext) {
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

    // Fetch activity with aggregated completion data and auto-trigger
    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        userId: user.id,
        archived: false,
      },
      include: {
        _count: {
          select: { completions: true },
        },
        completions: {
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: {
            completedAt: true,
          },
        },
        autoTrigger: {
          select: {
            id: true,
            triggerType: true,
            thresholdValue: true,
            workoutTypeId: true,
            triggerActivityId: true,
            isActive: true,
          },
        },
      },
    })

    if (!activity) {
      return notFoundError('Activity not found')
    }

    const lastCompletion = activity.completions[0] || null

    return successResponse({
      id: activity.id,
      name: activity.name,
      pillar: activity.pillar,
      subCategory: activity.subCategory,
      frequency: activity.frequency,
      description: activity.description,
      points: activity.points,
      isHabit: activity.isHabit,
      cueType: activity.cueType,
      cueValue: activity.cueValue,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      completionCount: activity._count.completions,
      lastCompletionDate: lastCompletion?.completedAt || null,
      autoTrigger: activity.autoTrigger,
    })
  } catch (error) {
    console.error('Activity fetch error:', error)
    return internalError('Failed to fetch activity')
  }
}

/**
 * PUT /api/v1/activities/[id]
 * Update an existing activity
 *
 * Request body (all fields optional):
 * - name: string
 * - pillar: 'BODY' | 'MIND'
 * - subCategory: string
 * - points: number
 * - isHabit: boolean
 * - description: string | null
 * - frequency: 'DAILY' | 'WEEKLY' | 'CUSTOM'
 * - cueType: 'TIME' | 'LOCATION' | 'AFTER_ACTIVITY' | null
 * - cueValue: string | null
 */
export async function PUT(request: NextRequest, context: RouteContext) {
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

    // Check if activity exists and belongs to user
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        userId: user.id,
        archived: false,
      },
    })

    if (!existingActivity) {
      return notFoundError('Activity not found')
    }

    // Parse request body
    let body: {
      name?: string
      pillar?: string
      subCategory?: string
      points?: number
      isHabit?: boolean
      description?: string | null
      frequency?: string
      cueType?: string | null
      cueValue?: string | null
      autoTrigger?: {
        triggerType: string
        thresholdValue?: number
        workoutTypeId?: number
        triggerActivityId?: string
      } | null
    }

    try {
      body = await request.json()
    } catch {
      return badRequestError('Invalid JSON in request body')
    }

    const {
      name,
      pillar,
      subCategory,
      points,
      isHabit,
      description,
      frequency,
      cueType,
      cueValue,
      autoTrigger,
    } = body

    // Build update data
    const updateData: {
      name?: string
      pillar?: Pillar
      subCategory?: string
      points?: number
      isHabit?: boolean
      description?: string | null
      frequency?: Frequency
      cueType?: CueType | null
      cueValue?: string | null
    } = {}

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return badRequestError('name cannot be empty')
      }
      updateData.name = name
    }

    if (pillar !== undefined) {
      if (!isValidPillar(pillar)) {
        return badRequestError(
          `Invalid pillar. Must be one of: ${Object.values(Pillar).join(', ')}`
        )
      }
      updateData.pillar = pillar as Pillar
    }

    if (subCategory !== undefined) {
      if (!subCategory || subCategory.trim().length === 0) {
        return badRequestError('subCategory cannot be empty')
      }
      updateData.subCategory = subCategory.toUpperCase()
    }

    if (points !== undefined) {
      if (typeof points !== 'number' || points < 0) {
        return badRequestError('points must be a positive number')
      }
      updateData.points = points
    }

    if (isHabit !== undefined) {
      updateData.isHabit = isHabit
    }

    if (description !== undefined) {
      updateData.description = description
    }

    if (frequency !== undefined) {
      const validFrequencies = Object.values(Frequency)
      if (!validFrequencies.includes(frequency as Frequency)) {
        return badRequestError(
          `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`
        )
      }
      updateData.frequency = frequency as Frequency
    }

    if (cueType !== undefined) {
      if (cueType === null) {
        updateData.cueType = null
        updateData.cueValue = null
      } else {
        const validCueTypes = Object.values(CueType)
        if (!validCueTypes.includes(cueType as CueType)) {
          return badRequestError(
            `Invalid cueType. Must be one of: ${validCueTypes.join(', ')}`
          )
        }
        updateData.cueType = cueType as CueType

        // Validate cue value
        const effectiveCueValue = cueValue !== undefined ? cueValue : existingActivity.cueValue
        if (cueType === 'TIME') {
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
          if (!effectiveCueValue || !timeRegex.test(effectiveCueValue)) {
            return badRequestError(
              'cueValue must be in HH:mm format for TIME cue type'
            )
          }
        } else if (!effectiveCueValue || effectiveCueValue.trim().length === 0) {
          return badRequestError(`cueValue is required when cueType is ${cueType}`)
        }
      }
    }

    if (cueValue !== undefined && cueType === undefined) {
      // If only cueValue is updated, validate against existing cueType
      if (existingActivity.cueType) {
        if (existingActivity.cueType === 'TIME') {
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
          if (!cueValue || !timeRegex.test(cueValue)) {
            return badRequestError(
              'cueValue must be in HH:mm format for TIME cue type'
            )
          }
        } else if (!cueValue || cueValue.trim().length === 0) {
          return badRequestError(
            `cueValue is required when cueType is ${existingActivity.cueType}`
          )
        }
      }
      updateData.cueValue = cueValue
    }

    // Update the activity
    const updatedActivity = await prisma.activity.update({
      where: { id: activityId },
      data: updateData,
    })

    // If points were changed, update today's completions to reflect new points
    if (points !== undefined && points !== existingActivity.points) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      await prisma.activityCompletion.updateMany({
        where: {
          activityId: activityId,
          completedAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        data: {
          pointsEarned: points,
        },
      })
    }

    // Handle autoTrigger updates
    let updatedAutoTrigger = null
    if (autoTrigger !== undefined) {
      if (autoTrigger === null) {
        // Remove existing auto-trigger
        await prisma.autoTrigger.deleteMany({
          where: { activityId },
        })
      } else {
        // Validate trigger type
        const validTriggerTypes = Object.values(AutoTriggerType)
        if (!validTriggerTypes.includes(autoTrigger.triggerType as AutoTriggerType)) {
          return badRequestError(
            `Invalid triggerType. Must be one of: ${validTriggerTypes.join(', ')}`
          )
        }

        // Upsert auto-trigger
        updatedAutoTrigger = await prisma.autoTrigger.upsert({
          where: { activityId },
          create: {
            activityId,
            triggerType: autoTrigger.triggerType as AutoTriggerType,
            thresholdValue: autoTrigger.thresholdValue,
            workoutTypeId: autoTrigger.workoutTypeId,
            triggerActivityId: autoTrigger.triggerActivityId,
            isActive: true,
          },
          update: {
            triggerType: autoTrigger.triggerType as AutoTriggerType,
            thresholdValue: autoTrigger.thresholdValue,
            workoutTypeId: autoTrigger.workoutTypeId,
            triggerActivityId: autoTrigger.triggerActivityId,
          },
          select: {
            id: true,
            triggerType: true,
            thresholdValue: true,
            workoutTypeId: true,
            triggerActivityId: true,
            isActive: true,
          },
        })
      }
    } else {
      // Fetch existing auto-trigger if not being updated
      updatedAutoTrigger = await prisma.autoTrigger.findUnique({
        where: { activityId },
        select: {
          id: true,
          triggerType: true,
          thresholdValue: true,
          workoutTypeId: true,
          triggerActivityId: true,
          isActive: true,
        },
      })
    }

    return successResponse({
      id: updatedActivity.id,
      name: updatedActivity.name,
      pillar: updatedActivity.pillar,
      subCategory: updatedActivity.subCategory,
      frequency: updatedActivity.frequency,
      description: updatedActivity.description,
      points: updatedActivity.points,
      isHabit: updatedActivity.isHabit,
      cueType: updatedActivity.cueType,
      cueValue: updatedActivity.cueValue,
      createdAt: updatedActivity.createdAt,
      updatedAt: updatedActivity.updatedAt,
      autoTrigger: updatedAutoTrigger,
    })
  } catch (error) {
    console.error('Activity update error:', error)
    return internalError('Failed to update activity')
  }
}

/**
 * DELETE /api/v1/activities/[id]
 * Soft delete an activity (set archived = true)
 * Preserves completion history
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

    // Check if activity exists and belongs to user
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        userId: user.id,
        archived: false,
      },
    })

    if (!existingActivity) {
      return notFoundError('Activity not found')
    }

    // Soft delete by setting archived = true
    await prisma.activity.update({
      where: { id: activityId },
      data: { archived: true },
    })

    return noContentResponse()
  } catch (error) {
    console.error('Activity delete error:', error)
    return internalError('Failed to delete activity')
  }
}
