import { useState, useEffect, useCallback } from 'react'
import type { Database, EntityType, RaciRole } from '../types/database'
import {
  getRaci,
  getRaciByUser,
  setRaci as setRaciService,
  deleteRaci,
  bulkSetRaci as bulkSetRaciService,
  type RaciData,
} from '../services/raci'

// ============================================================================
// Types
// ============================================================================

type Raci = Database['public']['Tables']['raci']['Row']

/** RACI assignments organized by role for easy display */
export interface RaciAssignmentsByRole {
  Responsible: Raci[]
  Accountable: Raci[]
  Support: Raci[]
  Consulted: Raci[]
  Informed: Raci[]
}

/** Display data for rendering RACI assignments in UI */
export interface RaciDisplayData {
  id: number
  userId: number
  role: RaciRole
  entityId: number
  entityType: EntityType
}

/** Input for bulk assignment operations */
export interface BulkRaciAssignment {
  role: RaciRole
  userId: number
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Groups RACI assignments by role
 */
function groupByRole(assignments: Raci[]): RaciAssignmentsByRole {
  const grouped: RaciAssignmentsByRole = {
    Responsible: [],
    Accountable: [],
    Support: [],
    Consulted: [],
    Informed: [],
  }

  for (const assignment of assignments) {
    grouped[assignment.role].push(assignment)
  }

  return grouped
}

/**
 * Converts a Raci row to RaciDisplayData
 */
export function toDisplayData(assignment: Raci): RaciDisplayData {
  return {
    id: assignment.id,
    userId: assignment.user_id,
    role: assignment.role,
    entityId: assignment.entity_id,
    entityType: assignment.entity_type,
  }
}

// ============================================================================
// useRaci Hook
// ============================================================================

export interface UseRaciReturn {
  /** Raw RACI assignments */
  assignments: Raci[]
  /** Assignments grouped by role for easy display */
  assignmentsByRole: RaciAssignmentsByRole
  /** Loading state */
  isLoading: boolean
  /** Error if fetch failed */
  error: Error | null
  /** Refetch assignments */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch RACI assignments for an entity (Outcome or Experiment)
 * @param entityId - The entity ID
 * @param entityType - The type of entity ('Outcome' | 'Experiment')
 */
export function useRaci(entityId: number, entityType: EntityType): UseRaciReturn {
  const [assignments, setAssignments] = useState<Raci[]>([])
  const [assignmentsByRole, setAssignmentsByRole] = useState<RaciAssignmentsByRole>({
    Responsible: [],
    Accountable: [],
    Support: [],
    Consulted: [],
    Informed: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getRaci(entityId, entityType)
      setAssignments(data)
      setAssignmentsByRole(groupByRole(data))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch RACI assignments'))
    } finally {
      setIsLoading(false)
    }
  }, [entityId, entityType])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  return {
    assignments,
    assignmentsByRole,
    isLoading,
    error,
    refetch: fetchAssignments,
  }
}

// ============================================================================
// useUserRaci Hook
// ============================================================================

export interface UseUserRaciReturn {
  /** All RACI assignments for the user */
  assignments: Raci[]
  /** Assignments grouped by role */
  assignmentsByRole: RaciAssignmentsByRole
  /** Loading state */
  isLoading: boolean
  /** Error if fetch failed */
  error: Error | null
  /** Refetch assignments */
  refetch: () => Promise<void>
}

/**
 * Hook to get all RACI assignments for a specific user
 * Useful for "My Assignments" views
 * @param userId - The user ID
 */
export function useUserRaci(userId: number): UseUserRaciReturn {
  const [assignments, setAssignments] = useState<Raci[]>([])
  const [assignmentsByRole, setAssignmentsByRole] = useState<RaciAssignmentsByRole>({
    Responsible: [],
    Accountable: [],
    Support: [],
    Consulted: [],
    Informed: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getRaciByUser(userId)
      setAssignments(data)
      setAssignmentsByRole(groupByRole(data))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user RACI assignments'))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  return {
    assignments,
    assignmentsByRole,
    isLoading,
    error,
    refetch: fetchAssignments,
  }
}

// ============================================================================
// useRaciMutations Hook
// ============================================================================

export interface UseRaciMutationsReturn {
  /** Assign a user to a RACI role */
  setRaci: (data: RaciData) => Promise<Raci>
  /** Remove a RACI assignment by ID */
  removeRaci: (id: number) => Promise<boolean>
  /** Replace all RACI assignments for an entity */
  bulkSetRaci: (
    entityId: number,
    entityType: EntityType,
    assignments: BulkRaciAssignment[]
  ) => Promise<Raci[]>
  /** Whether any mutation is in progress */
  isLoading: boolean
  /** Error from the last mutation */
  error: Error | null
}

/**
 * Hook for RACI mutation operations
 * Provides functions to set, remove, and bulk update RACI assignments
 */
export function useRaciMutations(): UseRaciMutationsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const setRaci = useCallback(async (data: RaciData): Promise<Raci> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await setRaciService(data)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to set RACI assignment')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const removeRaci = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await deleteRaci(id)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove RACI assignment')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const bulkSetRaci = useCallback(
    async (
      entityId: number,
      entityType: EntityType,
      assignments: BulkRaciAssignment[]
    ): Promise<Raci[]> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await bulkSetRaciService(entityId, entityType, assignments)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to bulk set RACI assignments')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    setRaci,
    removeRaci,
    bulkSetRaci,
    isLoading,
    error,
  }
}
