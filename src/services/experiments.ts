import { supabase } from './supabase'
import { ApiError } from './errors'
import type { Database, ExperimentStatus } from '../types/database'

type Experiment = Database['public']['Tables']['experiments']['Row']
type ExperimentInsert = Database['public']['Tables']['experiments']['Insert']
type ExperimentUpdate = Database['public']['Tables']['experiments']['Update']
type Task = Database['public']['Tables']['tasks']['Row']

/** Filters for querying experiments */
export interface ExperimentFilters {
  outcomeId?: number
  status?: ExperimentStatus
}

/** Experiment with related tasks */
export interface ExperimentWithTasks extends Experiment {
  tasks: Task[]
}

/**
 * Get all experiments with optional filters
 * @param outcomeId - Optional outcome ID to filter by
 * @param filters - Optional additional filters
 * @returns Array of experiments or empty array if supabase is not configured
 */
export async function getExperiments(outcomeId?: number, filters?: Omit<ExperimentFilters, 'outcomeId'>): Promise<Experiment[]> {
  if (!supabase) {
    console.warn('Supabase not configured - returning empty experiments list')
    return []
  }

  let query = supabase.from('experiments').select('*')

  if (outcomeId !== undefined) {
    query = query.eq('outcome_id', outcomeId)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new ApiError('Failed to fetch experiments', 'FETCH_EXPERIMENTS_ERROR', error)
  }

  return data ?? []
}

/**
 * Get a single experiment by ID
 * @param id - The experiment ID
 * @returns The experiment or null if not found
 */
export async function getExperiment(id: number): Promise<Experiment | null> {
  if (!supabase) {
    console.warn('Supabase not configured - returning null for experiment')
    return null
  }

  const { data, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Row not found
      return null
    }
    throw new ApiError(`Failed to fetch experiment ${id}`, 'FETCH_EXPERIMENT_ERROR', error)
  }

  return data
}

/**
 * Create a new experiment
 * @param data - The experiment data to insert
 * @returns The created experiment
 */
export async function createExperiment(data: ExperimentInsert): Promise<Experiment> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot create experiment', 'SUPABASE_NOT_CONFIGURED')
  }

  const { data: created, error } = await supabase
    .from('experiments')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new ApiError('Failed to create experiment', 'CREATE_EXPERIMENT_ERROR', error)
  }

  return created
}

/**
 * Update an existing experiment
 * @param id - The experiment ID to update
 * @param data - The fields to update
 * @returns The updated experiment
 */
export async function updateExperiment(id: number, data: ExperimentUpdate): Promise<Experiment> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot update experiment', 'SUPABASE_NOT_CONFIGURED')
  }

  const { data: updated, error } = await supabase
    .from('experiments')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new ApiError(`Failed to update experiment ${id}`, 'UPDATE_EXPERIMENT_ERROR', error)
  }

  return updated
}

/**
 * Delete an experiment
 * @param id - The experiment ID to delete
 * @returns True if deleted successfully
 */
export async function deleteExperiment(id: number): Promise<boolean> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot delete experiment', 'SUPABASE_NOT_CONFIGURED')
  }

  const { error } = await supabase.from('experiments').delete().eq('id', id)

  if (error) {
    throw new ApiError(`Failed to delete experiment ${id}`, 'DELETE_EXPERIMENT_ERROR', error)
  }

  return true
}

/**
 * Get an experiment with all its related tasks
 * @param id - The experiment ID
 * @returns The experiment with tasks or null if not found
 */
export async function getExperimentWithTasks(id: number): Promise<ExperimentWithTasks | null> {
  if (!supabase) {
    console.warn('Supabase not configured - returning null for experiment with tasks')
    return null
  }

  const { data, error } = await supabase
    .from('experiments')
    .select(`
      *,
      tasks (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new ApiError(`Failed to fetch experiment ${id} with tasks`, 'FETCH_EXPERIMENT_TASKS_ERROR', error)
  }

  return data as ExperimentWithTasks
}
