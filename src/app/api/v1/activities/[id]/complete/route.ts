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
import {
  Source,
  WorkoutType,
  Intensity,
  MuscleGroup,
  TrainingLocation,
} from '@prisma/client'
import { evaluateAutoTriggers } from '@/lib/auto-trigger'

// Training details input type
interface TrainingDetailsInput {
  workoutType?: string
  durationMinutes?: number
  intensity?: string
  muscleGroups?: string[]
  location?: string
  rpe?: number
  avgHeartRate?: number
  maxHeartRate?: number
  calories?: number
  distance?: number
  hrZones?: Record<string, number>
  exercises?: Array<{
    name: string
    sets?: number
    reps?: string
    weight?: number
    notes?: string
  }>
  source?: string
  externalWorkoutId?: string
  externalData?: Record<string, unknown>
}

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
 * - trainingDetails: TrainingDetailsInput - Optional training-specific data (for TRAINING activities)
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
    let trainingDetails: TrainingDetailsInput | undefined

    try {
      const body = await request.json()
      details = body.details
      trainingDetails = body.trainingDetails

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

    // Validate training details if provided
    if (trainingDetails) {
      if (activity.subCategory !== 'TRAINING') {
        return badRequestError('trainingDetails can only be provided for TRAINING activities')
      }

      // Validate workout type
      if (trainingDetails.workoutType) {
        const validWorkoutTypes = Object.values(WorkoutType)
        if (!validWorkoutTypes.includes(trainingDetails.workoutType as WorkoutType)) {
          return badRequestError(
            `Invalid workoutType. Must be one of: ${validWorkoutTypes.join(', ')}`
          )
        }
      }

      // Validate intensity
      if (trainingDetails.intensity) {
        const validIntensities = Object.values(Intensity)
        if (!validIntensities.includes(trainingDetails.intensity as Intensity)) {
          return badRequestError(
            `Invalid intensity. Must be one of: ${validIntensities.join(', ')}`
          )
        }
      }

      // Validate muscle groups
      if (trainingDetails.muscleGroups) {
        const validMuscleGroups = Object.values(MuscleGroup)
        for (const mg of trainingDetails.muscleGroups) {
          if (!validMuscleGroups.includes(mg as MuscleGroup)) {
            return badRequestError(
              `Invalid muscleGroup: ${mg}. Must be one of: ${validMuscleGroups.join(', ')}`
            )
          }
        }
      }

      // Validate location
      if (trainingDetails.location) {
        const validLocations = Object.values(TrainingLocation)
        if (!validLocations.includes(trainingDetails.location as TrainingLocation)) {
          return badRequestError(
            `Invalid location. Must be one of: ${validLocations.join(', ')}`
          )
        }
      }

      // Validate RPE
      if (trainingDetails.rpe !== undefined && (trainingDetails.rpe < 1 || trainingDetails.rpe > 10)) {
        return badRequestError('rpe must be between 1 and 10')
      }
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

    // Create the completion first
    const completion = await prisma.activityCompletion.create({
      data: {
        activityId: activity.id,
        pointsEarned: activity.points,
        details: details || null,
        source,
      },
    })

    // Create training details if provided
    let trainingDetailsResult = null
    if (trainingDetails) {
      const createdDetails = await prisma.trainingDetails.create({
        data: {
          activityCompletionId: completion.id,
          workoutType: trainingDetails.workoutType as WorkoutType | undefined,
          durationMinutes: trainingDetails.durationMinutes,
          intensity: trainingDetails.intensity as Intensity | undefined,
          muscleGroups: (trainingDetails.muscleGroups as MuscleGroup[]) || [],
          location: trainingDetails.location as TrainingLocation | undefined,
          rpe: trainingDetails.rpe,
          avgHeartRate: trainingDetails.avgHeartRate,
          maxHeartRate: trainingDetails.maxHeartRate,
          calories: trainingDetails.calories,
          distance: trainingDetails.distance,
          hrZones: trainingDetails.hrZones ? JSON.parse(JSON.stringify(trainingDetails.hrZones)) : undefined,
          source: trainingDetails.source as Source | undefined,
          externalWorkoutId: trainingDetails.externalWorkoutId,
          externalData: trainingDetails.externalData ? JSON.parse(JSON.stringify(trainingDetails.externalData)) : undefined,
        },
      })

      // Create exercises if provided
      let exercisesResult: Array<{
        id: string
        name: string
        sets: number | null
        reps: string | null
        weight: number | null
        notes: string | null
      }> = []

      if (trainingDetails.exercises?.length) {
        await prisma.exercise.createMany({
          data: trainingDetails.exercises.map((ex, index) => ({
            trainingDetailsId: createdDetails.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            notes: ex.notes,
            order: index,
          })),
        })

        const exercises = await prisma.exercise.findMany({
          where: { trainingDetailsId: createdDetails.id },
          orderBy: { order: 'asc' },
        })

        exercisesResult = exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          notes: ex.notes,
        }))
      }

      trainingDetailsResult = {
        workoutType: createdDetails.workoutType,
        durationMinutes: createdDetails.durationMinutes,
        intensity: createdDetails.intensity,
        muscleGroups: createdDetails.muscleGroups,
        location: createdDetails.location,
        rpe: createdDetails.rpe,
        avgHeartRate: createdDetails.avgHeartRate,
        maxHeartRate: createdDetails.maxHeartRate,
        calories: createdDetails.calories,
        distance: createdDetails.distance,
        hrZones: createdDetails.hrZones,
        exercises: exercisesResult,
      }
    }

    // Evaluate auto-triggers that depend on this activity being completed
    // (runs async, errors are logged but don't affect the response)
    evaluateAutoTriggers(user.id, {
      completedActivityId: activity.id,
    }).catch((error) => {
      console.error('[AutoTrigger] Evaluation error after activity completion:', error)
    })

    return createdResponse({
      id: completion.id,
      activityId: completion.activityId,
      completedAt: completion.completedAt,
      pointsEarned: completion.pointsEarned,
      details: completion.details,
      source: completion.source,
      trainingDetails: trainingDetailsResult,
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
