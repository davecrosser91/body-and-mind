import { prisma } from './db';

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

// Minimum score to count as "active" for a day
const MIN_ACTIVE_SCORE = 30;

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
 * Check if a pillar was active on a given date (score >= threshold)
 */
async function wasPillarActive(
  userId: string,
  date: Date,
  pillarKey: PillarKey
): Promise<boolean> {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  const score = await prisma.dailyScore.findUnique({
    where: {
      userId_date: {
        userId,
        date: dateOnly,
      },
    },
    select: {
      bodyScore: true,
      mindScore: true,
      balanceIndex: true,
    },
  });

  if (!score) return false;

  if (pillarKey === 'BODY') {
    return score.bodyScore >= MIN_ACTIVE_SCORE;
  } else if (pillarKey === 'MIND') {
    return score.mindScore >= MIN_ACTIVE_SCORE;
  }

  // OVERALL: both pillars need to be active
  return score.bodyScore >= MIN_ACTIVE_SCORE && score.mindScore >= MIN_ACTIVE_SCORE;
}

/**
 * Check if a day is complete for a given pillar based on habit completions
 * For OVERALL, both Body AND Mind must have at least 1 completion
 */
export async function isDayComplete(
  userId: string,
  date: Date,
  pillarKey: PillarKey = 'OVERALL'
): Promise<boolean> {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  const dateEnd = new Date(dateOnly);
  dateEnd.setHours(23, 59, 59, 999);

  // Get habits with completions for the given date
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      archived: false,
      pillar: pillarKey === 'OVERALL' ? { in: ['BODY', 'MIND'] } : pillarKey,
    },
    include: {
      completions: {
        where: {
          completedAt: {
            gte: dateOnly,
            lte: dateEnd,
          },
        },
        take: 1,
      },
    },
  });

  if (pillarKey === 'BODY' || pillarKey === 'MIND') {
    // For single pillar, check if any habit was completed
    return habits.some((habit) => habit.completions.length > 0);
  }

  // For OVERALL, both Body AND Mind must have at least 1 completion
  const bodyHabits = habits.filter((h) => h.pillar === 'BODY');
  const mindHabits = habits.filter((h) => h.pillar === 'MIND');

  const bodyComplete = bodyHabits.some((h) => h.completions.length > 0);
  const mindComplete = mindHabits.some((h) => h.completions.length > 0);

  return bodyComplete && mindComplete;
}

/**
 * Internal function to get raw streak data from database
 */
async function getRawStreak(
  userId: string,
  pillarKey: PillarKey
): Promise<{ current: number; longest: number; lastActiveDate: Date | null }> {
  const existing = await prisma.streak.findUnique({
    where: {
      userId_pillarKey: {
        userId,
        pillarKey,
      },
    },
  });

  if (existing) {
    return {
      current: existing.current,
      longest: existing.longest,
      lastActiveDate: existing.lastActiveDate,
    };
  }

  // Create new streak record
  const created = await prisma.streak.create({
    data: {
      userId,
      pillarKey,
      current: 0,
      longest: 0,
      lastActiveDate: null,
    },
  });

  return {
    current: created.current,
    longest: created.longest,
    lastActiveDate: created.lastActiveDate,
  };
}

/**
 * Get streak info for a specific pillar with atRisk and hoursRemaining
 */
export async function getStreak(
  userId: string,
  pillarKey: PillarKey = 'OVERALL'
): Promise<StreakInfo> {
  const rawStreak = await getRawStreak(userId, pillarKey);
  const todayComplete = await isDayComplete(userId, new Date(), pillarKey);
  const hoursRemaining = getHoursRemainingToday();

  // At risk if: current streak > 0 AND today not complete
  const atRisk = rawStreak.current > 0 && !todayComplete;

  return {
    current: rawStreak.current,
    longest: rawStreak.longest,
    lastActiveDate: rawStreak.lastActiveDate
      ? rawStreak.lastActiveDate.toISOString().split('T')[0] as string
      : null,
    atRisk,
    hoursRemaining,
  };
}

/**
 * Get or create streak record (returns enhanced StreakInfo with atRisk and hoursRemaining)
 */
async function getOrCreateStreak(
  userId: string,
  pillarKey: PillarKey
): Promise<StreakInfo> {
  // Use the new getStreak function which includes atRisk and hoursRemaining
  return getStreak(userId, pillarKey);
}

