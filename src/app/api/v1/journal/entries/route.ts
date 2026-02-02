/**
 * Journal Entries API
 *
 * GET /api/v1/journal/entries - Get paginated journal entries
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, badRequestError, internalError } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { JournalEntryType, Mood } from '@prisma/client'

/**
 * GET /api/v1/journal/entries
 * Returns paginated journal entries for the authenticated user
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - entryType: Filter by entry type (GRATITUDE, REFLECTION, FREE_WRITE, etc.)
 * - mood: Filter by mood
 * - search: Search in content
 * - startDate: Filter entries after this date (ISO string)
 * - endDate: Filter entries before this date (ISO string)
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    // Filters
    const entryType = searchParams.get('entryType')
    const mood = searchParams.get('mood')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate entry type
    if (entryType) {
      const validEntryTypes = Object.values(JournalEntryType)
      if (!validEntryTypes.includes(entryType as JournalEntryType)) {
        return badRequestError(`Invalid entryType. Must be one of: ${validEntryTypes.join(', ')}`)
      }
    }

    // Validate mood
    if (mood) {
      const validMoods = Object.values(Mood)
      if (!validMoods.includes(mood as Mood)) {
        return badRequestError(`Invalid mood. Must be one of: ${validMoods.join(', ')}`)
      }
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      activityCompletion: {
        activity: {
          userId: user.id,
          subCategory: 'JOURNALING',
        },
      },
    }

    if (entryType) {
      where.entryType = entryType as JournalEntryType
    }

    if (mood) {
      where.mood = mood as Mood
    }

    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive',
      }
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Fetch entries with total count
    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: {
          activityCompletion: {
            include: {
              activity: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.journalEntry.count({ where }),
    ])

    // Transform the response
    const transformedEntries = entries.map((entry) => ({
      id: entry.id,
      entryType: entry.entryType,
      mood: entry.mood,
      content: entry.content,
      wordCount: entry.wordCount,
      createdAt: entry.createdAt,
      activityName: entry.activityCompletion.activity.name,
    }))

    return successResponse({
      entries: transformedEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + entries.length < total,
      },
    })
  } catch (error) {
    console.error('Journal entries fetch error:', error)
    return internalError('Failed to fetch journal entries')
  }
})
