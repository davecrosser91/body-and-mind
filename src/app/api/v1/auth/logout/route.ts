import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { successResponse, internalError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await withAuth(request)

    if (!authResult.success) {
      return authResult.response
    }

    // For JWT-based auth, the client simply removes the token
    // No server-side invalidation needed (stateless)
    return successResponse({
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return internalError()
  }
}
