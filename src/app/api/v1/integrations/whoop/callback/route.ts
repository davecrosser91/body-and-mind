import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { exchangeCodeForTokens, calculateExpiresAt } from '@/lib/whoop'

// Get base URL for redirects (handles reverse proxy correctly)
function getBaseUrl(request: NextRequest): string {
  // Use NEXTAUTH_URL if set (recommended for production)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  // Fallback to request headers
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
  return `${proto}://${host}`
}

/**
 * GET /api/v1/integrations/whoop/callback
 * Handles OAuth callback from Whoop
 *
 * Query params:
 * - code: Authorization code from Whoop
 * - state: State parameter containing randomBytes:userId
 *
 * On success: Redirects to /settings?whoop=connected
 * On error: Redirects to /settings?whoop=error&message=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth error response
  if (error) {
    console.error('Whoop OAuth error:', error, errorDescription)
    const redirectUrl = new URL('/settings', getBaseUrl(request))
    redirectUrl.searchParams.set('whoop', 'error')
    redirectUrl.searchParams.set('message', errorDescription || error)
    return NextResponse.redirect(redirectUrl)
  }

  // Validate required parameters
  if (!code || !state) {
    console.error('Whoop callback missing code or state')
    const redirectUrl = new URL('/settings', getBaseUrl(request))
    redirectUrl.searchParams.set('whoop', 'error')
    redirectUrl.searchParams.set('message', 'Missing authorization code or state')
    return NextResponse.redirect(redirectUrl)
  }

  // Extract user ID from state (format: randomBytes:userId)
  const stateParts = state.split(':')
  const userId = stateParts[1]
  if (stateParts.length !== 2 || !userId) {
    console.error('Whoop callback invalid state format')
    const redirectUrl = new URL('/settings', getBaseUrl(request))
    redirectUrl.searchParams.set('whoop', 'error')
    redirectUrl.searchParams.set('message', 'Invalid state parameter')
    return NextResponse.redirect(redirectUrl)
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!user) {
    console.error('Whoop callback user not found:', userId)
    const redirectUrl = new URL('/settings', getBaseUrl(request))
    redirectUrl.searchParams.set('whoop', 'error')
    redirectUrl.searchParams.set('message', 'User not found')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    // Exchange authorization code for tokens
    console.log('Whoop callback: Exchanging code for tokens...')
    const tokens = await exchangeCodeForTokens(code)
    console.log('Whoop callback: Token exchange successful')
    console.log('Whoop callback: Granted scopes:', tokens.scope)

    // Calculate expiration date
    const expiresAt = calculateExpiresAt(tokens.expires_in)

    // Upsert WhoopConnection (create or update)
    console.log('Whoop callback: Saving connection for user:', userId)
    await prisma.whoopConnection.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        updatedAt: new Date(),
      },
    })
    console.log('Whoop callback: Connection saved successfully')

    // Redirect to settings with success
    const redirectUrl = new URL('/settings', getBaseUrl(request))
    redirectUrl.searchParams.set('whoop', 'connected')
    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error('Whoop callback error:', err)
    console.error('Whoop callback error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    const redirectUrl = new URL('/settings', getBaseUrl(request))
    redirectUrl.searchParams.set('whoop', 'error')
    redirectUrl.searchParams.set('message', 'Failed to complete authentication')
    return NextResponse.redirect(redirectUrl)
  }
}
