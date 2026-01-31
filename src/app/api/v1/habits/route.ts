import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  createdResponse,
  internalError,
  badRequestError,
  validationError,
  notFoundError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { Category, Frequency } from '@prisma/client'
import { createHabitSchema } from '@/lib/validations/habit'

/**
 * GET /api/v1/habits
 * Returns all non-archived habits for the authenticated user
 *
 * Query params:
 * - category: Filter by category (FITNESS, MINDFULNESS, NUTRITION, SLEEP, LEARNING)
 * - completed: Filter by today's completion status (true/false)
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url)
    const categoryParam = searchParams.get('category')
    const completedParam = searchParams.get('completed')

    // Validate category if provided
    if (categoryParam && !isValidCategory(categoryParam)) {
      return badRequestError(
        `Invalid category. Must be one of: ${Object.values(Category).join(', ')}`
      )
    }

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    // Build the where clause
    const whereClause: {
      userId: string
      archived: boolean
      category?: Category
    } = {
      userId: user.id,
      archived: false,
    }

    if (categoryParam) {
      whereClause.category = categoryParam as Category
    }

    // Fetch habits with today's completions
    const habits = await prisma.habit.findMany({
      where: whereClause,
      include: {
        completions: {
          where: {
            completedAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
    })

    // Map habits to response format
    let habitsWithStatus = habits.map((habit) => {
      const todayCompletion = habit.completions[0] || null
      return {
        id: habit.id,
        name: habit.name,
        category: habit.category,
        frequency: habit.frequency,
        description: habit.description,
        habitanimalType: habit.category, // Category maps directly to HabitanimalType
        completedToday: todayCompletion !== null,
        todayCompletion: todayCompletion
          ? {
              id: todayCompletion.id,
              completedAt: todayCompletion.completedAt,
              details: todayCompletion.details,
              xpEarned: todayCompletion.xpEarned,
              source: todayCompletion.source,
            }
          : null,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
      }
    })

    // Filter by completion status if requested
    if (completedParam !== null) {
      const filterCompleted = completedParam === 'true'
      habitsWithStatus = habitsWithStatus.filter(
        (habit) => habit.completedToday === filterCompleted
      )
    }

    // Get habitanimal names for each category
    const habitanimals = await prisma.habitanimal.findMany({
      where: { userId: user.id },
      select: {
        type: true,
        name: true,
        species: true,
      },
    })

    const habitanimalByType = new Map(
      habitanimals.map((h) => [h.type, { name: h.name, species: h.species }])
    )

    // Add habitanimal info to each habit
    const habitsWithHabitanimalInfo = habitsWithStatus.map((habit) => {
      const habitanimalInfo = habitanimalByType.get(habit.habitanimalType)
      return {
        ...habit,
        habitanimal: habitanimalInfo || null,
      }
    })

    return successResponse(habitsWithHabitanimalInfo)
  } catch (error) {
    console.error('Habits fetch error:', error)
    return internalError('Failed to fetch habits')
  }
})

/**
 * Check if a string is a valid Category enum value
 */
function isValidCategory(value: string): value is Category {
  return Object.values(Category).includes(value as Category)
}

/**
 * Map lowercase frequency string to Prisma Frequency enum
 */
function mapFrequency(frequency: string): Frequency {
  const frequencyMap: Record<string, Frequency> = {
    daily: Frequency.DAILY,
    weekly: Frequency.WEEKLY,
    monthly: Frequency.CUSTOM, // 'monthly' maps to CUSTOM in our schema
  }
  return frequencyMap[frequency] || Frequency.DAILY
}

/**
 * POST /api/v1/habits
 * Create a new habit for the authenticated user
 */
export const POST = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json()

    // Validate request body
    const parseResult = createHabitSchema.safeParse(body)
    if (!parseResult.success) {
      const errors = parseResult.error.flatten()
      return validationError('Invalid request body', errors.fieldErrors as Record<string, string[]>)
    }

    const { name, description, frequency, habitanimalId } = parseResult.data

    // Look up the habitanimal to get its type (category)
    const habitanimal = await prisma.habitanimal.findFirst({
      where: {
        id: habitanimalId,
        userId: user.id,
      },
      select: {
        id: true,
        type: true,
      },
    })

    if (!habitanimal) {
      return notFoundError('Habitanimal not found')
    }

    // Map habitanimal type to category (they use the same values)
    const category = habitanimal.type as unknown as Category

    // Create the habit
    const habit = await prisma.habit.create({
      data: {
        name,
        description: description || null,
        frequency: mapFrequency(frequency),
        category,
        userId: user.id,
      },
    })

    // Return created habit with habitanimal info
    return createdResponse({
      id: habit.id,
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency,
      category: habit.category,
      habitanimalId: habitanimal.id,
      archived: habit.archived,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
    })
  } catch (error) {
    console.error('Habit creation error:', error)
    return internalError('Failed to create habit')
  }
})
