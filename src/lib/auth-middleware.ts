import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, TokenPayload } from './auth'
import { prisma } from './db'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string | null
}

export interface AuthContext {
  user: AuthenticatedUser
  token: TokenPayload
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader) {
    return null
  }

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer' || !token) {
    return null
  }

  return token
}

/**
 * Result type for withAuth
 */
type AuthResult =
  | { success: true; context: AuthContext }
  | { success: false; response: NextResponse }

/**
 * Middleware to protect API routes
 * Returns the auth context if authenticated, or an error response
 */
export async function withAuth(request: NextRequest): Promise<AuthResult> {
  const token = extractBearerToken(request)

  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      ),
    }
  }

  const payload = await verifyToken(token)

  if (!payload) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ),
    }
  }

  // Fetch user from database to ensure they still exist
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      ),
    }
  }

  return {
    success: true,
    context: {
      user,
      token: payload,
    },
  }
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * Usage:
 * ```typescript
 * export const GET = requireAuth(async (request, context) => {
 *   const { user } = context
 *   // Your route logic here
 *   return NextResponse.json({ user })
 * })
 * ```
 */
export function requireAuth(
  handler: (
    request: NextRequest,
    context: AuthContext
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await withAuth(request)

    if (!authResult.success) {
      return authResult.response
    }

    return handler(request, authResult.context)
  }
}

/**
 * Optional auth middleware - doesn't fail if no auth provided
 * Useful for routes that have different behavior for authenticated vs anonymous users
 */
export async function withOptionalAuth(
  request: NextRequest
): Promise<AuthContext | null> {
  const token = extractBearerToken(request)

  if (!token) {
    return null
  }

  const payload = await verifyToken(token)

  if (!payload) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  if (!user) {
    return null
  }

  return {
    user,
    token: payload,
  }
}
