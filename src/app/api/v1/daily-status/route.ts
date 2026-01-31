import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { successResponse, internalError } from '@/lib/api-response';
import { getDailyStatus, DailyStatus } from '@/lib/daily-status';

/**
 * GET /api/v1/daily-status
 *
 * Returns the daily status for the authenticated user including:
 * - Body and Mind completion status
 * - Activity scores and completed activities
 * - Streak information with at-risk warnings
 * - Whoop recovery data (if connected)
 * - Daily motivational quote
 *
 * @returns {Object} response
 * @returns {boolean} response.success - Always true on success
 * @returns {DailyStatus} response.data - The daily status data
 *
 * @example Response
 * {
 *   "success": true,
 *   "data": {
 *     "date": "2024-01-15",
 *     "body": {
 *       "completed": true,
 *       "score": 70,
 *       "activities": [
 *         {
 *           "id": "clx123...",
 *           "name": "Morning Workout",
 *           "category": "TRAINING",
 *           "completedAt": "2024-01-15T07:30:00.000Z"
 *         }
 *       ]
 *     },
 *     "mind": {
 *       "completed": false,
 *       "score": 0,
 *       "activities": []
 *     },
 *     "streak": {
 *       "current": 5,
 *       "atRisk": true,
 *       "hoursRemaining": 8.5
 *     },
 *     "recovery": {
 *       "score": 72,
 *       "zone": "green",
 *       "recommendation": "Your body is well recovered. Great day for intense training!"
 *     },
 *     "quote": {
 *       "text": "The only bad workout is the one that didn't happen.",
 *       "author": null
 *     }
 *   }
 * }
 */
export const GET = requireAuth(async (_request: NextRequest, { user }) => {
  try {
    const dailyStatus: DailyStatus = await getDailyStatus(user.id);

    return successResponse(dailyStatus);
  } catch (error) {
    console.error('Daily status fetch error:', error);
    return internalError('Failed to fetch daily status');
  }
});
