/**
 * POST /api/v1/integrations/whoop/sync
 *
 * Manually trigger a Whoop data sync for the authenticated user.
 * Fetches sleep and workout data from Whoop and creates HabitCompletions.
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  notFoundError,
  internalError,
} from '@/lib/api-response'
import {
  syncWhoopData,
  WhoopConnectionNotFoundError,
  WhoopTokenRefreshError,
} from '@/lib/whoop-sync'

/**
 * POST /api/v1/integrations/whoop/sync
 *
 * Sync Whoop data for the authenticated user.
 *
 * Requires: Valid bearer token
 *
 * Returns:
 * - sleepSynced: Number of sleep records synced
 * - workoutsSynced: Number of workout records synced
 * - xpEarned: XP breakdown (sleep, fitness, total)
 * - errors: Any non-fatal errors encountered during sync
 */
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const result = await syncWhoopData(user.id)

    return successResponse({
      message: 'Whoop data synced successfully',
      sleepSynced: result.sleepSynced,
      workoutsSynced: result.workoutsSynced,
      xpEarned: result.xpEarned,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (error) {
    if (error instanceof WhoopConnectionNotFoundError) {
      return notFoundError('No Whoop connection found. Please connect your Whoop account first.')
    }

    if (error instanceof WhoopTokenRefreshError) {
      return notFoundError('Whoop authentication expired. Please reconnect your Whoop account.')
    }

    console.error('Whoop sync error:', error)
    return internalError('Failed to sync Whoop data')
  }
}
