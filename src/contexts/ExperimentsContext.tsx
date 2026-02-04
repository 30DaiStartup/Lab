import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { Database } from '@/types/database'
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

/** Cache entry for an experiment with tasks */
interface ExperimentCache {
  experiment: ExperimentWithTasks
  fetchedAt: number
}

/** State for the experiments context */
interface ExperimentsState {
  /** All experiments (potentially filtered) */
  experiments: Experiment[]
  /** Loading state for experiments list */
  isLoadingList: boolean
  /** Error state for experiments list */
  listError: Error | null
  /** Cache of individual experiments with tasks */
  experimentCache: Map<number, ExperimentCache>
  /** Current filters applied to the list */
  filters: ExperimentFilters | undefined
  /** Current outcomeId filter */
  outcomeId: number | undefined
}

/** Actions available in the experiments context */
interface ExperimentsActions {
  /** Refetch the experiments list with current filters */
  refetchExperiments: () => Promise<void>
  /** Set filters for the experiments list */
  setFilters: (filters: ExperimentFilters | undefined) => void
  /** Set the outcomeId filter */
  setOutcomeId: (outcomeId: number | undefined) => void
  /** Get a single experiment with tasks (uses cache when available) */
  getExperimentById: (id: number, forceRefresh?: boolean) => Promise<ExperimentWithTasks | null>
  /** Create a new experiment */
  createExperiment: (data: ExperimentInsert) => Promise<Experiment>
  /** Update an existing experiment */
  updateExperiment: (id: number, data: ExperimentUpdate) => Promise<Experiment>
  /** Delete an experiment */
  deleteExperiment: (id: number) => Promise<boolean>
  /** Invalidate the cache for a specific experiment or all */
  invalidateCache: (id?: number) => void
}

/** Full context value */
interface ExperimentsContextValue extends ExperimentsState, ExperimentsActions {
  /** Whether any mutation is in progress */
  isMutating: boolean
}

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL = 5 * 60 * 1000

const ExperimentsContext = createContext<ExperimentsContextValue | null>(null)

export interface ExperimentsProviderProps {
  children: ReactNode
  /** Initial filters to apply */
  initialFilters?: ExperimentFilters
  /** Initial outcomeId to filter by */
  initialOutcomeId?: number
}

/**
 * Provider component that manages experiment state and provides it to children
 * Handles caching, list management, and mutations
 */
