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
import { WhoopRecovery } from './whoop-sync';

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

/**
 * Fetch recovery data from Whoop API
 */
async function getWhoopRecovery(userId: string): Promise<RecoveryStatus | null> {
  try {
    // Get user's Whoop connection
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
        // Token refresh failed, return null
        console.error('Failed to refresh Whoop token for daily status');
        return null;
      }
    }

    // Fetch today's recovery data with timeout to prevent blocking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startParam = today.toISOString();
    const endParam = tomorrow.toISOString();

    interface WhoopPaginatedResponse<T> {
      records: T[];
      next_token?: string;
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WHOOP_FETCH_TIMEOUT_MS);

    try {
      const response = await whoopFetch<WhoopPaginatedResponse<WhoopRecovery>>(
        `/developer/v1/recovery?start=${startParam}&end=${endParam}`,
        accessToken,
        { signal: controller.signal }
      );

      if (response.records.length === 0) {
        // Try getting most recent recovery
        const recentResponse = await whoopFetch<WhoopPaginatedResponse<WhoopRecovery>>(
          `/developer/v1/recovery?limit=1`,
          accessToken,
          { signal: controller.signal }
        );

        if (recentResponse.records.length === 0) {
          return null;
        }

        const recovery = recentResponse.records[0];
        if (!recovery) return null;

        const score = recovery.score.recovery_score;
        const zone = getRecoveryZone(score);

        return {
          score,
          zone,
          recommendation: getRecoveryRecommendation(zone),
        };
      }

      const recovery = response.records[0];
      if (!recovery) return null;

      const score = recovery.score.recovery_score;
      const zone = getRecoveryZone(score);

      return {
        score,
        zone,
        recommendation: getRecoveryRecommendation(zone),
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

  // Fetch data in parallel
  const [habits, streaks, quote, recovery] = await Promise.all([
    // Get habits with pillar info and today's completions
    prisma.habit.findMany({
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
    getWhoopRecovery(userId),
  ]);

  // Separate habits by pillar and collect completed activities
  const bodyActivities: CompletedActivity[] = [];
  const mindActivities: CompletedActivity[] = [];

  for (const habit of habits) {
    if (habit.completions.length > 0) {
      const completion = habit.completions[0];
      if (!completion) continue;

      const activity: CompletedActivity = {
        id: habit.id,
        name: habit.name,
        category: habit.subCategory || habit.category,
        completedAt: completion.completedAt.toISOString(),
      };

      if (habit.pillar === 'BODY') {
        bodyActivities.push(activity);
      } else if (habit.pillar === 'MIND') {
        mindActivities.push(activity);
      }
    }
  }

  // Determine completion status (at least 1 activity per pillar)
  const bodyCompleted = bodyActivities.length >= 1;
  const mindCompleted = mindActivities.length >= 1;

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
      score: calculatePillarScore(bodyCompleted, bodyActivities.length),
      activities: bodyActivities,
    },
    mind: {
      completed: mindCompleted,
      score: calculatePillarScore(mindCompleted, mindActivities.length),
      activities: mindActivities,
    },
    streak: {
      current: overallStreak,
      atRisk,
      hoursRemaining,
    },
    recovery,
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
