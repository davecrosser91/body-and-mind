import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { successResponse, internalError } from '@/lib/api-response';
import { getAllStreaks, AllStreaks } from '@/lib/streaks';

/**
 * GET /api/v1/streaks
 *
 * Returns streak information for all three pillar types (OVERALL, BODY, MIND)
 * for the authenticated user.
 *
 * The OVERALL streak requires BOTH Body AND Mind to have at least one completion
 * each day to maintain the streak. Missing either pillar resets the overall streak.
 *
 * @returns {Object} response
 * @returns {boolean} response.success - Always true on success
 * @returns {AllStreaks} response.data - Streak data for all pillars
 *
 * @example Response
 * {
 *   "success": true,
 *   "data": {
 *     "overall": {
 *       "current": 5,
 *       "longest": 14,
 *       "lastActiveDate": "2024-01-14",
 *       "atRisk": true,
 *       "hoursRemaining": 8.5
 *     },
 *     "body": {
 *       "current": 7,
 *       "longest": 20,
 *       "lastActiveDate": "2024-01-15",
 *       "atRisk": false,
 *       "hoursRemaining": 8.5
 *     },
 *     "mind": {
 *       "current": 5,
 *       "longest": 14,
 *       "lastActiveDate": "2024-01-14",
 *       "atRisk": true,
 *       "hoursRemaining": 8.5
 *     }
 *   }
 * }
 */
export const GET = requireAuth(async (_request: NextRequest, { user }) => {
  try {
    const streaks: AllStreaks = await getAllStreaks(user.id);

    return successResponse(streaks);
  } catch (error) {
    console.error('Streaks fetch error:', error);
    return internalError('Failed to fetch streak data');
  }
});
