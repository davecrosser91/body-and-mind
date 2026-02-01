/**
 * Link External Workout API
 *
 * POST /api/v1/training/link-external - Link an external workout to an existing habit
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import {
  createdResponse,
  badRequestError,
  notFoundError,
  conflictError,
  internalError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import {
  Source,
  WorkoutType,
  Intensity,
  MuscleGroup,
  TrainingLocation,
} from '@prisma/client'
import { evaluateAutoTriggers } from '@/lib/auto-trigger'

/**
 * POST /api/v1/training/link-external
 * Link an external workout (e.g., from Whoop) to an existing training habit
 *
 * Request body:
 * - activityId: string (required) - The habit to complete
 * - externalWorkout: { source, externalId, name, workoutType, durationMinutes, strain, avgHeartRate, maxHeartRate, calories, hrZones }
 * - overrides: { points, workoutType, intensity, muscleGroups, location, rpe, notes }
 */
export const POST = requireAuth(async (request: NextRequest, { user }) => {
  try {
    let body: {
      activityId?: string
      externalWorkout?: {
        source?: string
        externalId?: string
        name?: string
        workoutType?: string
        durationMinutes?: number
        strain?: number
        avgHeartRate?: number
        maxHeartRate?: number
        calories?: number
        hrZones?: Record<string, number>
      }
      overrides?: {
        points?: number
        workoutType?: string
        intensity?: string
        muscleGroups?: string[]
        location?: string
        rpe?: number
        notes?: string
      }
    }

    try {
      body = await request.json()
    } catch {
      return badRequestError('Invalid JSON in request body')
    }

    const { activityId, externalWorkout, overrides } = body

    // Validate required fields
    if (!activityId) {
      return badRequestError('activityId is required')
    }

    if (!externalWorkout) {
      return badRequestError('externalWorkout is required')
    }

    if (!externalWorkout.source || !externalWorkout.externalId) {
      return badRequestError('externalWorkout.source and externalWorkout.externalId are required')
    }

    // Validate source
    const validSources = Object.values(Source)
    if (!validSources.includes(externalWorkout.source as Source)) {
      return badRequestError(`Invalid source. Must be one of: ${validSources.join(', ')}`)
    }

    // Find the activity (must be a training habit owned by the user)
    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        userId: user.id,
        subCategory: 'TRAINING',
        isHabit: true,
        archived: false,
      },
    })

    if (!activity) {
      return notFoundError('Training habit not found')
    }

    // Check if already completed today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingCompletion = await prisma.activityCompletion.findFirst({
      where: {
        activityId: activity.id,
        completedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (existingCompletion) {
      return conflictError('This habit has already been completed today')
    }

    // Check if this external workout has already been linked
    const existingLink = await prisma.trainingDetails.findFirst({
      where: {
        source: externalWorkout.source as Source,
        externalWorkoutId: externalWorkout.externalId,
      },
    })

    if (existingLink) {
      return conflictError('This external workout has already been logged')
    }

    // Determine final values (overrides take precedence)
    const finalWorkoutType = overrides?.workoutType || externalWorkout.workoutType
    const finalPoints = overrides?.points ?? activity.points

    // Validate overrides if provided
    if (finalWorkoutType) {
      const validWorkoutTypes = Object.values(WorkoutType)
      if (!validWorkoutTypes.includes(finalWorkoutType as WorkoutType)) {
        return badRequestError(
          `Invalid workoutType. Must be one of: ${validWorkoutTypes.join(', ')}`
        )
      }
    }

    if (overrides?.intensity) {
      const validIntensities = Object.values(Intensity)
      if (!validIntensities.includes(overrides.intensity as Intensity)) {
        return badRequestError(
          `Invalid intensity. Must be one of: ${validIntensities.join(', ')}`
        )
      }
    }

    if (overrides?.muscleGroups) {
      const validMuscleGroups = Object.values(MuscleGroup)
      for (const mg of overrides.muscleGroups) {
        if (!validMuscleGroups.includes(mg as MuscleGroup)) {
          return badRequestError(
            `Invalid muscleGroup: ${mg}. Must be one of: ${validMuscleGroups.join(', ')}`
          )
        }
      }
    }

    if (overrides?.location) {
      const validLocations = Object.values(TrainingLocation)
      if (!validLocations.includes(overrides.location as TrainingLocation)) {
        return badRequestError(
          `Invalid location. Must be one of: ${validLocations.join(', ')}`
        )
      }
    }

    if (overrides?.rpe !== undefined && (overrides.rpe < 1 || overrides.rpe > 10)) {
      return badRequestError('rpe must be between 1 and 10')
    }

    // Create the completion first
    const completion = await prisma.activityCompletion.create({
      data: {
        activityId: activity.id,
        pointsEarned: finalPoints,
        source: externalWorkout.source as Source,
        details: overrides?.notes || null,
      },
    })

    // Create training details
    const trainingDetailsRecord = await prisma.trainingDetails.create({
      data: {
        activityCompletionId: completion.id,
        workoutType: finalWorkoutType as WorkoutType | undefined,
        durationMinutes: externalWorkout.durationMinutes,
        intensity: overrides?.intensity as Intensity | undefined,
        muscleGroups: (overrides?.muscleGroups as MuscleGroup[]) || [],
        location: overrides?.location as TrainingLocation | undefined,
        rpe: overrides?.rpe,
        avgHeartRate: externalWorkout.avgHeartRate,
        maxHeartRate: externalWorkout.maxHeartRate,
        calories: externalWorkout.calories,
        hrZones: externalWorkout.hrZones ? JSON.parse(JSON.stringify(externalWorkout.hrZones)) : undefined,
        source: externalWorkout.source as Source,
        externalWorkoutId: externalWorkout.externalId,
        externalData: {
          name: externalWorkout.name,
          strain: externalWorkout.strain,
          originalWorkoutType: externalWorkout.workoutType,
        },
      },
    })

    // Evaluate auto-triggers
    evaluateAutoTriggers(user.id, {
      completedActivityId: activity.id,
    }).catch((error) => {
      console.error('[AutoTrigger] Evaluation error after link-external:', error)
    })

    return createdResponse({
      id: completion.id,
      activityId: completion.activityId,
      activityName: activity.name,
      completedAt: completion.completedAt,
      pointsEarned: completion.pointsEarned,
      source: completion.source,
      trainingDetails: {
        workoutType: trainingDetailsRecord.workoutType,
        durationMinutes: trainingDetailsRecord.durationMinutes,
        intensity: trainingDetailsRecord.intensity,
        muscleGroups: trainingDetailsRecord.muscleGroups,
        location: trainingDetailsRecord.location,
        rpe: trainingDetailsRecord.rpe,
        avgHeartRate: trainingDetailsRecord.avgHeartRate,
        maxHeartRate: trainingDetailsRecord.maxHeartRate,
        calories: trainingDetailsRecord.calories,
        hrZones: trainingDetailsRecord.hrZones,
        externalWorkoutId: trainingDetailsRecord.externalWorkoutId,
      },
    })
  } catch (error) {
    console.error('Link external workout error:', error)
    return internalError('Failed to link external workout')
  }
})
