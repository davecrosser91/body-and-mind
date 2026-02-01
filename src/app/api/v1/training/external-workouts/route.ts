/**
 * External Workouts API
 *
 * GET /api/v1/training/external-workouts - Get unlogged workouts from integrations (Whoop)
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
    zone_duration?: {
      zone_zero_milli?: number
      zone_one_milli?: number
      zone_two_milli?: number
      zone_three_milli?: number
      zone_four_milli?: number
      zone_five_milli?: number
    }
  }
}

interface WhoopPaginatedResponse<T> {
  records: T[]
  next_token?: string
}

// Whoop sport ID to workout type mapping
const WHOOP_SPORT_MAP: Record<number, { name: string; type: string }> = {
  0: { name: 'Activity', type: 'OTHER' },
  1: { name: 'Running', type: 'CARDIO' },
  33: { name: 'Cycling', type: 'CARDIO' },
  44: { name: 'Functional Fitness', type: 'HIIT' },
  48: { name: 'HIIT', type: 'HIIT' },
  52: { name: 'Weightlifting', type: 'STRENGTH' },
  63: { name: 'Yoga', type: 'YOGA' },
  64: { name: 'Pilates', type: 'STRETCH' },
  71: { name: 'Walking', type: 'WALK' },
  82: { name: 'Swim', type: 'CARDIO' },
  84: { name: 'CrossFit', type: 'HIIT' },
  87: { name: 'Spin', type: 'CARDIO' },
  // Add more mappings as needed
}

function getWorkoutNameAndType(sportId: number): { name: string; type: string } {
  return WHOOP_SPORT_MAP[sportId] || { name: 'Workout', type: 'OTHER' }
}

/**
 * GET /api/v1/training/external-workouts
 * Returns unlogged workouts from connected integrations (currently Whoop)
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const externalWorkouts: Array<{
      id: string
      source: string
      externalId: string
      name: string
      workoutType: string
      startTime: string
      endTime: string
      durationMinutes: number
      strain?: number
      avgHeartRate?: number
      maxHeartRate?: number
      calories?: number
      hrZones?: {
        z0?: number
        z1?: number
        z2?: number
        z3?: number
        z4?: number
        z5?: number
      }
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
          // Return empty list if token refresh fails
          return successResponse(externalWorkouts)
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

        // Get existing logged Whoop workouts for today
        const existingCompletions = await prisma.trainingDetails.findMany({
          where: {
            source: 'WHOOP',
            createdAt: {
              gte: today,
            },
          },
          select: {
            externalWorkoutId: true,
          },
        })

        const loggedExternalIds = new Set(
          existingCompletions.map((c) => c.externalWorkoutId).filter(Boolean)
        )

        // Also check old-style completions (stored in ActivityCompletion.details)
        const oldStyleCompletions = await prisma.activityCompletion.findMany({
          where: {
            source: 'WHOOP',
            completedAt: {
              gte: today,
            },
            details: {
              contains: '"type":"workout"',
            },
          },
          select: {
            details: true,
          },
        })

        for (const completion of oldStyleCompletions) {
          if (completion.details) {
            try {
              const parsed = JSON.parse(completion.details)
              if (parsed.whoopId) {
                loggedExternalIds.add(String(parsed.whoopId))
              }
            } catch {
              // Ignore parse errors
            }
          }
        }

        // Filter to unlogged workouts
        for (const workout of workoutResponse.records) {
          if (loggedExternalIds.has(String(workout.id))) {
            continue // Already logged
          }

          const { name, type } = getWorkoutNameAndType(workout.sport_id)
          const startTime = new Date(workout.start)
          const endTime = new Date(workout.end)
          const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

          // Convert zone durations from milliseconds to minutes
          const hrZones = workout.score.zone_duration
            ? {
                z0: workout.score.zone_duration.zone_zero_milli
                  ? Math.round(workout.score.zone_duration.zone_zero_milli / 60000)
                  : undefined,
                z1: workout.score.zone_duration.zone_one_milli
                  ? Math.round(workout.score.zone_duration.zone_one_milli / 60000)
                  : undefined,
                z2: workout.score.zone_duration.zone_two_milli
                  ? Math.round(workout.score.zone_duration.zone_two_milli / 60000)
                  : undefined,
                z3: workout.score.zone_duration.zone_three_milli
                  ? Math.round(workout.score.zone_duration.zone_three_milli / 60000)
                  : undefined,
                z4: workout.score.zone_duration.zone_four_milli
                  ? Math.round(workout.score.zone_duration.zone_four_milli / 60000)
                  : undefined,
                z5: workout.score.zone_duration.zone_five_milli
                  ? Math.round(workout.score.zone_duration.zone_five_milli / 60000)
                  : undefined,
              }
            : undefined

          externalWorkouts.push({
            id: `whoop_${workout.id}`,
            source: 'WHOOP',
            externalId: String(workout.id),
            name,
            workoutType: type,
            startTime: workout.start,
            endTime: workout.end,
            durationMinutes,
            strain: workout.score.strain,
            avgHeartRate: workout.score.average_heart_rate,
            maxHeartRate: workout.score.max_heart_rate,
            calories: workout.score.kilojoule
              ? Math.round(workout.score.kilojoule / 4.184)
              : undefined,
            hrZones,
          })
        }
      } catch (error) {
        console.error('Failed to fetch Whoop workouts:', error)
        // Continue with empty list for Whoop
      }
    }

    // Sort by start time descending (most recent first)
    externalWorkouts.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )

    return successResponse(externalWorkouts)
  } catch (error) {
    console.error('External workouts fetch error:', error)
    return internalError('Failed to fetch external workouts')
  }
})
