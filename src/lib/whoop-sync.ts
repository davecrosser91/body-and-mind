/**
 * Whoop Data Sync Service
 *
 * Syncs sleep and workout data from Whoop to create HabitCompletions
 * and award XP to appropriate Habitanimals.
 */

import { prisma } from '@/lib/db'
import { whoopFetch, refreshAccessToken, isTokenExpired, calculateExpiresAt } from '@/lib/whoop'
import { calculateLevel, calculateEvolutionStage } from '@/lib/xp'
import { recoverHealth } from '@/lib/habitanimal-health'
import { HabitanimalType } from '@prisma/client'

// ============ WHOOP API TYPES ============

export interface WhoopSleep {
  id: number
  start: string
  end: string
  score: {
    stage_summary: {
      total_in_bed_time_milli: number
      total_slow_wave_sleep_time_milli: number
      total_rem_sleep_time_milli: number
    }
    sleep_needed: { baseline_milli: number }
    respiratory_rate: number
    sleep_performance_percentage: number
    sleep_efficiency_percentage: number
  }
}

export interface WhoopWorkout {
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

export interface WhoopRecovery {
  cycle_id: number
  score: {
    recovery_score: number
    resting_heart_rate: number
    hrv_rmssd_milli: number
  }
}

interface WhoopPaginatedResponse<T> {
  records: T[]
  next_token?: string
}

// ============ XP CALCULATION ============

const MILLIS_PER_HOUR = 3600000

/**
 * Calculate XP for sleep tracking (for Milo the Sloth)
 *
 * Base: 10 XP for any tracked sleep
 * Bonus: +5 for 7+ hours, +5 for 85%+ efficiency, +5 for good HRV
 */
export function calculateSleepXP(sleep: WhoopSleep, recovery?: WhoopRecovery): number {
  let xp = 10 // Base XP for tracked sleep

  // Check for 7+ hours of sleep
  const totalSleepHours = sleep.score.stage_summary.total_in_bed_time_milli / MILLIS_PER_HOUR
  if (totalSleepHours >= 7) {
    xp += 5
  }

  // Check for 85%+ efficiency
  if (sleep.score.sleep_efficiency_percentage >= 85) {
    xp += 5
  }

  // Check for good HRV (if recovery data available)
  // Good HRV is typically considered > 50ms for most adults
  if (recovery && recovery.score.hrv_rmssd_milli >= 50) {
    xp += 5
  }

  return xp
}

/**
 * Calculate XP for workout tracking (for Guiro the Gorilla)
 *
 * Base: 10 XP for any workout
 * Bonus: +5 for 30+ minutes, +5 for strain 10+, +5 for strain 15+
 */
export function calculateWorkoutXP(workout: WhoopWorkout): number {
  let xp = 10 // Base XP for any workout

  // Check for 30+ minutes
  const startTime = new Date(workout.start).getTime()
  const endTime = new Date(workout.end).getTime()
  const durationMinutes = (endTime - startTime) / 60000
  if (durationMinutes >= 30) {
    xp += 5
  }

  // Check strain levels
  if (workout.score.strain >= 10) {
    xp += 5
  }
  if (workout.score.strain >= 15) {
    xp += 5
  }

  return xp
}

// ============ SYNC RESULT TYPES ============

export interface SyncResult {
  sleepSynced: number
  workoutsSynced: number
  xpEarned: {
    sleep: number
    fitness: number
    total: number
  }
  errors: string[]
}

// ============ CUSTOM ERRORS ============

export class WhoopConnectionNotFoundError extends Error {
  constructor(userId: string) {
    super(`No Whoop connection found for user: ${userId}`)
    this.name = 'WhoopConnectionNotFoundError'
  }
}

export class WhoopTokenRefreshError extends Error {
  constructor(message: string) {
    super(`Failed to refresh Whoop token: ${message}`)
    this.name = 'WhoopTokenRefreshError'
  }
}

// ============ HELPER FUNCTIONS ============

/**
 * Get the start date for syncing data
 * If lastSync exists, use it; otherwise use 7 days ago
 */
function getSyncStartDate(lastSync: Date | null): Date {
  if (lastSync) {
    return lastSync
  }
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return sevenDaysAgo
}

/**
 * Format date for Whoop API query parameter
 */
function formatDateForWhoop(date: Date): string {
  return date.toISOString()
}

/**
 * Check if a Whoop data record has already been synced
 */
async function isAlreadySynced(
  whoopId: number,
  dataType: 'sleep' | 'workout'
): Promise<boolean> {
  const existing = await prisma.habitCompletion.findFirst({
    where: {
      source: 'WHOOP',
      details: {
        contains: `"whoopId":${whoopId},"type":"${dataType}"`,
      },
    },
  })
  return existing !== null
}

/**
 * Create completion details JSON string
 */
function createCompletionDetails(
  whoopId: number,
  dataType: 'sleep' | 'workout',
  additionalData: Record<string, unknown>
): string {
  return JSON.stringify({
    whoopId,
    type: dataType,
    ...additionalData,
  })
}

/**
 * Update habitanimal with new XP
 */
async function awardXPToHabitanimal(
  userId: string,
  habitanimalType: HabitanimalType,
  xpToAdd: number
): Promise<void> {
  const habitanimal = await prisma.habitanimal.findFirst({
    where: {
      userId,
      type: habitanimalType,
    },
  })

  if (!habitanimal) {
    return // Silently skip if habitanimal doesn't exist
  }

  const newXP = habitanimal.xp + xpToAdd
  const newLevel = calculateLevel(newXP)
  const newEvolutionStage = calculateEvolutionStage(newLevel)
  const newHealth = recoverHealth(habitanimal.health)

  await prisma.habitanimal.update({
    where: { id: habitanimal.id },
    data: {
      xp: newXP,
      level: newLevel,
      evolutionStage: newEvolutionStage,
      health: newHealth,
      lastInteraction: new Date(),
    },
  })
}

/**
 * Get or create a system habit for Whoop data syncing
 */
async function getOrCreateWhoopHabit(
  userId: string,
  category: 'SLEEP' | 'FITNESS'
): Promise<string> {
  const habitName = category === 'SLEEP' ? 'Whoop Sleep Tracking' : 'Whoop Workout Tracking'

  let habit = await prisma.habit.findFirst({
    where: {
      userId,
      name: habitName,
      category,
    },
  })

  if (!habit) {
    habit = await prisma.habit.create({
      data: {
        userId,
        name: habitName,
        category,
        description: `Automatically synced from Whoop`,
        frequency: 'DAILY',
      },
    })
  }

  return habit.id
}

// ============ MAIN SYNC FUNCTION ============

/**
 * Sync Whoop data for a user
 *
 * 1. Get user's WhoopConnection
 * 2. Refresh token if expired
 * 3. Fetch sleep data from last sync (or last 7 days if first sync)
 * 4. Fetch workout data from last sync
 * 5. Create HabitCompletions for new data (source: WHOOP)
 * 6. Award XP to appropriate Habitanimals
 * 7. Update lastSync timestamp
 * 8. Return summary
 */
export async function syncWhoopData(userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    sleepSynced: 0,
    workoutsSynced: 0,
    xpEarned: {
      sleep: 0,
      fitness: 0,
      total: 0,
    },
    errors: [],
  }

