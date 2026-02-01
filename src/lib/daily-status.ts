/**
 * Daily Status Service
 *
 * Provides the daily status for Body & Mind tracking including:
 * - Body and Mind completion status
 * - Activity scores and completed activities
 * - Streak information with at-risk warnings
 * - Whoop recovery data (if connected)
 * - Daily motivational quote
 */

import { prisma } from './db';
import { getDailyQuote } from './quotes';
import { getAllStreaks } from './streaks';
import { whoopFetch, refreshAccessToken, isTokenExpired, calculateExpiresAt } from './whoop';
import { WhoopRecovery, WhoopSleep, WhoopWorkout } from './whoop-sync';

// Whoop sport ID to name mapping
const WHOOP_SPORT_NAMES: Record<number, string> = {
  0: 'Running',
  1: 'Cycling',
  44: 'Weightlifting',
  52: 'HIIT',
  71: 'Yoga',
  82: 'CrossFit',
  84: 'Functional Fitness',
  96: 'Walking',
  126: 'Meditation',
  // Add more as needed
};

// ============ CONSTANTS ============

/** Base score awarded when a pillar is completed */
const PILLAR_BASE_SCORE = 50;

/** Bonus score per additional activity completed */
const PILLAR_ACTIVITY_BONUS = 10;

/** Recovery zone threshold - scores >= this are "green" (well recovered) */
const RECOVERY_GREEN_THRESHOLD = 67;

/** Recovery zone threshold - scores >= this (but < green) are "yellow" (moderate) */
const RECOVERY_YELLOW_THRESHOLD = 34;

/** Timeout for Whoop API requests in milliseconds */
const WHOOP_FETCH_TIMEOUT_MS = 5000;

// ============ TYPES ============

interface CompletedActivity {
  id: string;
  name: string;
  category: string;
  completedAt: string;
}

interface PillarStatus {
  completed: boolean;
  score: number;
  activities: CompletedActivity[];
}

interface StreakStatus {
  current: number;
  atRisk: boolean;
  hoursRemaining: number;
}

type RecoveryZone = 'green' | 'yellow' | 'red';

interface RecoveryStatus {
  score: number | null;
  zone: RecoveryZone | null;
  recommendation: string | null;
  hrv: number | null;
  restingHeartRate: number | null;
}

interface WhoopSleepData {
  hours: number;
  efficiency: number;
  remHours: number;
  deepHours: number;
  performance: number;
}

interface WhoopTrainingData {
  strain: number;
  calories: number;
  workouts: {
    name: string;
    strain: number;
    duration: number;
    calories: number;
  }[];
}

interface QuoteData {
  text: string;
  author: string | null;
}

export interface DailyStatus {
  date: string;
  body: PillarStatus;
  mind: PillarStatus;
  streak: StreakStatus;
  recovery: RecoveryStatus | null;
  whoop: {
    connected: boolean;
    lastSync: string | null;
    sleep: WhoopSleepData | null;
    training: WhoopTrainingData | null;
  } | null;
  quote: QuoteData;
}

// ============ HELPER FUNCTIONS ============

/**
 * Calculate hours remaining until midnight (local time)
 */
function getHoursRemainingToday(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const msRemaining = midnight.getTime() - now.getTime();
  const hoursRemaining = msRemaining / (1000 * 60 * 60);

  return Math.max(0, Math.round(hoursRemaining * 10) / 10); // Round to 1 decimal
}

/**
 * Determine recovery zone based on Whoop recovery score
 * Green >= 67, Yellow >= 34, Red < 34
 */
function getRecoveryZone(score: number): RecoveryZone {
  if (score >= RECOVERY_GREEN_THRESHOLD) return 'green';
  if (score >= RECOVERY_YELLOW_THRESHOLD) return 'yellow';
  return 'red';
}

/**
 * Get recovery recommendation based on zone
 */
function getRecoveryRecommendation(zone: RecoveryZone): string {
  switch (zone) {
    case 'green':
      return 'Your body is well recovered. Great day for intense training!';
    case 'yellow':
      return 'Moderate recovery. Consider a lighter workout or active recovery.';
    case 'red':
      return 'Low recovery. Focus on rest, sleep, and gentle movement today.';
  }
}

interface WhoopPaginatedResponse<T> {
  records: T[];
  next_token?: string;
}

interface WhoopConnectionData {
  accessToken: string;
  lastSync: Date | null;
}

/**
 * Get Whoop connection and refresh token if needed
 */
async function getWhoopConnection(userId: string): Promise<WhoopConnectionData | null> {
  try {
    const connection = await prisma.whoopConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      return null;
    }

    let accessToken = connection.accessToken;

    // Refresh token if expired
    if (isTokenExpired(connection.expiresAt)) {
      try {
        const refreshed = await refreshAccessToken(connection.refreshToken);

        await prisma.whoopConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
            expiresAt: calculateExpiresAt(refreshed.expires_in),
          },
        });

        accessToken = refreshed.access_token;
      } catch {
        console.error('Failed to refresh Whoop token');
        return null;
      }
    }

    return { accessToken, lastSync: connection.lastSync };
  } catch {
    return null;
  }
}

