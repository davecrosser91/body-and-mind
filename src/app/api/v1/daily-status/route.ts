import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { successResponse, badRequestError, internalError } from '@/lib/api-response';
import { getDailyStatus, DailyStatus } from '@/lib/daily-status';
import { prisma } from '@/lib/db';
import { syncWhoopData, WhoopConnectionNotFoundError, WhoopTokenRefreshError } from '@/lib/whoop-sync';

/**
 * Parse and validate a date string (YYYY-MM-DD format)
 * Returns null if invalid
 */
function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10) - 1; // JS months are 0-indexed
  const day = parseInt(match[3]!, 10);

  const date = new Date(year, month, day);

  // Validate the date is real (e.g., not Feb 30)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Auto-sync interval: 15 minutes */
const AUTO_SYNC_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Check if Whoop auto-sync is needed and trigger if so
 * Runs in background, doesn't block the response
 */
async function maybeAutoSyncWhoop(userId: string): Promise<void> {
  try {
    const connection = await prisma.whoopConnection.findUnique({
      where: { userId },
      select: { lastSync: true },
    });

    if (!connection) return;

    const now = new Date();
    const lastSync = connection.lastSync;

    // Auto-sync if never synced or more than 15 minutes ago
    if (!lastSync || now.getTime() - lastSync.getTime() > AUTO_SYNC_INTERVAL_MS) {
      console.log(`Auto-syncing Whoop data for user ${userId}`);
      await syncWhoopData(userId);
    }
  } catch (error) {
    // Don't throw - auto-sync errors shouldn't break the request
    if (error instanceof WhoopConnectionNotFoundError || error instanceof WhoopTokenRefreshError) {
      console.log('Whoop auto-sync skipped:', error.message);
    } else {
      console.error('Whoop auto-sync error:', error);
    }
  }
}

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
 *
 * Query Parameters:
 * - date (optional): Date in YYYY-MM-DD format. Defaults to today.
 *
 * @example Historical request
 * GET /api/v1/daily-status?date=2025-01-15
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    // Parse optional date parameter
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    let targetDate: Date | undefined;
    if (dateParam) {
      targetDate = parseDate(dateParam) ?? undefined;
      if (!targetDate) {
        return badRequestError('Invalid date format. Use YYYY-MM-DD');
      }

      // Don't allow future dates
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (targetDate > today) {
        return badRequestError('Cannot fetch status for future dates');
      }
    }

    // Only trigger auto-sync for today's data (await so auto-triggers complete before fetching status)
    if (!dateParam) {
      await maybeAutoSyncWhoop(user.id);
    }

    const dailyStatus: DailyStatus = await getDailyStatus(user.id, targetDate);

    return successResponse(dailyStatus);
  } catch (error) {
    console.error('Daily status fetch error:', error);
    return internalError('Failed to fetch daily status');
  }
});
