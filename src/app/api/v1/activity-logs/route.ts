/**
 * Activity Logs API
 *
 * GET /api/v1/activity-logs - Get activity completions for a date
 * POST /api/v1/activity-logs - Quick log an activity (simple completion)
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  createdResponse,
  badRequestError,
  notFoundError,
  conflictError,
  internalError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { Pillar, Source } from '@prisma/client'
import { updateStreaksForDate } from '@/lib/streaks'

/**
 * GET /api/v1/activity-logs
 * Returns activity completions for a specific date
 *
 * Query params:
 * - pillar: Filter by pillar (BODY, MIND)
 * - date: Date in YYYY-MM-DD format (defaults to today)
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url)
    const pillarParam = searchParams.get('pillar')
    const dateParam = searchParams.get('date')

    // Parse date
    let targetDate: Date
    if (dateParam) {
      targetDate = new Date(dateParam)
      if (isNaN(targetDate.getTime())) {
        return badRequestError('Invalid date format. Use YYYY-MM-DD')
      }
    } else {
      targetDate = new Date()
    }

    // Set date range for the target day
    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

    // Build where clause for activities
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activityWhere: any = {
      userId: user.id,
    }

    if (pillarParam) {
      const validPillars = Object.values(Pillar)
      if (!validPillars.includes(pillarParam as Pillar)) {
        return badRequestError(
          `Invalid pillar. Must be one of: ${validPillars.join(', ')}`
        )
      }
      activityWhere.pillar = pillarParam as Pillar
    }

    // Fetch completions for the date range
    const completions = await prisma.activityCompletion.findMany({
      where: {
        completedAt: {
          gte: dayStart,
          lte: dayEnd,
        },
        activity: activityWhere,
      },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            pillar: true,
            subCategory: true,
          },
        },
        meditationDetails: true,
        journalEntry: true,
        trainingDetails: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    })

    // Map to response format
    const logs = completions.map((completion) => ({
      id: completion.id,
      activityId: completion.activity.id,
      activityName: completion.activity.name,
      pillar: completion.activity.pillar,
      subCategory: completion.activity.subCategory,
      pointsEarned: completion.pointsEarned,
      completedAt: completion.completedAt,
      details: completion.details,
      source: completion.source,
      meditationDetails: completion.meditationDetails
        ? {
            durationMinutes: completion.meditationDetails.durationMinutes,
            technique: completion.meditationDetails.technique,
            moodBefore: completion.meditationDetails.moodBefore,
            moodAfter: completion.meditationDetails.moodAfter,
          }
        : null,
      journalEntry: completion.journalEntry
        ? {
            entryType: completion.journalEntry.entryType,
            mood: completion.journalEntry.mood,
            content: completion.journalEntry.content,
            wordCount: completion.journalEntry.wordCount,
          }
        : null,
      trainingDetails: completion.trainingDetails
        ? {
            workoutType: completion.trainingDetails.workoutType,
            durationMinutes: completion.trainingDetails.durationMinutes,
            intensity: completion.trainingDetails.intensity,
            muscleGroups: completion.trainingDetails.muscleGroups,
            calories: completion.trainingDetails.calories,
            rpe: completion.trainingDetails.rpe,
          }
        : null,
    }))

    return successResponse(logs)
  } catch (error) {
    console.error('Activity logs fetch error:', error)
    return internalError('Failed to fetch activity logs')
  }
})

/**
 * POST /api/v1/activity-logs
 * Quick log an activity (simple completion without additional details)
 *
 * Request body:
 * - activityId: string (required)
 */
export const POST = requireAuth(async (request: NextRequest, { user }) => {
  try {
    let body: { activityId?: string }

    try {
      body = await request.json()
    } catch {
      return badRequestError('Invalid JSON in request body')
    }

    const { activityId } = body

    if (!activityId) {
      return badRequestError('activityId is required')
    }

    // Find the activity
    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        userId: user.id,
        archived: false,
      },
    })

    if (!activity) {
      return notFoundError('Activity not found')
    }

    // Check if already completed today (for habits)
    if (activity.isHabit) {
      const now = new Date()
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(now)
      todayEnd.setHours(23, 59, 59, 999)

      const existingCompletion = await prisma.activityCompletion.findFirst({
        where: {
          activityId: activity.id,
          completedAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      })

      if (existingCompletion) {
        return conflictError('Activity already completed today')
      }
    }

    // Create the completion
    const completion = await prisma.activityCompletion.create({
      data: {
        activityId: activity.id,
        pointsEarned: activity.points,
        source: Source.MANUAL,
      },
      include: {
        activity: {
          select: {
            name: true,
            pillar: true,
            subCategory: true,
          },
        },
      },
    })

    // Update streaks after activity completion
    updateStreaksForDate(user.id, new Date()).catch((error) => {
      console.error('[Streaks] Update error after activity log:', error)
    })

    return createdResponse({
      id: completion.id,
      activityId: completion.activityId,
      activityName: completion.activity.name,
      pillar: completion.activity.pillar,
      subCategory: completion.activity.subCategory,
      pointsEarned: completion.pointsEarned,
      completedAt: completion.completedAt,
      source: completion.source,
    })
  } catch (error) {
    console.error('Activity log creation error:', error)
    return internalError('Failed to log activity')
  }
})
