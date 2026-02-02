/**
 * Journal Entry Detail API
 *
 * GET /api/v1/journal/entries/[id] - Get a specific journal entry
 * DELETE /api/v1/journal/entries/[id] - Delete a journal entry
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { successResponse, notFoundError, internalError } from '@/lib/api-response'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/journal/entries/[id]
 * Get a specific journal entry by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id } = await context.params

    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        activityCompletion: {
          activity: {
            userId: user.id,
          },
        },
      },
      include: {
        activityCompletion: {
          include: {
            activity: {
              select: {
                name: true,
                points: true,
              },
            },
          },
        },
      },
    })

    if (!entry) {
      return notFoundError('Journal entry not found')
    }

    return successResponse({
      id: entry.id,
      entryType: entry.entryType,
      mood: entry.mood,
      content: entry.content,
      wordCount: entry.wordCount,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      activityName: entry.activityCompletion.activity.name,
      pointsEarned: entry.activityCompletion.pointsEarned,
    })
  } catch (error) {
    console.error('Journal entry fetch error:', error)
    return internalError('Failed to fetch journal entry')
  }
}

/**
 * DELETE /api/v1/journal/entries/[id]
 * Delete a journal entry and its associated activity completion
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const { id } = await context.params

    // Find the entry and verify ownership
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id,
        activityCompletion: {
          activity: {
            userId: user.id,
          },
        },
      },
      include: {
        activityCompletion: true,
      },
    })

    if (!entry) {
      return notFoundError('Journal entry not found')
    }

    // Delete the activity completion (cascades to journal entry)
    await prisma.activityCompletion.delete({
      where: { id: entry.activityCompletionId },
    })

    return successResponse({
      message: 'Journal entry deleted successfully',
      deletedId: id,
    })
  } catch (error) {
    console.error('Journal entry delete error:', error)
    return internalError('Failed to delete journal entry')
  }
}
