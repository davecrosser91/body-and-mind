import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, internalError } from '@/lib/api-response'
import { getAuthorizationUrl } from '@/lib/whoop'

/**
 * POST /api/v1/integrations/whoop/connect
 * Initiates OAuth connection flow with Whoop
 *
 * Returns the authorization URL for the client to redirect the user to
 * The state parameter includes the user ID for verification in the callback
 */
export const POST = requireAuth(async (request: NextRequest, { user }) => {
  try {
    // Generate random state with user ID encoded for CSRF protection
    // Format: randomBytes:userId
    const randomState = randomBytes(32).toString('hex')
    const state = `${randomState}:${user.id}`

    // Build the authorization URL
    const authorizationUrl = getAuthorizationUrl(state)

    return successResponse({
      authorizationUrl,
      message: 'Redirect user to the authorization URL to connect Whoop',
    })
  } catch (error) {
    console.error('Whoop connect error:', error)
    return internalError('Failed to initiate Whoop connection')
  }
})
