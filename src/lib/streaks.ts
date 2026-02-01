import { prisma } from '@/lib/db';
import { isPillarComplete } from './points';

// Pillar keys for streaks
export type PillarKey = 'BODY' | 'MIND' | 'OVERALL';

export interface StreakInfo {
  current: number;
  longest: number;
  lastActiveDate: string | null;
  atRisk: boolean;
  hoursRemaining: number;
}

export interface AllStreaks {
  overall: StreakInfo;
  body: StreakInfo;
  mind: StreakInfo;
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
 * Update streaks for a specific date based on activity completions
 * Uses points-based completion (100 pts = streak maintained)
 */
export async function updateStreaksForDate(userId: string, date: Date) {
  // Get or calculate daily score
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all completions for the day
  const completions = await prisma.activityCompletion.findMany({
    where: {
      activity: { userId },
      completedAt: { gte: startOfDay, lte: endOfDay },
    },
    include: { activity: true },
  });

  // Calculate points per pillar
  const bodyPoints = completions
    .filter(c => c.activity.pillar === 'BODY')
    .reduce((sum, c) => sum + c.pointsEarned, 0);

  const mindPoints = completions
    .filter(c => c.activity.pillar === 'MIND')
    .reduce((sum, c) => sum + c.pointsEarned, 0);

  const bodyComplete = isPillarComplete(bodyPoints);
  const mindComplete = isPillarComplete(mindPoints);

  // Update or create DailyScore
  await prisma.dailyScore.upsert({
    where: { userId_date: { userId, date: startOfDay } },
    create: {
      userId,
      date: startOfDay,
      bodyScore: Math.min(bodyPoints, 100),
      mindScore: Math.min(mindPoints, 100),
      balanceIndex: Math.round((Math.min(bodyPoints, 100) + Math.min(mindPoints, 100)) / 2),
      bodyPoints,
      mindPoints,
      bodyComplete,
      mindComplete,
    },
    update: {
      bodyScore: Math.min(bodyPoints, 100),
      mindScore: Math.min(mindPoints, 100),
      balanceIndex: Math.round((Math.min(bodyPoints, 100) + Math.min(mindPoints, 100)) / 2),
      bodyPoints,
      mindPoints,
      bodyComplete,
      mindComplete,
    },
  });

  // Update streaks
  await updatePillarStreak(userId, 'BODY', bodyComplete, startOfDay);
  await updatePillarStreak(userId, 'MIND', mindComplete, startOfDay);
  await updatePillarStreak(userId, 'OVERALL', bodyComplete && mindComplete, startOfDay);
}

async function updatePillarStreak(
  userId: string,
  pillarKey: string,
  complete: boolean,
  date: Date
) {
  const streak = await prisma.streak.upsert({
    where: { userId_pillarKey: { userId, pillarKey } },
    create: { userId, pillarKey, current: 0, longest: 0 },
    update: {},
  });

  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);

  if (complete) {
    // Check if continuing streak from yesterday
    const wasActiveYesterday = streak.lastActiveDate &&
      streak.lastActiveDate.getTime() >= yesterday.setHours(0, 0, 0, 0);

    const newCurrent = wasActiveYesterday ? streak.current + 1 : 1;

    await prisma.streak.update({
      where: { id: streak.id },
      data: {
        current: newCurrent,
        longest: Math.max(streak.longest, newCurrent),
        lastActiveDate: date,
      },
    });
  } else if (streak.lastActiveDate && streak.lastActiveDate < yesterday) {
    // Missed yesterday, reset streak
    await prisma.streak.update({
      where: { id: streak.id },
      data: { current: 0 },
    });
  }
}

/**
 * Get streaks for a user (simple format)
 */
export async function getStreaks(userId: string) {
  const streaks = await prisma.streak.findMany({
    where: { userId },
  });

  return {
    body: streaks.find(s => s.pillarKey === 'BODY')?.current ?? 0,
    mind: streaks.find(s => s.pillarKey === 'MIND')?.current ?? 0,
    overall: streaks.find(s => s.pillarKey === 'OVERALL')?.current ?? 0,
    bodyLongest: streaks.find(s => s.pillarKey === 'BODY')?.longest ?? 0,
    mindLongest: streaks.find(s => s.pillarKey === 'MIND')?.longest ?? 0,
    overallLongest: streaks.find(s => s.pillarKey === 'OVERALL')?.longest ?? 0,
  };
}

/**
 * Check if a day is complete for a given pillar based on points
 * For OVERALL, both Body AND Mind must have >= 100 points
 */
