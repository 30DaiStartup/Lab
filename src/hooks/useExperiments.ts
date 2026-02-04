import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Database, ExperimentStatus } from '@/types/database'
import {
  getExperiments,
  getExperimentWithTasks,
  createExperiment as createExperimentService,
  updateExperiment as updateExperimentService,
  deleteExperiment as deleteExperimentService,
  type ExperimentFilters,
  type ExperimentWithTasks,
} from '@/services/experiments'

type Experiment = Database['public']['Tables']['experiments']['Row']
type ExperimentInsert = Database['public']['Tables']['experiments']['Insert']
type ExperimentUpdate = Database['public']['Tables']['experiments']['Update']

/** Filter options for useExperiments hook */
export interface UseExperimentsFilters {
  status?: ExperimentStatus
}

/** Return type for useExperiments hook */
export interface UseExperimentsResult {
  experiments: Experiment[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/** Return type for useExperiment hook */
export interface UseExperimentResult {
  experiment: ExperimentWithTasks | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/** Return type for useExperimentMutations hook */
export interface UseExperimentMutationsResult {
  createExperiment: (data: ExperimentInsert) => Promise<Experiment>
  updateExperiment: (id: number, data: ExperimentUpdate) => Promise<Experiment>
  deleteExperiment: (id: number) => Promise<boolean>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: Error | null
}

/**
 * Hook to fetch and manage list of experiments
 * Supports filtering by outcomeId and status
 *
 * @param outcomeId - Optional outcome ID to filter experiments by parent outcome
 * @param filters - Optional filters to apply (status)
 * @returns Object with experiments array, loading state, error, and refetch function
 */
export function useExperiments(
  outcomeId?: number,
  filters?: UseExperimentsFilters
): UseExperimentsResult {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Memoize filters to prevent unnecessary refetches
  const memoizedFilters = useMemo<Omit<ExperimentFilters, 'outcomeId'> | undefined>(() => {
    if (!filters) return undefined
    return {
      status: filters.status,
    }
  }, [filters?.status])

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true)

  const fetchExperiments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getExperiments(outcomeId, memoizedFilters)
      if (isMountedRef.current) {
        setExperiments(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch experiments'))
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [outcomeId, memoizedFilters])

  useEffect(() => {
    isMountedRef.current = true
    fetchExperiments()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchExperiments])

  const refetch = useCallback(async () => {
    await fetchExperiments()
  }, [fetchExperiments])

  return { experiments, isLoading, error, refetch }
}

/**
 * Hook to fetch a single experiment with its related tasks
 *
 * @param id - The experiment ID to fetch
 * @returns Object with experiment, loading state, error, and refetch function
 */
export function useExperiment(id: number | null | undefined): UseExperimentResult {
  const [experiment, setExperiment] = useState<ExperimentWithTasks | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true)

  const fetchExperiment = useCallback(async () => {
    if (id === null || id === undefined) {
      setExperiment(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getExperimentWithTasks(id)
      if (isMountedRef.current) {
        setExperiment(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch experiment ${id}`))
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [id])

  useEffect(() => {
    isMountedRef.current = true
    fetchExperiment()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchExperiment])

  const refetch = useCallback(async () => {
    await fetchExperiment()
  }, [fetchExperiment])

  return { experiment, isLoading, error, refetch }
}

/**
 * Hook for experiment mutations (create, update, delete)
 * Provides functions that return promises and track loading states
 *
 * @param onMutationSuccess - Optional callback to trigger after successful mutation (e.g., refetch list)
 * @returns Object with mutation functions and loading states
 */
export function useExperimentMutations(
  onMutationSuccess?: () => void | Promise<void>
): UseExperimentMutationsResult {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createExperiment = useCallback(
    async (data: ExperimentInsert): Promise<Experiment> => {
      setIsCreating(true)
      setError(null)

      try {
        const created = await createExperimentService(data)
        await onMutationSuccess?.()
        return created
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create experiment')
        setError(error)
        throw error
      } finally {
        setIsCreating(false)
      }
    },
    [onMutationSuccess]
  )

  const updateExperiment = useCallback(
    async (id: number, data: ExperimentUpdate): Promise<Experiment> => {
      setIsUpdating(true)
      setError(null)

      try {
        const updated = await updateExperimentService(id, data)
        await onMutationSuccess?.()
        return updated
      } catch (err) {
        const error = err instanceof Error ? err : new Error(`Failed to update experiment ${id}`)
        setError(error)
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [onMutationSuccess]
  )

  const deleteExperiment = useCallback(
    async (id: number): Promise<boolean> => {
      setIsDeleting(true)
      setError(null)

      try {
        const result = await deleteExperimentService(id)
        await onMutationSuccess?.()
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(`Failed to delete experiment ${id}`)
        setError(error)
        throw error
      } finally {
        setIsDeleting(false)
      }
    },
    [onMutationSuccess]
  )

  return {
    createExperiment,
    updateExperiment,
    deleteExperiment,
    isCreating,
    isUpdating,
    isDeleting,
    error,
  }
}
