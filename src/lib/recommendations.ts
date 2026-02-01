/**
 * Recommendations Service
 *
 * Provides personalized recommendations based on:
 * - Whoop recovery data (if connected)
 * - Streak status and risk
 * - Habit stacks progress
 * - Daily quote
 */

import { prisma } from './db';
import { getDailyStatus } from './daily-status';
import { getActiveStacks, HabitStackWithActivities, ActivityInStack } from './habit-stacks';
import { getDailyQuote } from './quotes';

// SubCategory is now a string, not an enum
type SubCategory = 'TRAINING' | 'MEDITATION' | 'READING' | 'NUTRITION' | 'LEARNING' | 'SLEEP' | 'JOURNALING';

// ============ TYPES ============

export interface QuickAction {
  activity: SubCategory;
  label: string;
  duration: string;
}

export interface RecoveryRecommendation {
  score: number | null;
  zone: 'green' | 'yellow' | 'red' | null;
  suggestion: string;
  suggestedActivities: SubCategory[];
}

export interface StreakStatusRecommendation {
  current: number;
  atRisk: boolean;
  hoursRemaining: number;
  quickActions: QuickAction[];
}

export interface NextInStackInfo {
  stackName: string;
  activity: ActivityInStack;
  afterCompleting: ActivityInStack | null;
}

export interface Quote {
  text: string;
  author: string | null;
}

export interface Recommendation {
  recovery: RecoveryRecommendation;
  streakStatus: StreakStatusRecommendation;
  nextInStack: NextInStackInfo | null;
  quote: Quote;
}

// ============ CONSTANTS ============

/**
 * Quick actions for each category
 * These are short, easy-to-complete activities for each pillar
 */
export const QUICK_ACTIONS: Record<SubCategory, QuickAction> = {
  TRAINING: {
    activity: 'TRAINING',
    label: 'Quick stretch',
    duration: '2 min',
  },
  MEDITATION: {
    activity: 'MEDITATION',
    label: 'Breathe',
    duration: '2 min',
  },
  READING: {
    activity: 'READING',
    label: 'Read 1 page',
    duration: '2 min',
  },
  NUTRITION: {
    activity: 'NUTRITION',
    label: 'Log a meal',
    duration: '1 min',
  },
  LEARNING: {
    activity: 'LEARNING',
    label: 'Quick lesson',
    duration: '5 min',
  },
  SLEEP: {
    activity: 'SLEEP',
    label: 'Log sleep',
    duration: '1 min',
  },
  JOURNALING: {
    activity: 'JOURNALING',
    label: 'Quick journal',
    duration: '3 min',
  },
};

/**
 * Recovery zone thresholds
 */
const RECOVERY_GREEN_THRESHOLD = 67;
const RECOVERY_YELLOW_THRESHOLD = 34;

/**
 * Categories by pillar for filtering
 */
const BODY_CATEGORIES: SubCategory[] = [
  'TRAINING',
  'SLEEP',
  'NUTRITION',
];

const MIND_CATEGORIES: SubCategory[] = [
  'MEDITATION',
  'READING',
  'LEARNING',
  'JOURNALING',
];

// ============ HELPER FUNCTIONS ============

/**
 * Get recovery zone based on score
 */
function getRecoveryZone(score: number): 'green' | 'yellow' | 'red' {
  if (score >= RECOVERY_GREEN_THRESHOLD) return 'green';
  if (score >= RECOVERY_YELLOW_THRESHOLD) return 'yellow';
  return 'red';
}

/**
 * Get recovery-based suggestions
 */
function getRecoverySuggestion(
  zone: 'green' | 'yellow' | 'red' | null
): { suggestion: string; suggestedActivities: SubCategory[] } {
  switch (zone) {
    case 'green':
      return {
        suggestion: 'Great recovery! Push yourself today.',
        suggestedActivities: ['TRAINING', 'LEARNING'],
      };
    case 'yellow':
      return {
        suggestion: 'Moderate recovery. Balance intensity.',
        suggestedActivities: [
          'TRAINING',
          'MEDITATION',
          'READING',
        ],
      };
    case 'red':
      return {
        suggestion: 'Rest day recommended. Focus on Mind.',
        suggestedActivities: [
          'MEDITATION',
          'READING',
          'SLEEP',
        ],
      };
    default:
      return {
        suggestion: 'Connect Whoop for personalized recommendations.',
        suggestedActivities: [],
      };
  }
}

/**
 * Get incomplete categories for the day based on activities
 */
