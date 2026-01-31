'use client'

import { motion } from 'framer-motion'
import { AnimatedNumber, AnimatedXP } from '@/components/ui/AnimatedNumber'

interface StatsOverviewProps {
  totalHabits: number
  completedToday: number
  currentStreak: number
  totalXp: number
}

/**
 * Stats card component for individual statistics
 */
function StatCard({
  label,
  children,
  delay = 0,
}: {
  label: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col"
    >
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-2xl font-semibold text-gray-900 mt-1">{children}</span>
    </motion.div>
  )
}

/**
 * Stats overview component displaying key metrics in horizontal cards
 *
 * Shows:
 * - Habits completed today / total habits
 * - Current streak
 * - Total XP earned
 */
export function StatsOverview({
  totalHabits,
  completedToday,
  currentStreak,
  totalXp,
}: StatsOverviewProps) {
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Today's Progress" delay={0}>
        <span className="flex items-baseline gap-1">
          <AnimatedNumber value={completedToday} duration={0.8} />
          <span className="text-gray-400 text-lg font-normal">/ {totalHabits}</span>
        </span>
      </StatCard>

      <StatCard label="Completion Rate" delay={0.1}>
        <span className="flex items-center gap-2">
          <AnimatedNumber value={completionRate} duration={0.8} />
          <span className="text-gray-400 text-lg font-normal">%</span>
        </span>
      </StatCard>

      <StatCard label="Current Streak" delay={0.2}>
        <span className="flex items-center gap-2">
          <AnimatedNumber value={currentStreak} duration={0.8} />
          <span className="text-gray-400 text-lg font-normal">days</span>
        </span>
      </StatCard>

      <StatCard label="Total XP" delay={0.3}>
        <AnimatedXP value={totalXp} duration={1} showSuffix={false} />
      </StatCard>
    </div>
  )
}
