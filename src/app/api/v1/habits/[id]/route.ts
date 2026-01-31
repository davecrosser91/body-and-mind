import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  noContentResponse,
  notFoundError,
  validationError,
  internalError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { Frequency } from '@prisma/client'
import { updateHabitSchema, habitIdParamSchema } from '@/lib/validations/habit'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Map lowercase frequency string to Prisma Frequency enum
 */
function mapFrequency(frequency: string): Frequency {
  const frequencyMap: Record<string, Frequency> = {
    daily: Frequency.DAILY,
    weekly: Frequency.WEEKLY,
    monthly: Frequency.CUSTOM,
  }
  return frequencyMap[frequency] || Frequency.DAILY
}

/**
 * GET /api/v1/habits/[id]
 * Returns a single habit with completion statistics
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id: habitId } = await context.params

    // Validate habit ID
    const paramResult = habitIdParamSchema.safeParse({ id: habitId })
    if (!paramResult.success) {
      return notFoundError('Invalid habit ID format')
    }

    // Fetch habit with aggregated completion data
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
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
      },
    })

    if (!habit) {
      return notFoundError('Habit not found')
    }

    // Get the habitanimal for this category
    const habitanimal = await prisma.habitanimal.findFirst({
      where: {
        userId: user.id,
        type: habit.category,
      },
      select: {
        id: true,
        name: true,
        species: true,
        type: true,
      },
    })

    const lastCompletion = habit.completions[0] || null

    return successResponse({
      id: habit.id,
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency,
      category: habit.category,
      archived: habit.archived,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
      completionCount: habit._count.completions,
      lastCompletionDate: lastCompletion?.completedAt || null,
      habitanimal: habitanimal
        ? {
            id: habitanimal.id,
            name: habitanimal.name,
            species: habitanimal.species,
            type: habitanimal.type,
          }
        : null,
    })
  } catch (error) {
    console.error('Habit fetch error:', error)
    return internalError('Failed to fetch habit')
  }
}

/**
 * PATCH /api/v1/habits/[id]
 * Update an existing habit (name, description, frequency only)
 * Cannot change category as it affects habitanimal
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id: habitId } = await context.params

    // Validate habit ID
    const paramResult = habitIdParamSchema.safeParse({ id: habitId })
    if (!paramResult.success) {
      return notFoundError('Invalid habit ID format')
    }

    // Parse and validate request body
    const body = await request.json()
    const parseResult = updateHabitSchema.safeParse(body)
    if (!parseResult.success) {
      const errors = parseResult.error.flatten()
      return validationError(
        'Invalid request body',
        errors.fieldErrors as Record<string, string[]>
      )
    }

    const { name, description, frequency } = parseResult.data

    // Check if habit exists and belongs to user
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id,
        archived: false,
      },
    })

    if (!existingHabit) {
      return notFoundError('Habit not found')
    }

    // Build update data (only allowed fields)
    const updateData: {
      name?: string
      description?: string | null
      frequency?: Frequency
    } = {}

    if (name !== undefined) {
      updateData.name = name
    }
    if (description !== undefined) {
      updateData.description = description
    }
    if (frequency !== undefined) {
      updateData.frequency = mapFrequency(frequency)
    }

    // Update the habit
    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: updateData,
    })

    // Get the habitanimal for this category
    const habitanimal = await prisma.habitanimal.findFirst({
      where: {
        userId: user.id,
        type: updatedHabit.category,
      },
      select: {
        id: true,
        name: true,
        species: true,
        type: true,
      },
    })

    return successResponse({
      id: updatedHabit.id,
      name: updatedHabit.name,
      description: updatedHabit.description,
      frequency: updatedHabit.frequency,
      category: updatedHabit.category,
      archived: updatedHabit.archived,
      createdAt: updatedHabit.createdAt,
      updatedAt: updatedHabit.updatedAt,
      habitanimal: habitanimal
        ? {
            id: habitanimal.id,
            name: habitanimal.name,
            species: habitanimal.species,
            type: habitanimal.type,
          }
        : null,
    })
  } catch (error) {
    console.error('Habit update error:', error)
    return internalError('Failed to update habit')
  }
}

/**
 * DELETE /api/v1/habits/[id]
 * Soft delete a habit (set archived = true)
 * Preserves completion history
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id: habitId } = await context.params

    // Validate habit ID
    const paramResult = habitIdParamSchema.safeParse({ id: habitId })
    if (!paramResult.success) {
      return notFoundError('Invalid habit ID format')
    }

    // Check if habit exists and belongs to user
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id,
        archived: false,
      },
    })

    if (!existingHabit) {
      return notFoundError('Habit not found')
    }

    // Soft delete by setting archived = true
    await prisma.habit.update({
      where: { id: habitId },
      data: { archived: true },
    })

    return noContentResponse()
  } catch (error) {
    console.error('Habit delete error:', error)
    return internalError('Failed to delete habit')
  }
}
