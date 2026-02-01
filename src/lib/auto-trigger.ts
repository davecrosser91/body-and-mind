/**
 * Auto-Trigger Evaluation Service
 *
 * Evaluates trigger conditions and auto-completes habits when conditions are met.
 * Called after:
 * - Whoop data sync (for recovery, sleep, strain, workout triggers)
 * - Activity completion (for ACTIVITY_COMPLETED triggers)
 */

import { prisma } from '@/lib/db'
import { AutoTriggerType, Source } from '@prisma/client'

/**
 * Context provided when evaluating triggers.
 * Each field corresponds to a data source that can trigger habits.
 */
export interface TriggerContext {
  // Whoop data
  whoopRecovery?: number // 0-100 percentage
  whoopSleepHours?: number // decimal hours
  whoopStrain?: number // 0-21 strain score
  whoopWorkoutTypeId?: number // sport_id from Whoop

  // Activity completion
  completedActivityId?: string

  // Future integrations (8sleep, Apple Watch, etc.)
  // eightsleepSleepScore?: number
  // appleWorkoutTypeId?: number
  // appleExerciseMinutes?: number
}

/**
 * Result of evaluating a single trigger
 */
interface TriggerEvaluationResult {
  triggerId: string
  activityId: string
  activityName: string
  triggered: boolean
  alreadyCompletedToday: boolean
  completionCreated: boolean
}

/**
 * Evaluate all auto-triggers for a user and auto-complete habits when conditions are met.
 *
 * @param userId - The user whose triggers to evaluate
 * @param context - The trigger context containing current data values
 * @returns Array of evaluation results for each trigger
 */
