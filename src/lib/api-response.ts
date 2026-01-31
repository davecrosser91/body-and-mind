import { NextResponse } from 'next/server'

/**
 * Standard API response types
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * HTTP status codes for common scenarios
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus]

/**
 * Error codes for the API
 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
} as const

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode]

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  status: HttpStatusCode = HttpStatus.OK
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

/**
 * Create a success response for created resources
 */
export function createdResponse<T>(
  data: T
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, HttpStatus.CREATED)
}

/**
 * Create a no content response (204)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: HttpStatus.NO_CONTENT })
}

/**
 * Create an error response
 */
export function errorResponse(
  code: ErrorCodeType,
  message: string,
  status: HttpStatusCode,
  details?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  )
}

/**
 * Validation error response
 */
export function validationError(
  message: string,
  details?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    ErrorCode.VALIDATION_ERROR,
    message,
    HttpStatus.BAD_REQUEST,
    details
  )
}

/**
 * Unauthorized error response
 */
export function unauthorizedError(
  message = 'Authentication required'
): NextResponse<ApiErrorResponse> {
  return errorResponse(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED)
}

/**
 * Forbidden error response
 */
export function forbiddenError(
  message = 'Access denied'
): NextResponse<ApiErrorResponse> {
  return errorResponse(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN)
}

/**
 * Not found error response
 */
export function notFoundError(
  message = 'Resource not found'
): NextResponse<ApiErrorResponse> {
  return errorResponse(ErrorCode.NOT_FOUND, message, HttpStatus.NOT_FOUND)
}

/**
 * Conflict error response
 */
export function conflictError(
  message = 'Resource already exists'
): NextResponse<ApiErrorResponse> {
  return errorResponse(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT)
}

/**
 * Rate limit error response
 */
export function rateLimitError(
  message = 'Too many requests'
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    ErrorCode.RATE_LIMITED,
    message,
    HttpStatus.TOO_MANY_REQUESTS
  )
}

/**
 * Internal server error response
 */
export function internalError(
  message = 'An unexpected error occurred'
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    ErrorCode.INTERNAL_ERROR,
    message,
    HttpStatus.INTERNAL_SERVER_ERROR
  )
}

/**
 * Bad request error response
 */
export function badRequestError(
  message: string
): NextResponse<ApiErrorResponse> {
  return errorResponse(ErrorCode.BAD_REQUEST, message, HttpStatus.BAD_REQUEST)
}

/**
 * Paginated response helper
 */
export interface PaginationMeta {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedData<T> {
  items: T[]
  pagination: PaginationMeta
}

export function paginatedResponse<T>(
  items: T[],
  page: number,
  pageSize: number,
  totalCount: number
): NextResponse<ApiSuccessResponse<PaginatedData<T>>> {
  const totalPages = Math.ceil(totalCount / pageSize)

  return successResponse({
    items,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  })
}
