/**
 * External Meditation API
 *
 * GET /api/v1/meditation/external - Get unlogged meditation sessions from integrations (Whoop)
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, internalError } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { whoopFetch, refreshAccessToken, isTokenExpired, calculateExpiresAt } from '@/lib/whoop'

interface WhoopWorkout {
  id: number
  start: string
  end: string
  sport_id: number
  score: {
    strain: number
    average_heart_rate: number
    max_heart_rate: number
    kilojoule: number
  }
}

interface WhoopPaginatedResponse<T> {
  records: T[]
  next_token?: string
}

// Whoop sport IDs that are meditation/breathwork related
const MEDITATION_SPORT_IDS = new Set([
  42, // Breathwork
  63, // Yoga (can be meditative)
])

function getMeditationName(sportId: number): string {
  switch (sportId) {
    case 42:
      return 'Breathwork'
    case 63:
      return 'Yoga'
    default:
      return 'Meditation'
  }
}

/**
 * GET /api/v1/meditation/external
 * Returns unlogged meditation/breathwork sessions from connected integrations (currently Whoop)
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const externalMeditations: Array<{
      id: string
      source: string
      externalId: string
      name: string
      durationMinutes: number
      startTime: string
    }> = []

    // Get Whoop connection
    const whoopConnection = await prisma.whoopConnection.findUnique({
      where: { userId: user.id },
    })

    if (whoopConnection) {
      let accessToken = whoopConnection.accessToken

      // Refresh token if expired
      if (isTokenExpired(whoopConnection.expiresAt)) {
        try {
          const refreshed = await refreshAccessToken(whoopConnection.refreshToken)
          await prisma.whoopConnection.update({
            where: { id: whoopConnection.id },
            data: {
              accessToken: refreshed.access_token,
              refreshToken: refreshed.refresh_token,
              expiresAt: calculateExpiresAt(refreshed.expires_in),
            },
          })
          accessToken = refreshed.access_token
        } catch (error) {
          console.error('Failed to refresh Whoop token:', error)
          return successResponse(externalMeditations)
        }
      }

      // Get today's date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startParam = today.toISOString()

      try {
        // Fetch today's workouts from Whoop
        const workoutResponse = await whoopFetch<WhoopPaginatedResponse<WhoopWorkout>>(
          `/developer/v2/activity/workout?start=${startParam}`,
          accessToken
        )

        // Get existing logged Whoop meditations for today
        const existingCompletions = await prisma.meditationDetails.findMany({
          where: {
            source: 'WHOOP',
            createdAt: {
              gte: today,
            },
          },
          select: {
            externalId: true,
          },
        })

        const loggedExternalIds = new Set(
          existingCompletions.map((c) => c.externalId).filter(Boolean)
        )

        // Filter to unlogged meditation activities
        for (const workout of workoutResponse.records) {
          // Only include meditation-related activities
          if (!MEDITATION_SPORT_IDS.has(workout.sport_id)) {
            continue
          }

          if (loggedExternalIds.has(String(workout.id))) {
            continue // Already logged
          }

          const name = getMeditationName(workout.sport_id)
          const startTime = new Date(workout.start)
          const endTime = new Date(workout.end)
          const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

          externalMeditations.push({
            id: `whoop_${workout.id}`,
            source: 'WHOOP',
            externalId: String(workout.id),
            name,
            durationMinutes,
            startTime: workout.start,
          })
        }
      } catch (error) {
        console.error('Failed to fetch Whoop meditation activities:', error)
      }
    }

    // Sort by start time descending (most recent first)
    externalMeditations.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )

    return successResponse(externalMeditations)
  } catch (error) {
    console.error('External meditation fetch error:', error)
    return internalError('Failed to fetch external meditation sessions')
  }
})
