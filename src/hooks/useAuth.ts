'use client'

import { useAuthContext } from '@/contexts/AuthContext'

/**
 * Hook to access authentication state and functions
 *
 * Must be used within an AuthProvider
 *
 * @throws Error if used outside of AuthProvider
 */
export function useAuth() {
  return useAuthContext()
}
