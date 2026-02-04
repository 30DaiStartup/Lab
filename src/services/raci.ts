import { supabase } from './supabase'
import { ApiError } from './errors'
import type { Database, EntityType, RaciRole } from '../types/database'

type Raci = Database['public']['Tables']['raci']['Row']
type RaciInsert = Database['public']['Tables']['raci']['Insert']
type RaciUpdate = Database['public']['Tables']['raci']['Update']

/** RACI assignment data for creating/updating */
export interface RaciData {
  entityId: number
  entityType: EntityType
  role: RaciRole
  userId: number
}

/**
 * Get all RACI assignments for an entity
 * @param entityId - The entity ID (outcome or experiment)
 * @param entityType - The type of entity
 * @returns Array of RACI assignments or empty array if supabase is not configured
 */
export async function getRaci(entityId: number, entityType: EntityType): Promise<Raci[]> {
  if (!supabase) {
    console.warn('Supabase not configured - returning empty RACI list')
    return []
  }

  const { data, error } = await supabase
    .from('raci')
    .select('*')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)

  if (error) {
    throw new ApiError('Failed to fetch RACI assignments', 'FETCH_RACI_ERROR', error)
  }

  return data ?? []
}

/**
 * Get RACI assignments for a specific user
 * @param userId - The user ID
 * @returns Array of RACI assignments for the user
 */
export async function getRaciByUser(userId: number): Promise<Raci[]> {
  if (!supabase) {
    console.warn('Supabase not configured - returning empty RACI list')
    return []
  }

  const { data, error } = await supabase
    .from('raci')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    throw new ApiError('Failed to fetch RACI assignments for user', 'FETCH_USER_RACI_ERROR', error)
  }

  return data ?? []
}

/**
 * Create or update a RACI assignment
 * If an assignment with the same entity, role, and user exists, it will be updated
 * @param data - The RACI assignment data
 * @returns The created or updated RACI assignment
 */
export async function setRaci(data: RaciData): Promise<Raci> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot set RACI', 'SUPABASE_NOT_CONFIGURED')
  }

  const insertData: RaciInsert = {
    entity_id: data.entityId,
    entity_type: data.entityType,
    role: data.role,
    user_id: data.userId,
  }

  // Check if assignment already exists
  const { data: existing } = await supabase
    .from('raci')
    .select('id')
    .eq('entity_id', data.entityId)
    .eq('entity_type', data.entityType)
    .eq('role', data.role)
    .eq('user_id', data.userId)
    .single()

  if (existing) {
    // Update existing
    const { data: updated, error } = await supabase
      .from('raci')
      .update(insertData)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      throw new ApiError('Failed to update RACI assignment', 'UPDATE_RACI_ERROR', error)
    }

    return updated
  }

  // Create new
  const { data: created, error } = await supabase
    .from('raci')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    throw new ApiError('Failed to create RACI assignment', 'CREATE_RACI_ERROR', error)
  }

  return created
}

/**
 * Update an existing RACI assignment
 * @param id - The RACI assignment ID
 * @param data - The fields to update
 * @returns The updated RACI assignment
 */
export async function updateRaci(id: number, data: RaciUpdate): Promise<Raci> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot update RACI', 'SUPABASE_NOT_CONFIGURED')
  }

  const { data: updated, error } = await supabase
    .from('raci')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new ApiError(`Failed to update RACI assignment ${id}`, 'UPDATE_RACI_ERROR', error)
  }

  return updated
}

/**
 * Delete a RACI assignment
 * @param id - The RACI assignment ID to delete
 * @returns True if deleted successfully
 */
export async function deleteRaci(id: number): Promise<boolean> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot delete RACI', 'SUPABASE_NOT_CONFIGURED')
  }

  const { error } = await supabase.from('raci').delete().eq('id', id)

  if (error) {
    throw new ApiError(`Failed to delete RACI assignment ${id}`, 'DELETE_RACI_ERROR', error)
  }

  return true
}

/**
 * Delete all RACI assignments for an entity
 * @param entityId - The entity ID
 * @param entityType - The type of entity
 * @returns True if deleted successfully
 */
export async function deleteAllRaciForEntity(entityId: number, entityType: EntityType): Promise<boolean> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot delete RACI', 'SUPABASE_NOT_CONFIGURED')
  }

  const { error } = await supabase
    .from('raci')
    .delete()
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)

  if (error) {
    throw new ApiError('Failed to delete RACI assignments for entity', 'DELETE_ENTITY_RACI_ERROR', error)
  }

  return true
}

/**
 * Bulk set RACI assignments for an entity (replaces all existing)
 * @param entityId - The entity ID
 * @param entityType - The type of entity
 * @param assignments - Array of role and user pairs
 * @returns Array of created RACI assignments
 */
export async function bulkSetRaci(
  entityId: number,
  entityType: EntityType,
  assignments: Array<{ role: RaciRole; userId: number }>
): Promise<Raci[]> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot bulk set RACI', 'SUPABASE_NOT_CONFIGURED')
  }

  // Delete existing assignments
  await deleteAllRaciForEntity(entityId, entityType)

  if (assignments.length === 0) {
    return []
  }

  // Insert new assignments
  const insertData: RaciInsert[] = assignments.map((a) => ({
    entity_id: entityId,
    entity_type: entityType,
    role: a.role,
    user_id: a.userId,
  }))

  const { data, error } = await supabase.from('raci').insert(insertData).select()

  if (error) {
    throw new ApiError('Failed to bulk set RACI assignments', 'BULK_SET_RACI_ERROR', error)
  }

  return data
}
