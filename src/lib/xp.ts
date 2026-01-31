/**
 * XP Calculation utilities
 *
 * Core business logic for experience points and leveling system
 */

// Constants
const BASE_XP = 10
const DETAIL_BONUS_MULTIPLIER = 1.5
const XP_PER_LEVEL_MULTIPLIER = 100

// Calculate XP earned for completing a habit
export function calculateHabitXP(hasDetails: boolean): number {
  let xp = BASE_XP
  if (hasDetails) {
    xp = Math.floor(xp * DETAIL_BONUS_MULTIPLIER)
  }
  return xp
}

// Calculate level from total XP
// Level 1: 0-99, Level 2: 100-299, Level 3: 300-599...
export function calculateLevel(totalXP: number): number {
  let level = 1
  let xpNeeded = XP_PER_LEVEL_MULTIPLIER
  let accumulated = 0

  while (accumulated + xpNeeded <= totalXP) {
    accumulated += xpNeeded
    level++
    xpNeeded = level * XP_PER_LEVEL_MULTIPLIER
  }

  return level
}

// Calculate XP needed for next level
export function xpForNextLevel(currentLevel: number): number {
  return currentLevel * XP_PER_LEVEL_MULTIPLIER
}

// Calculate total XP needed to reach a level
export function totalXPForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += i * XP_PER_LEVEL_MULTIPLIER
  }
  return total
}

// Calculate evolution stage from level
export function calculateEvolutionStage(level: number): number {
  if (level >= 50) return 4 // Legendary
  if (level >= 25) return 3 // Adult
  if (level >= 10) return 2 // Teen
  return 1 // Baby
}

// Get evolution stage name
export function getEvolutionStageName(stage: number): string {
  const names = ['Baby', 'Teen', 'Adult', 'Legendary']
  return names[stage - 1] || 'Unknown'
}
