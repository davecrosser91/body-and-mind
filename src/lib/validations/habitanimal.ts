import { z } from 'zod'

/**
 * UUID validation helper
 */
const uuidSchema = z.string().uuid('Invalid UUID format')

/**
 * Habitanimal name validation
 */
const habitanimalNameSchema = z
  .string()
  .min(1, 'Habitanimal name is required')
  .max(50, 'Habitanimal name must be less than 50 characters')
  .transform((name) => name.trim())

/**
 * Species validation
 * Predefined list of available species
 */
export const speciesOptions = [
  'Phoenix',
  'Dragon',
  'Wolf',
  'Bear',
  'Owl',
  'Fox',
  'Tiger',
  'Rabbit',
  'Cat',
  'Dog',
  'Panda',
  'Koala',
  'Lion',
  'Eagle',
  'Dolphin',
] as const

export const speciesSchema = z
  .string()
  .min(1, 'Species is required')
  .max(50, 'Species must be less than 50 characters')
  .transform((species) => species.trim())

export type Species = (typeof speciesOptions)[number]

/**
 * Create habitanimal request schema
 */
export const createHabitanimalSchema = z.object({
  name: habitanimalNameSchema,
  species: speciesSchema,
})

export type CreateHabitanimalInput = z.infer<typeof createHabitanimalSchema>

/**
 * Update habitanimal request schema
 * Only name can be updated (species is immutable)
 */
export const updateHabitanimalSchema = z
  .object({
    name: habitanimalNameSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

export type UpdateHabitanimalInput = z.infer<typeof updateHabitanimalSchema>

/**
 * Habitanimal ID parameter schema
 */
export const habitanimalIdParamSchema = z.object({
  id: uuidSchema,
})

export type HabitanimalIdParam = z.infer<typeof habitanimalIdParamSchema>

/**
 * List habitanimals query parameters schema
 */
export const listHabitanimalsQuerySchema = z.object({
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
  sortBy: z.enum(['name', 'createdAt', 'level', 'health']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export type ListHabitanimalsQuery = z.infer<typeof listHabitanimalsQuerySchema>

/**
 * Habitanimal stats response schema (for validation of internal data)
 */
export const habitanimalStatsSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  species: z.string(),
  health: z.number().min(0).max(100),
  xp: z.number().int().nonnegative(),
  level: z.number().int().positive(),
  userId: uuidSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type HabitanimalStats = z.infer<typeof habitanimalStatsSchema>

/**
 * Feed habitanimal schema (for potential future feature)
 */
export const feedHabitanimalSchema = z.object({
  foodType: z.enum(['basic', 'premium', 'special']).optional(),
})

export type FeedHabitanimalInput = z.infer<typeof feedHabitanimalSchema>
