import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { successResponse, internalError } from '@/lib/api-response';
import { getRecommendations, Recommendation } from '@/lib/recommendations';

/**
 * GET /api/v1/recommendations
 *
 * Returns personalized recommendations for the authenticated user based on:
 * - Whoop recovery data (if connected)
 * - Current streak status and risk
 * - Habit stacks progress
 * - Daily motivational quote
 *
 * @returns {Object} response
 * @returns {boolean} response.success - Always true on success
 * @returns {Recommendation} response.data - The recommendations data
 *
 * @example Response
 * {
 *   "success": true,
 *   "data": {
 *     "recovery": {
 *       "score": 72,
 *       "zone": "green",
 *       "suggestion": "Great recovery! Push yourself today.",
 *       "suggestedActivities": ["TRAINING", "LEARNING"]
 *     },
 *     "streakStatus": {
 *       "current": 5,
 *       "atRisk": true,
 *       "hoursRemaining": 8.5,
 *       "quickActions": [
 *         { "activity": "MEDITATION", "label": "Breathe", "duration": "2 min" }
 *       ]
 *     },
 *     "nextInStack": {
 *       "stackName": "Morning Momentum",
 *       "activity": "MEDITATION",
 *       "afterCompleting": "TRAINING"
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
    const recommendations: Recommendation = await getRecommendations(user.id);

    return successResponse(recommendations);
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    return internalError('Failed to fetch recommendations');
  }
});
