import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import {
  successResponse,
  noContentResponse,
  internalError,
  notFoundError,
} from '@/lib/api-response'
import { prisma } from '@/lib/db'

/**
 * GET /api/v1/integrations/whoop
 * Returns the Whoop connection status for the authenticated user
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const connection = await prisma.whoopConnection.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        expiresAt: true,
        lastSync: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!connection) {
      return successResponse({
        connected: false,
        lastSync: null,
        expiresAt: null,
      })
    }

    return successResponse({
      connected: true,
      lastSync: connection.lastSync,
      expiresAt: connection.expiresAt,
      connectedAt: connection.createdAt,
    })
  } catch (error) {
    console.error('Whoop status error:', error)
    return internalError('Failed to fetch Whoop connection status')
  }
})

/**
 * DELETE /api/v1/integrations/whoop
 * Disconnects Whoop integration for the authenticated user
 */
export const DELETE = requireAuth(async (request: NextRequest, { user }) => {
  try {
    // Check if connection exists
    const connection = await prisma.whoopConnection.findUnique({
      where: { userId: user.id },
    })

    if (!connection) {
      return notFoundError('No Whoop connection found')
    }

    // Delete the connection
    await prisma.whoopConnection.delete({
      where: { userId: user.id },
    })

    return noContentResponse()
  } catch (error) {
    console.error('Whoop disconnect error:', error)
    return internalError('Failed to disconnect Whoop')
  }
})
