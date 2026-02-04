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

/** Cache entry for an outcome with experiments */
interface OutcomeCache {
  outcome: OutcomeWithExperiments
  fetchedAt: number
}

/** State for the outcomes context */
interface OutcomesState {
  /** All outcomes (potentially filtered) */
  outcomes: Outcome[]
  /** Loading state for outcomes list */
  isLoadingList: boolean
  /** Error state for outcomes list */
  listError: Error | null
  /** Cache of individual outcomes with experiments */
  outcomeCache: Map<number, OutcomeCache>
  /** Current filters applied to the list */
  filters: OutcomeFilters | undefined
}

/** Actions available in the outcomes context */
interface OutcomesActions {
  /** Refetch the outcomes list with current filters */
  refetchOutcomes: () => Promise<void>
  /** Set filters for the outcomes list */
  setFilters: (filters: OutcomeFilters | undefined) => void
  /** Get a single outcome with experiments (uses cache when available) */
  getOutcomeById: (id: number, forceRefresh?: boolean) => Promise<OutcomeWithExperiments | null>
  /** Create a new outcome */
  createOutcome: (data: OutcomeInsert) => Promise<Outcome>
  /** Update an existing outcome */
  updateOutcome: (id: number, data: OutcomeUpdate) => Promise<Outcome>
  /** Delete an outcome */
  deleteOutcome: (id: number) => Promise<boolean>
  /** Invalidate the cache for a specific outcome or all */
  invalidateCache: (id?: number) => void
}

/** Full context value */
interface OutcomesContextValue extends OutcomesState, OutcomesActions {
  /** Whether any mutation is in progress */
  isMutating: boolean
}

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL = 5 * 60 * 1000

const OutcomesContext = createContext<OutcomesContextValue | null>(null)

export interface OutcomesProviderProps {
  children: ReactNode
  /** Initial filters to apply */
  initialFilters?: OutcomeFilters
}

/**
 * Provider component that manages outcome state and provides it to children
 * Handles caching, list management, and mutations
 */
export function OutcomesProvider({ children, initialFilters }: OutcomesProviderProps) {
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [listError, setListError] = useState<Error | null>(null)
  const [filters, setFilters] = useState<OutcomeFilters | undefined>(initialFilters)
  const [isMutating, setIsMutating] = useState(false)

  // Use a ref for the cache to avoid re-renders on cache updates
  const outcomeCacheRef = useRef<Map<number, OutcomeCache>>(new Map())
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

  // Fetch outcomes list
  const refetchOutcomes = useCallback(async () => {
    setIsLoadingList(true)
    setListError(null)

    try {
      const data = await getOutcomes(filters)
      if (isMountedRef.current) {
        setOutcomes(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setListError(err instanceof Error ? err : new Error('Failed to fetch outcomes'))
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingList(false)
      }
    }
  }, [filters])

  // Fetch on mount and when filters change
  useEffect(() => {
    refetchOutcomes()
  }, [refetchOutcomes])

  // Get outcome by ID with caching
  const getOutcomeById = useCallback(
    async (id: number, forceRefresh = false): Promise<OutcomeWithExperiments | null> => {
      const cache = outcomeCacheRef.current
      const cached = cache.get(id)
      const now = Date.now()

      // Return cached if valid and not forcing refresh
      if (!forceRefresh && cached && now - cached.fetchedAt < CACHE_TTL) {
        return cached.outcome
      }

      // Fetch fresh data
      const outcome = await getOutcomeWithExperiments(id)
      if (outcome && isMountedRef.current) {
        cache.set(id, { outcome, fetchedAt: now })
        setCacheVersion((v) => v + 1)
      }
      return outcome
    },
    []
  )

  // Invalidate cache
  const invalidateCache = useCallback((id?: number) => {
    if (id !== undefined) {
      outcomeCacheRef.current.delete(id)
    } else {
      outcomeCacheRef.current.clear()
    }
    setCacheVersion((v) => v + 1)
  }, [])

  // Create outcome
  const createOutcome = useCallback(
    async (data: OutcomeInsert): Promise<Outcome> => {
      setIsMutating(true)
      try {
        const created = await createOutcomeService(data)
        // Refetch list to include new outcome
        await refetchOutcomes()
        return created
      } finally {
        if (isMountedRef.current) {
          setIsMutating(false)
        }
      }
    },
    [refetchOutcomes]
  )

  // Update outcome
  const updateOutcome = useCallback(
    async (id: number, data: OutcomeUpdate): Promise<Outcome> => {
      setIsMutating(true)
      try {
        const updated = await updateOutcomeService(id, data)
        // Invalidate cache for this outcome
        invalidateCache(id)
        // Refetch list to reflect changes
        await refetchOutcomes()
        return updated
      } finally {
        if (isMountedRef.current) {
          setIsMutating(false)
        }
      }
    },
    [refetchOutcomes, invalidateCache]
  )

  // Delete outcome
  const deleteOutcome = useCallback(
    async (id: number): Promise<boolean> => {
      setIsMutating(true)
      try {
        const result = await deleteOutcomeService(id)
        // Invalidate cache for this outcome
        invalidateCache(id)
        // Refetch list to reflect deletion
        await refetchOutcomes()
        return result
      } finally {
        if (isMountedRef.current) {
          setIsMutating(false)
        }
      }
    },
    [refetchOutcomes, invalidateCache]
  )

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<OutcomesContextValue>(
    () => ({
      outcomes,
      isLoadingList,
      listError,
      outcomeCache: outcomeCacheRef.current,
      filters,
      isMutating,
      refetchOutcomes,
      setFilters,
      getOutcomeById,
      createOutcome,
      updateOutcome,
      deleteOutcome,
      invalidateCache,
    }),
    [
      outcomes,
      isLoadingList,
      listError,
      filters,
      isMutating,
      cacheVersion, // Include cache version to trigger updates
      refetchOutcomes,
      getOutcomeById,
      createOutcome,
      updateOutcome,
      deleteOutcome,
      invalidateCache,
    ]
  )

  return <OutcomesContext.Provider value={contextValue}>{children}</OutcomesContext.Provider>
}

/**
 * Hook to access the outcomes context
 * Must be used within an OutcomesProvider
 *
 * @returns The outcomes context value
 * @throws Error if used outside of OutcomesProvider
 */
export function useOutcomesContext(): OutcomesContextValue {
  const context = useContext(OutcomesContext)
  if (!context) {
    throw new Error('useOutcomesContext must be used within an OutcomesProvider')
  }
  return context
}

/**
 * Hook to get a single outcome from context
 * Fetches on mount and caches the result
 *
 * @param id - The outcome ID to fetch
 * @returns Object with outcome, loading state, error, and refetch function
 */
export function useOutcomeFromContext(id: number | null | undefined) {
  const { getOutcomeById } = useOutcomesContext()
  const [outcome, setOutcome] = useState<OutcomeWithExperiments | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchOutcome = useCallback(async () => {
    if (id === null || id === undefined) {
      setOutcome(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getOutcomeById(id)
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
  }, [id, getOutcomeById])

  useEffect(() => {
    fetchOutcome()
  }, [fetchOutcome])

  const refetch = useCallback(async () => {
    if (id !== null && id !== undefined) {
      setIsLoading(true)
      try {
        const data = await getOutcomeById(id, true) // Force refresh
        if (isMountedRef.current) {
          setOutcome(data)
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error(`Failed to refetch outcome ${id}`))
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }
  }, [id, getOutcomeById])

  return { outcome, isLoading, error, refetch }
}

// Re-export types for convenience
export type { OutcomeFilters, OutcomeWithExperiments }
