import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { successResponse, internalError } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { calculateHealthDecay, getMood } from '@/lib/habitanimal-health'

/**
 * POST /api/v1/habitanimals/recalculate-health
 * Recalculates health for all user's habitanimals based on their last interaction
 * This applies the health decay algorithm and updates the database
 */
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { user } = authResult.context

  try {
    const now = new Date()

    // Fetch all habitanimals for the user
    const habitanimals = await prisma.habitanimal.findMany({
      where: {
        userId: user.id,
      },
    })

    // Calculate new health for each habitanimal and prepare updates
    const updates = habitanimals.map((habitanimal) => {
      const newHealth = calculateHealthDecay(
        habitanimal.health,
        habitanimal.lastInteraction,
        now
      )

      return {
        id: habitanimal.id,
        previousHealth: habitanimal.health,
        newHealth,
        lastInteraction: habitanimal.lastInteraction,
      }
    })

    // Update all habitanimals in a transaction
    await prisma.$transaction(
      updates.map((update) =>
        prisma.habitanimal.update({
          where: { id: update.id },
          data: { health: update.newHealth },
        })
      )
    )

    // Fetch updated habitanimals to return
    const updatedHabitanimals = await prisma.habitanimal.findMany({
      where: {
        userId: user.id,
      },
    })

    // Format response with updated data
    const response = updatedHabitanimals.map((habitanimal) => {
      const update = updates.find((u) => u.id === habitanimal.id)

      return {
        id: habitanimal.id,
        type: habitanimal.type,
        species: habitanimal.species,
        name: habitanimal.name,
        health: habitanimal.health,
        previousHealth: update?.previousHealth ?? habitanimal.health,
        healthChange: update
          ? habitanimal.health - update.previousHealth
          : 0,
        mood: getMood(habitanimal.health),
        lastInteraction: habitanimal.lastInteraction,
        updatedAt: habitanimal.updatedAt,
      }
    })

    return successResponse({
      recalculatedAt: now.toISOString(),
      habitanimals: response,
      summary: {
        total: response.length,
        healthDecayed: response.filter((h) => h.healthChange < 0).length,
        healthUnchanged: response.filter((h) => h.healthChange === 0).length,
      },
    })
  } catch (error) {
    console.error('Health recalculation error:', error)
    return internalError('Failed to recalculate habitanimal health')
  }
}
