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

// Activity schemas - moved from habit.ts to activity.ts
// (schemas removed - API validation is now inline in route handlers)

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