/**
 * Update streak after completing a day
 * Updates the streak in the database and returns the enhanced StreakInfo
 */
export async function updateStreak(
  userId: string,
  pillarKey: PillarKey,
  date: Date
): Promise<StreakInfo> {
  const rawStreak = await getRawStreak(userId, pillarKey);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  const hoursRemaining = getHoursRemainingToday();

  // If already updated today, return current streak info
  if (rawStreak.lastActiveDate) {
    const lastDate = new Date(rawStreak.lastActiveDate);
    lastDate.setHours(0, 0, 0, 0);

    if (lastDate.getTime() === dateOnly.getTime()) {
      const todayComplete = await isDayComplete(userId, new Date(), pillarKey);
      return {
        current: rawStreak.current,
        longest: rawStreak.longest,
        lastActiveDate: rawStreak.lastActiveDate.toISOString().split('T')[0] as string,
        atRisk: rawStreak.current > 0 && !todayComplete,
        hoursRemaining,
      };
    }
  }

  // Check if active today using habit completions (for combined streak)
  const isActive = await isDayComplete(userId, date, pillarKey);

  if (!isActive) {
    // Check if we broke the streak (missed yesterday)
    if (rawStreak.lastActiveDate) {
      const lastDate = new Date(rawStreak.lastActiveDate);
      lastDate.setHours(0, 0, 0, 0);

      const daysSinceActive = Math.floor(
        (dateOnly.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActive > 1) {
        // Streak broken - reset to 0
        const updated = await prisma.streak.update({
          where: {
            userId_pillarKey: { userId, pillarKey },
          },
          data: {
            current: 0,
          },
        });

        return {
          current: updated.current,
          longest: updated.longest,
          lastActiveDate: updated.lastActiveDate
            ? updated.lastActiveDate.toISOString().split('T')[0] as string
            : null,
          atRisk: false, // Streak is 0, not at risk
          hoursRemaining,
        };
      }
    }

    // Not active today but streak not broken yet (yesterday was active)
    const todayComplete = await isDayComplete(userId, new Date(), pillarKey);
    return {
      current: rawStreak.current,
      longest: rawStreak.longest,
      lastActiveDate: rawStreak.lastActiveDate
        ? rawStreak.lastActiveDate.toISOString().split('T')[0] as string
        : null,
      atRisk: rawStreak.current > 0 && !todayComplete,
      hoursRemaining,
    };
  }

  // Active today - update streak
  let newCurrent = 1;

  if (rawStreak.lastActiveDate) {
    const lastDate = new Date(rawStreak.lastActiveDate);
    lastDate.setHours(0, 0, 0, 0);

    const daysSinceActive = Math.floor(
      (dateOnly.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActive === 1) {
      // Consecutive day - increment
      newCurrent = rawStreak.current + 1;
    } else if (daysSinceActive === 0) {
      // Same day - keep current
      newCurrent = rawStreak.current;
    }
    // If daysSinceActive > 1, streak was broken, start at 1
  }

  const newLongest = Math.max(rawStreak.longest, newCurrent);

  const updated = await prisma.streak.update({
    where: {
      userId_pillarKey: { userId, pillarKey },
    },
    data: {
      current: newCurrent,
      longest: newLongest,
      lastActiveDate: dateOnly,
    },
  });

  // Check for streak achievements
  await checkStreakAchievements(userId, newCurrent);

  return {
    current: updated.current,
    longest: updated.longest,
    lastActiveDate: updated.lastActiveDate
      ? updated.lastActiveDate.toISOString().split('T')[0] as string
      : null,
    atRisk: false, // Day is complete, not at risk
    hoursRemaining,
  };
}

/**
 * Update all streaks (overall, body, mind)
 */
export async function updateAllStreaks(
  userId: string,
  date: Date
): Promise<AllStreaks> {
  const [overall, body, mind] = await Promise.all([
    updateStreak(userId, 'OVERALL', date),
    updateStreak(userId, 'BODY', date),
    updateStreak(userId, 'MIND', date),
  ]);

  return { overall, body, mind };
}

/**
 * Get all streaks for a user
 */
export async function getAllStreaks(userId: string): Promise<AllStreaks> {
  const [overall, body, mind] = await Promise.all([
    getOrCreateStreak(userId, 'OVERALL'),
    getOrCreateStreak(userId, 'BODY'),
    getOrCreateStreak(userId, 'MIND'),
  ]);

  return { overall, body, mind };
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
async function checkStreakAchievements(
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