export async function isDayComplete(
  userId: string,
  date: Date,
  pillarKey: PillarKey = 'OVERALL'
): Promise<boolean> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  // Get completions for the day
  const completions = await prisma.activityCompletion.findMany({
    where: {
      activity: { userId, archived: false },
      completedAt: { gte: dayStart, lte: dayEnd },
    },
    include: { activity: { select: { pillar: true } } },
  });

  if (pillarKey === 'BODY' || pillarKey === 'MIND') {
    const points = completions
      .filter(c => c.activity.pillar === pillarKey)
      .reduce((sum, c) => sum + c.pointsEarned, 0);
    return isPillarComplete(points);
  }

  // For OVERALL, both Body AND Mind must have >= 100 points
  const bodyPoints = completions
    .filter(c => c.activity.pillar === 'BODY')
    .reduce((sum, c) => sum + c.pointsEarned, 0);
  const mindPoints = completions
    .filter(c => c.activity.pillar === 'MIND')
    .reduce((sum, c) => sum + c.pointsEarned, 0);

  return isPillarComplete(bodyPoints) && isPillarComplete(mindPoints);
}

/**
 * Get streak info for a specific pillar with atRisk and hoursRemaining
 */
export async function getStreak(
  userId: string,
  pillarKey: PillarKey = 'OVERALL'
): Promise<StreakInfo> {
  const streak = await prisma.streak.findUnique({
    where: { userId_pillarKey: { userId, pillarKey } },
  });

  const current = streak?.current ?? 0;
  const longest = streak?.longest ?? 0;
  const lastActiveDate = streak?.lastActiveDate ?? null;

  const todayComplete = await isDayComplete(userId, new Date(), pillarKey);
  const hoursRemaining = getHoursRemainingToday();

  // At risk if: current streak > 0 AND today not complete
  const atRisk = current > 0 && !todayComplete;

  return {
    current,
    longest,
    lastActiveDate: lastActiveDate
      ? lastActiveDate.toISOString().split('T')[0] as string
      : null,
    atRisk,
    hoursRemaining,
  };
}

/**
 * Get all streaks for a user (detailed format with atRisk info)
 */
export async function getAllStreaks(userId: string): Promise<AllStreaks> {
  const [overall, body, mind] = await Promise.all([
    getStreak(userId, 'OVERALL'),
    getStreak(userId, 'BODY'),
    getStreak(userId, 'MIND'),
  ]);

  return { overall, body, mind };
}

/**
 * Update all streaks (overall, body, mind) for current date
 */
export async function updateAllStreaks(
  userId: string,
  date: Date
): Promise<AllStreaks> {
  // Update streaks for the date
  await updateStreaksForDate(userId, date);

  // Return the updated streaks
  return getAllStreaks(userId);
}

/**
 * Get ember intensity based on streak length
 */
export function getEmberIntensity(days: number): {
  level: 'dim' | 'steady' | 'bright' | 'golden';
  hasParticles: boolean;
} {
  if (days >= 14) {
    return { level: 'golden', hasParticles: true };
  } else if (days >= 7) {
    return { level: 'bright', hasParticles: false };
  } else if (days >= 4) {
    return { level: 'steady', hasParticles: false };
  }
  return { level: 'dim', hasParticles: false };
}

// Streak milestone achievements
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

/**
 * Check and unlock streak achievements
 */
export async function checkStreakAchievements(
  userId: string,
  streakDays: number
): Promise<string[]> {
  const unlockedTypes: string[] = [];

  for (const milestone of STREAK_MILESTONES) {
    if (streakDays >= milestone) {
      const type = `streak_${milestone}`;

      // Check if already unlocked
      const existing = await prisma.achievement.findUnique({
        where: {
          userId_type: { userId, type },
        },
      });

      if (!existing) {
        await prisma.achievement.create({
          data: {
            userId,
            type,
          },
        });
        unlockedTypes.push(type);
      }
    }
  }

  return unlockedTypes;
}

/**
 * Get all achievements for a user
 */
export async function getAchievements(
  userId: string
): Promise<Array<{ type: string; unlockedAt: Date }>> {
  return prisma.achievement.findMany({
    where: { userId },
    select: {
      type: true,
      unlockedAt: true,
    },
    orderBy: { unlockedAt: 'desc' },
  });
}

/**
 * Achievement definitions for display
 */
export const ACHIEVEMENT_DEFINITIONS: Record<
  string,
  { title: string; description: string; icon: string }
> = {
  streak_3: {
    title: 'Getting Started',
    description: '3 day streak',
    icon: 'flame',
  },
  streak_7: {
    title: 'One Week Strong',
    description: '7 day streak',
    icon: 'fire',
  },
  streak_14: {
    title: 'Two Weeks In',
    description: '14 day streak',
    icon: 'fire-plus',
  },
  streak_30: {
    title: 'Monthly Master',
    description: '30 day streak',
    icon: 'medal',
  },
  streak_60: {
    title: 'Consistency King',
    description: '60 day streak',
    icon: 'crown',
  },
  streak_100: {
    title: 'Century Club',
    description: '100 day streak',
    icon: 'trophy',
  },
  streak_365: {
    title: 'Year of Excellence',
    description: '365 day streak',
    icon: 'star',
  },
  perfect_balance: {
    title: 'Perfect Balance',
    description: 'Body & Mind both at 100',
    icon: 'yin-yang',
  },
  first_workout: {
    title: 'First Steps',
    description: 'Complete your first workout',
    icon: 'dumbbell',
  },
};
