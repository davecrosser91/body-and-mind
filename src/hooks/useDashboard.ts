'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchDashboard,
  completeActivity,
  uncompleteActivity,
  type DashboardData,
  type CompleteActivityResponse,
  ApiError,
} from '@/lib/api-client'

/**
 * Dashboard hook state
 */
interface UseDashboardState {
  data: DashboardData | null
  isLoading: boolean
  error: Error | null
}

/**
 * Dashboard hook return type
 */
interface UseDashboardReturn extends UseDashboardState {
  refetch: () => Promise<void>
  toggleActivity: (activityId: string) => Promise<CompleteActivityResponse | void>
  isTogglingActivity: string | null
  // Legacy aliases
  toggleHabit: (habitId: string) => Promise<CompleteActivityResponse | void>
  isTogglingHabit: string | null
}

/**
 * Custom hook for fetching and managing dashboard data
 *
 * Provides:
 * - Automatic data fetching on mount
 * - Loading and error states
 * - Refetch function for manual refresh
 * - Toggle habit completion with optimistic updates
 */
export function useDashboard(): UseDashboardReturn {
  const [state, setState] = useState<UseDashboardState>({
    data: null,
    isLoading: true,
    error: null,
  })
  const [isTogglingActivity, setIsTogglingActivity] = useState<string | null>(null)

  /**
   * Fetch dashboard data from API
   */
  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const data = await fetchDashboard()
      setState({ data, isLoading: false, error: null })
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Failed to fetch dashboard data'

      setState({
        data: null,
        isLoading: false,
        error: new Error(errorMessage),
      })
    }
  }, [])

  /**
   * Refetch dashboard data
   */
  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  /**
   * Toggle activity completion
   * Uses optimistic updates for better UX
   */
  const toggleActivity = useCallback(
    async (activityId: string): Promise<CompleteActivityResponse | void> => {
      if (!state.data) return

      const activity = state.data.todaysActivities.find((a) => a.id === activityId)
      if (!activity) return

      setIsTogglingActivity(activityId)

      // Optimistic update
      setState((prev) => {
        if (!prev.data) return prev

        const updatedActivities = prev.data.todaysActivities.map((a) =>
          a.id === activityId ? { ...a, completedToday: !a.completedToday } : a
        )

        const completedCount = updatedActivities.filter((a) => a.completedToday).length

        return {
          ...prev,
          data: {
            ...prev.data,
            todaysActivities: updatedActivities,
            stats: {
              ...prev.data.stats,
              completedToday: completedCount,
            },
          },
        }
      })

      try {
        if (activity.completedToday) {
          await uncompleteActivity(activityId)
        } else {
          const response = await completeActivity(activityId)
          setIsTogglingActivity(null)

          // Update stats from response
          setState((prev) => {
            if (!prev.data) return prev

            return {
              ...prev,
              data: {
                ...prev.data,
                stats: {
                  ...prev.data.stats,
                  totalXp: (prev.data.stats.totalXp || 0) + response.pointsEarned,
                },
              },
            }
          })

          return response
        }
      } catch (error) {
        // Revert optimistic update on error
        setState((prev) => {
          if (!prev.data) return prev

          const revertedActivities = prev.data.todaysActivities.map((a) =>
            a.id === activityId ? { ...a, completedToday: activity.completedToday } : a
          )

          const completedCount = revertedActivities.filter((a) => a.completedToday).length

          return {
            ...prev,
            data: {
              ...prev.data,
              todaysActivities: revertedActivities,
              stats: {
                ...prev.data.stats,
                completedToday: completedCount,
              },
            },
          }
        })

        throw error
      } finally {
        setIsTogglingActivity(null)
      }
    },
    [state.data]
  )

  // Legacy alias
  const toggleHabit = toggleActivity

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ...state,
    refetch,
    toggleActivity,
    isTogglingActivity,
    // Legacy aliases
    toggleHabit,
    isTogglingHabit: isTogglingActivity,
  }
}