/**
 * Fetch recovery data from Whoop API
 * Uses cycle-based approach: first get latest cycle, then get recovery for that cycle
 */
async function getWhoopRecovery(accessToken: string): Promise<RecoveryStatus | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WHOOP_FETCH_TIMEOUT_MS);

    try {
      // Step 1: Get the latest cycle
      const cycleResponse = await whoopFetch<WhoopPaginatedResponse<{ id: number }>>(
        `/developer/v2/cycle?limit=1`,
        accessToken,
        { signal: controller.signal }
      );

      const cycle = cycleResponse.records[0];
      if (!cycle) {
        console.log('No Whoop cycle found');
        return null;
      }

      // Step 2: Get recovery for this cycle
      const recovery = await whoopFetch<WhoopRecovery>(
        `/developer/v2/cycle/${cycle.id}/recovery`,
        accessToken,
        { signal: controller.signal }
      );

      if (!recovery || !recovery.score) {
        console.log('No recovery score for cycle', cycle.id);
        return null;
      }

      const score = recovery.score.recovery_score;
      const zone = getRecoveryZone(score);

      return {
        score,
        zone,
        recommendation: getRecoveryRecommendation(zone),
        hrv: recovery.score.hrv_rmssd_milli,
        restingHeartRate: recovery.score.resting_heart_rate,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error fetching Whoop recovery:', error);
    return null;
  }
}

/**
 * Fetch sleep data from Whoop API
 * Gets the most recent sleep record
 */
async function getWhoopSleep(accessToken: string): Promise<WhoopSleepData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WHOOP_FETCH_TIMEOUT_MS);

    try {
      // Get most recent sleep (limit=1 returns latest)
      const response = await whoopFetch<WhoopPaginatedResponse<WhoopSleep>>(
        `/developer/v2/activity/sleep?limit=1`,
        accessToken,
        { signal: controller.signal }
      );

      const sleep = response.records[0];
      if (!sleep) {
        console.log('No Whoop sleep data found');
        return null;
      }

      const MILLIS_PER_HOUR = 3600000;
      const totalHours = sleep.score.stage_summary.total_in_bed_time_milli / MILLIS_PER_HOUR;
      const remHours = sleep.score.stage_summary.total_rem_sleep_time_milli / MILLIS_PER_HOUR;
      const deepHours = sleep.score.stage_summary.total_slow_wave_sleep_time_milli / MILLIS_PER_HOUR;

      return {
        hours: Math.round(totalHours * 10) / 10,
        efficiency: Math.round(sleep.score.sleep_efficiency_percentage),
        remHours: Math.round(remHours * 10) / 10,
        deepHours: Math.round(deepHours * 10) / 10,
        performance: Math.round(sleep.score.sleep_performance_percentage),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error fetching Whoop sleep:', error);
    return null;
  }
}

/**
 * Fetch training/workout data from Whoop API
 * Gets recent workouts (last 5)
 */
async function getWhoopTraining(accessToken: string): Promise<WhoopTrainingData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WHOOP_FETCH_TIMEOUT_MS);

    try {
      // Get recent workouts
      const response = await whoopFetch<WhoopPaginatedResponse<WhoopWorkout>>(
        `/developer/v2/activity/workout?limit=5`,
        accessToken,
        { signal: controller.signal }
      );

      if (response.records.length === 0) {
        console.log('No Whoop workout data found');
        return {
          strain: 0,
          calories: 0,
          workouts: [],
        };
      }

      // Filter to only today's workouts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayWorkouts = response.records.filter(w => {
        const workoutDate = new Date(w.start);
        return workoutDate >= today;
      });

      if (todayWorkouts.length === 0) {
        return {
          strain: 0,
          calories: 0,
          workouts: [],
        };
      }

      const workouts = todayWorkouts.map((workout) => {
        const startTime = new Date(workout.start).getTime();
        const endTime = new Date(workout.end).getTime();
        const durationMinutes = Math.round((endTime - startTime) / 60000);

        return {
          name: WHOOP_SPORT_NAMES[workout.sport_id] || `Activity ${workout.sport_id}`,
          strain: Math.round(workout.score.strain * 10) / 10,
          duration: durationMinutes,
          calories: Math.round(workout.score.kilojoule / 4.184), // Convert kJ to kcal
        };
      });

      const totalStrain = workouts.reduce((sum, w) => sum + w.strain, 0);
      const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);

      return {
        strain: Math.round(totalStrain * 10) / 10,
        calories: totalCalories,
        workouts,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error fetching Whoop training:', error);
    return null;
  }
}

/**
 * Calculate pillar score based on completed activities
 * Simple scoring: 100 if completed, 0 if not
 * Could be extended to calculate based on number/quality of activities
 */
