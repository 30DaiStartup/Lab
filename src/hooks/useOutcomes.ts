import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Database, OutcomeStatus, OutcomeLevel, CascadeAlignment } from '@/types/database'
import {
  getOutcomes,
  getOutcomeWithExperiments,
  createOutcome as createOutcomeService,
  updateOutcome as updateOutcomeService,
  deleteOutcome as deleteOutcomeService,
  type OutcomeFilters,
  type OutcomeWithExperiments,
} from '@/services/outcomes'

type Outcome = Database['public']['Tables']['outcomes']['Row']
type OutcomeInsert = Database['public']['Tables']['outcomes']['Insert']
type OutcomeUpdate = Database['public']['Tables']['outcomes']['Update']

/** Filter options for useOutcomes hook */
export interface UseOutcomesFilters {
  status?: OutcomeStatus
  level?: OutcomeLevel
  cascadeAlignment?: CascadeAlignment
  parentOutcomeId?: number | null
}

/** Return type for useOutcomes hook */
export interface UseOutcomesResult {
  outcomes: Outcome[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/** Return type for useOutcome hook */
export interface UseOutcomeResult {
  outcome: OutcomeWithExperiments | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/** Return type for useOutcomeMutations hook */
export interface UseOutcomeMutationsResult {
  createOutcome: (data: OutcomeInsert) => Promise<Outcome>
  updateOutcome: (id: number, data: OutcomeUpdate) => Promise<Outcome>
  deleteOutcome: (id: number) => Promise<boolean>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: Error | null
}

/**
 * Hook to fetch and manage list of outcomes
 * Supports filtering by status, level, cascadeAlignment, and parentOutcomeId
 *
 * @param filters - Optional filters to apply
 * @returns Object with outcomes array, loading state, error, and refetch function
 */
export function useOutcomes(filters?: UseOutcomesFilters): UseOutcomesResult {
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Memoize filters to prevent unnecessary refetches
  const memoizedFilters = useMemo<OutcomeFilters | undefined>(() => {
    if (!filters) return undefined
    return {
      status: filters.status,
      level: filters.level,
      cascadeAlignment: filters.cascadeAlignment,
      parentOutcomeId: filters.parentOutcomeId,
    }
  }, [filters?.status, filters?.level, filters?.cascadeAlignment, filters?.parentOutcomeId])

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true)

  const fetchOutcomes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getOutcomes(memoizedFilters)
      if (isMountedRef.current) {
        setOutcomes(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch outcomes'))
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [memoizedFilters])

  useEffect(() => {
    isMountedRef.current = true
    fetchOutcomes()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchOutcomes])

  const refetch = useCallback(async () => {
    await fetchOutcomes()
  }, [fetchOutcomes])

  return { outcomes, isLoading, error, refetch }
}

/**
 * Hook to fetch a single outcome with its related experiments
 *
 * @param id - The outcome ID to fetch
 * @returns Object with outcome, loading state, error, and refetch function
 */
export function useOutcome(id: number | null | undefined): UseOutcomeResult {
  const [outcome, setOutcome] = useState<OutcomeWithExperiments | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true)

  const fetchOutcome = useCallback(async () => {
    if (id === null || id === undefined) {
      setOutcome(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getOutcomeWithExperiments(id)
      if (isMountedRef.current) {
        setOutcome(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch outcome ${id}`))
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [id])

  useEffect(() => {
    isMountedRef.current = true
    fetchOutcome()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchOutcome])

  const refetch = useCallback(async () => {
    await fetchOutcome()
  }, [fetchOutcome])

  return { outcome, isLoading, error, refetch }
}

/**
 * Hook for outcome mutations (create, update, delete)
 * Provides functions that return promises and track loading states
 *
 * @param onMutationSuccess - Optional callback to trigger after successful mutation (e.g., refetch list)
 * @returns Object with mutation functions and loading states
 */
export function useOutcomeMutations(
  onMutationSuccess?: () => void | Promise<void>
): UseOutcomeMutationsResult {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createOutcome = useCallback(
    async (data: OutcomeInsert): Promise<Outcome> => {
      setIsCreating(true)
      setError(null)

      try {
        const created = await createOutcomeService(data)
        await onMutationSuccess?.()
        return created
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create outcome')
        setError(error)
        throw error
      } finally {
        setIsCreating(false)
      }
    },
    [onMutationSuccess]
  )

  const updateOutcome = useCallback(
    async (id: number, data: OutcomeUpdate): Promise<Outcome> => {
      setIsUpdating(true)
      setError(null)

      try {
        const updated = await updateOutcomeService(id, data)
        await onMutationSuccess?.()
        return updated
      } catch (err) {
        const error = err instanceof Error ? err : new Error(`Failed to update outcome ${id}`)
        setError(error)
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [onMutationSuccess]
  )

  const deleteOutcome = useCallback(
    async (id: number): Promise<boolean> => {
      setIsDeleting(true)
      setError(null)

      try {
        const result = await deleteOutcomeService(id)
        await onMutationSuccess?.()
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(`Failed to delete outcome ${id}`)
        setError(error)
        throw error
      } finally {
        setIsDeleting(false)
      }
    },
    [onMutationSuccess]
  )

  return {
    createOutcome,
    updateOutcome,
    deleteOutcome,
    isCreating,
    isUpdating,
    isDeleting,
    error,
  }
}
