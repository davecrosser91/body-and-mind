import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, internalError } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getMood, calculateHealthDecay } from '@/lib/habitanimal-health'
import {
  calculateLevel,
  xpForNextLevel,
  totalXPForLevel,
  getEvolutionStageName,
} from '@/lib/xp'

/**
 * GET /api/v1/habitanimals
 * Returns all habitanimals for the authenticated user
 */
export const GET = requireAuth(async (_request: NextRequest, { user }) => {
  try {
    const now = new Date()

    const habitanimals = await prisma.habitanimal.findMany({
      where: { userId: user.id },
      orderBy: { type: 'asc' },
    })

    // Calculate derived fields for each habitanimal
    const habitanimalsWithDerivedFields = habitanimals.map((habitanimal) => {
      const currentHealth = calculateHealthDecay(
        habitanimal.health,
        habitanimal.lastInteraction,
        now
      )
      const level = calculateLevel(habitanimal.xp)
      const xpToNextLevel = xpForNextLevel(level)
      const xpInCurrentLevel = habitanimal.xp - totalXPForLevel(level)

      return {
        id: habitanimal.id,
        type: habitanimal.type,
        species: habitanimal.species,
        name: habitanimal.name,
        level,
        xp: habitanimal.xp,
        xpInCurrentLevel,
        xpToNextLevel,
        health: currentHealth,
        evolutionStage: habitanimal.evolutionStage,
        evolutionStageName: getEvolutionStageName(habitanimal.evolutionStage),
        mood: getMood(currentHealth),
        lastInteraction: habitanimal.lastInteraction,
        createdAt: habitanimal.createdAt,
        updatedAt: habitanimal.updatedAt,
      }
    })

    return successResponse(habitanimalsWithDerivedFields)
  } catch (error) {
    console.error('Habitanimals fetch error:', error)
    return internalError('Failed to fetch habitanimals')
  }
})
