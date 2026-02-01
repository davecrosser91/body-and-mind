/**
 * API client for dashboard and related endpoints
 *
 * Provides typed fetch functions for communicating with the backend API
 */

import type { Habitanimal, Activity, ActivityCompletion, User } from '@/types'

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
    totalActivities: number
    completedToday: number
    currentStreak: number
    totalXp: number
  }
  habitanimals: Habitanimal[]
  todaysActivities: Array<
    Activity & {
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
 * Fetch all activities for the current user
 */
export async function fetchActivities(habitsOnly?: boolean): Promise<Activity[]> {
  const endpoint = habitsOnly ? '/activities?habitsOnly=true' : '/activities'
  const response = await apiFetch<Activity[]>(endpoint)
  return response
}

/**
 * Complete activity response type
 */
export interface CompleteActivityResponse {
  id: string
  activityId: string
  completedAt: string
  pointsEarned: number
  details: string | null
  source: string
}

/**
 * Mark an activity as completed
 *
 * @param activityId - The ID of the activity to complete
 * @param details - Optional details/notes about the completion
 */
export async function completeActivity(
  activityId: string,
  details?: string
): Promise<CompleteActivityResponse> {
  return apiFetch<CompleteActivityResponse>(`/activities/${activityId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ details }),
  })
}

/**
 * Uncomplete an activity (remove today's completion)
 *
 * @param activityId - The ID of the activity to uncomplete
 */
export async function uncompleteActivity(activityId: string): Promise<void> {
  await apiFetch(`/activities/${activityId}/complete`, {
    method: 'DELETE',
  })
}

// Legacy aliases for backward compatibility
export const completeHabit = completeActivity
export const uncompleteHabit = uncompleteActivity
export type CompleteHabitResponse = CompleteActivityResponse