export async function evaluateAutoTriggers(
  userId: string,
  context: TriggerContext
): Promise<TriggerEvaluationResult[]> {
  const results: TriggerEvaluationResult[] = []

  // Get all active triggers for this user's activities
  const triggers = await prisma.autoTrigger.findMany({
    where: {
      isActive: true,
      activity: {
        userId,
        archived: false,
      },
    },
    include: {
      activity: {
        select: {
          id: true,
          name: true,
          points: true,
        },
      },
    },
  })

  if (triggers.length === 0) {
    console.log(`[AutoTrigger] No active triggers found for user ${userId}`)
    return results
  }

  console.log(`[AutoTrigger] Evaluating ${triggers.length} trigger(s) for user ${userId}`)
  console.log(`[AutoTrigger] Context:`, {
    whoopRecovery: context.whoopRecovery,
    whoopSleepHours: context.whoopSleepHours,
    whoopStrain: context.whoopStrain,
    whoopWorkoutTypeId: context.whoopWorkoutTypeId,
    completedActivityId: context.completedActivityId,
  })

  // Get today's date range for checking existing completions
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  // Evaluate each trigger
  for (const trigger of triggers) {
    const result: TriggerEvaluationResult = {
      triggerId: trigger.id,
      activityId: trigger.activity.id,
      activityName: trigger.activity.name,
      triggered: false,
      alreadyCompletedToday: false,
      completionCreated: false,
    }

    // Check if trigger condition is met
    const conditionMet = evaluateTriggerCondition(trigger, context)
    result.triggered = conditionMet

    console.log(
      `[AutoTrigger] "${trigger.activity.name}" (${trigger.triggerType}): ` +
        `condition ${conditionMet ? 'MET' : 'NOT MET'} ` +
        `(threshold: ${trigger.thresholdValue}, workoutType: ${trigger.workoutTypeId})`
    )

    if (conditionMet) {
      // Check if already completed today
      const existingCompletion = await prisma.activityCompletion.findFirst({
        where: {
          activityId: trigger.activity.id,
          completedAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      })

      if (existingCompletion) {
        result.alreadyCompletedToday = true
        console.log(`[AutoTrigger] "${trigger.activity.name}": Already completed today, skipping`)
      } else {
        // Create completion
        await prisma.activityCompletion.create({
          data: {
            activityId: trigger.activity.id,
            pointsEarned: trigger.activity.points,
            source: Source.AUTO_TRIGGER,
            details: getCompletionDetails(trigger.triggerType, context),
          },
        })
        result.completionCreated = true

        console.log(
          `[AutoTrigger] Auto-completed "${trigger.activity.name}" for user ${userId} ` +
            `(trigger: ${trigger.triggerType})`
        )
      }
    }

    results.push(result)
  }

  return results
}

/**
 * Evaluate a single trigger condition against the provided context
 */
function evaluateTriggerCondition(
  trigger: {
    triggerType: AutoTriggerType
    thresholdValue: number | null
    workoutTypeId: number | null
    triggerActivityId: string | null
  },
  context: TriggerContext
): boolean {
  switch (trigger.triggerType) {
    case 'WHOOP_RECOVERY_ABOVE':
      if (context.whoopRecovery === undefined) return false
      return context.whoopRecovery >= (trigger.thresholdValue ?? 0)

    case 'WHOOP_RECOVERY_BELOW':
      if (context.whoopRecovery === undefined) return false
      return context.whoopRecovery < (trigger.thresholdValue ?? 100)

    case 'WHOOP_SLEEP_ABOVE':
      if (context.whoopSleepHours === undefined) return false
      return context.whoopSleepHours >= (trigger.thresholdValue ?? 0)

    case 'WHOOP_STRAIN_ABOVE':
      if (context.whoopStrain === undefined) return false
      return context.whoopStrain >= (trigger.thresholdValue ?? 0)

    case 'WHOOP_WORKOUT_TYPE':
      if (context.whoopWorkoutTypeId === undefined) return false
      return context.whoopWorkoutTypeId === trigger.workoutTypeId

    case 'ACTIVITY_COMPLETED':
      if (!context.completedActivityId) return false
      return context.completedActivityId === trigger.triggerActivityId

    default:
      console.warn(`[AutoTrigger] Unknown trigger type: ${trigger.triggerType}`)
      return false
  }
}

/**
 * Generate a details string for the auto-completion based on trigger type
 */
function getCompletionDetails(
  triggerType: AutoTriggerType,
  context: TriggerContext
): string {
  switch (triggerType) {
    case 'WHOOP_RECOVERY_ABOVE':
      return `Auto-triggered: Recovery ${context.whoopRecovery}%`
    case 'WHOOP_RECOVERY_BELOW':
      return `Auto-triggered: Recovery ${context.whoopRecovery}%`
    case 'WHOOP_SLEEP_ABOVE':
      return `Auto-triggered: Sleep ${context.whoopSleepHours?.toFixed(1)} hours`
    case 'WHOOP_STRAIN_ABOVE':
      return `Auto-triggered: Strain ${context.whoopStrain?.toFixed(1)}`
    case 'WHOOP_WORKOUT_TYPE':
      return `Auto-triggered: Workout type ${context.whoopWorkoutTypeId} logged`
    case 'ACTIVITY_COMPLETED':
      return `Auto-triggered: Linked activity completed`
    default:
      return 'Auto-triggered'
  }
}

/**
 * Whoop workout types for reference
 * These are the most common sport_ids from the Whoop API
 */
export const WHOOP_WORKOUT_TYPES = [
  { id: 1, name: 'Running' },
  { id: 44, name: 'Functional Fitness' },
  { id: 43, name: 'HIIT' },
  { id: 0, name: 'Weightlifting' },
  { id: 63, name: 'Meditation' },
  { id: 52, name: 'Cycling' },
  { id: 71, name: 'Yoga' },
  { id: 48, name: 'Swimming' },
  { id: 82, name: 'Walking' },
  { id: 16, name: 'Basketball' },
  { id: 25, name: 'Golf' },
  { id: 57, name: 'Tennis' },
  { id: 64, name: 'Rowing' },
  { id: 73, name: 'Pilates' },
] as const
