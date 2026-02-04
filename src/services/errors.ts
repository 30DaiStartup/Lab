/**
 * Common error handling for API services
 */

/**
 * API Error class for typed error handling
 * Used across all service modules for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Check if an error is an ApiError
 * @param error - The error to check
 * @returns True if the error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && error.name === 'ApiError'
}

/**
 * Wrap an async function with common error handling
 * @param fn - The async function to wrap
 * @param errorCode - The error code to use if an error occurs
 * @returns The wrapped function
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  errorCode: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (isApiError(error)) {
        throw error
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        errorCode,
        error
      )
    }
  }) as T
}

/**
 * Helper to safely execute an API call with a fallback value
 * @param fn - The async function to execute
 * @param fallback - The fallback value to return if an error occurs
 * @returns The result of the function or the fallback value
 */
export async function safeApiCall<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error('API call failed:', error)
    return fallback
  }
}