function calculatePillarScore(completed: boolean, activityCount: number): number {
  if (!completed) return 0;
  // Base score for completion, plus bonus for each additional activity up to 100
  return Math.min(100, PILLAR_BASE_SCORE + activityCount * PILLAR_ACTIVITY_BONUS);
}

// ============ MAIN FUNCTION ============

/**
 * Get daily status for a user
 *
 * Returns comprehensive daily status including:
 * - Body completion (at least 1 BODY activity)
 * - Mind completion (at least 1 MIND activity)
 * - Streak with at-risk warning
 * - Recovery from Whoop (if available)
 * - Daily quote
 */
export async function getDailyStatus(userId: string): Promise<DailyStatus> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Get Whoop connection first
  const whoopConnection = await getWhoopConnection(userId);

  // Fetch data in parallel
  const [activities, streaks, quote, recovery, sleep, training] = await Promise.all([
    // Get activities with pillar info and today's completions
    prisma.activity.findMany({
      where: {
        userId,
        archived: false,
        pillar: { in: ['BODY', 'MIND'] },
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
        },
      },
    }),
    getAllStreaks(userId),
    getDailyQuote(userId),
    whoopConnection ? getWhoopRecovery(whoopConnection.accessToken) : Promise.resolve(null),
    whoopConnection ? getWhoopSleep(whoopConnection.accessToken) : Promise.resolve(null),
    whoopConnection ? getWhoopTraining(whoopConnection.accessToken) : Promise.resolve(null),
  ]);

  // Separate activities by pillar and collect completed ones
  const bodyCompletedActivities: CompletedActivity[] = [];
  const mindCompletedActivities: CompletedActivity[] = [];

  for (const activity of activities) {
    if (activity.completions.length > 0) {
      const completion = activity.completions[0];
      if (!completion) continue;

      const completedActivity: CompletedActivity = {
        id: activity.id,
        name: activity.name,
        category: activity.subCategory,
        completedAt: completion.completedAt.toISOString(),
      };

      if (activity.pillar === 'BODY') {
        bodyCompletedActivities.push(completedActivity);
      } else if (activity.pillar === 'MIND') {
        mindCompletedActivities.push(completedActivity);
      }
    }
  }

  // Determine completion status (at least 1 activity per pillar)
  const bodyCompleted = bodyCompletedActivities.length >= 1;
  const mindCompleted = mindCompletedActivities.length >= 1;

  // Calculate hours remaining
  const hoursRemaining = getHoursRemainingToday();

  // Determine if streak is at risk
  // At risk if: has a streak AND (body OR mind not completed)
  const overallStreak = streaks.overall.current;
  const atRisk = overallStreak > 0 && (!bodyCompleted || !mindCompleted);

  // Build response
  const dailyStatus: DailyStatus = {
    date: todayStart.toISOString().split('T')[0] as string,
    body: {
      completed: bodyCompleted,
      score: calculatePillarScore(bodyCompleted, bodyCompletedActivities.length),
      activities: bodyCompletedActivities,
    },
    mind: {
      completed: mindCompleted,
      score: calculatePillarScore(mindCompleted, mindCompletedActivities.length),
      activities: mindCompletedActivities,
    },
    streak: {
      current: overallStreak,
      atRisk,
      hoursRemaining,
    },
    recovery,
    whoop: whoopConnection
      ? {
          connected: true,
          lastSync: whoopConnection.lastSync?.toISOString() || null,
          sleep,
          training,
        }
      : null,
    quote: {
      text: quote.text,
      author: quote.author,
    },
  };

  return dailyStatus;
}

/**
 * Update daily goal record
 * Called when activities are completed to track daily progress
 * Uses upsert for atomic create-or-update operation
 */
export async function updateDailyGoal(
  userId: string,
  pillar: 'BODY' | 'MIND',
  activityId: string
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Use upsert for atomic operation, then update array if needed
  const result = await prisma.dailyGoal.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    create: {
      userId,
      date: today,
      bodyCompleted: pillar === 'BODY',
      mindCompleted: pillar === 'MIND',
      bodyActivities: pillar === 'BODY' ? [activityId] : [],
      mindActivities: pillar === 'MIND' ? [activityId] : [],
    },
    update: {}, // We'll handle the update separately to manage array deduplication
  });

  // Check if activity already exists in array and update if needed
  if (pillar === 'BODY') {
    if (!result.bodyActivities.includes(activityId)) {
      await prisma.dailyGoal.update({
        where: { id: result.id },
        data: {
          bodyActivities: { push: activityId },
          bodyCompleted: true,
        },
      });
    }
  } else {
    if (!result.mindActivities.includes(activityId)) {
      await prisma.dailyGoal.update({
        where: { id: result.id },
        data: {
          mindActivities: { push: activityId },
          mindCompleted: true,
        },
      });
    }
  }
}
