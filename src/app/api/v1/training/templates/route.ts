/**
 * Training Templates API
 *
 * GET /api/v1/training/templates - List training templates for the user
 * POST /api/v1/training/templates - Create a new training template
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
import { WorkoutType, Intensity, MuscleGroup, TrainingLocation } from '@prisma/client'

/**
 * GET /api/v1/training/templates
 * Returns all training templates (activities with isHabit=true, subCategory=TRAINING)
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    // Get training activities that are habits (templates)
    const templates = await prisma.activity.findMany({
      where: {
        userId: user.id,
        subCategory: 'TRAINING',
        isHabit: true,
        archived: false,
      },
      include: {
        trainingTemplate: true,
        completions: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map to response format
    const templatesResponse = templates.map((template) => ({
      id: template.id,
      name: template.name,
      points: template.points,
      description: template.description,
      cueType: template.cueType,
      cueValue: template.cueValue,
      createdAt: template.createdAt,
      usageCount: template.completions.length,
      trainingDefaults: template.trainingTemplate
        ? {
            workoutType: template.trainingTemplate.workoutType,
            durationMinutes: template.trainingTemplate.durationMinutes,
            intensity: template.trainingTemplate.intensity,
            muscleGroups: template.trainingTemplate.muscleGroups,
            location: template.trainingTemplate.location,
            defaultExercises: template.trainingTemplate.defaultExercises,
          }
        : null,
    }))

    return successResponse(templatesResponse)
  } catch (error) {
    console.error('Training templates fetch error:', error)
    return internalError('Failed to fetch training templates')
  }
})

/**
 * POST /api/v1/training/templates
 * Create a new training template
 *
 * Request body:
 * - name: string (required)
 * - points: number (optional, defaults to 25)
 * - description: string (optional)
 * - cueType: 'TIME' | 'LOCATION' | 'AFTER_ACTIVITY' (optional)
 * - cueValue: string (optional)
 * - trainingDefaults: { workoutType, durationMinutes, intensity, muscleGroups, location, defaultExercises } (optional)
 */
export const POST = requireAuth(async (request: NextRequest, { user }) => {
  try {
    let body: {
      name?: string
      points?: number
      description?: string
      cueType?: string
      cueValue?: string
      trainingDefaults?: {
        workoutType?: string
        durationMinutes?: number
        intensity?: string
        muscleGroups?: string[]
        location?: string
        defaultExercises?: Array<{
          name: string
          sets?: number
          reps?: string
          weight?: number
        }>
      }
    }

    try {
      body = await request.json()
    } catch {
      return badRequestError('Invalid JSON in request body')
    }

    const { name, points = 25, description, cueType, cueValue, trainingDefaults } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return badRequestError('name is required')
    }

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

    // Create the activity first
    const template = await prisma.activity.create({
      data: {
        name: name.trim(),
        pillar: 'BODY',
        subCategory: 'TRAINING',
        points,
        isHabit: true,
        description: description || null,
        cueType: cueType as 'TIME' | 'LOCATION' | 'AFTER_ACTIVITY' | null,
        cueValue: cueValue || null,
        userId: user.id,
      },
    })

    // Create training template defaults if provided
    let trainingTemplateResult = null
    if (trainingDefaults) {
      const createdTemplate = await prisma.trainingTemplate.create({
        data: {
          activityId: template.id,
          workoutType: trainingDefaults.workoutType as WorkoutType | undefined,
          durationMinutes: trainingDefaults.durationMinutes,
          intensity: trainingDefaults.intensity as Intensity | undefined,
          muscleGroups: (trainingDefaults.muscleGroups as MuscleGroup[]) || [],
          location: trainingDefaults.location as TrainingLocation | undefined,
          defaultExercises: trainingDefaults.defaultExercises
            ? JSON.parse(JSON.stringify(trainingDefaults.defaultExercises))
            : undefined,
        },
      })

      trainingTemplateResult = {
        workoutType: createdTemplate.workoutType,
        durationMinutes: createdTemplate.durationMinutes,
        intensity: createdTemplate.intensity,
        muscleGroups: createdTemplate.muscleGroups,
        location: createdTemplate.location,
        defaultExercises: createdTemplate.defaultExercises,
      }
    }

    return createdResponse({
      id: template.id,
      name: template.name,
      points: template.points,
      description: template.description,
      cueType: template.cueType,
      cueValue: template.cueValue,
      createdAt: template.createdAt,
      usageCount: 0,
      trainingDefaults: trainingTemplateResult,
    })
  } catch (error) {
    console.error('Training template creation error:', error)
    return internalError('Failed to create training template')
  }
})
