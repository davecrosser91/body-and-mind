import { prisma } from './db';
import { Pillar, SubCategory } from '@prisma/client';

// Category to Pillar/SubCategory mapping for migration
export const CATEGORY_MAPPING: Record<string, { pillar: Pillar; subCategory: SubCategory }> = {
  FITNESS: { pillar: 'BODY', subCategory: 'TRAINING' },
  SLEEP: { pillar: 'BODY', subCategory: 'SLEEP' },
  NUTRITION: { pillar: 'BODY', subCategory: 'NUTRITION' },
  MINDFULNESS: { pillar: 'MIND', subCategory: 'MEDITATION' },
  LEARNING: { pillar: 'MIND', subCategory: 'LEARNING' },
};

// Sub-category weights for score calculation
const BODY_WEIGHTS = {
  TRAINING: 0.35,
  SLEEP: 0.40,
  NUTRITION: 0.25,
};

const MIND_WEIGHTS = {
  MEDITATION: 0.35,
  READING: 0.30,
  LEARNING: 0.25,
  JOURNALING: 0.10,
};

interface WhoopData {
  strain?: number;        // 0-21
  sleepPerformance?: number; // 0-100
  recoveryScore?: number; // 0-100
  sleepEfficiency?: number; // 0-100
}

interface SubScores {
  trainingScore: number;
  sleepScore: number;
  nutritionScore: number;
  meditationScore: number;
  readingScore: number;
  learningScore: number;
}

interface DailyScoreResult {
  bodyScore: number;
  mindScore: number;
  balanceIndex: number;
  subScores: SubScores;
}

/**
 * Calculate completion percentage for habits in a specific sub-category
 */
async function getSubCategoryCompletionScore(
  userId: string,
  subCategory: SubCategory,
  date: Date
): Promise<number> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all active habits in this sub-category
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      subCategory,
      archived: false,
    },
    include: {
      completions: {
        where: {
          completedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      },
    },
  });

  if (habits.length === 0) return 0;

  // Calculate completion percentage
  const completedCount = habits.filter((h: typeof habits[number]) => h.completions.length > 0).length;
  let score = (completedCount / habits.length) * 100;

  // Bonus: +10 points if any completion has details
  const hasDetails = habits.some((h: typeof habits[number]) =>
    h.completions.some((c: typeof h.completions[number]) => c.details && c.details.length > 0)
  );
  if (hasDetails) {
    score = Math.min(100, score + 10);
  }

  return Math.round(score);
}

/**
 * Calculate training score from Whoop data or manual habits
 */
function calculateTrainingScore(whoopData?: WhoopData, manualScore?: number): number {
  if (whoopData?.strain !== undefined) {
    // Whoop strain is 0-21, map to 0-100
    // 10+ strain is a good workout, 14+ is intense
    const strainScore = Math.min(100, (whoopData.strain / 15) * 100);
    return Math.round(strainScore);
  }
  return manualScore ?? 0;
}

/**
 * Calculate sleep score from Whoop data or manual habits
 */
function calculateSleepScore(whoopData?: WhoopData, manualScore?: number): number {
  if (whoopData?.sleepPerformance !== undefined) {
    let score = whoopData.sleepPerformance;

    // Recovery modifier: adjust score based on recovery
    if (whoopData.recoveryScore !== undefined) {
      const recoveryModifier = 0.8 + (whoopData.recoveryScore / 500);
      score = score * recoveryModifier;
    }

    // Efficiency bonus
    if (whoopData.sleepEfficiency !== undefined && whoopData.sleepEfficiency > 85) {
      score += 5;
    }

    return Math.round(Math.min(100, score));
  }
  return manualScore ?? 0;
}

/**
 * Calculate daily scores for a user
 */
