/**
 * Central export for all validation schemas
 */

// Auth schemas
export {
  signupSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  updateProfileSchema,
  type SignupInput,
  type LoginInput,
  type PasswordResetRequestInput,
  type PasswordResetInput,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from './auth'

// Habit schemas
export {
  habitFrequencySchema,
  createHabitSchema,
  updateHabitSchema,
  habitIdParamSchema,
  listHabitsQuerySchema,
  completeHabitSchema,
  listCompletionsQuerySchema,
  type HabitFrequency,
  type CreateHabitInput,
  type UpdateHabitInput,
  type HabitIdParam,
  type ListHabitsQuery,
  type CompleteHabitInput,
  type ListCompletionsQuery,
} from './habit'

// Habitanimal schemas
export {
  speciesOptions,
  speciesSchema,
  createHabitanimalSchema,
  updateHabitanimalSchema,
  habitanimalIdParamSchema,
  listHabitanimalsQuerySchema,
  habitanimalStatsSchema,
  feedHabitanimalSchema,
  type Species,
  type CreateHabitanimalInput,
  type UpdateHabitanimalInput,
  type HabitanimalIdParam,
  type ListHabitanimalsQuery,
  type HabitanimalStats,
  type FeedHabitanimalInput,
} from './habitanimal'

// Common validation utilities
export { validateRequest, validateQuery, validateParams } from '../validate'
