import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  notFoundError,
  badRequestError,
  internalError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { calculateHealthDecay } from '@/lib/habitanimal-health'
import { calculateLevel } from '@/lib/xp'

interface RouteContext {
  params: Promise<{ id: string }>
}

interface DailyHistoryEntry {
  date: string
  health: number
  xpEarned: number
  completionsCount: number
  levelMilestone: number | null
}

/**
 * GET /api/v1/habitanimals/[id]/history
 * Returns detailed history for a habitanimal
 *
 * Query parameters:
 * - days: number (default: 30) - Number of days of history to return
 *
 * Returns:
 * - Daily health values
 * - Daily XP earned
 * - Completions count per day
 * - Level milestones reached
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id: habitanimalId } = await context.params

    if (!habitanimalId) {
      return badRequestError('Habitanimal ID is required')
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days')

    // Parse and validate days parameter
    let days = 30
    if (daysParam !== null) {
      const parsedDays = parseInt(daysParam, 10)
      if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
        return badRequestError('Days must be an integer between 1 and 365')
      }
      days = parsedDays
    }

    // Fetch habitanimal
    const habitanimal = await prisma.habitanimal.findFirst({
      where: {
        id: habitanimalId,
        userId: user.id,
      },
    })

    if (!habitanimal) {
      return notFoundError('Habitanimal not found')
    }

    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Get related activities for this habitanimal type (map type to pillar)
    const typeToConfig: Record<string, { pillar: 'BODY' | 'MIND'; subCategories: string[] }> = {
      FITNESS: { pillar: 'BODY', subCategories: ['TRAINING', 'FITNESS'] },
      SLEEP: { pillar: 'BODY', subCategories: ['SLEEP'] },
      NUTRITION: { pillar: 'BODY', subCategories: ['NUTRITION'] },
      MINDFULNESS: { pillar: 'MIND', subCategories: ['MEDITATION', 'MINDFULNESS'] },
      LEARNING: { pillar: 'MIND', subCategories: ['LEARNING', 'READING', 'JOURNALING'] },
    }

    const config = typeToConfig[habitanimal.type] || { pillar: 'BODY', subCategories: [] }

    const relatedActivities = await prisma.activity.findMany({
      where: {
        userId: user.id,
        pillar: config.pillar,
        subCategory: { in: config.subCategories },
      },
      select: {
        id: true,
      },
    })

    const activityIds = relatedActivities.map((a: { id: string }) => a.id)

    // Fetch completions for the time period
    const completions = await prisma.activityCompletion.findMany({
      where: {
        activityId: { in: activityIds },
        completedAt: {
          gte: startDate,
        },
      },
      orderBy: { completedAt: 'asc' },
    })

    // Group completions by date
    const completionsByDate = new Map<
      string,
      { count: number; xpEarned: number }
    >()
    completions.forEach((c: { completedAt: Date; pointsEarned: number }) => {
      const dateStr = c.completedAt.toISOString().split('T')[0] as string
      const existing = completionsByDate.get(dateStr) || {
        count: 0,
        xpEarned: 0,
      }
      completionsByDate.set(dateStr, {
        count: existing.count + 1,
        xpEarned: existing.xpEarned + c.pointsEarned,
      })
    })

    // Calculate cumulative XP to track level milestones
    // We need to work backwards to understand level progression
    const sortedDates = Array.from(completionsByDate.entries()).sort(
      ([a], [b]) => a.localeCompare(b)
    )

    // Calculate XP at start of period (approximation)
    let cumulativeXpBeforePeriod = habitanimal.xp
    for (const [, data] of sortedDates) {
      cumulativeXpBeforePeriod -= data.xpEarned
    }
    cumulativeXpBeforePeriod = Math.max(0, cumulativeXpBeforePeriod)

    // Build daily history
    const history: DailyHistoryEntry[] = []
    let runningXp = cumulativeXpBeforePeriod
    let previousLevel = calculateLevel(runningXp)

    // Track health estimation working backwards from current state
    const healthByDate = calculateDetailedHealthHistory(
      habitanimal.health,
      habitanimal.lastInteraction,
      completionsByDate,
      days,
      now
    )

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0] as string
      const dayData = completionsByDate.get(dateStr) || {
        count: 0,
        xpEarned: 0,
      }

      // Update running XP
      runningXp += dayData.xpEarned
      const currentLevel = calculateLevel(runningXp)

      // Check for level milestone
      let levelMilestone: number | null = null
      if (currentLevel > previousLevel) {
        levelMilestone = currentLevel
      }
      previousLevel = currentLevel

      history.push({
        date: dateStr,
        health: healthByDate.get(dateStr) ?? habitanimal.health,
        xpEarned: dayData.xpEarned,
        completionsCount: dayData.count,
        levelMilestone,
      })
    }

    // Calculate summary statistics
    const totalXpEarned = history.reduce((sum, day) => sum + day.xpEarned, 0)
    const totalCompletions = history.reduce(
      (sum, day) => sum + day.completionsCount,
      0
    )
    const levelMilestones = history
      .filter((day) => day.levelMilestone !== null)
      .map((day) => ({
        date: day.date,
        level: day.levelMilestone as number,
      }))
    const averageHealth =
      history.length > 0
        ? Math.round(
            history.reduce((sum, day) => sum + day.health, 0) / history.length
          )
        : habitanimal.health
    const lowestHealth = Math.min(...history.map((day) => day.health))
    const highestHealth = Math.max(...history.map((day) => day.health))

    return successResponse({
      habitanimalId: habitanimal.id,
      habitanimalName: habitanimal.name,
      habitanimalType: habitanimal.type,
      period: {
        days,
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      },
      history,
      summary: {
        totalXpEarned,
        totalCompletions,
        averageCompletionsPerDay:
          days > 0 ? Math.round((totalCompletions / days) * 100) / 100 : 0,
        averageHealth,
        lowestHealth,
        highestHealth,
        levelMilestones,
        currentLevel: calculateLevel(habitanimal.xp),
      },
    })
  } catch (error) {
    console.error('Habitanimal history fetch error:', error)
    return internalError('Failed to fetch habitanimal history')
  }
}

/**
 * Calculate detailed health history for the period
 * Uses completion data to estimate daily health values
 */
