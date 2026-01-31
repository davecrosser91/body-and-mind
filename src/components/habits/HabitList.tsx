'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { HabitCheckInButton } from './HabitCheckInButton'
import { HabitDetailModal } from './HabitDetailModal'
import { CreateHabitModal } from './CreateHabitModal'
import type { Habit as HabitType } from '@/types'

type HabitCategory = 'FITNESS' | 'MINDFULNESS' | 'NUTRITION' | 'SLEEP' | 'LEARNING'

export interface Habit {
  id: string
  name: string
  category: HabitCategory
  completedToday: boolean
  habitanimalName: string
}

interface HabitListProps {
  habits: Habit[]
  onToggleComplete?: (habitId: string, completed: boolean) => void
  onComplete?: (habitId: string, details?: string) => Promise<void>
  onUncomplete?: (habitId: string) => Promise<void>
  onHabitCreated?: (habit: HabitType) => void
  showAddButton?: boolean
}

const categoryColorMap: Record<HabitCategory, { bg: string; border: string; text: string }> = {
  FITNESS: { bg: 'bg-fitness-50', border: 'border-fitness-500', text: 'text-fitness-600' },
  MINDFULNESS: { bg: 'bg-mindfulness-50', border: 'border-mindfulness-500', text: 'text-mindfulness-600' },
  NUTRITION: { bg: 'bg-nutrition-50', border: 'border-nutrition-500', text: 'text-nutrition-600' },
  SLEEP: { bg: 'bg-sleep-50', border: 'border-sleep-500', text: 'text-sleep-600' },
  LEARNING: { bg: 'bg-learning-50', border: 'border-learning-500', text: 'text-learning-600' },
}

function HabitItem({
  habit,
  onToggle,
  onComplete,
  onUncomplete,
}: {
  habit: Habit
  onToggle?: (completed: boolean) => void
  onComplete?: (habitId: string, details?: string) => Promise<void>
  onUncomplete?: (habitId: string) => Promise<void>
}) {
  const [isCompleted, setIsCompleted] = useState(habit.completedToday)
  const [isLoading, setIsLoading] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const colors = categoryColorMap[habit.category]

  // Legacy toggle handler for backwards compatibility
  const handleLegacyToggle = () => {
    const newValue = !isCompleted
    setIsCompleted(newValue)
    onToggle?.(newValue)
  }

  // New async complete handler
  const handleComplete = async (habitId: string, details?: string) => {
    if (!onComplete) {
      // Fall back to legacy behavior
      handleLegacyToggle()
      return
    }

    setIsLoading(true)
    try {
      await onComplete(habitId, details)
      setIsCompleted(true)
      onToggle?.(true)
    } finally {
      setIsLoading(false)
    }
  }

  // New async uncomplete handler
  const handleUncomplete = async (habitId: string) => {
    if (!onUncomplete) {
      // Fall back to legacy behavior
      handleLegacyToggle()
      return
    }

    setIsLoading(true)
    try {
      await onUncomplete(habitId)
      setIsCompleted(false)
      onToggle?.(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Determine if we should use the new async behavior
  const useAsyncBehavior = Boolean(onComplete || onUncomplete)

  return (
    <>
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
          isCompleted
            ? `${colors.bg} border-transparent`
            : 'bg-white border-gray-100 hover:border-gray-200'
        }`}
      >
        {/* Checkbox - use HabitCheckInButton when async handlers are provided */}
        {useAsyncBehavior ? (
          <HabitCheckInButton
            habitId={habit.id}
            habitName={habit.name}
            isCompleted={isCompleted}
            isLoading={isLoading}
            onComplete={handleComplete}
            onUncomplete={handleUncomplete}
            onOpenDetailModal={() => setShowDetailModal(true)}
          />
        ) : (
          <button
            onClick={handleLegacyToggle}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              isCompleted
                ? `${colors.border} ${colors.bg}`
                : 'border-gray-300 hover:border-gray-400'
            }`}
            aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted && (
              <svg
                className={`w-3 h-3 ${colors.text}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        )}

        {/* Habit Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
            {habit.name}
          </p>
          <p className="text-xs text-gray-500">
            <span className={`inline-block w-2 h-2 rounded-full ${colors.border.replace('border', 'bg')} mr-1`} />
            {habit.habitanimalName}
          </p>
        </div>

        {/* Category Badge */}
        <div className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text} flex-shrink-0`}>
          {habit.category.charAt(0) + habit.category.slice(1).toLowerCase()}
        </div>
      </div>

      {/* Detail Modal */}
      {useAsyncBehavior && (
        <HabitDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          habit={{ id: habit.id, name: habit.name, category: habit.category }}
          onComplete={async (details) => {
            await handleComplete(habit.id, details)
          }}
        />
      )}
    </>
  )
}

export function HabitList({
  habits,
  onToggleComplete,
  onComplete,
  onUncomplete,
  onHabitCreated,
  showAddButton = false,
}: HabitListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Track completed status based on props and local updates
  const [localCompletions, setLocalCompletions] = useState<Record<string, boolean>>({})

  const getIsCompleted = (habit: Habit) => {
    return localCompletions[habit.id] ?? habit.completedToday
  }

  const completedCount = habits.filter((h) => getIsCompleted(h)).length

  const handleComplete = async (habitId: string, details?: string) => {
    if (onComplete) {
      await onComplete(habitId, details)
      setLocalCompletions(prev => ({ ...prev, [habitId]: true }))
    }
  }

  const handleUncomplete = async (habitId: string) => {
    if (onUncomplete) {
      await onUncomplete(habitId)
      setLocalCompletions(prev => ({ ...prev, [habitId]: false }))
    }
  }

  const handleHabitCreated = (habit: HabitType) => {
    onHabitCreated?.(habit)
    setShowCreateModal(false)
  }

  if (habits.length === 0) {
    return (
      <>
        <Card>
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No habits for today.</p>
            <p className="text-xs mt-1">Add some habits to start building routines!</p>
            {showAddButton && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-gray-900
                  rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2
                  focus:ring-offset-2 focus:ring-gray-900 transition-colors"
              >
                Add Your First Habit
              </button>
            )}
          </div>
        </Card>

        {showAddButton && (
          <CreateHabitModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreated={handleHabitCreated}
          />
        )}
      </>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-900">Today&apos;s Habits</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {completedCount}/{habits.length} completed
          </span>
          {showAddButton && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                text-gray-700 bg-white border border-gray-200 rounded-lg
                hover:bg-gray-50 hover:border-gray-300
                focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400
                transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Habit
            </button>
          )}
        </div>
      </div>

      {/* Habit List with staggered animation */}
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
      >
        {habits.map((habit) => (
          <motion.div
            key={habit.id}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
            }}
          >
            <HabitItem
              habit={{ ...habit, completedToday: getIsCompleted(habit) }}
              onToggle={onToggleComplete ? (completed) => onToggleComplete(habit.id, completed) : undefined}
              onComplete={onComplete ? handleComplete : undefined}
              onUncomplete={onUncomplete ? handleUncomplete : undefined}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Create Habit Modal */}
      {showAddButton && (
        <CreateHabitModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleHabitCreated}
        />
      )}
    </div>
  )
}
