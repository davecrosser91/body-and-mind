import { describe, it, expect } from 'vitest'
import {
  calculateHabitXP,
  calculateLevel,
  xpForNextLevel,
  totalXPForLevel,
  calculateEvolutionStage,
  getEvolutionStageName,
} from '@/lib/xp'

describe('XP Calculation', () => {
  describe('calculateHabitXP', () => {
    it('returns base XP (10) when no details provided', () => {
      expect(calculateHabitXP(false)).toBe(10)
    })

    it('returns bonus XP (15) when details provided', () => {
      expect(calculateHabitXP(true)).toBe(15)
    })
  })

  describe('calculateLevel', () => {
    it('returns level 1 for 0 XP', () => {
      expect(calculateLevel(0)).toBe(1)
    })

    it('returns level 1 for 99 XP', () => {
      expect(calculateLevel(99)).toBe(1)
    })

    it('returns level 2 for 100 XP', () => {
      expect(calculateLevel(100)).toBe(2)
    })

    it('returns level 2 for 299 XP', () => {
      expect(calculateLevel(299)).toBe(2)
    })

    it('returns level 3 for 300 XP', () => {
      // Level 2 requires 100 XP, Level 3 requires 200 more (total 300)
      expect(calculateLevel(300)).toBe(3)
    })

    it('returns level 3 for 599 XP', () => {
      expect(calculateLevel(599)).toBe(3)
    })

    it('returns level 4 for 600 XP', () => {
      // Level 1: 100, Level 2: 200, Level 3: 300 = 600 total
      expect(calculateLevel(600)).toBe(4)
    })

    it('handles large XP values correctly', () => {
      // Calculate expected level for 10000 XP
      // Sum of 1+2+3+...+n = n(n+1)/2 * 100 <= 10000
      // n(n+1) <= 200
      // n = 13 gives 13*14 = 182, so level 14 at 9100 XP
      // n = 14 gives 14*15 = 210, so need 10500 for level 15
      expect(calculateLevel(10000)).toBe(14)
    })
  })

  describe('xpForNextLevel', () => {
    it('returns 100 XP needed for level 1 to reach level 2', () => {
      expect(xpForNextLevel(1)).toBe(100)
    })

    it('returns 200 XP needed for level 2 to reach level 3', () => {
      expect(xpForNextLevel(2)).toBe(200)
    })

    it('returns 500 XP needed for level 5 to reach level 6', () => {
      expect(xpForNextLevel(5)).toBe(500)
    })

    it('returns 1000 XP needed for level 10 to reach level 11', () => {
      expect(xpForNextLevel(10)).toBe(1000)
    })
  })

  describe('totalXPForLevel', () => {
    it('returns 0 XP to reach level 1', () => {
      expect(totalXPForLevel(1)).toBe(0)
    })

    it('returns 100 XP to reach level 2', () => {
      expect(totalXPForLevel(2)).toBe(100)
    })

    it('returns 300 XP to reach level 3', () => {
      // 100 (for level 2) + 200 (for level 3) = 300
      expect(totalXPForLevel(3)).toBe(300)
    })

    it('returns 600 XP to reach level 4', () => {
      // 100 + 200 + 300 = 600
      expect(totalXPForLevel(4)).toBe(600)
    })
  })

  describe('calculateEvolutionStage', () => {
    it('returns stage 1 (Baby) for level 1', () => {
      expect(calculateEvolutionStage(1)).toBe(1)
    })

    it('returns stage 1 (Baby) for level 9', () => {
      expect(calculateEvolutionStage(9)).toBe(1)
    })

    it('returns stage 2 (Teen) for level 10', () => {
      expect(calculateEvolutionStage(10)).toBe(2)
    })

    it('returns stage 2 (Teen) for level 24', () => {
      expect(calculateEvolutionStage(24)).toBe(2)
    })

    it('returns stage 3 (Adult) for level 25', () => {
      expect(calculateEvolutionStage(25)).toBe(3)
    })

    it('returns stage 3 (Adult) for level 49', () => {
      expect(calculateEvolutionStage(49)).toBe(3)
    })

    it('returns stage 4 (Legendary) for level 50', () => {
      expect(calculateEvolutionStage(50)).toBe(4)
    })

    it('returns stage 4 (Legendary) for level 100', () => {
      expect(calculateEvolutionStage(100)).toBe(4)
    })
  })

  describe('getEvolutionStageName', () => {
    it('returns "Baby" for stage 1', () => {
      expect(getEvolutionStageName(1)).toBe('Baby')
    })

    it('returns "Teen" for stage 2', () => {
      expect(getEvolutionStageName(2)).toBe('Teen')
    })

    it('returns "Adult" for stage 3', () => {
      expect(getEvolutionStageName(3)).toBe('Adult')
    })

    it('returns "Legendary" for stage 4', () => {
      expect(getEvolutionStageName(4)).toBe('Legendary')
    })

    it('returns "Unknown" for invalid stage 0', () => {
      expect(getEvolutionStageName(0)).toBe('Unknown')
    })

    it('returns "Unknown" for invalid stage 5', () => {
      expect(getEvolutionStageName(5)).toBe('Unknown')
    })
  })
})
