/**
 * Type exports for the application
 *
 * Add shared types here as the application grows
 */

export type HealthStatus = 'healthy' | 'warning' | 'critical'

export interface User {
  id: string
  email: string
  name: string | null
}

export interface Habitanimal {
  id: string
  name: string
  species: string
  health: number
  xp: number
  level: number
}

export interface Activity {
  id: string
  name: string
  pillar: 'BODY' | 'MIND'
  subCategory: string
  frequency: 'DAILY' | 'WEEKLY' | 'CUSTOM'
  description: string | null
  points: number
  isHabit: boolean
  cueType?: 'TIME' | 'LOCATION' | 'AFTER_ACTIVITY' | null
  cueValue?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ActivityCompletion {
  id: string
  activityId: string
  completedAt: Date
  pointsEarned: number
  details?: string | null
  source: 'MANUAL' | 'WHOOP' | 'APPLE_HEALTH'
}

// Legacy aliases for backward compatibility during migration
export type Habit = Activity
export type HabitCompletion = ActivityCompletion