export async function calculateDailyScores(
  userId: string,
  date: Date,
  whoopData?: WhoopData
): Promise<DailyScoreResult> {
  // Get manual completion scores for each sub-category
  const [
    manualTraining,
    manualSleep,
    nutritionScore,
    meditationScore,
    readingScore,
    learningScore,
  ] = await Promise.all([
    getSubCategoryCompletionScore(userId, 'TRAINING', date),
    getSubCategoryCompletionScore(userId, 'SLEEP', date),
    getSubCategoryCompletionScore(userId, 'NUTRITION', date),
    getSubCategoryCompletionScore(userId, 'MEDITATION', date),
    getSubCategoryCompletionScore(userId, 'READING', date),
    getSubCategoryCompletionScore(userId, 'LEARNING', date),
  ]);

  // Calculate final sub-scores (Whoop data overrides manual for training/sleep)
  const trainingScore = calculateTrainingScore(whoopData, manualTraining);
  const sleepScore = calculateSleepScore(whoopData, manualSleep);

  // Calculate Body score (weighted average)
  const bodyComponents = [
    { value: trainingScore, weight: BODY_WEIGHTS.TRAINING },
    { value: sleepScore, weight: BODY_WEIGHTS.SLEEP },
    { value: nutritionScore, weight: BODY_WEIGHTS.NUTRITION },
  ];

  const bodyScore = Math.round(
    bodyComponents.reduce((sum, c) => sum + c.value * c.weight, 0)
  );

  // Calculate Mind score (weighted average)
  const mindComponents = [
    { value: meditationScore, weight: MIND_WEIGHTS.MEDITATION },
    { value: readingScore, weight: MIND_WEIGHTS.READING },
    { value: learningScore, weight: MIND_WEIGHTS.LEARNING },
  ];

  const mindScore = Math.round(
    mindComponents.reduce((sum, c) => sum + c.value * c.weight, 0)
  );

  // Calculate Balance Index
  let balanceIndex = Math.round((bodyScore + mindScore) / 2);

  // Bonus: +5 points if pillars are balanced (within 15 points)
  const pillarDiff = Math.abs(bodyScore - mindScore);
  if (pillarDiff <= 15 && bodyScore > 0 && mindScore > 0) {
    balanceIndex = Math.min(100, balanceIndex + 5);
  }

  return {
    bodyScore,
    mindScore,
    balanceIndex,
    subScores: {
      trainingScore,
      sleepScore,
      nutritionScore,
      meditationScore,
      readingScore,
      learningScore,
    },
  };
}

/**
 * Save or update daily score in database
 */
export async function saveDailyScore(
  userId: string,
  date: Date,
  scores: DailyScoreResult,
  whoopData?: WhoopData
): Promise<void> {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  await prisma.dailyScore.upsert({
    where: {
      userId_date: {
        userId,
        date: dateOnly,
      },
    },
    update: {
      bodyScore: scores.bodyScore,
      mindScore: scores.mindScore,
      balanceIndex: scores.balanceIndex,
      trainingScore: scores.subScores.trainingScore,
      sleepScore: scores.subScores.sleepScore,
      nutritionScore: scores.subScores.nutritionScore,
      meditationScore: scores.subScores.meditationScore,
      readingScore: scores.subScores.readingScore,
      learningScore: scores.subScores.learningScore,
      whoopStrain: whoopData?.strain,
      whoopSleep: whoopData?.sleepPerformance,
      whoopRecovery: whoopData?.recoveryScore,
    },
    create: {
      userId,
      date: dateOnly,
      bodyScore: scores.bodyScore,
      mindScore: scores.mindScore,
      balanceIndex: scores.balanceIndex,
      trainingScore: scores.subScores.trainingScore,
      sleepScore: scores.subScores.sleepScore,
      nutritionScore: scores.subScores.nutritionScore,
      meditationScore: scores.subScores.meditationScore,
      readingScore: scores.subScores.readingScore,
      learningScore: scores.subScores.learningScore,
      whoopStrain: whoopData?.strain,
      whoopSleep: whoopData?.sleepPerformance,
      whoopRecovery: whoopData?.recoveryScore,
    },
  });
}

/**
 * Get recent daily scores for trends
 */
export async function getRecentScores(
  userId: string,
  days: number = 7
): Promise<Array<{
  date: Date;
  bodyScore: number;
  mindScore: number;
  balanceIndex: number;
}>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return prisma.dailyScore.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    select: {
      date: true,
      bodyScore: true,
      mindScore: true,
      balanceIndex: true,
    },
    orderBy: { date: 'asc' },
  });
}

/**
 * Get today's score or calculate if not exists
 */
export async function getTodayScore(
  userId: string,
  whoopData?: WhoopData
): Promise<{
  bodyScore: number;
  mindScore: number;
  balanceIndex: number;
  subScores: SubScores;
  isNew: boolean;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if we have today's score
  const existing = await prisma.dailyScore.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existing) {
    return {
      bodyScore: existing.bodyScore,
      mindScore: existing.mindScore,
      balanceIndex: existing.balanceIndex,
      subScores: {
        trainingScore: existing.trainingScore ?? 0,
        sleepScore: existing.sleepScore ?? 0,
        nutritionScore: existing.nutritionScore ?? 0,
        meditationScore: existing.meditationScore ?? 0,
        readingScore: existing.readingScore ?? 0,
        learningScore: existing.learningScore ?? 0,
      },
      isNew: false,
    };
  }

  // Calculate new score
  const scores = await calculateDailyScores(userId, today, whoopData);
  await saveDailyScore(userId, today, scores, whoopData);

  return { ...scores, isNew: true };
}
