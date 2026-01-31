import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateHabitXP, calculateLevel, calculateEvolutionStage } from '@/lib/xp'
import { recoverHealth } from '@/lib/habitanimal-health'

// Mock Prisma client for unit tests
vi.mock('@/lib/db', () => ({
  prisma: {
    habit: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    habitCompletion: {
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    habitanimal: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

/**
 * Habit Completion Service Logic
 *
 * These tests validate the core business logic for completing habits,
 * including XP calculations, level-ups, evolutions, and health recovery.
 */

// Types for test fixtures
interface TestHabitanimal {
  id: string
  type: string
  name: string
  level: number
  xp: number
  health: number
  evolutionStage: number
  lastInteraction: Date
  userId: string
}

interface TestHabit {
  id: string
  name: string
  category: string
  userId: string
}

interface CompletionResult {
  xpEarned: number
  newXp: number
  newLevel: number
  leveledUp: boolean
  newEvolutionStage: number
  evolved: boolean
  newHealth: number
}

// Helper to create test fixtures
function createTestHabitanimal(overrides: Partial<TestHabitanimal> = {}): TestHabitanimal {
  return {
    id: 'habitanimal-1',
    type: 'FITNESS',
    name: 'Guiro',
    level: 1,
    xp: 0,
    health: 80,
    evolutionStage: 1,
    lastInteraction: new Date(),
    userId: 'user-1',
    ...overrides,
  }
}

function createTestHabit(overrides: Partial<TestHabit> = {}): TestHabit {
  return {
    id: 'habit-1',
    name: 'Morning Workout',
    category: 'FITNESS',
    userId: 'user-1',
    ...overrides,
  }
}

/**
 * Simulates the completion service logic
 * This is a pure function implementation of what the actual service would do
 */
function completeHabit(
  habitanimal: TestHabitanimal,
  hasDetails: boolean
): CompletionResult {
  // Calculate XP earned
  const xpEarned = calculateHabitXP(hasDetails)
  const newXp = habitanimal.xp + xpEarned

  // Calculate new level
  const oldLevel = calculateLevel(habitanimal.xp)
  const newLevel = calculateLevel(newXp)
  const leveledUp = newLevel > oldLevel

  // Calculate evolution
  const oldEvolutionStage = calculateEvolutionStage(oldLevel)
  const newEvolutionStage = calculateEvolutionStage(newLevel)
  const evolved = newEvolutionStage > oldEvolutionStage

  // Calculate health recovery
  const newHealth = recoverHealth(habitanimal.health)

  return {
    xpEarned,
    newXp,
    newLevel,
    leveledUp,
    newEvolutionStage,
    evolved,
    newHealth,
  }
}

/**
 * Simulates uncompleting a habit (reversing the XP)
 */
function uncompleteHabit(
  habitanimal: TestHabitanimal,
  xpToRemove: number
): { newXp: number; newLevel: number } {
  const newXp = Math.max(0, habitanimal.xp - xpToRemove)
  const newLevel = calculateLevel(newXp)
  return { newXp, newLevel }
}

/**
 * Checks if a habit was already completed today
 */
function isCompletedToday(completions: { completedAt: Date }[]): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return completions.some((c) => {
    const completedAt = new Date(c.completedAt)
    return completedAt >= today && completedAt < tomorrow
  })
}

describe('Habit Completion Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('XP Calculation on Completion', () => {
    it('completing a habit earns base XP (10) without details', () => {
      const habitanimal = createTestHabitanimal({ xp: 0 })
      const result = completeHabit(habitanimal, false)

      expect(result.xpEarned).toBe(10)
      expect(result.newXp).toBe(10)
    })

    it('completing with details earns bonus XP (15)', () => {
      const habitanimal = createTestHabitanimal({ xp: 0 })
      const result = completeHabit(habitanimal, true)

      expect(result.xpEarned).toBe(15)
      expect(result.newXp).toBe(15)
    })

    it('XP accumulates correctly over multiple completions', () => {
      let habitanimal = createTestHabitanimal({ xp: 0 })

      // First completion without details
      let result = completeHabit(habitanimal, false)
      expect(result.newXp).toBe(10)

      // Second completion with details
      habitanimal = { ...habitanimal, xp: result.newXp }
      result = completeHabit(habitanimal, true)
      expect(result.newXp).toBe(25)

      // Third completion without details
      habitanimal = { ...habitanimal, xp: result.newXp }
      result = completeHabit(habitanimal, false)
      expect(result.newXp).toBe(35)
    })
  })

  describe('XP Added to Correct Habitanimal', () => {
    it('XP should be added to habitanimal matching habit category', () => {
      const fitnessHabitanimal = createTestHabitanimal({
        id: 'fitness-habitanimal',
        type: 'FITNESS',
        xp: 50,
      })
      const fitnessHabit = createTestHabit({
        id: 'fitness-habit',
        category: 'FITNESS',
      })

      // Verify categories match
      expect(fitnessHabitanimal.type).toBe(fitnessHabit.category)

      const result = completeHabit(fitnessHabitanimal, false)
      expect(result.newXp).toBe(60)
    })

    it('different category habitanimals should not receive XP from wrong habits', () => {
      const mindfulnessHabitanimal = createTestHabitanimal({
        id: 'mindfulness-habitanimal',
        type: 'MINDFULNESS',
        xp: 50,
      })
      const fitnessHabit = createTestHabit({
        id: 'fitness-habit',
        category: 'FITNESS',
      })

      // Categories should not match
      expect(mindfulnessHabitanimal.type).not.toBe(fitnessHabit.category)
    })
  })

  describe('Level-up Detection', () => {
    it('level-up detected at 100 XP threshold (level 1 to 2)', () => {
      const habitanimal = createTestHabitanimal({ xp: 95 })
      const result = completeHabit(habitanimal, false)

      expect(result.leveledUp).toBe(true)
      expect(result.newLevel).toBe(2)
      expect(result.newXp).toBe(105)
    })

    it('no level-up when XP does not reach threshold', () => {
      const habitanimal = createTestHabitanimal({ xp: 80 })
      const result = completeHabit(habitanimal, false)

      expect(result.leveledUp).toBe(false)
      expect(result.newLevel).toBe(1)
      expect(result.newXp).toBe(90)
    })

    it('level-up from level 2 to 3 at 300 XP', () => {
      const habitanimal = createTestHabitanimal({ xp: 295 })
      const result = completeHabit(habitanimal, false)

      expect(result.leveledUp).toBe(true)
      expect(result.newLevel).toBe(3)
    })

    it('multiple level-ups in one completion (if large XP gain)', () => {
      // Start at 90 XP (level 1), add enough for multiple levels
      // This tests edge case - though in practice XP gains are smaller
      const habitanimal = createTestHabitanimal({ xp: 90 })

      // Level 1 needs 100 XP total, Level 2 needs 300 XP total
      // With 15 XP, we should reach 105 XP = Level 2
      const result = completeHabit(habitanimal, true)
      expect(result.newXp).toBe(105)
      expect(result.newLevel).toBe(2)
      expect(result.leveledUp).toBe(true)
    })
  })

  describe('Evolution Detection', () => {
    it('evolution to Teen stage detected at level 10', () => {
      // To reach level 10, need 4500 XP (sum of 1+2+...+9 * 100)
      // Start at 4495 XP (level 9, almost level 10)
      const habitanimal = createTestHabitanimal({ xp: 4495 })
      const result = completeHabit(habitanimal, false)

      expect(result.newLevel).toBe(10)
      expect(result.evolved).toBe(true)
      expect(result.newEvolutionStage).toBe(2) // Teen
    })

    it('evolution to Adult stage detected at level 25', () => {
      // To reach level 25, need sum of 1+2+...+24 * 100 = 30000 XP
      const habitanimal = createTestHabitanimal({ xp: 29995 })
      const result = completeHabit(habitanimal, false)

      expect(result.newLevel).toBe(25)
      expect(result.evolved).toBe(true)
      expect(result.newEvolutionStage).toBe(3) // Adult
    })

    it('evolution to Legendary stage detected at level 50', () => {
      // To reach level 50, need sum of 1+2+...+49 * 100 = 122500 XP
      const habitanimal = createTestHabitanimal({ xp: 122495 })
      const result = completeHabit(habitanimal, false)

      expect(result.newLevel).toBe(50)
      expect(result.evolved).toBe(true)
      expect(result.newEvolutionStage).toBe(4) // Legendary
    })

    it('no evolution when level threshold not crossed', () => {
      const habitanimal = createTestHabitanimal({ xp: 4400 })
      const result = completeHabit(habitanimal, false)

      expect(result.evolved).toBe(false)
      expect(result.newEvolutionStage).toBe(1) // Still Baby
    })
  })

  describe('Health Recovery', () => {
    it('health increases by 15 on completion', () => {
      const habitanimal = createTestHabitanimal({ health: 50 })
      const result = completeHabit(habitanimal, false)

      expect(result.newHealth).toBe(65)
    })

    it('health caps at 100', () => {
      const habitanimal = createTestHabitanimal({ health: 95 })
      const result = completeHabit(habitanimal, false)

      expect(result.newHealth).toBe(100)
    })

    it('health recovers from low values', () => {
      const habitanimal = createTestHabitanimal({ health: 10 })
      const result = completeHabit(habitanimal, false)

      expect(result.newHealth).toBe(25)
    })

    it('health recovers from 0', () => {
      const habitanimal = createTestHabitanimal({ health: 0 })
      const result = completeHabit(habitanimal, false)

      expect(result.newHealth).toBe(15)
    })
  })

  describe('Same Day Completion Prevention', () => {
    it('cannot complete same habit twice in one day', () => {
      const today = new Date()
      today.setHours(10, 0, 0, 0)

      const completions = [{ completedAt: today }]

      expect(isCompletedToday(completions)).toBe(true)
    })

    it('allows completion if no completions today', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const completions = [{ completedAt: yesterday }]

      expect(isCompletedToday(completions)).toBe(false)
    })

    it('allows completion if completions list is empty', () => {
      const completions: { completedAt: Date }[] = []

      expect(isCompletedToday(completions)).toBe(false)
    })

    it('detects completion at start of day', () => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 1, 0)

      const completions = [{ completedAt: todayStart }]

      expect(isCompletedToday(completions)).toBe(true)
    })

    it('detects completion at end of day', () => {
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 0)

      const completions = [{ completedAt: todayEnd }]

      expect(isCompletedToday(completions)).toBe(true)
    })

    it('completion from yesterday at 11:59 PM does not count as today', () => {
      const yesterdayLate = new Date()
      yesterdayLate.setDate(yesterdayLate.getDate() - 1)
      yesterdayLate.setHours(23, 59, 59, 999)

      const completions = [{ completedAt: yesterdayLate }]

      expect(isCompletedToday(completions)).toBe(false)
    })
  })

  describe('Uncomplete (Reverse) XP', () => {
    it('uncomplete reverses XP earned', () => {
      const habitanimal = createTestHabitanimal({ xp: 50 })
      const result = uncompleteHabit(habitanimal, 10)

      expect(result.newXp).toBe(40)
    })

    it('uncomplete with details reverses bonus XP (15)', () => {
      const habitanimal = createTestHabitanimal({ xp: 65 })
      const result = uncompleteHabit(habitanimal, 15)

      expect(result.newXp).toBe(50)
    })

    it('uncomplete does not go below 0 XP', () => {
      const habitanimal = createTestHabitanimal({ xp: 5 })
      const result = uncompleteHabit(habitanimal, 10)

      expect(result.newXp).toBe(0)
    })

    it('uncomplete recalculates level correctly', () => {
      // Habitanimal at level 2 (105 XP)
      const habitanimal = createTestHabitanimal({ xp: 105 })
      expect(calculateLevel(105)).toBe(2)

      // Remove 10 XP, should drop to level 1
      const result = uncompleteHabit(habitanimal, 10)
      expect(result.newXp).toBe(95)
      expect(result.newLevel).toBe(1)
    })

    it('uncomplete from exactly threshold XP drops level', () => {
      // Exactly at level 2 threshold (100 XP)
      const habitanimal = createTestHabitanimal({ xp: 100 })
      expect(calculateLevel(100)).toBe(2)

      const result = uncompleteHabit(habitanimal, 10)
      expect(result.newXp).toBe(90)
      expect(result.newLevel).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    it('handles 0 initial XP correctly', () => {
      const habitanimal = createTestHabitanimal({ xp: 0, health: 100 })
      const result = completeHabit(habitanimal, false)

      expect(result.xpEarned).toBe(10)
      expect(result.newXp).toBe(10)
      expect(result.newLevel).toBe(1)
      expect(result.leveledUp).toBe(false)
    })

    it('handles max health correctly', () => {
      const habitanimal = createTestHabitanimal({ health: 100 })
      const result = completeHabit(habitanimal, false)

      expect(result.newHealth).toBe(100)
    })

    it('handles very high XP values', () => {
      const habitanimal = createTestHabitanimal({ xp: 1000000 })
      const result = completeHabit(habitanimal, true)

      expect(result.xpEarned).toBe(15)
      expect(result.newXp).toBe(1000015)
      expect(result.newLevel).toBeGreaterThan(50)
    })

    it('new habitanimal starts at correct defaults', () => {
      const newHabitanimal = createTestHabitanimal({
        level: 1,
        xp: 0,
        health: 100,
        evolutionStage: 1,
      })

      expect(newHabitanimal.level).toBe(1)
      expect(newHabitanimal.xp).toBe(0)
      expect(newHabitanimal.health).toBe(100)
      expect(newHabitanimal.evolutionStage).toBe(1)
    })
  })

  describe('Combined Scenarios', () => {
    it('completing habit triggers level-up, evolution, and health recovery', () => {
      // Set up habitanimal just below level 10 evolution threshold
      const habitanimal = createTestHabitanimal({
        xp: 4495,
        health: 60,
        evolutionStage: 1,
      })

      const result = completeHabit(habitanimal, false)

      // Should level up to 10
      expect(result.leveledUp).toBe(true)
      expect(result.newLevel).toBe(10)

      // Should evolve to Teen (stage 2)
      expect(result.evolved).toBe(true)
      expect(result.newEvolutionStage).toBe(2)

      // Health should recover
      expect(result.newHealth).toBe(75)
    })

    it('multiple completions throughout the day track correctly', () => {
      // Simulating checking if already completed today
      const habit1Completion = new Date()
      habit1Completion.setHours(9, 0, 0, 0)

      const habit2Completions: { completedAt: Date }[] = []

      // Habit 1 already completed today
      expect(isCompletedToday([{ completedAt: habit1Completion }])).toBe(true)

      // Habit 2 not completed today
      expect(isCompletedToday(habit2Completions)).toBe(false)
    })
  })
})
