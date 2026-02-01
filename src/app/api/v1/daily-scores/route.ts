/**
 * Daily Scores History API
 *
 * GET /api/v1/daily-scores - Get historical daily scores
 *
 * Query Parameters:
 * - days: Number of days to fetch (default: 7, max: 365)
 * - startDate: Start date in YYYY-MM-DD format (alternative to days)
 * - endDate: End date in YYYY-MM-DD format (defaults to today)
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { successResponse, badRequestError, internalError } from '@/lib/api-response';
import { prisma } from '@/lib/db';

/**
 * Parse and validate a date string (YYYY-MM-DD format)
 * Returns null if invalid
 */
function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10) - 1;
  const day = parseInt(match[3]!, 10);

  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * GET /api/v1/daily-scores
 *
 * Returns historical daily scores for charting and analytics
 *
 * @example Response
 * {
 *   "success": true,
 *   "data": {
 *     "scores": [
 *       {
 *         "date": "2025-01-15",
 *         "bodyScore": 72,
 *         "mindScore": 65,
 *         "balanceIndex": 68,
 *         "bodyComplete": true,
 *         "mindComplete": false,
 *         "subScores": {
 *           "training": 80,
 *           "sleep": 70,
 *           "nutrition": 60,
 *           "meditation": 75,
 *           "reading": 50,
 *           "learning": 60
 *         }
 *       }
 *     ],
 *     "summary": {
 *       "totalDays": 7,
 *       "daysWithData": 5,
 *       "averageBody": 68,
 *       "averageMind": 62,
 *       "averageBalance": 65,
 *       "perfectDays": 2,
 *       "bodyCompleteDays": 4,
 *       "mindCompleteDays": 3
 *     }
 *   }
 * }
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let startDate: Date;
    let endDate: Date = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Parse end date if provided
    if (endDateParam) {
      const parsed = parseDate(endDateParam);
      if (!parsed) {
        return badRequestError('Invalid endDate format. Use YYYY-MM-DD');
      }
      endDate = parsed;
      endDate.setHours(23, 59, 59, 999);
    }

    // Parse start date or calculate from days
    if (startDateParam) {
      const parsed = parseDate(startDateParam);
      if (!parsed) {
        return badRequestError('Invalid startDate format. Use YYYY-MM-DD');
      }
      startDate = parsed;
    } else {
      const days = daysParam ? parseInt(daysParam, 10) : 7;
      if (isNaN(days) || days < 1 || days > 365) {
        return badRequestError('days must be a number between 1 and 365');
      }
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days + 1);
    }

    startDate.setHours(0, 0, 0, 0);

    // Validate date range
    if (startDate > endDate) {
      return badRequestError('startDate must be before endDate');
    }

    // Fetch scores from database
    const scores = await prisma.dailyScore.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Format scores for response
    const formattedScores = scores.map((score) => ({
      date: score.date.toISOString().split('T')[0],
      bodyScore: score.bodyScore,
      mindScore: score.mindScore,
      balanceIndex: score.balanceIndex,
      bodyPoints: score.bodyPoints,
      mindPoints: score.mindPoints,
      bodyComplete: score.bodyComplete,
      mindComplete: score.mindComplete,
      subScores: {
        training: score.trainingScore ?? 0,
        sleep: score.sleepScore ?? 0,
        nutrition: score.nutritionScore ?? 0,
        meditation: score.meditationScore ?? 0,
        reading: score.readingScore ?? 0,
        learning: score.learningScore ?? 0,
      },
      whoop: score.whoopStrain !== null ? {
        strain: score.whoopStrain,
        sleep: score.whoopSleep,
        recovery: score.whoopRecovery,
      } : null,
    }));

    // Calculate summary statistics
    const daysWithData = scores.length;
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const perfectDays = scores.filter((s) => s.bodyComplete && s.mindComplete).length;
    const bodyCompleteDays = scores.filter((s) => s.bodyComplete).length;
    const mindCompleteDays = scores.filter((s) => s.mindComplete).length;

    const averageBody = daysWithData > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.bodyScore, 0) / daysWithData)
      : 0;
    const averageMind = daysWithData > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.mindScore, 0) / daysWithData)
      : 0;
    const averageBalance = daysWithData > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.balanceIndex, 0) / daysWithData)
      : 0;

    return successResponse({
      scores: formattedScores,
      summary: {
        totalDays,
        daysWithData,
        averageBody,
        averageMind,
        averageBalance,
        perfectDays,
        bodyCompleteDays,
        mindCompleteDays,
      },
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Daily scores fetch error:', error);
    return internalError('Failed to fetch daily scores');
  }
});
