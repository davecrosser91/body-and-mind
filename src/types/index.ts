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

export interface Habit {
  id: string
  name: string
  description: string | null
  frequency: 'daily' | 'weekly' | 'monthly'
  habitanimalId: string
}

export interface HabitCompletion {
  id: string
  habitId: string
  completedAt: Date
  xpEarned: number
}
