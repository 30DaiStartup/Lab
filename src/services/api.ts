/**
 * API Client Service Layer
 *
 * This module provides a unified API client for the Outcome Tracking Dashboard.
 * It exports all service modules and provides common error handling utilities.
 */

// Re-export all services
export * from './outcomes'
export * from './experiments'
export * from './tasks'
export * from './raci'
export * from './analysis'

// Re-export error handling utilities
export { ApiError, isApiError, withErrorHandling, safeApiCall } from './errors'

// Re-export the supabase client for direct access when needed
export { supabase } from './supabase'

// Common types re-exported for convenience
export type {
  Database,
  OutcomeStatus,
  OutcomeLevel,
  CascadeAlignment,
  ExperimentStatus,
  TaskStatus,
  RaciRole,
  EntityType,
} from '../types/database'

import { supabase } from './supabase'

/**
 * Check if Supabase is configured and available
 * @returns True if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  // Synchronously check if supabase client is available
  return supabase !== null
}

// Namespace exports for grouped access
import * as outcomes from './outcomes'
import * as experiments from './experiments'
import * as tasks from './tasks'
import * as raci from './raci'
import * as analysis from './analysis'

export const api = {
  outcomes,
  experiments,
  tasks,
  raci,
  analysis,
}
