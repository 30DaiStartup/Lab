import { supabase } from './supabase'
import { ApiError } from './errors'
import type { Database, OutcomeStatus, OutcomeLevel, CascadeAlignment } from '../types/database'

type Outcome = Database['public']['Tables']['outcomes']['Row']
type OutcomeInsert = Database['public']['Tables']['outcomes']['Insert']
type OutcomeUpdate = Database['public']['Tables']['outcomes']['Update']
type Experiment = Database['public']['Tables']['experiments']['Row']

/** Filters for querying outcomes */
export interface OutcomeFilters {
  status?: OutcomeStatus
  level?: OutcomeLevel
  cascadeAlignment?: CascadeAlignment
  parentOutcomeId?: number | null
}

/** Outcome with related experiments */
export interface OutcomeWithExperiments extends Outcome {
  experiments: Experiment[]
}

/**
 * Get all outcomes with optional filters
 * @param filters - Optional filters for status, level, cascade alignment, or parent
 * @returns Array of outcomes or empty array if supabase is not configured
 */
export async function getOutcomes(filters?: OutcomeFilters): Promise<Outcome[]> {
  if (!supabase) {
    console.warn('Supabase not configured - returning empty outcomes list')
    return []
  }

  let query = supabase.from('outcomes').select('*')

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.level) {
    query = query.eq('level', filters.level)
  }
  if (filters?.cascadeAlignment) {
    query = query.contains('cascade_alignment', [filters.cascadeAlignment])
  }
  if (filters?.parentOutcomeId !== undefined) {
    if (filters.parentOutcomeId === null) {
      query = query.is('parent_outcome_id', null)
    } else {
      query = query.eq('parent_outcome_id', filters.parentOutcomeId)
    }
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new ApiError('Failed to fetch outcomes', 'FETCH_OUTCOMES_ERROR', error)
  }

  return data ?? []
}

/**
 * Get a single outcome by ID
 * @param id - The outcome ID
 * @returns The outcome or null if not found
 */
export async function getOutcome(id: number): Promise<Outcome | null> {
  if (!supabase) {
    console.warn('Supabase not configured - returning null for outcome')
    return null
  }

  const { data, error } = await supabase
    .from('outcomes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Row not found
      return null
    }
    throw new ApiError(`Failed to fetch outcome ${id}`, 'FETCH_OUTCOME_ERROR', error)
  }

  return data
}

/**
 * Create a new outcome
 * @param data - The outcome data to insert
 * @returns The created outcome
 */
export async function createOutcome(data: OutcomeInsert): Promise<Outcome> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot create outcome', 'SUPABASE_NOT_CONFIGURED')
  }

  const { data: created, error } = await supabase
    .from('outcomes')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new ApiError('Failed to create outcome', 'CREATE_OUTCOME_ERROR', error)
  }

  return created
}

/**
 * Update an existing outcome
 * @param id - The outcome ID to update
 * @param data - The fields to update
 * @returns The updated outcome
 */
export async function updateOutcome(id: number, data: OutcomeUpdate): Promise<Outcome> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot update outcome', 'SUPABASE_NOT_CONFIGURED')
  }

  const { data: updated, error } = await supabase
    .from('outcomes')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new ApiError(`Failed to update outcome ${id}`, 'UPDATE_OUTCOME_ERROR', error)
  }

  return updated
}

/**
 * Delete an outcome
 * @param id - The outcome ID to delete
 * @returns True if deleted successfully
 */
export async function deleteOutcome(id: number): Promise<boolean> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot delete outcome', 'SUPABASE_NOT_CONFIGURED')
  }

  const { error } = await supabase.from('outcomes').delete().eq('id', id)

  if (error) {
    throw new ApiError(`Failed to delete outcome ${id}`, 'DELETE_OUTCOME_ERROR', error)
  }

  return true
}

/**
 * Get an outcome with all its related experiments
 * @param id - The outcome ID
 * @returns The outcome with experiments or null if not found
 */
export async function getOutcomeWithExperiments(id: number): Promise<OutcomeWithExperiments | null> {
  if (!supabase) {
    console.warn('Supabase not configured - returning null for outcome with experiments')
    return null
  }

  const { data, error } = await supabase
    .from('outcomes')
    .select(`
      *,
      experiments (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new ApiError(`Failed to fetch outcome ${id} with experiments`, 'FETCH_OUTCOME_EXPERIMENTS_ERROR', error)
  }

  return data as OutcomeWithExperiments
}
