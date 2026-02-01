/**
 * Activities API
 *
 * GET /api/v1/activities - List activities for the authenticated user
 * POST /api/v1/activities - Create a new activity
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  createdResponse,
  badRequestError,
  internalError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { Pillar, Frequency, CueType } from '@prisma/client'

/**
 * GET /api/v1/activities
 * Returns all non-archived activities for the authenticated user
 *
 * Query params:
 * - pillar: Filter by pillar (BODY, MIND)
 * - subCategory: Filter by subCategory
 * - habitsOnly: If 'true', only return activities where isHabit = true
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url)
    const pillarParam = searchParams.get('pillar')
    const subCategoryParam = searchParams.get('subCategory')
    const habitsOnlyParam = searchParams.get('habitsOnly')

    // Validate pillar if provided
    if (pillarParam && !isValidPillar(pillarParam)) {
      return badRequestError(
        `Invalid pillar. Must be one of: ${Object.values(Pillar).join(', ')}`
      )
    }

    // Build the where clause
    const whereClause: {
      userId: string
      archived: boolean
      pillar?: Pillar
      subCategory?: string
      isHabit?: boolean
    } = {
      userId: user.id,
      archived: false,
    }

    if (pillarParam) {
      whereClause.pillar = pillarParam as Pillar
    }

    if (subCategoryParam) {
      whereClause.subCategory = subCategoryParam.toUpperCase()
    }

    if (habitsOnlyParam === 'true') {
      whereClause.isHabit = true
    }

    // Fetch activities
    const activities = await prisma.activity.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    })

    // Map to response format
    const activitiesResponse = activities.map((activity) => ({
      id: activity.id,
      name: activity.name,
      pillar: activity.pillar,
      subCategory: activity.subCategory,
      frequency: activity.frequency,
      description: activity.description,
      points: activity.points,
      isHabit: activity.isHabit,
      cueType: activity.cueType,
      cueValue: activity.cueValue,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    }))

    return successResponse(activitiesResponse)
  } catch (error) {
    console.error('Activities fetch error:', error)
    return internalError('Failed to fetch activities')
  }
})

/**
 * Check if a string is a valid Pillar enum value
 */
function isValidPillar(value: string): value is Pillar {
  return Object.values(Pillar).includes(value as Pillar)
}

/**
 * POST /api/v1/activities
 * Create a new activity for the authenticated user
 *
 * Request body:
 * - name: string (required)
 * - pillar: 'BODY' | 'MIND' (required)
 * - subCategory: string (required)
 * - points?: number (optional, defaults to 25)
 * - isHabit?: boolean (optional, defaults to false)
 * - description?: string (optional)
 * - frequency?: 'DAILY' | 'WEEKLY' | 'CUSTOM' (optional, defaults to DAILY)
 * - cueType?: 'TIME' | 'LOCATION' | 'AFTER_ACTIVITY' (optional)
 * - cueValue?: string (optional)
 */
export const POST = requireAuth(async (request: NextRequest, { user }) => {
  try {
    // Parse request body
    let body: {
      name?: string
      pillar?: string
      subCategory?: string
      points?: number
      isHabit?: boolean
      description?: string
      frequency?: string
      cueType?: string
      cueValue?: string
    }

    try {
      body = await request.json()
    } catch {
      return badRequestError('Invalid JSON in request body')
    }

    const {
      name,
      pillar,
      subCategory,
      points = 25,
      isHabit = false,
      description,
      frequency = 'DAILY',
      cueType,
      cueValue,
    } = body

    // Validate required fields
    if (!name) {
      return badRequestError('name is required')
    }

    if (!pillar) {
      return badRequestError('pillar is required')
    }

    if (!isValidPillar(pillar)) {
      return badRequestError(
        `Invalid pillar. Must be one of: ${Object.values(Pillar).join(', ')}`
      )
    }

    if (!subCategory) {
      return badRequestError('subCategory is required')
    }

    // Validate frequency if provided
    const validFrequencies = Object.values(Frequency)
    if (!validFrequencies.includes(frequency as Frequency)) {
      return badRequestError(
        `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`
      )
    }

    // Validate cueType if provided
    if (cueType) {
      const validCueTypes = Object.values(CueType)
      if (!validCueTypes.includes(cueType as CueType)) {
        return badRequestError(
          `Invalid cueType. Must be one of: ${validCueTypes.join(', ')}`
        )
      }

      // Validate cue value if cue type is provided
      if (cueType === 'TIME') {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
        if (!cueValue || !timeRegex.test(cueValue)) {
          return badRequestError(
            'cueValue must be in HH:mm format for TIME cue type'
          )
        }
      } else if (!cueValue || cueValue.trim().length === 0) {
        return badRequestError(`cueValue is required when cueType is ${cueType}`)
      }
    }

    // Create the activity
    const activity = await prisma.activity.create({
      data: {
        name,
        pillar: pillar as Pillar,
        subCategory: subCategory.toUpperCase(),
        points,
        isHabit,
        description: description || null,
        frequency: frequency as Frequency,
        cueType: cueType ? (cueType as CueType) : null,
        cueValue: cueValue || null,
        userId: user.id,
      },
    })

    return createdResponse({
      id: activity.id,
      name: activity.name,
      pillar: activity.pillar,
      subCategory: activity.subCategory,
      frequency: activity.frequency,
      description: activity.description,
      points: activity.points,
      isHabit: activity.isHabit,
      cueType: activity.cueType,
      cueValue: activity.cueValue,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    })
  } catch (error) {
    console.error('Activity creation error:', error)
    return internalError('Failed to create activity')
  }
})