  // 1. Get user's WhoopConnection
  const connection = await prisma.whoopConnection.findUnique({
    where: { userId },
  })

  if (!connection) {
    throw new WhoopConnectionNotFoundError(userId)
  }

  let accessToken = connection.accessToken

  // 2. Refresh token if expired (with 5 minute buffer)
  if (isTokenExpired(connection.expiresAt)) {
    try {
      const refreshed = await refreshAccessToken(connection.refreshToken)

      // Update connection with new tokens
      await prisma.whoopConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          expiresAt: calculateExpiresAt(refreshed.expires_in),
        },
      })

      accessToken = refreshed.access_token
    } catch (error) {
      throw new WhoopTokenRefreshError(
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  // Get sync start date
  const startDate = getSyncStartDate(connection.lastSync)
  const startParam = formatDateForWhoop(startDate)
  const endParam = formatDateForWhoop(new Date())

  // 3. Fetch and process sleep data
  try {
    const sleepResponse = await whoopFetch<WhoopPaginatedResponse<WhoopSleep>>(
      `/activity/sleep?start=${startParam}&end=${endParam}`,
      accessToken
    )

    // Also fetch recovery data for HRV bonus
    let recoveryMap: Map<number, WhoopRecovery> = new Map()
    try {
      const recoveryResponse = await whoopFetch<WhoopPaginatedResponse<WhoopRecovery>>(
        `/recovery?start=${startParam}&end=${endParam}`,
        accessToken
      )
      recoveryResponse.records.forEach((recovery) => {
        recoveryMap.set(recovery.cycle_id, recovery)
      })
    } catch {
      // Recovery data is optional, continue without it
    }

    const sleepHabitId = await getOrCreateWhoopHabit(userId, 'SLEEP')

    for (const sleep of sleepResponse.records) {
      // Skip if already synced
      if (await isAlreadySynced(sleep.id, 'sleep')) {
        continue
      }

      // Find matching recovery data (if available)
      const recovery = recoveryMap.get(sleep.id)

      // Calculate XP
      const xp = calculateSleepXP(sleep, recovery)

      // Create completion record
      const sleepHours = sleep.score.stage_summary.total_in_bed_time_milli / MILLIS_PER_HOUR

      await prisma.habitCompletion.create({
        data: {
          habitId: sleepHabitId,
          xpEarned: xp,
          source: 'WHOOP',
          completedAt: new Date(sleep.end),
          details: createCompletionDetails(sleep.id, 'sleep', {
            sleepHours: sleepHours.toFixed(1),
            efficiency: sleep.score.sleep_efficiency_percentage,
            hrv: recovery?.score.hrv_rmssd_milli,
          }),
        },
      })

      result.sleepSynced++
      result.xpEarned.sleep += xp
    }

    // Award accumulated sleep XP to Milo (SLEEP habitanimal)
    if (result.xpEarned.sleep > 0) {
      await awardXPToHabitanimal(userId, 'SLEEP', result.xpEarned.sleep)
    }
  } catch (error) {
    result.errors.push(
      `Sleep sync error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  // 4. Fetch and process workout data
  try {
    const workoutResponse = await whoopFetch<WhoopPaginatedResponse<WhoopWorkout>>(
      `/activity/workout?start=${startParam}&end=${endParam}`,
      accessToken
    )

    const fitnessHabitId = await getOrCreateWhoopHabit(userId, 'FITNESS')

    for (const workout of workoutResponse.records) {
      // Skip if already synced
      if (await isAlreadySynced(workout.id, 'workout')) {
        continue
      }

      // Calculate XP
      const xp = calculateWorkoutXP(workout)

      // Calculate duration
      const startTime = new Date(workout.start).getTime()
      const endTime = new Date(workout.end).getTime()
      const durationMinutes = Math.round((endTime - startTime) / 60000)

      await prisma.habitCompletion.create({
        data: {
          habitId: fitnessHabitId,
          xpEarned: xp,
          source: 'WHOOP',
          completedAt: new Date(workout.end),
          details: createCompletionDetails(workout.id, 'workout', {
            sportId: workout.sport_id,
            strain: workout.score.strain,
            durationMinutes,
            kilojoule: workout.score.kilojoule,
          }),
        },
      })

      result.workoutsSynced++
      result.xpEarned.fitness += xp
    }

    // Award accumulated fitness XP to Guiro (FITNESS habitanimal)
    if (result.xpEarned.fitness > 0) {
      await awardXPToHabitanimal(userId, 'FITNESS', result.xpEarned.fitness)
    }
  } catch (error) {
    result.errors.push(
      `Workout sync error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  // Calculate total XP
  result.xpEarned.total = result.xpEarned.sleep + result.xpEarned.fitness

  // 7. Update lastSync timestamp
  await prisma.whoopConnection.update({
    where: { id: connection.id },
    data: {
      lastSync: new Date(),
    },
  })

  return result
}
