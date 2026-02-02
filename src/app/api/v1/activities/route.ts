/**
 * Activities API
 *
 * GET /api/v1/activities - List activities for the authenticated user
 * POST /api/v1/activities - Create a new activity
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  createdResponse,
  badRequestError,
  internalError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { Pillar, Frequency, CueType, AutoTriggerType } from '@prisma/client'

/**
 * GET /api/v1/activities
 * Returns all non-archived activities for the authenticated user
 *
 * Query params:
 * - pillar: Filter by pillar (BODY, MIND)
 * - subCategory: Filter by subCategory
 * - habitsOnly: If 'true', only return activities where isHabit = true
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url)
    const pillarParam = searchParams.get('pillar')
    const subCategoryParam = searchParams.get('subCategory')
    const habitsOnlyParam = searchParams.get('habitsOnly')

    // Validate pillar if provided
    if (pillarParam && !isValidPillar(pillarParam)) {
      return badRequestError(
        `Invalid pillar. Must be one of: ${Object.values(Pillar).join(', ')}`
      )
    }

    // Build the where clause
    const whereClause: {
      userId: string
      archived: boolean
      pillar?: Pillar
      subCategory?: string
      isHabit?: boolean
    } = {
      userId: user.id,
      archived: false,
    }

    if (pillarParam) {
      whereClause.pillar = pillarParam as Pillar
    }

    if (subCategoryParam) {
      whereClause.subCategory = subCategoryParam.toUpperCase()
    }

    if (habitsOnlyParam === 'true') {
      whereClause.isHabit = true
    }

    // Get today's date range for checking completions
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Fetch activities with auto-trigger info and today's completions
    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: {
        autoTrigger: {
          include: {
            triggerActivity: {
              select: { id: true, name: true },
            },
          },
        },
        completions: {
          where: {
            completedAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map to response format
    const activitiesResponse = activities.map((activity) => ({
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
      completedToday: activity.completions.length > 0,
      autoTrigger: activity.autoTrigger
        ? {
            id: activity.autoTrigger.id,
            triggerType: activity.autoTrigger.triggerType,
            thresholdValue: activity.autoTrigger.thresholdValue,
            workoutTypeId: activity.autoTrigger.workoutTypeId,
            triggerActivityId: activity.autoTrigger.triggerActivityId,
            triggerActivityName: activity.autoTrigger.triggerActivity?.name,
            isActive: activity.autoTrigger.isActive,
          }
        : null,
    }))

    return successResponse(activitiesResponse)
  } catch (error) {
    console.error('Activities fetch error:', error)
    return internalError('Failed to fetch activities')
  }
})

/**
 * Check if a string is a valid Pillar enum value
 */
function isValidPillar(value: string): value is Pillar {
  return Object.values(Pillar).includes(value as Pillar)
}

/**
 * POST /api/v1/activities
 * Create a new activity for the authenticated user
 *
 * Request body:
 * - name: string (required)
 * - pillar: 'BODY' | 'MIND' (required)
 * - subCategory: string (required)
 * - points?: number (optional, defaults to 25)
 * - isHabit?: boolean (optional, defaults to false)
 * - description?: string (optional)
 * - frequency?: 'DAILY' | 'WEEKLY' | 'CUSTOM' (optional, defaults to DAILY)
 * - cueType?: 'TIME' | 'LOCATION' | 'AFTER_ACTIVITY' (optional)
 * - cueValue?: string (optional)
 * - autoTrigger?: { triggerType, thresholdValue?, workoutTypeId?, triggerActivityId? } (optional)
 */
