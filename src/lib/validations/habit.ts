import { z } from 'zod'

/**
 * Habit frequency enum
 */
export const habitFrequencySchema = z.enum(['daily', 'weekly', 'monthly'])
export type HabitFrequency = z.infer<typeof habitFrequencySchema>

/**
 * Habit name validation
 */
const habitNameSchema = z
  .string()
  .min(1, 'Habit name is required')
  .max(100, 'Habit name must be less than 100 characters')
  .transform((name) => name.trim())

/**
 * Habit description validation
 */
const habitDescriptionSchema = z
  .string()
  .max(500, 'Description must be less than 500 characters')
  .nullable()
  .optional()
  .transform((desc) => (desc ? desc.trim() : null))

/**
 * UUID validation helper
 */
const uuidSchema = z.string().uuid('Invalid UUID format')

/**
 * Create habit request schema
 */
export const createHabitSchema = z.object({
  name: habitNameSchema,
  description: habitDescriptionSchema,
  frequency: habitFrequencySchema,
  habitanimalId: uuidSchema,
})

export type CreateHabitInput = z.infer<typeof createHabitSchema>

/**
 * Update habit request schema
 * All fields are optional for partial updates
 */
export const updateHabitSchema = z
  .object({
    name: habitNameSchema.optional(),
    description: habitDescriptionSchema,
    frequency: habitFrequencySchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export type UpdateHabitInput = z.infer<typeof updateHabitSchema>

/**
 * Habit ID parameter schema
 */
export const habitIdParamSchema = z.object({
  id: uuidSchema,
})

export type HabitIdParam = z.infer<typeof habitIdParamSchema>

/**
 * List habits query parameters schema
 */
export const listHabitsQuerySchema = z.object({
  habitanimalId: uuidSchema.optional(),
  frequency: habitFrequencySchema.optional(),
  page: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 1
      return isNaN(parsed) || parsed < 1 ? 1 : parsed
    }),
  pageSize: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 20
      if (isNaN(parsed) || parsed < 1) return 20
      return Math.min(parsed, 100)
    }),
})

export type ListHabitsQuery = z.infer<typeof listHabitsQuerySchema>

/**
 * Complete habit request schema
 * Optional fields for completion metadata
 */
export const completeHabitSchema = z.object({
  completedAt: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : new Date())),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
})

export type CompleteHabitInput = z.infer<typeof completeHabitSchema>

/**
 * List completions query parameters
 */
export const listCompletionsQuerySchema = z.object({
  habitId: uuidSchema.optional(),
  startDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  page: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 1
      return isNaN(parsed) || parsed < 1 ? 1 : parsed
    }),
  pageSize: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 20
      if (isNaN(parsed) || parsed < 1) return 20
      return Math.min(parsed, 100)
    }),
})

export type ListCompletionsQuery = z.infer<typeof listCompletionsQuerySchema>
