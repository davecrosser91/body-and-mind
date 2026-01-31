/**
 * Habitanimal Health Logic
 *
 * Core business logic for habitanimal health state machine
 * Implements the "Never Miss Twice" rule for habit tracking
 */

// Constants
const MAX_HEALTH = 100
const MIN_HEALTH = 0
const HEALTH_DECAY_SINGLE_MISS = 10
const HEALTH_DECAY_CONSECUTIVE_MISS = 30
const HEALTH_RECOVERY_PER_COMPLETION = 15

// Calculate days between two dates
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.floor(Math.abs(date2.getTime() - date1.getTime()) / oneDay)
}

// Calculate health based on last interaction
// Implements "Never Miss Twice" rule
export function calculateHealthDecay(
  currentHealth: number,
  lastInteraction: Date,
  now: Date = new Date()
): number {
  const daysMissed = daysBetween(lastInteraction, now)

  if (daysMissed <= 1) {
    // Completed today or yesterday - no decay
    return currentHealth
  } else if (daysMissed === 2) {
    // Missed 1 day - small decay (grace period)
    return Math.max(MIN_HEALTH, currentHealth - HEALTH_DECAY_SINGLE_MISS)
  } else {
    // Missed 2+ consecutive days - larger decay
    const extraDays = daysMissed - 2
    const decay = HEALTH_DECAY_SINGLE_MISS + extraDays * HEALTH_DECAY_CONSECUTIVE_MISS
    return Math.max(MIN_HEALTH, currentHealth - decay)
  }
}

// Recover health after completing a habit
export function recoverHealth(currentHealth: number): number {
  return Math.min(MAX_HEALTH, currentHealth + HEALTH_RECOVERY_PER_COMPLETION)
}

// Get mood based on health
export function getMood(health: number): 'happy' | 'neutral' | 'tired' | 'sad' {
  if (health >= 80) return 'happy'
  if (health >= 50) return 'neutral'
  if (health >= 30) return 'tired'
  return 'sad'
}

// Check if habitanimal needs attention
export function needsAttention(health: number): boolean {
  return health < 50
}