export const POST = requireAuth(async (request: NextRequest, { user }) => {
  try {
    // Parse request body
    let body: {
      name?: string
      pillar?: string
      subCategory?: string
      points?: number
      isHabit?: boolean
      description?: string
      frequency?: string
      cueType?: string
      cueValue?: string
      autoTrigger?: {
        triggerType?: string
        thresholdValue?: number
        workoutTypeId?: number
        triggerActivityId?: string
      }
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
      points = 25,
      isHabit = false,
      description,
      frequency = 'DAILY',
      cueType,
      cueValue,
      autoTrigger,
    } = body

    // Validate required fields
    if (!name) {
      return badRequestError('name is required')
    }

    if (!pillar) {
      return badRequestError('pillar is required')
    }

    if (!isValidPillar(pillar)) {
      return badRequestError(
        `Invalid pillar. Must be one of: ${Object.values(Pillar).join(', ')}`
      )
    }

    if (!subCategory) {
      return badRequestError('subCategory is required')
    }

    // Validate frequency if provided
    const validFrequencies = Object.values(Frequency)
    if (!validFrequencies.includes(frequency as Frequency)) {
      return badRequestError(
        `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`
      )
    }

    // Validate cueType if provided
    if (cueType) {
      const validCueTypes = Object.values(CueType)
      if (!validCueTypes.includes(cueType as CueType)) {
        return badRequestError(
          `Invalid cueType. Must be one of: ${validCueTypes.join(', ')}`
        )
      }

      // Validate cue value if cue type is provided
      if (cueType === 'TIME') {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
        if (!cueValue || !timeRegex.test(cueValue)) {
          return badRequestError(
            'cueValue must be in HH:mm format for TIME cue type'
          )
        }
      } else if (!cueValue || cueValue.trim().length === 0) {
        return badRequestError(`cueValue is required when cueType is ${cueType}`)
      }
    }

    // Validate autoTrigger if provided
    if (autoTrigger && autoTrigger.triggerType) {
      const validTriggerTypes = Object.values(AutoTriggerType)
      if (!validTriggerTypes.includes(autoTrigger.triggerType as AutoTriggerType)) {
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
        'NUTRITION_PROTEIN_ABOVE',
        'NUTRITION_HEALTHY_MEALS',
      ]
      if (numericTriggerTypes.includes(autoTrigger.triggerType as AutoTriggerType)) {
        if (autoTrigger.thresholdValue === undefined || autoTrigger.thresholdValue === null) {
          return badRequestError('thresholdValue is required for this trigger type')
        }
      }

      // Validate workoutTypeId for workout trigger
      if (autoTrigger.triggerType === 'WHOOP_WORKOUT_TYPE') {
        if (autoTrigger.workoutTypeId === undefined || autoTrigger.workoutTypeId === null) {
          return badRequestError('workoutTypeId is required for WHOOP_WORKOUT_TYPE trigger')
        }
      }

      // Validate triggerActivityId for activity trigger
      if (autoTrigger.triggerType === 'ACTIVITY_COMPLETED') {
        if (!autoTrigger.triggerActivityId) {
          return badRequestError('triggerActivityId is required for ACTIVITY_COMPLETED trigger')
        }
        // Verify the trigger activity exists and belongs to the user
        const triggerActivity = await prisma.activity.findFirst({
          where: { id: autoTrigger.triggerActivityId, userId: user.id },
        })
        if (!triggerActivity) {
          return badRequestError('Trigger activity not found')
        }
      }
    }

    // Create the activity (with autoTrigger if provided)
    const activity = await prisma.activity.create({
      data: {
        name,
        pillar: pillar as Pillar,
        subCategory: subCategory.toUpperCase(),
        points,
        isHabit,
        description: description || null,
        frequency: frequency as Frequency,
        cueType: cueType ? (cueType as CueType) : null,
        cueValue: cueValue || null,
        userId: user.id,
        ...(autoTrigger?.triggerType && {
          autoTrigger: {
            create: {
              triggerType: autoTrigger.triggerType as AutoTriggerType,
              thresholdValue: autoTrigger.thresholdValue ?? null,
              workoutTypeId: autoTrigger.workoutTypeId ?? null,
              triggerActivityId: autoTrigger.triggerActivityId ?? null,
            },
          },
        }),
      },
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

    return createdResponse({
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
      autoTrigger: activity.autoTrigger
        ? {
            id: activity.autoTrigger.id,
            triggerType: activity.autoTrigger.triggerType,
            thresholdValue: activity.autoTrigger.thresholdValue,
            workoutTypeId: activity.autoTrigger.workoutTypeId,
            triggerActivityId: activity.autoTrigger.triggerActivityId,
            triggerActivityName: activity.autoTrigger.triggerActivity?.name,
            isActive: activity.autoTrigger.isActive,
          }
        : null,
    })
  } catch (error) {
    console.error('Activity creation error:', error)
    return internalError('Failed to create activity')
  }
})
