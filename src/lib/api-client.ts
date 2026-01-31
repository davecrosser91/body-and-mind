/**
 * API client for dashboard and related endpoints
 *
 * Provides typed fetch functions for communicating with the backend API
 */

import type { Habitanimal, Habit, HabitCompletion, User } from '@/types'

const API_BASE = '/api/v1'

/**
 * API error class for handling fetch errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    let errorMessage = 'Request failed'
    let errorCode: string | undefined

    try {
      const errorData = await response.json()
      errorMessage = errorData.error?.message || errorData.message || errorMessage
      errorCode = errorData.error?.code || errorData.code
    } catch {
      // Response wasn't JSON, use status text
      errorMessage = response.statusText || errorMessage
    }

    throw new ApiError(errorMessage, response.status, errorCode)
  }

  return response.json()
}

/**
 * Dashboard data response type
 */
export interface DashboardData {
  user: User
  stats: {
    totalHabits: number
    completedToday: number
    currentStreak: number
    totalXp: number
  }
  habitanimals: Habitanimal[]
  todaysHabits: Array<
    Habit & {
      habitanimal: Pick<Habitanimal, 'id' | 'name' | 'species'>
      completedToday: boolean
    }
  >
}

/**
 * Fetch dashboard data including user stats, habitanimals, and today's habits
 */
export async function fetchDashboard(): Promise<DashboardData> {
  return apiFetch<DashboardData>('/dashboard')
}

/**
 * Fetch all habitanimals for the current user
 */
export async function fetchHabitanimals(): Promise<Habitanimal[]> {
  const response = await apiFetch<{ habitanimals: Habitanimal[] }>('/habitanimals')
  return response.habitanimals
}

/**
 * Fetch a single habitanimal by ID
 */
export async function fetchHabitanimal(id: string): Promise<Habitanimal> {
  const response = await apiFetch<{ habitanimal: Habitanimal }>(`/habitanimals/${id}`)
  return response.habitanimal
}

/**
 * Fetch all habits for the current user
 */
export async function fetchHabits(): Promise<Habit[]> {
  const response = await apiFetch<{ habits: Habit[] }>('/habits')
  return response.habits
}

/**
 * Fetch habits for a specific habitanimal
 */
export async function fetchHabitsByHabitanimal(habitanimalId: string): Promise<Habit[]> {
  const response = await apiFetch<{ habits: Habit[] }>(
    `/habitanimals/${habitanimalId}/habits`
  )
  return response.habits
}

/**
 * Complete habit response type
 */
export interface CompleteHabitResponse {
  completion: HabitCompletion
  habitanimal: {
    id: string
    xp: number
    level: number
    health: number
    leveledUp: boolean
  }
}

/**
 * Mark a habit as completed
 *
 * @param habitId - The ID of the habit to complete
 * @param details - Optional details/notes about the completion
 */
export async function completeHabit(
  habitId: string,
  details?: string
): Promise<CompleteHabitResponse> {
  return apiFetch<CompleteHabitResponse>(`/habits/${habitId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ details }),
  })
}

/**
 * Uncomplete a habit (remove today's completion)
 *
 * @param habitId - The ID of the habit to uncomplete
 */
export async function uncompleteHabit(habitId: string): Promise<void> {
  await apiFetch(`/habits/${habitId}/complete`, {
    method: 'DELETE',
  })
}
