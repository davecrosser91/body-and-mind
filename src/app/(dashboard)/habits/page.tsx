'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { HabitList } from '@/components/habits/HabitList'
import { CreateHabitModal } from '@/components/habits/CreateHabitModal'
import { useAuth } from '@/hooks/useAuth'

interface Habit {
  id: string
  name: string
  category: 'FITNESS' | 'MINDFULNESS' | 'NUTRITION' | 'SLEEP' | 'LEARNING'
  frequency: string
  completedToday: boolean
  habitanimalName: string
}

export default function HabitsPage() {
  const { token } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchHabits = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/v1/habits', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch habits')
      }

      const data = await response.json()
      const items = data.data?.items || data.data || []
      setHabits(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const handleComplete = async (habitId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/v1/habits/${habitId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Refresh habits list
        fetchHabits()
      }
    } catch (err) {
      console.error('Failed to complete habit:', err)
    }
  }

  const handleUncomplete = async (habitId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/v1/habits/${habitId}/complete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchHabits()
      }
    } catch (err) {
      console.error('Failed to uncomplete habit:', err)
    }
  }

  const handleCreateHabit = async (data: { name: string; category: string; frequency: string }) => {
    if (!token) return

    try {
      const response = await fetch('/api/v1/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setShowCreateModal(false)
        fetchHabits()
      }
    } catch (err) {
      console.error('Failed to create habit:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Habits</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete habits to earn XP for your Habitanimals
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Add Habit
        </motion.button>
      </motion.div>

      <HabitList
        habits={habits}
        onComplete={handleComplete}
        onUncomplete={handleUncomplete}
      />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8"
      >
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Habits</p>
          <p className="text-2xl font-bold text-gray-900">{habits.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Completed Today</p>
          <p className="text-2xl font-bold text-gray-900">
            {habits.filter((h) => h.completedToday).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Completion Rate</p>
          <p className="text-2xl font-bold text-gray-900">
            {habits.length > 0
              ? Math.round((habits.filter((h) => h.completedToday).length / habits.length) * 100)
              : 0}%
          </p>
        </div>
      </motion.div>

      <CreateHabitModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false)
          fetchHabits()
        }}
      />
    </div>
  )
}