function calculateDetailedHealthHistory(
  currentHealth: number,
  lastInteraction: Date,
  completionsByDate: Map<string, { count: number; xpEarned: number }>,
  days: number,
  now: Date
): Map<string, number> {
  const healthByDate = new Map<string, number>()

  // For today, use current calculated health
  const todayStr = now.toISOString().split('T')[0] as string
  healthByDate.set(
    todayStr,
    calculateHealthDecay(currentHealth, lastInteraction, now)
  )

  // Work backwards from today to estimate health
  // This is an approximation based on the completion pattern
  let estimatedHealth = currentHealth
  const HEALTH_RECOVERY = 15
  const HEALTH_DECAY_SINGLE = 10
  const HEALTH_DECAY_CONSECUTIVE = 30

  let consecutiveMisses = 0

  for (let i = 1; i < days; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0] as string
    const hadCompletion = completionsByDate.has(dateStr)

    if (hadCompletion) {
      // If there was a completion, health was recovering
      // Reverse the recovery to estimate previous state
      const completionData = completionsByDate.get(dateStr)!
      estimatedHealth = Math.max(
        0,
        estimatedHealth - HEALTH_RECOVERY * completionData.count
      )
      consecutiveMisses = 0
    } else {
      // No completion - health was higher before decay
      consecutiveMisses++
      if (consecutiveMisses === 1) {
        // First miss - small decay, so health was higher by that amount
        estimatedHealth = Math.min(100, estimatedHealth + HEALTH_DECAY_SINGLE)
      } else {
        // Consecutive misses - larger decay
        estimatedHealth = Math.min(
          100,
          estimatedHealth + HEALTH_DECAY_CONSECUTIVE
        )
      }
    }

    healthByDate.set(dateStr, Math.max(0, Math.min(100, estimatedHealth)))
  }

  return healthByDate
}
