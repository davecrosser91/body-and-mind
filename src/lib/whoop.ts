/**
 * Whoop API Client
 * Handles OAuth flow and authenticated API requests to Whoop
 */

// Whoop API configuration
const WHOOP_API_BASE = 'https://api.prod.whoop.com'
const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth'
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'

// Scopes needed for the integration
const WHOOP_SCOPES = ['read:profile', 'read:sleep', 'read:workout', 'read:recovery']

export interface WhoopApiError {
  error: string
  message: string
}

/**
 * Get environment variables with validation
 */
function getWhoopConfig() {
  const clientId = process.env.WHOOP_CLIENT_ID
  const clientSecret = process.env.WHOOP_CLIENT_SECRET
  const redirectUri = process.env.WHOOP_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Whoop OAuth configuration. Please set WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, and WHOOP_REDIRECT_URI environment variables.')
  }

  return { clientId, clientSecret, redirectUri }
}

/**
 * Build the OAuth authorization URL for Whoop
 * @param state - Random state string for CSRF protection
 * @returns The full authorization URL to redirect the user to
 */
export function getAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getWhoopConfig()

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: WHOOP_SCOPES.join(' '),
    state,
  })

  return `${WHOOP_AUTH_URL}?${params.toString()}`
}

/**
 * Token response from Whoop OAuth
 */
export interface WhoopTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

/**
 * Exchange an authorization code for access and refresh tokens
 * @param code - The authorization code from the callback
 * @returns Token response containing access_token, refresh_token, and expires_in
 */
export async function exchangeCodeForTokens(code: string): Promise<WhoopTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getWhoopConfig()

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Whoop token exchange failed:', errorText)
    throw new Error(`Failed to exchange code for tokens: ${response.status}`)
  }

  return response.json()
}

/**
 * Refresh an expired access token using the refresh token
 * @param refreshToken - The refresh token from a previous authentication
 * @returns New token response with fresh access_token and potentially new refresh_token
 */
export async function refreshAccessToken(refreshToken: string): Promise<WhoopTokenResponse> {
  const { clientId, clientSecret } = getWhoopConfig()

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Whoop token refresh failed:', errorText)
    throw new Error(`Failed to refresh access token: ${response.status}`)
  }

  return response.json()
}

/**
 * Make an authenticated request to the Whoop API
 * @param endpoint - The API endpoint (e.g., '/developer/v1/user/profile/basic')
 * @param accessToken - The access token for authentication
 * @param options - Additional fetch options
 * @returns The parsed JSON response
 */
export async function whoopFetch<T = unknown>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${WHOOP_API_BASE}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const error = new Error(
      `Whoop API error: ${response.status} ${response.statusText}`
    ) as Error & { status: number; body: unknown }
    error.status = response.status
    error.body = errorBody
    throw error
  }

  return response.json()
}

/**
 * Calculate token expiration date from expires_in seconds
 * @param expiresIn - Number of seconds until token expires
 * @returns Date when the token will expire
 */
export function calculateExpiresAt(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000)
}

/**
 * Check if a token is expired or about to expire (within 5 minutes)
 * @param expiresAt - The expiration date of the token
 * @returns True if the token should be refreshed
 */
export function isTokenExpired(expiresAt: Date): boolean {
  const bufferMs = 5 * 60 * 1000 // 5 minutes buffer
  return new Date(expiresAt).getTime() - bufferMs < Date.now()
}
