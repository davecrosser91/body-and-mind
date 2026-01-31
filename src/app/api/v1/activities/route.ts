/**
 * Activity Logging API
 *
 * POST /api/v1/activities
 * Log an activity for a user. This endpoint supports:
 * - Manual activity logging from the app
 * - Whoop sync logging
 * - Claude bot integration for logging on behalf of users
 *
 * Creates or finds a habit for the pillar+category, creates a completion,
 * and updates streaks and daily goals.
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import {
  createdResponse,
  badRequestError,
  internalError,
} from '@/lib/api-response'
import { logActivity, LogActivityInput } from '@/lib/services/habit-completion'

/**
 * Valid pillars for activity logging
 */
const VALID_PILLARS = ['BODY', 'MIND'] as const

/**
 * Valid categories for each pillar
 */
const PILLAR_CATEGORIES = {
  BODY: ['TRAINING', 'SLEEP', 'NUTRITION'],
  MIND: ['MEDITATION', 'READING', 'LEARNING', 'JOURNALING'],
} as const

type Pillar = (typeof VALID_PILLARS)[number]
type BodyCategory = (typeof PILLAR_CATEGORIES.BODY)[number]
type MindCategory = (typeof PILLAR_CATEGORIES.MIND)[number]
type ActivityCategory = BodyCategory | MindCategory

/**
 * Request body for activity logging
 */
interface LogActivityRequest {
  pillar: Pillar
  category: ActivityCategory
  duration?: number
  details?: string
  source?: 'manual' | 'whoop' | 'api'
}

/**
 * Validate that a category is valid for the given pillar
 */
function isValidCategoryForPillar(
  pillar: Pillar,
  category: string
): category is ActivityCategory {
  const validCategories = PILLAR_CATEGORIES[pillar] as readonly string[]
  return validCategories.includes(category)
}

/**
 * POST /api/v1/activities
 * Log an activity for the authenticated user
 *
 * Request body:
 * - pillar: 'BODY' | 'MIND' (required)
 * - category: Category within the pillar (required)
 *   - BODY: 'TRAINING' | 'SLEEP' | 'NUTRITION'
 *   - MIND: 'MEDITATION' | 'READING' | 'LEARNING' | 'JOURNALING'
 * - duration?: number (optional, in minutes)
 * - details?: string (optional, notes about the activity)
 * - source?: 'manual' | 'whoop' | 'api' (optional, defaults to 'manual')
 *
 * Response:
 * - habitId: string - ID of the habit (may be newly created)
 * - completionId: string - ID of the completion record
 * - isNew: boolean - Whether a new habit was created
 * - message: string - Human-readable success message
 */
export const POST = requireAuth(async (request: NextRequest, { user }) => {
  try {
    // Parse request body
    let body: LogActivityRequest
    try {
      body = await request.json()
    } catch {
      return badRequestError('Invalid JSON in request body')
    }

    const { pillar, category, duration, details, source } = body

    // Validate pillar
    if (!pillar) {
      return badRequestError('pillar is required')
    }
    if (!VALID_PILLARS.includes(pillar as Pillar)) {
      return badRequestError(
        `Invalid pillar. Must be one of: ${VALID_PILLARS.join(', ')}`
      )
    }

    // Validate category
    if (!category) {
      return badRequestError('category is required')
    }
    if (!isValidCategoryForPillar(pillar as Pillar, category)) {
      const validCategories = PILLAR_CATEGORIES[pillar as Pillar]
      return badRequestError(
        `Invalid category for ${pillar}. Must be one of: ${validCategories.join(', ')}`
      )
    }

    // Validate duration if provided
    if (duration !== undefined) {
      if (typeof duration !== 'number' || duration < 0) {
        return badRequestError('duration must be a positive number (minutes)')
      }
    }

    // Validate source if provided
    const validSources = ['manual', 'whoop', 'api']
    if (source !== undefined && !validSources.includes(source)) {
      return badRequestError(
        `Invalid source. Must be one of: ${validSources.join(', ')}`
      )
    }

    // Build input for logActivity
    const input: LogActivityInput = {
      pillar: pillar as 'BODY' | 'MIND',
      category: category,
      duration,
      details,
      source: source as 'manual' | 'whoop' | 'api' | undefined,
    }

    // Log the activity
    const result = await logActivity(user.id, input)

    // Build success message
    let message = `Activity logged successfully`
    if (result.isNew) {
      message = `Activity logged and new habit created for ${category.toLowerCase()}`
    }

    return createdResponse({
      habitId: result.habitId,
      completionId: result.completionId,
      isNew: result.isNew,
      message,
    })
  } catch (error) {
    console.error('Activity logging error:', error)
    return internalError('Failed to log activity')
  }
})
