'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useDashboard } from '@/hooks/useDashboard'
import { StatsOverview } from '@/components/dashboard/StatsOverview'
import { HabitanimalGrid } from '@/components/habitanimals/HabitanimalGrid'
import { HabitList, type Habit as HabitListHabit } from '@/components/habits/HabitList'
import { type HabitanimalCardProps } from '@/components/habitanimals/HabitanimalCard'
import { getMood } from '@/lib/habitanimal-health'
import { calculateEvolutionStage } from '@/lib/xp'

/**
 * Get greeting based on time of day
 */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Format today's date
 */
function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Loading skeleton component
 */
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-24"></div>
        ))}
      </div>

      {/* Habitanimals skeleton */}
      <div>
        <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-40"></div>
          ))}
        </div>
      </div>

      {/* Habits skeleton */}
      <div>
        <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-16"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Error display component
 */
function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="bg-red-50 rounded-xl p-6 max-w-md mx-auto">
        <h2 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h2>
        <p className="text-sm text-red-600 mb-4">{error.message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </motion.div>
  )
}

/**
 * Map habitanimal type from species for demo purposes
 * In a real app, this would come from the API
 */
function getHabitanimalType(
  species: string
): 'FITNESS' | 'MINDFULNESS' | 'NUTRITION' | 'SLEEP' | 'LEARNING' {
  const typeMap: Record<string, 'FITNESS' | 'MINDFULNESS' | 'NUTRITION' | 'SLEEP' | 'LEARNING'> = {
    gorilla: 'FITNESS',
    turtle: 'MINDFULNESS',
    chameleon: 'NUTRITION',
    owl: 'SLEEP',
    fox: 'LEARNING',
  }
  return typeMap[species.toLowerCase()] || 'FITNESS'
}

/**
 * Dashboard page component
 *
 * Main view after login showing:
 * - Personalized greeting with date
 * - Stats overview (habits completed, streak, XP)
 * - Habitanimal grid (5 companions)
 * - Today's habit list
 */
export default function DashboardPage() {
  const router = useRouter()
  const { data, isLoading, error, refetch, toggleHabit, isTogglingHabit } = useDashboard()

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Error state
  if (error) {
    return <DashboardError error={error} onRetry={refetch} />
  }

  // No data state (shouldn't happen but handle gracefully)
  if (!data) {
    return <DashboardSkeleton />
  }

  const { user, stats, habitanimals, todaysHabits } = data

  // Transform habitanimals to card props
  const habitanimalCards: HabitanimalCardProps[] = habitanimals.map((ha) => ({
    id: ha.id,
    name: ha.name,
    species: ha.species,
    type: getHabitanimalType(ha.species),
    level: ha.level,
    xp: ha.xp,
    health: ha.health,
    mood: getMood(ha.health),
    evolutionStage: calculateEvolutionStage(ha.level),
  }))

  // Transform habits to habit list format
  const habitListItems: HabitListHabit[] = todaysHabits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    category: getHabitanimalType(habit.habitanimal.species),
    completedToday: habit.completedToday,
    habitanimalName: habit.habitanimal.name,
  }))

  // Handle habitanimal card click
  const handleHabitanimalClick = (id: string) => {
    router.push(`/habitanimals/${id}`)
  }

  // Handle habit toggle
  const handleHabitToggle = async (habitId: string) => {
    try {
      await toggleHabit(habitId)
    } catch (err) {
      // Error is handled by optimistic update rollback
      console.error('Failed to toggle habit:', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user.name || 'there'}
        </h1>
        <p className="text-gray-500 mt-1">{formatDate()}</p>
      </motion.header>

      {/* Stats Overview */}
      <section>
        <StatsOverview
          totalHabits={stats.totalHabits}
          completedToday={stats.completedToday}
          currentStreak={stats.currentStreak}
          totalXp={stats.totalXp}
        />
      </section>

      {/* Habitanimal Grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Habitanimals</h2>
        <HabitanimalGrid
          habitanimals={habitanimalCards}
          onHabitanimalClick={handleHabitanimalClick}
        />
      </motion.section>

      {/* Today's Habits */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <HabitList
          habits={habitListItems}
          onToggleComplete={(habitId) => handleHabitToggle(habitId)}
        />
        {isTogglingHabit && (
          <p className="text-xs text-gray-400 mt-2">Saving...</p>
        )}
      </motion.section>
    </motion.div>
  )
}
