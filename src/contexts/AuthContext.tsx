'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import type { User } from '@/types'

const TOKEN_KEY = 'auth_token'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  updateProfile: (data: { name?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && !!token

  // Fetch user profile with the given token
  const fetchUserProfile = useCallback(async (authToken: string): Promise<User | null> => {
    try {
      const response = await fetch('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.user
    } catch {
      return null
    }
  }, [])

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY)

      if (storedToken) {
        const userProfile = await fetchUserProfile(storedToken)

        if (userProfile) {
          setToken(storedToken)
          setUser(userProfile)
        } else {
          // Token is invalid, clear it
          localStorage.removeItem(TOKEN_KEY)
        }
      }

      setIsLoading(false)
    }

    initializeAuth()
  }, [fetchUserProfile])

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || errorData.message || 'Login failed')
    }

    const data = await response.json()
    const { token: newToken, user: newUser } = data

    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const response = await fetch('/api/v1/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || errorData.message || 'Signup failed')
    }

    const data = await response.json()
    const { token: newToken, user: newUser } = data

    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (data: { name?: string }) => {
    if (!token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch('/api/v1/auth/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || errorData.message || 'Update failed')
    }

    const responseData = await response.json()
    setUser(responseData.user)
  }, [token])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }

  return context
}