export function ExperimentsProvider({
  children,
  initialFilters,
  initialOutcomeId,
}: ExperimentsProviderProps) {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [listError, setListError] = useState<Error | null>(null)
  const [filters, setFilters] = useState<ExperimentFilters | undefined>(initialFilters)
  const [outcomeId, setOutcomeId] = useState<number | undefined>(initialOutcomeId)
  const [isMutating, setIsMutating] = useState(false)

  // Use a ref for the cache to avoid re-renders on cache updates
  const experimentCacheRef = useRef<Map<number, ExperimentCache>>(new Map())
  // Force re-render when cache changes (for consumers that depend on cache)
  const [cacheVersion, setCacheVersion] = useState(0)

  // Track mounted state
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Fetch experiments list
  const refetchExperiments = useCallback(async () => {
    setIsLoadingList(true)
    setListError(null)

    try {
      const data = await getExperiments(outcomeId, filters)
      if (isMountedRef.current) {
        setExperiments(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setListError(err instanceof Error ? err : new Error('Failed to fetch experiments'))
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingList(false)
      }
    }
  }, [outcomeId, filters])

  // Fetch on mount and when filters or outcomeId change
  useEffect(() => {
    refetchExperiments()
  }, [refetchExperiments])

  // Get experiment by ID with caching
  const getExperimentById = useCallback(
    async (id: number, forceRefresh = false): Promise<ExperimentWithTasks | null> => {
      const cache = experimentCacheRef.current
      const cached = cache.get(id)
      const now = Date.now()

      // Return cached if valid and not forcing refresh
      if (!forceRefresh && cached && now - cached.fetchedAt < CACHE_TTL) {
        return cached.experiment
      }

      // Fetch fresh data
      const experiment = await getExperimentWithTasks(id)
      if (experiment && isMountedRef.current) {
        cache.set(id, { experiment, fetchedAt: now })
        setCacheVersion((v) => v + 1)
      }
      return experiment
    },
    []
  )

  // Invalidate cache
  const invalidateCache = useCallback((id?: number) => {
    if (id !== undefined) {
      experimentCacheRef.current.delete(id)
    } else {
      experimentCacheRef.current.clear()
    }
    setCacheVersion((v) => v + 1)
  }, [])

  // Create experiment
  const createExperiment = useCallback(
    async (data: ExperimentInsert): Promise<Experiment> => {
      setIsMutating(true)
      try {
        const created = await createExperimentService(data)
        // Refetch list to include new experiment
        await refetchExperiments()
        return created
      } finally {
        if (isMountedRef.current) {
          setIsMutating(false)
        }
      }
    },
    [refetchExperiments]
  )

  // Update experiment
  const updateExperiment = useCallback(
    async (id: number, data: ExperimentUpdate): Promise<Experiment> => {
      setIsMutating(true)
      try {
        const updated = await updateExperimentService(id, data)
        // Invalidate cache for this experiment
        invalidateCache(id)
        // Refetch list to reflect changes
        await refetchExperiments()
        return updated
      } finally {
        if (isMountedRef.current) {
          setIsMutating(false)
        }
      }
    },
    [refetchExperiments, invalidateCache]
  )

  // Delete experiment
  const deleteExperiment = useCallback(
    async (id: number): Promise<boolean> => {
      setIsMutating(true)
      try {
        const result = await deleteExperimentService(id)
        // Invalidate cache for this experiment
        invalidateCache(id)
        // Refetch list to reflect deletion
        await refetchExperiments()
        return result
      } finally {
        if (isMountedRef.current) {
          setIsMutating(false)
        }
      }
    },
    [refetchExperiments, invalidateCache]
  )

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ExperimentsContextValue>(
    () => ({
      experiments,
      isLoadingList,
      listError,
      experimentCache: experimentCacheRef.current,
      filters,
      outcomeId,
      isMutating,
      refetchExperiments,
      setFilters,
      setOutcomeId,
      getExperimentById,
      createExperiment,
      updateExperiment,
      deleteExperiment,
      invalidateCache,
    }),
    [
      experiments,
      isLoadingList,
      listError,
      filters,
      outcomeId,
      isMutating,
      cacheVersion, // Include cache version to trigger updates
      refetchExperiments,
      getExperimentById,
      createExperiment,
      updateExperiment,
      deleteExperiment,
      invalidateCache,
    ]
  )

  return <ExperimentsContext.Provider value={contextValue}>{children}</ExperimentsContext.Provider>
}

/**
 * Hook to access the experiments context
 * Must be used within an ExperimentsProvider
 *
 * @returns The experiments context value
 * @throws Error if used outside of ExperimentsProvider
 */
export function useExperimentsContext(): ExperimentsContextValue {
  const context = useContext(ExperimentsContext)
  if (!context) {
    throw new Error('useExperimentsContext must be used within an ExperimentsProvider')
  }
  return context
}

/**
 * Hook to get a single experiment from context
 * Fetches on mount and caches the result
 *
 * @param id - The experiment ID to fetch
 * @returns Object with experiment, loading state, error, and refetch function
 */
export function useExperimentFromContext(id: number | null | undefined) {
  const { getExperimentById } = useExperimentsContext()
  const [experiment, setExperiment] = useState<ExperimentWithTasks | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchExperiment = useCallback(async () => {
    if (id === null || id === undefined) {
      setExperiment(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getExperimentById(id)
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
  }, [id, getExperimentById])

  useEffect(() => {
    fetchExperiment()
  }, [fetchExperiment])

  const refetch = useCallback(async () => {
    if (id !== null && id !== undefined) {
      setIsLoading(true)
      try {
        const data = await getExperimentById(id, true) // Force refresh
        if (isMountedRef.current) {
          setExperiment(data)
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error(`Failed to refetch experiment ${id}`))
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }
  }, [id, getExperimentById])

  return { experiment, isLoading, error, refetch }
}

// Re-export types for convenience
export type { ExperimentFilters, ExperimentWithTasks }