async function getIncompleteCategories(
  userId: string
): Promise<{ body: SubCategory[]; mind: SubCategory[] }> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Get activities with today's completions
  const activities = await prisma.activity.findMany({
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
      },
    },
  });

  // Collect completed subcategories
  const completedSubCategories = new Set<string>();
  for (const activity of activities) {
    if (activity.completions.length > 0 && activity.subCategory) {
      completedSubCategories.add(activity.subCategory);
    }
  }

  // Find incomplete categories
  const incompleteBody = BODY_CATEGORIES.filter(
    (cat) => !completedSubCategories.has(cat)
  );
  const incompleteMind = MIND_CATEGORIES.filter(
    (cat) => !completedSubCategories.has(cat)
  );

  return {
    body: incompleteBody,
    mind: incompleteMind,
  };
}

/**
 * Get quick actions based on incomplete pillars
 */
function getQuickActionsForIncomplete(
  incompleteBody: SubCategory[],
  incompleteMind: SubCategory[],
  bodyCompleted: boolean,
  mindCompleted: boolean
): QuickAction[] {
  const actions: QuickAction[] = [];

  // If body pillar not completed, suggest body activities
  if (!bodyCompleted) {
    // Prioritize TRAINING
    if (incompleteBody.includes('TRAINING')) {
      const action = QUICK_ACTIONS['TRAINING'];
      if (action) actions.push(action);
    } else if (incompleteBody.length > 0) {
      // Add first incomplete body activity
      const first = incompleteBody[0];
      if (first) {
        const action = QUICK_ACTIONS[first];
        if (action) actions.push(action);
      }
    }
  }

  // If mind pillar not completed, suggest mind activities
  if (!mindCompleted) {
    // Prioritize MEDITATION
    if (incompleteMind.includes('MEDITATION')) {
      const action = QUICK_ACTIONS['MEDITATION'];
      if (action) actions.push(action);
    } else if (incompleteMind.length > 0) {
      // Add first incomplete mind activity
      const first = incompleteMind[0];
      if (first) {
        const action = QUICK_ACTIONS[first];
        if (action) actions.push(action);
      }
    }
  }

  // If both are completed but streak is at risk, suggest additional activities
  if (bodyCompleted && mindCompleted && actions.length === 0) {
    // Return empty - no quick actions needed
    return [];
  }

  return actions;
}

/**
 * Find the next incomplete activity in active stacks
 */
async function findNextInStack(
  userId: string,
  completedActivityIds: Set<string>
): Promise<NextInStackInfo | null> {
  const activeStacks = await getActiveStacks(userId);

  for (const stack of activeStacks) {
    let previousActivity: ActivityInStack | null = null;

    for (const activity of stack.activities) {
      if (!completedActivityIds.has(activity.id)) {
        return {
          stackName: stack.name,
          activity,
          afterCompleting: previousActivity,
        };
      }
      previousActivity = activity;
    }
  }

  return null;
}

// ============ MAIN FUNCTION ============

/**
 * Get personalized recommendations for a user
 *
 * Combines recovery data, streak status, and habit stack progress
 * to provide actionable recommendations.
 */
export async function getRecommendations(userId: string): Promise<Recommendation> {
  // Fetch daily status and quote in parallel
  const [dailyStatus, quote] = await Promise.all([
    getDailyStatus(userId),
    getDailyQuote(userId),
  ]);

  // Build recovery recommendation
  const recoveryZone = dailyStatus.recovery?.zone ?? null;
  const recoverySuggestions = getRecoverySuggestion(recoveryZone);

  const recovery: RecoveryRecommendation = {
    score: dailyStatus.recovery?.score ?? null,
    zone: recoveryZone,
    suggestion: recoverySuggestions.suggestion,
    suggestedActivities: recoverySuggestions.suggestedActivities,
  };

  // Get incomplete categories
  const incompleteCategories = await getIncompleteCategories(userId);

  // Build streak status with quick actions
  const quickActions = getQuickActionsForIncomplete(
    incompleteCategories.body,
    incompleteCategories.mind,
    dailyStatus.body.completed,
    dailyStatus.mind.completed
  );

  const streakStatus: StreakStatusRecommendation = {
    current: dailyStatus.streak.current,
    atRisk: dailyStatus.streak.atRisk,
    hoursRemaining: dailyStatus.streak.hoursRemaining,
    quickActions,
  };

  // Get completed activity IDs for next-in-stack calculation
  const completedActivityIds = new Set<string>();
  for (const activity of dailyStatus.body.activities) {
    completedActivityIds.add(activity.id);
  }
  for (const activity of dailyStatus.mind.activities) {
    completedActivityIds.add(activity.id);
  }

  // Find next activity in stack
  const nextInStack = await findNextInStack(userId, completedActivityIds);

  return {
    recovery,
    streakStatus,
    nextInStack,
    quote: {
      text: quote.text,
      author: quote.author,
    },
  };
}
