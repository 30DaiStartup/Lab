import { supabase } from './supabase'
import { ApiError } from './errors'
import type { Database, EntityType } from '../types/database'

type Analysis = Database['public']['Tables']['analysis']['Row']
type AnalysisInsert = Database['public']['Tables']['analysis']['Insert']
type AnalysisUpdate = Database['public']['Tables']['analysis']['Update']

/** Analysis data for creating/updating */
export interface AnalysisData {
  entityId: number
  entityType: EntityType
  currentState?: Record<string, unknown> | null
  processBreakdown?: Record<string, unknown> | null
  solutions?: Record<string, unknown> | null
}

/**
 * Get analysis for an entity
 * @param entityId - The entity ID (outcome or experiment)
 * @param entityType - The type of entity
 * @returns The analysis or null if not found
 */
export async function getAnalysis(entityId: number, entityType: EntityType): Promise<Analysis | null> {
  if (!supabase) {
    console.warn('Supabase not configured - returning null for analysis')
    return null
  }

  const { data, error } = await supabase
    .from('analysis')
    .select('*')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Row not found
      return null
    }
    throw new ApiError('Failed to fetch analysis', 'FETCH_ANALYSIS_ERROR', error)
  }

  return data
}

/**
 * Get analysis by ID
 * @param id - The analysis ID
 * @returns The analysis or null if not found
 */
export async function getAnalysisById(id: number): Promise<Analysis | null> {
  if (!supabase) {
    console.warn('Supabase not configured - returning null for analysis')
    return null
  }

  const { data, error } = await supabase
    .from('analysis')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new ApiError(`Failed to fetch analysis ${id}`, 'FETCH_ANALYSIS_ERROR', error)
  }

  return data
}

/**
 * Create or update analysis for an entity
 * If analysis for the entity already exists, it will be updated
 * @param data - The analysis data
 * @returns The created or updated analysis
 */
export async function saveAnalysis(data: AnalysisData): Promise<Analysis> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot save analysis', 'SUPABASE_NOT_CONFIGURED')
  }

  // Check if analysis already exists for this entity
  const existing = await getAnalysis(data.entityId, data.entityType)

  if (existing) {
    // Update existing analysis
    const updateData: AnalysisUpdate = {}

    if (data.currentState !== undefined) {
      updateData.current_state = data.currentState
    }
    if (data.processBreakdown !== undefined) {
      updateData.process_breakdown = data.processBreakdown
    }
    if (data.solutions !== undefined) {
      updateData.solutions = data.solutions
    }

    const { data: updated, error } = await supabase
      .from('analysis')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      throw new ApiError('Failed to update analysis', 'UPDATE_ANALYSIS_ERROR', error)
    }

    return updated
  }

  // Create new analysis
  const insertData: AnalysisInsert = {
    entity_id: data.entityId,
    entity_type: data.entityType,
    current_state: data.currentState ?? null,
    process_breakdown: data.processBreakdown ?? null,
    solutions: data.solutions ?? null,
  }

  const { data: created, error } = await supabase
    .from('analysis')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    throw new ApiError('Failed to create analysis', 'CREATE_ANALYSIS_ERROR', error)
  }

  return created
}

/**
 * Update current state section of analysis
 * @param entityId - The entity ID
 * @param entityType - The type of entity
 * @param currentState - The current state data
 * @returns The updated analysis
 */
export async function updateCurrentState(
  entityId: number,
  entityType: EntityType,
  currentState: Record<string, unknown>
): Promise<Analysis> {
  return saveAnalysis({ entityId, entityType, currentState })
}

/**
 * Update process breakdown section of analysis
 * @param entityId - The entity ID
 * @param entityType - The type of entity
 * @param processBreakdown - The process breakdown data
 * @returns The updated analysis
 */
export async function updateProcessBreakdown(
  entityId: number,
  entityType: EntityType,
  processBreakdown: Record<string, unknown>
): Promise<Analysis> {
  return saveAnalysis({ entityId, entityType, processBreakdown })
}

/**
 * Update solutions section of analysis
 * @param entityId - The entity ID
 * @param entityType - The type of entity
 * @param solutions - The solutions data
 * @returns The updated analysis
 */
export async function updateSolutions(
  entityId: number,
  entityType: EntityType,
  solutions: Record<string, unknown>
): Promise<Analysis> {
  return saveAnalysis({ entityId, entityType, solutions })
}

/**
 * Delete analysis for an entity
 * @param entityId - The entity ID
 * @param entityType - The type of entity
 * @returns True if deleted successfully, false if not found
 */
export async function deleteAnalysis(entityId: number, entityType: EntityType): Promise<boolean> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot delete analysis', 'SUPABASE_NOT_CONFIGURED')
  }

  const { error, count } = await supabase
    .from('analysis')
    .delete()
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)

  if (error) {
    throw new ApiError('Failed to delete analysis', 'DELETE_ANALYSIS_ERROR', error)
  }

  return (count ?? 0) > 0
}

/**
 * Delete analysis by ID
 * @param id - The analysis ID
 * @returns True if deleted successfully
 */
export async function deleteAnalysisById(id: number): Promise<boolean> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot delete analysis', 'SUPABASE_NOT_CONFIGURED')
  }

  const { error } = await supabase.from('analysis').delete().eq('id', id)

  if (error) {
    throw new ApiError(`Failed to delete analysis ${id}`, 'DELETE_ANALYSIS_ERROR', error)
  }

  return true
}
