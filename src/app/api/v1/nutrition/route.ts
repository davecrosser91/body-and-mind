/**
 * Nutrition API
 *
 * GET /api/v1/nutrition - Get nutrition log for a date
 * POST /api/v1/nutrition - Save/update nutrition log
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  badRequestError,
  internalError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { MealQuality } from '@prisma/client'
import { evaluateAutoTriggers } from '@/lib/auto-trigger'

/**
 * GET /api/v1/nutrition
 * Get nutrition log for a specific date
 *
 * Query params:
 * - date: Date in YYYY-MM-DD format (defaults to today)
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    // Parse date
    let targetDate: Date
    if (dateParam) {
      targetDate = new Date(dateParam)
      if (isNaN(targetDate.getTime())) {
        return badRequestError('Invalid date format. Use YYYY-MM-DD')
      }
    } else {
      targetDate = new Date()
    }

    // Set to start of day
    targetDate.setHours(0, 0, 0, 0)

    // Find nutrition log for this date
    const nutritionLog = await prisma.nutritionLog.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: targetDate,
        },
      },
    })

    if (!nutritionLog) {
      return successResponse({
        date: targetDate.toISOString().split('T')[0],
        proteinGrams: 0,
        mealQuality: {
          breakfast: null,
          lunch: null,
          dinner: null,
        },
        hasData: false,
      })
    }

    return successResponse({
      id: nutritionLog.id,
      date: nutritionLog.date.toISOString().split('T')[0],
      proteinGrams: nutritionLog.proteinGrams,
      mealQuality: {
        breakfast: nutritionLog.breakfastQuality?.toLowerCase() ?? null,
        lunch: nutritionLog.lunchQuality?.toLowerCase() ?? null,
        dinner: nutritionLog.dinnerQuality?.toLowerCase() ?? null,
      },
      hasData: true,
    })
  } catch (error) {
    console.error('Nutrition fetch error:', error)
    return internalError('Failed to fetch nutrition data')
  }
})

/**
 * POST /api/v1/nutrition
 * Save or update nutrition log for a date
 *
 * Request body:
 * - date?: string (YYYY-MM-DD, defaults to today)
 * - proteinGrams: number
 * - mealQuality: { breakfast, lunch, dinner } - each 'healthy' | 'okay' | 'bad' | null
 */
export const POST = requireAuth(async (request: NextRequest, { user }) => {
  try {
    let body: {
      date?: string
      proteinGrams?: number
      mealQuality?: {
        breakfast?: string | null
        lunch?: string | null
        dinner?: string | null
      }
    }

    try {
      body = await request.json()
    } catch {
      return badRequestError('Invalid JSON in request body')
    }

    // Parse date
    let targetDate: Date
    if (body.date) {
      targetDate = new Date(body.date)
      if (isNaN(targetDate.getTime())) {
        return badRequestError('Invalid date format. Use YYYY-MM-DD')
      }
    } else {
      targetDate = new Date()
    }
    targetDate.setHours(0, 0, 0, 0)

    // Validate protein grams
    const proteinGrams = body.proteinGrams ?? 0
    if (proteinGrams < 0 || proteinGrams > 500) {
      return badRequestError('proteinGrams must be between 0 and 500')
    }

    // Parse meal quality values
    const parseMealQuality = (val: string | null | undefined): MealQuality | null => {
      if (!val) return null
      const upper = val.toUpperCase()
      if (upper === 'HEALTHY' || upper === 'OKAY' || upper === 'BAD') {
        return upper as MealQuality
      }
      return null
    }

    const breakfastQuality = parseMealQuality(body.mealQuality?.breakfast)
    const lunchQuality = parseMealQuality(body.mealQuality?.lunch)
    const dinnerQuality = parseMealQuality(body.mealQuality?.dinner)

    // Upsert the nutrition log
    const nutritionLog = await prisma.nutritionLog.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: targetDate,
        },
      },
      create: {
        userId: user.id,
        date: targetDate,
        proteinGrams,
        breakfastQuality,
        lunchQuality,
        dinnerQuality,
      },
      update: {
        proteinGrams,
        breakfastQuality,
        lunchQuality,
        dinnerQuality,
      },
    })

    // Count healthy meals for auto-trigger evaluation
    const healthyMealsCount = [breakfastQuality, lunchQuality, dinnerQuality]
      .filter((q) => q === 'HEALTHY')
      .length

    // Evaluate nutrition auto-triggers
    evaluateAutoTriggers(user.id, {
      nutritionProteinGrams: proteinGrams,
      nutritionHealthyMealsCount: healthyMealsCount,
    }).catch((error) => {
      console.error('[AutoTrigger] Evaluation error after nutrition log:', error)
    })

    return successResponse({
      id: nutritionLog.id,
      date: nutritionLog.date.toISOString().split('T')[0],
      proteinGrams: nutritionLog.proteinGrams,
      mealQuality: {
        breakfast: nutritionLog.breakfastQuality?.toLowerCase() ?? null,
        lunch: nutritionLog.lunchQuality?.toLowerCase() ?? null,
        dinner: nutritionLog.dinnerQuality?.toLowerCase() ?? null,
      },
      hasData: true,
    })
  } catch (error) {
    console.error('Nutrition save error:', error)
    return internalError('Failed to save nutrition data')
  }
})
