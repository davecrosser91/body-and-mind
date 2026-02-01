/**
 * Training Template by ID API
 *
 * GET /api/v1/training/templates/[id] - Get a specific template
 * PUT /api/v1/training/templates/[id] - Update a template
 * DELETE /api/v1/training/templates/[id] - Delete a template
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  notFoundError,
  badRequestError,
  internalError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { WorkoutType, Intensity, MuscleGroup, TrainingLocation, CueType } from '@prisma/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/training/templates/[id]
 * Get a specific training template
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id } = await context.params

    const template = await prisma.activity.findFirst({
      where: {
        id,
        userId: user.id,
        subCategory: 'TRAINING',
        isHabit: true,
        archived: false,
      },
      include: {
        TrainingTemplate: true,
        ActivityCompletion: {
          select: { id: true },
        },
      },
    })

    if (!template) {
      return notFoundError('Training template not found')
    }

    return successResponse({
      id: template.id,
      name: template.name,
      points: template.points,
      description: template.description,
      cueType: template.cueType,
      cueValue: template.cueValue,
      createdAt: template.createdAt,
      usageCount: template.ActivityCompletion.length,
      trainingDefaults: template.TrainingTemplate
        ? {
            workoutType: template.TrainingTemplate.workoutType,
            durationMinutes: template.TrainingTemplate.durationMinutes,
            intensity: template.TrainingTemplate.intensity,
            muscleGroups: template.TrainingTemplate.muscleGroups,
            location: template.TrainingTemplate.location,
            defaultExercises: template.TrainingTemplate.defaultExercises,
          }
        : null,
    })
  } catch (error) {
    console.error('Training template fetch error:', error)
    return internalError('Failed to fetch training template')
  }
}

/**
 * PUT /api/v1/training/templates/[id]
 * Update a training template
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id } = await context.params

    // Find the template
    const existingTemplate = await prisma.activity.findFirst({
      where: {
        id,
        userId: user.id,
        subCategory: 'TRAINING',
        isHabit: true,
        archived: false,
      },
      include: {
        TrainingTemplate: true,
      },
    })

    if (!existingTemplate) {
      return notFoundError('Training template not found')
    }

    let body: {
      name?: string
      points?: number
      description?: string
      cueType?: string | null
      cueValue?: string | null
      trainingDefaults?: {
        workoutType?: string | null
        durationMinutes?: number | null
        intensity?: string | null
        muscleGroups?: string[]
        location?: string | null
        defaultExercises?: Array<{
          name: string
          sets?: number
          reps?: string
          weight?: number
        }> | null
      }
    }

    try {
      body = await request.json()
    } catch {
      return badRequestError('Invalid JSON in request body')
    }

    const { name, points, description, cueType, cueValue, trainingDefaults } = body

    // Validate workout type if provided
    if (trainingDefaults?.workoutType) {
      const validWorkoutTypes = Object.values(WorkoutType)
      if (!validWorkoutTypes.includes(trainingDefaults.workoutType as WorkoutType)) {
        return badRequestError(
          `Invalid workoutType. Must be one of: ${validWorkoutTypes.join(', ')}`
        )
      }
    }

    // Validate intensity if provided
    if (trainingDefaults?.intensity) {
      const validIntensities = Object.values(Intensity)
      if (!validIntensities.includes(trainingDefaults.intensity as Intensity)) {
        return badRequestError(
          `Invalid intensity. Must be one of: ${validIntensities.join(', ')}`
        )
      }
    }

    // Validate muscle groups if provided
    if (trainingDefaults?.muscleGroups) {
      const validMuscleGroups = Object.values(MuscleGroup)
      for (const mg of trainingDefaults.muscleGroups) {
        if (!validMuscleGroups.includes(mg as MuscleGroup)) {
          return badRequestError(
            `Invalid muscleGroup: ${mg}. Must be one of: ${validMuscleGroups.join(', ')}`
          )
        }
      }
    }

    // Validate location if provided
    if (trainingDefaults?.location) {
      const validLocations = Object.values(TrainingLocation)
      if (!validLocations.includes(trainingDefaults.location as TrainingLocation)) {
        return badRequestError(
          `Invalid location. Must be one of: ${validLocations.join(', ')}`
        )
      }
    }

    // Update the activity
    const updatedTemplate = await prisma.activity.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(points !== undefined && { points }),
        ...(description !== undefined && { description: description || null }),
        ...(cueType !== undefined && { cueType: cueType as CueType | null }),
        ...(cueValue !== undefined && { cueValue: cueValue || null }),
      },
    })

    // Get existing training template
    const existingTrainingTemplate = await prisma.trainingTemplate.findUnique({
      where: { activityId: id },
    })

    // Update or create training template defaults
    let trainingTemplateResult = null
    if (trainingDefaults) {
      if (existingTrainingTemplate) {
        const updated = await prisma.trainingTemplate.update({
          where: { id: existingTrainingTemplate.id },
          data: {
            ...(trainingDefaults.workoutType !== undefined && {
              workoutType: trainingDefaults.workoutType as WorkoutType | null,
            }),
            ...(trainingDefaults.durationMinutes !== undefined && {
              durationMinutes: trainingDefaults.durationMinutes,
            }),
            ...(trainingDefaults.intensity !== undefined && {
              intensity: trainingDefaults.intensity as Intensity | null,
            }),
            ...(trainingDefaults.muscleGroups !== undefined && {
              muscleGroups: trainingDefaults.muscleGroups as MuscleGroup[],
            }),
            ...(trainingDefaults.location !== undefined && {
              location: trainingDefaults.location as TrainingLocation | null,
            }),
            ...(trainingDefaults.defaultExercises !== undefined && {
              defaultExercises: trainingDefaults.defaultExercises
                ? JSON.parse(JSON.stringify(trainingDefaults.defaultExercises))
                : null,
            }),
          },
        })
        trainingTemplateResult = {
          workoutType: updated.workoutType,
          durationMinutes: updated.durationMinutes,
          intensity: updated.intensity,
          muscleGroups: updated.muscleGroups,
          location: updated.location,
          defaultExercises: updated.defaultExercises,
        }
      } else {
        const created = await prisma.trainingTemplate.create({
          data: {
            activityId: id,
            workoutType: trainingDefaults.workoutType as WorkoutType | undefined,
            durationMinutes: trainingDefaults.durationMinutes ?? undefined,
            intensity: trainingDefaults.intensity as Intensity | undefined,
            muscleGroups: (trainingDefaults.muscleGroups as MuscleGroup[]) || [],
            location: trainingDefaults.location as TrainingLocation | undefined,
            defaultExercises: trainingDefaults.defaultExercises
              ? JSON.parse(JSON.stringify(trainingDefaults.defaultExercises))
              : undefined,
          },
        })
        trainingTemplateResult = {
          workoutType: created.workoutType,
          durationMinutes: created.durationMinutes,
          intensity: created.intensity,
          muscleGroups: created.muscleGroups,
          location: created.location,
          defaultExercises: created.defaultExercises,
        }
      }
    } else if (existingTrainingTemplate) {
      trainingTemplateResult = {
        workoutType: existingTrainingTemplate.workoutType,
        durationMinutes: existingTrainingTemplate.durationMinutes,
        intensity: existingTrainingTemplate.intensity,
        muscleGroups: existingTrainingTemplate.muscleGroups,
        location: existingTrainingTemplate.location,
        defaultExercises: existingTrainingTemplate.defaultExercises,
      }
    }

    // Get completion count
    const completionCount = await prisma.activityCompletion.count({
      where: { activityId: id },
    })

    return successResponse({
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      points: updatedTemplate.points,
      description: updatedTemplate.description,
      cueType: updatedTemplate.cueType,
      cueValue: updatedTemplate.cueValue,
      createdAt: updatedTemplate.createdAt,
      usageCount: completionCount,
      trainingDefaults: trainingTemplateResult,
    })
  } catch (error) {
    console.error('Training template update error:', error)
    return internalError('Failed to update training template')
  }
}

/**
 * DELETE /api/v1/training/templates/[id]
 * Delete a training template (archives it)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id } = await context.params

    // Find the template
    const template = await prisma.activity.findFirst({
      where: {
        id,
        userId: user.id,
        subCategory: 'TRAINING',
        isHabit: true,
        archived: false,
      },
    })

    if (!template) {
      return notFoundError('Training template not found')
    }

    // Archive the template (soft delete)
    await prisma.activity.update({
      where: { id },
      data: { archived: true },
    })

    return successResponse({
      message: 'Training template deleted successfully',
      deletedTemplateId: id,
    })
  } catch (error) {
    console.error('Training template delete error:', error)
    return internalError('Failed to delete training template')
  }
}
