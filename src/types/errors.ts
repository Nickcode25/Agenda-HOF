/**
 * Error types for the application
 * Replaces generic 'any' types with proper type safety
 */

export interface AppError {
  message: string
  code?: string
  details?: unknown
}

export interface SupabaseError extends AppError {
  code: string
  details: string
  hint?: string
}

/**
 * Type guard to check if error is a Supabase error
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (isSupabaseError(error)) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }

  return 'An unknown error occurred'
}

/**
 * Safely extract error code from unknown error
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isSupabaseError(error)) {
    return error.code
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String(error.code)
  }

  return undefined
}
