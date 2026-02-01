import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, internalError } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getMood, calculateHealthDecay } from '@/lib/habitanimal-health'
import {
  calculateLevel,
  xpForNextLevel,
  totalXPForLevel,
  getEvolutionStageName,
} from '@/lib/xp'

/**
 * GET /api/v1/dashboard
 * Returns complete dashboard state for the authenticated user
 */
export const GET = requireAuth(async (_request: NextRequest, { user }) => {
  try {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    // Fetch all data in parallel
    const [habitanimals, activities, todayCompletions] = await Promise.all([
      // Get all habitanimals for the user
      prisma.habitanimal.findMany({
        where: { userId: user.id },
        orderBy: { type: 'asc' },
      }),
      // Get all non-archived activities (habits)
      prisma.activity.findMany({
        where: {
          userId: user.id,
          archived: false,
          isHabit: true,
        },
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
        orderBy: { createdAt: 'asc' },
      }),
      // Get count of today's completions for stats
      prisma.activityCompletion.count({
        where: {
          activity: {
            userId: user.id,
            archived: false,
          },
          completedAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
    ])

    // Calculate habitanimal derived fields
    const habitanimalsWithDerivedFields = habitanimals.map((habitanimal: { health: number; lastInteraction: Date; xp: number; id: string; type: string; species: string; name: string; evolutionStage: number }) => {
      const currentHealth = calculateHealthDecay(
        habitanimal.health,
        habitanimal.lastInteraction,
        now
      )
      const level = calculateLevel(habitanimal.xp)
      const xpToNextLevel = xpForNextLevel(level)
      const xpInCurrentLevel = habitanimal.xp - totalXPForLevel(level)

      return {
        id: habitanimal.id,
        type: habitanimal.type,
        species: habitanimal.species,
        name: habitanimal.name,
        level,
        xp: habitanimal.xp,
        xpInCurrentLevel,
        xpToNextLevel,
        health: currentHealth,
        evolutionStage: habitanimal.evolutionStage,
        evolutionStageName: getEvolutionStageName(habitanimal.evolutionStage),
        mood: getMood(currentHealth),
        lastInteraction: habitanimal.lastInteraction,
      }
    })

    // Format activities with completion status
    const activitiesWithStatus = activities.map((activity: { id: string; name: string; pillar: string; subCategory: string; frequency: string; description: string | null; points: number; isHabit: boolean; completions: Array<{ id: string; completedAt: Date; details: string | null; pointsEarned: number; source: string }> }) => {
      const todayCompletion = activity.completions[0] || null
      return {
        id: activity.id,
        name: activity.name,
        pillar: activity.pillar,
        subCategory: activity.subCategory,
        frequency: activity.frequency,
        description: activity.description,
        points: activity.points,
        isHabit: activity.isHabit,
        completedToday: todayCompletion !== null,
        todayCompletion: todayCompletion
          ? {
              id: todayCompletion.id,
              completedAt: todayCompletion.completedAt,
              details: todayCompletion.details,
              pointsEarned: todayCompletion.pointsEarned,
              source: todayCompletion.source,
            }
          : null,
      }
    })

    // Calculate streak info (consecutive days with at least one completion)
    const streakInfo = await calculateStreak(user.id)

    // Build dashboard response
    const dashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      habitanimals: habitanimalsWithDerivedFields,
      activities: activitiesWithStatus,
      stats: {
        activitiesCompletedToday: todayCompletions,
        totalActivitiesToday: activities.length,
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
      },
    }

    return successResponse(dashboardData)
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return internalError('Failed to fetch dashboard data')
  }
})

/**
 * Calculate user's streak information
 */
async function calculateStreak(
  userId: string
): Promise<{ currentStreak: number; longestStreak: number }> {
  // Get completions grouped by date for the last 365 days
  const completions = await prisma.activityCompletion.findMany({
    where: {
      activity: {
        userId,
        archived: false,
      },
      completedAt: {
        gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      completedAt: true,
    },
    orderBy: {
      completedAt: 'desc',
    },
  })

  if (completions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  // Get unique dates with completions
  const uniqueDates = new Set<string>()
  completions.forEach((c: { completedAt: Date }) => {
    const dateStr = c.completedAt.toISOString().split('T')[0] as string
    uniqueDates.add(dateStr)
  })

  const sortedDates = Array.from(uniqueDates).sort().reverse()

  // Calculate current streak
  let currentStreak = 0
  const today = new Date().toISOString().split('T')[0] as string
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0] as string

  // Check if streak includes today or yesterday
  const firstDate = sortedDates[0]
  if (firstDate && (firstDate === today || firstDate === yesterday)) {
    currentStreak = 1
    const checkDate = new Date(firstDate)

    for (let i = 1; i < sortedDates.length; i++) {
      checkDate.setDate(checkDate.getDate() - 1)
      const expectedDate = checkDate.toISOString().split('T')[0] as string

      if (sortedDates[i] === expectedDate) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 1

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const currentDateStr = sortedDates[i]
    const nextDateStr = sortedDates[i + 1]
    if (!currentDateStr || !nextDateStr) continue

    const currentDate = new Date(currentDateStr)
    const nextDate = new Date(nextDateStr)
    const diffDays = Math.floor(
      (currentDate.getTime() - nextDate.getTime()) / (24 * 60 * 60 * 1000)
    )

    if (diffDays === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  return { currentStreak, longestStreak }
}
