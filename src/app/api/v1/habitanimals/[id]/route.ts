import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  notFoundError,
  internalError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getMood, calculateHealthDecay } from '@/lib/habitanimal-health'
import {
  calculateLevel,
  xpForNextLevel,
  totalXPForLevel,
  getEvolutionStageName,
  calculateEvolutionStage,
} from '@/lib/xp'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/habitanimals/[id]
 * Returns a single habitanimal with full details
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id: habitanimalId } = await context.params

    if (!habitanimalId) {
      return notFoundError('Habitanimal ID is required')
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

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
        archived: false,
      },
      include: {
        completions: {
          where: {
            completedAt: {
              gte: sevenDaysAgo,
            },
          },
          orderBy: { completedAt: 'desc' },
        },
      },
    })

    // Calculate health history for last 7 days
    const healthHistory = calculateHealthHistory(
      habitanimal.health,
      habitanimal.lastInteraction,
      relatedActivities.flatMap((a: { completions: Array<{ completedAt: Date; pointsEarned: number }> }) => a.completions.map((c) => ({ completedAt: c.completedAt, xpEarned: c.pointsEarned }))),
      7
    )

    // Calculate derived fields
    const currentHealth = calculateHealthDecay(
      habitanimal.health,
      habitanimal.lastInteraction,
      now
    )
    const level = calculateLevel(habitanimal.xp)
    const xpToNextLevel = xpForNextLevel(level)
    const xpInCurrentLevel = habitanimal.xp - totalXPForLevel(level)
    const totalXpForCurrentLevel = totalXPForLevel(level)
    const totalXpForNextLevel = totalXPForLevel(level + 1)

    // Calculate next evolution milestone
    const currentEvolutionStage = calculateEvolutionStage(level)
    const nextEvolutionLevel = getNextEvolutionLevel(currentEvolutionStage)

    const response = {
      id: habitanimal.id,
      type: habitanimal.type,
      species: habitanimal.species,
      name: habitanimal.name,
      level,
      xp: habitanimal.xp,
      xpProgress: {
        current: xpInCurrentLevel,
        required: xpToNextLevel,
        totalForCurrentLevel: totalXpForCurrentLevel,
        totalForNextLevel: totalXpForNextLevel,
        percentage: Math.floor((xpInCurrentLevel / xpToNextLevel) * 100),
      },
      health: currentHealth,
      evolutionStage: habitanimal.evolutionStage,
      evolutionStageName: getEvolutionStageName(habitanimal.evolutionStage),
      nextEvolution: nextEvolutionLevel
        ? {
            stage: currentEvolutionStage + 1,
            stageName: getEvolutionStageName(currentEvolutionStage + 1),
            levelRequired: nextEvolutionLevel,
            levelsRemaining: nextEvolutionLevel - level,
          }
        : null,
      mood: getMood(currentHealth),
      lastInteraction: habitanimal.lastInteraction,
      createdAt: habitanimal.createdAt,
      updatedAt: habitanimal.updatedAt,
      healthHistory,
      relatedActivities: relatedActivities.map((activity: { id: string; name: string; subCategory: string; completions: Array<unknown> }) => ({
        id: activity.id,
        name: activity.name,
        subCategory: activity.subCategory,
        recentCompletions: activity.completions.length,
      })),
    }

    return successResponse(response)
  } catch (error) {
    console.error('Habitanimal fetch error:', error)
    return internalError('Failed to fetch habitanimal')
  }
}

/**
 * Get the level required for next evolution stage
 */
function getNextEvolutionLevel(currentStage: number): number | null {
  const evolutionLevels: Record<number, number> = {
    1: 10, // Baby -> Teen
    2: 25, // Teen -> Adult
    3: 50, // Adult -> Legendary
  }
  return evolutionLevels[currentStage] || null
}

/**
 * Calculate health history for the last N days
 * This is an approximation based on completion data
 */
function calculateHealthHistory(
  currentHealth: number,
  lastInteraction: Date,
  completions: { completedAt: Date; xpEarned: number }[],
  days: number
): { date: string; health: number }[] {
  const history: { date: string; health: number }[] = []
  const now = new Date()

  // Group completions by date
  const completionsByDate = new Map<string, number>()
  completions.forEach((c) => {
    const dateStr = c.completedAt.toISOString().split('T')[0] as string
    completionsByDate.set(dateStr, (completionsByDate.get(dateStr) || 0) + 1)
  })

  // Calculate health for each day (simplified model)
  let estimatedHealth = currentHealth

  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0] as string

    // For today, use current calculated health
    if (i === 0) {
      history.unshift({
        date: dateStr,
        health: calculateHealthDecay(currentHealth, lastInteraction, now),
      })
    } else {
      // For past days, estimate based on completions
      const hadCompletion = completionsByDate.has(dateStr)
      if (hadCompletion) {
        estimatedHealth = Math.min(100, estimatedHealth)
      } else {
        estimatedHealth = Math.max(0, estimatedHealth - 10)
      }
      history.unshift({
        date: dateStr,
        health: estimatedHealth,
      })
    }
  }

  return history
}
