import { describe, it, expect } from 'vitest'
import {
  daysBetween,
  calculateHealthDecay,
  recoverHealth,
  getMood,
  needsAttention,
} from '@/lib/habitanimal-health'

describe('Habitanimal Health', () => {
  describe('daysBetween', () => {
    it('returns 0 for same date', () => {
      const date = new Date('2024-01-15T12:00:00')
      expect(daysBetween(date, date)).toBe(0)
    })

    it('returns 0 for dates less than 24 hours apart', () => {
      const date1 = new Date('2024-01-15T12:00:00')
      const date2 = new Date('2024-01-15T20:00:00')
      expect(daysBetween(date1, date2)).toBe(0)
    })

    it('returns 1 for dates exactly 24 hours apart', () => {
      const date1 = new Date('2024-01-15T12:00:00')
      const date2 = new Date('2024-01-16T12:00:00')
      expect(daysBetween(date1, date2)).toBe(1)
    })

    it('returns 1 for dates between 24 and 48 hours apart', () => {
      const date1 = new Date('2024-01-15T12:00:00')
      const date2 = new Date('2024-01-16T18:00:00')
      expect(daysBetween(date1, date2)).toBe(1)
    })

    it('returns 7 for dates one week apart', () => {
      const date1 = new Date('2024-01-15T12:00:00')
      const date2 = new Date('2024-01-22T12:00:00')
      expect(daysBetween(date1, date2)).toBe(7)
    })

    it('works regardless of date order', () => {
      const date1 = new Date('2024-01-15T12:00:00')
      const date2 = new Date('2024-01-20T12:00:00')
      expect(daysBetween(date1, date2)).toBe(5)
      expect(daysBetween(date2, date1)).toBe(5)
    })
  })

  describe('calculateHealthDecay', () => {
    const currentHealth = 100
    const baseDate = new Date('2024-01-15T12:00:00')

    it('returns same health when completed today (0 days)', () => {
      const now = new Date('2024-01-15T18:00:00')
      expect(calculateHealthDecay(currentHealth, baseDate, now)).toBe(100)
    })

    it('returns same health when completed yesterday (1 day)', () => {
      const now = new Date('2024-01-16T12:00:00')
      expect(calculateHealthDecay(currentHealth, baseDate, now)).toBe(100)
    })

    it('applies small decay (10) when missed 1 day (2 days since)', () => {
      const now = new Date('2024-01-17T12:00:00')
      expect(calculateHealthDecay(currentHealth, baseDate, now)).toBe(90)
    })

    it('applies larger decay when missed 2+ consecutive days', () => {
      // 3 days since = missed 2 days = 10 + (1 * 30) = 40 decay
      const now = new Date('2024-01-18T12:00:00')
      expect(calculateHealthDecay(currentHealth, baseDate, now)).toBe(60)
    })

    it('applies increasing decay for more missed days', () => {
      // 4 days since = missed 3 days = 10 + (2 * 30) = 70 decay
      const now = new Date('2024-01-19T12:00:00')
      expect(calculateHealthDecay(currentHealth, baseDate, now)).toBe(30)
    })

    it('clamps health at minimum 0', () => {
      // 5 days since = missed 4 days = 10 + (3 * 30) = 100 decay
      const now = new Date('2024-01-20T12:00:00')
      expect(calculateHealthDecay(currentHealth, baseDate, now)).toBe(0)
    })

    it('clamps health at minimum 0 for very long absences', () => {
      const now = new Date('2024-02-15T12:00:00') // 1 month later
      expect(calculateHealthDecay(currentHealth, baseDate, now)).toBe(0)
    })

    it('works with lower starting health', () => {
      const now = new Date('2024-01-17T12:00:00') // 2 days since
      expect(calculateHealthDecay(50, baseDate, now)).toBe(40)
    })

    it('does not go below 0 when starting health is low', () => {
      const now = new Date('2024-01-18T12:00:00') // 3 days since, 40 decay
      expect(calculateHealthDecay(30, baseDate, now)).toBe(0)
    })
  })

  describe('recoverHealth', () => {
    it('increases health by 15', () => {
      expect(recoverHealth(50)).toBe(65)
    })

    it('caps health at 100', () => {
      expect(recoverHealth(90)).toBe(100)
    })

    it('returns 100 when already at 100', () => {
      expect(recoverHealth(100)).toBe(100)
    })

    it('recovers from 0 health', () => {
      expect(recoverHealth(0)).toBe(15)
    })

    it('caps at exactly 100 when would exceed', () => {
      expect(recoverHealth(95)).toBe(100)
    })
  })

  describe('getMood', () => {
    it('returns "happy" for health >= 80', () => {
      expect(getMood(80)).toBe('happy')
      expect(getMood(90)).toBe('happy')
      expect(getMood(100)).toBe('happy')
    })

    it('returns "neutral" for health 50-79', () => {
      expect(getMood(50)).toBe('neutral')
      expect(getMood(65)).toBe('neutral')
      expect(getMood(79)).toBe('neutral')
    })

    it('returns "tired" for health 30-49', () => {
      expect(getMood(30)).toBe('tired')
      expect(getMood(40)).toBe('tired')
      expect(getMood(49)).toBe('tired')
    })

    it('returns "sad" for health < 30', () => {
      expect(getMood(0)).toBe('sad')
      expect(getMood(15)).toBe('sad')
      expect(getMood(29)).toBe('sad')
    })

    it('handles boundary values correctly', () => {
      expect(getMood(79)).toBe('neutral')
      expect(getMood(80)).toBe('happy')
      expect(getMood(49)).toBe('tired')
      expect(getMood(50)).toBe('neutral')
      expect(getMood(29)).toBe('sad')
      expect(getMood(30)).toBe('tired')
    })
  })

  describe('needsAttention', () => {
    it('returns true for health < 50', () => {
      expect(needsAttention(0)).toBe(true)
      expect(needsAttention(25)).toBe(true)
      expect(needsAttention(49)).toBe(true)
    })

    it('returns false for health >= 50', () => {
      expect(needsAttention(50)).toBe(false)
      expect(needsAttention(75)).toBe(false)
      expect(needsAttention(100)).toBe(false)
    })

    it('handles boundary at 50 correctly', () => {
      expect(needsAttention(49)).toBe(true)
      expect(needsAttention(50)).toBe(false)
    })
  })
})
