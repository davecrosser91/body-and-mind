'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchDashboard,
  completeHabit,
  uncompleteHabit,
  type DashboardData,
  type CompleteHabitResponse,
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
  toggleHabit: (habitId: string) => Promise<CompleteHabitResponse | void>
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
  const [isTogglingHabit, setIsTogglingHabit] = useState<string | null>(null)

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
   * Toggle habit completion
   * Uses optimistic updates for better UX
   */
  const toggleHabit = useCallback(
    async (habitId: string): Promise<CompleteHabitResponse | void> => {
      if (!state.data) return

      const habit = state.data.todaysHabits.find((h) => h.id === habitId)
      if (!habit) return

      setIsTogglingHabit(habitId)

      // Optimistic update
      setState((prev) => {
        if (!prev.data) return prev

        const updatedHabits = prev.data.todaysHabits.map((h) =>
          h.id === habitId ? { ...h, completedToday: !h.completedToday } : h
        )

        const completedCount = updatedHabits.filter((h) => h.completedToday).length

        return {
          ...prev,
          data: {
            ...prev.data,
            todaysHabits: updatedHabits,
            stats: {
              ...prev.data.stats,
              completedToday: completedCount,
            },
          },
        }
      })

      try {
        if (habit.completedToday) {
          await uncompleteHabit(habitId)
        } else {
          const response = await completeHabit(habitId)
          setIsTogglingHabit(null)

          // Update habitanimal XP and level from response
          setState((prev) => {
            if (!prev.data) return prev

            const updatedHabitanimals = prev.data.habitanimals.map((ha) =>
              ha.id === response.habitanimal.id
                ? {
                    ...ha,
                    xp: response.habitanimal.xp,
                    level: response.habitanimal.level,
                    health: response.habitanimal.health,
                  }
                : ha
            )

            return {
              ...prev,
              data: {
                ...prev.data,
                habitanimals: updatedHabitanimals,
                stats: {
                  ...prev.data.stats,
                  totalXp: prev.data.stats.totalXp + response.completion.xpEarned,
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

          const revertedHabits = prev.data.todaysHabits.map((h) =>
            h.id === habitId ? { ...h, completedToday: habit.completedToday } : h
          )

          const completedCount = revertedHabits.filter((h) => h.completedToday).length

          return {
            ...prev,
            data: {
              ...prev.data,
              todaysHabits: revertedHabits,
              stats: {
                ...prev.data.stats,
                completedToday: completedCount,
              },
            },
          }
        })

        throw error
      } finally {
        setIsTogglingHabit(null)
      }
    },
    [state.data]
  )

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ...state,
    refetch,
    toggleHabit,
    isTogglingHabit,
  }
}
