import { NextRequest } from 'next/server'
import { z, ZodError, ZodSchema } from 'zod'
import { validationError } from './api-response'

/**
 * Result type for validation
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ReturnType<typeof validationError> }

/**
 * Format Zod errors into a user-friendly structure
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root'
    if (!details[path]) {
      details[path] = []
    }
    details[path].push(issue.message)
  }

  return details
}

/**
 * Validate request body against a Zod schema
 *
 * @example
 * ```typescript
 * const result = await validateRequest(request, createHabitSchema)
 * if (!result.success) {
 *   return result.error
 * }
 * const { name, frequency } = result.data
 * ```
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatZodErrors(error)
      return {
        success: false,
        error: validationError('Validation failed', details),
      }
    }

    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: validationError('Invalid JSON in request body'),
      }
    }

    return {
      success: false,
      error: validationError('Failed to parse request body'),
    }
  }
}

/**
 * Validate URL query parameters against a Zod schema
 *
 * @example
 * ```typescript
 * const result = validateQuery(request, listHabitsQuerySchema)
 * if (!result.success) {
 *   return result.error
 * }
 * const { page, pageSize, frequency } = result.data
 * ```
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const { searchParams } = new URL(request.url)
    const params: Record<string, string | undefined> = {}

    searchParams.forEach((value, key) => {
      params[key] = value
    })

    const data = schema.parse(params)
    return { success: true, data }
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatZodErrors(error)
      return {
        success: false,
        error: validationError('Invalid query parameters', details),
      }
    }

    return {
      success: false,
      error: validationError('Failed to parse query parameters'),
    }
  }
}

/**
 * Validate URL path parameters against a Zod schema
 *
 * @example
 * ```typescript
 * const result = validateParams({ id: params.id }, habitIdParamSchema)
 * if (!result.success) {
 *   return result.error
 * }
 * const { id } = result.data
 * ```
 */
export function validateParams<T>(
  params: Record<string, string | undefined>,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const data = schema.parse(params)
    return { success: true, data }
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatZodErrors(error)
      return {
        success: false,
        error: validationError('Invalid path parameters', details),
      }
    }

    return {
      success: false,
      error: validationError('Failed to parse path parameters'),
    }
  }
}

/**
 * Validate any data against a Zod schema
 * Useful for validating data from sources other than HTTP requests
 *
 * @example
 * ```typescript
 * const result = validate(someData, mySchema)
 * if (!result.success) {
 *   console.error(result.error)
 *   return
 * }
 * const validData = result.data
 * ```
 */
export function validate<T>(
  data: unknown,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const validData = schema.parse(data)
    return { success: true, data: validData }
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatZodErrors(error)
      return {
        success: false,
        error: validationError('Validation failed', details),
      }
    }

    return {
      success: false,
      error: validationError('Validation failed'),
    }
  }
}

/**
 * Safe parse wrapper that returns the parsed data or undefined
 * Useful when you want to silently handle validation failures
 */
export function safeParse<T>(data: unknown, schema: ZodSchema<T>): T | undefined {
  const result = schema.safeParse(data)
  return result.success ? result.data : undefined
}
