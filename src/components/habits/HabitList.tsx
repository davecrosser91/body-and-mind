'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../ui/Card'
import { HabitCheckInButton } from './HabitCheckInButton'
import { HabitDetailModal } from './HabitDetailModal'
import { CreateHabitModal } from './CreateHabitModal'
import { HabitanimalIcon, type HabitanimalSpecies } from '@/components/habitanimals/icons'
import type { Habit as HabitType } from '@/types'

type HabitCategory = 'FITNESS' | 'MINDFULNESS' | 'NUTRITION' | 'SLEEP' | 'LEARNING'
type CategoryFilter = HabitCategory | 'ALL'

// Category info mapping
const CATEGORY_INFO: Record<HabitCategory, {
  habitanimal: string
  species: HabitanimalSpecies
  description: string
}> = {
  FITNESS: { habitanimal: 'Guiro', species: 'guiro', description: 'Exercise & movement' },
  MINDFULNESS: { habitanimal: 'Zen', species: 'zen', description: 'Meditation & calm' },
  NUTRITION: { habitanimal: 'Greeny', species: 'greeny', description: 'Healthy eating' },
  SLEEP: { habitanimal: 'Milo', species: 'milo', description: 'Rest & recovery' },
  LEARNING: { habitanimal: 'Finn', species: 'finn', description: 'Knowledge & growth' },
}

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

const categoryColorMap: Record<HabitCategory, { bg: string; bgSolid: string; border: string; text: string }> = {
  FITNESS: { bg: 'bg-fitness-50', bgSolid: 'bg-fitness-500', border: 'border-fitness-500', text: 'text-fitness-600' },
  MINDFULNESS: { bg: 'bg-mindfulness-50', bgSolid: 'bg-mindfulness-500', border: 'border-mindfulness-500', text: 'text-mindfulness-600' },
  NUTRITION: { bg: 'bg-nutrition-50', bgSolid: 'bg-nutrition-500', border: 'border-nutrition-500', text: 'text-nutrition-600' },
  SLEEP: { bg: 'bg-sleep-50', bgSolid: 'bg-sleep-500', border: 'border-sleep-500', text: 'text-sleep-600' },
  LEARNING: { bg: 'bg-learning-50', bgSolid: 'bg-learning-500', border: 'border-learning-500', text: 'text-learning-600' },
}

// Filter button options
const filterOptions: { value: CategoryFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'FITNESS', label: 'Fitness' },
  { value: 'MINDFULNESS', label: 'Mindfulness' },
  { value: 'NUTRITION', label: 'Nutrition' },
  { value: 'SLEEP', label: 'Sleep' },
  { value: 'LEARNING', label: 'Learning' },
]

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
            className="w-11 h-11 -m-2 flex items-center justify-center flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded-full"
            aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                isCompleted
                  ? `${colors.border} ${colors.bg}`
                  : 'border-gray-300 hover:border-gray-400'
              }`}
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
            </div>
          </button>
        )}

        {/* Habitanimal Icon */}
        <div className="flex-shrink-0 relative group">
          <HabitanimalIcon
            species={CATEGORY_INFO[habit.category].species}
            mood={isCompleted ? 'happy' : 'neutral'}
            size={32}
            className={isCompleted ? '' : 'opacity-70'}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded
            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            Benefits {CATEGORY_INFO[habit.category].habitanimal}
          </div>
        </div>

        {/* Habit Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
            {habit.name}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-full ${colors.bgSolid}`} />
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
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL')

  // Track completed status based on props and local updates
  const [localCompletions, setLocalCompletions] = useState<Record<string, boolean>>({})

  const getIsCompleted = (habit: Habit) => {
    return localCompletions[habit.id] ?? habit.completedToday
  }

  // Filter habits based on selected category
  const filteredHabits = useMemo(() => {
    if (categoryFilter === 'ALL') return habits
    return habits.filter(habit => habit.category === categoryFilter)
  }, [habits, categoryFilter])

  const completedCount = habits.filter((h) => getIsCompleted(h)).length
  const filteredCompletedCount = filteredHabits.filter((h) => getIsCompleted(h)).length

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
                className="mt-4 px-4 py-3 text-sm font-medium text-white bg-gray-900
                  rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2
                  focus:ring-offset-2 focus:ring-gray-900 transition-colors min-h-[44px]"
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
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium
                text-gray-700 bg-white border border-gray-200 rounded-lg
                hover:bg-gray-50 hover:border-gray-300
                focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400
                transition-colors min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add Habit</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const isSelected = categoryFilter === option.value
          const isCategory = option.value !== 'ALL'
          const categoryColors = isCategory ? categoryColorMap[option.value as HabitCategory] : null
          const categoryInfo = isCategory ? CATEGORY_INFO[option.value as HabitCategory] : null

          return (
            <motion.button
              key={option.value}
              onClick={() => setCategoryFilter(option.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg
                transition-all focus:outline-none focus:ring-2 focus:ring-offset-1
                min-h-[44px]
                ${isSelected
                  ? isCategory && categoryColors
                    ? `${categoryColors.bg} ${categoryColors.text} ${categoryColors.border} border focus:${categoryColors.border.replace('border', 'ring')}`
                    : 'bg-gray-900 text-white border border-gray-900 focus:ring-gray-900'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-400'
                }
              `}
            >
              {isCategory && categoryInfo && (
                <HabitanimalIcon
                  species={categoryInfo.species}
                  mood="happy"
                  size={16}
                />
              )}
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">{isCategory ? option.label.slice(0, 3) : option.label}</span>
              {isSelected && categoryFilter !== 'ALL' && (
                <span className={`ml-0.5 px-1 py-0.5 text-[10px] rounded ${isCategory && categoryColors ? categoryColors.text : 'text-white'} bg-white/20`}>
                  {filteredHabits.length}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Habit List with staggered animation */}
      <AnimatePresence mode="popLayout">
        {filteredHabits.length === 0 ? (
          <motion.div
            key="empty-filter"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-6 text-center text-gray-500"
          >
            <p className="text-sm">No {categoryFilter.toLowerCase()} habits found.</p>
            <button
              onClick={() => setCategoryFilter('ALL')}
              className="mt-2 text-xs text-gray-600 underline hover:text-gray-800"
            >
              Show all habits
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={`list-${categoryFilter}`}
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
            {filteredHabits.map((habit) => (
              <motion.div
                key={habit.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
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
        )}
      </AnimatePresence>

      {/* Filtered count indicator */}
      {categoryFilter !== 'ALL' && filteredHabits.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-gray-500 text-center"
        >
          Showing {filteredCompletedCount}/{filteredHabits.length} {categoryFilter.toLowerCase()} habits completed
        </motion.p>
      )}

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
