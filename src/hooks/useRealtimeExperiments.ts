import { useCallback, useRef } from 'react'
import {
  useRealtimeSubscription,
  type RealtimeChangePayload,
  type UseRealtimeSubscriptionResult,
  type RealtimeFilter,
} from './useRealtimeSubscription'
import type { Database } from '@/types/database'

type Experiment = Database['public']['Tables']['experiments']['Row']

/** Callback type for experiment changes */
export type ExperimentChangeCallback = (
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  experiment: Experiment | null,
  oldExperiment?: Experiment | null
) => void

/** Options for useRealtimeExperiments */
export interface UseRealtimeExperimentsOptions {
  /** Filter to a specific outcome's experiments */
  outcomeId?: number | null
  /** Callback when any change occurs */
  onChange?: ExperimentChangeCallback
  /** Callback specifically for inserts */
  onInsert?: (experiment: Experiment) => void
  /** Callback specifically for updates */
  onUpdate?: (experiment: Experiment, oldExperiment: Experiment | null) => void
  /** Callback specifically for deletes */
  onDelete?: (experiment: Experiment) => void
  /** Whether the subscription is enabled */
  enabled?: boolean
}

/** Return type extending base subscription result */
export interface UseRealtimeExperimentsResult extends UseRealtimeSubscriptionResult {
  /** Last received change payload */
  lastChange: RealtimeChangePayload<Experiment> | null
}

/**
 * Hook for subscribing to real-time experiment changes
 * Can optionally filter to experiments belonging to a specific outcome
 *
 * @param options - Configuration options including outcomeId filter and callbacks
 * @returns Subscription result with connection state and last change
 *
 * @example
 * ```tsx
 * // Subscribe to all experiments
 * const { isConnected } = useRealtimeExperiments({
 *   onChange: (type, experiment) => console.log(type, experiment)
 * })
 *
 * // Subscribe to experiments for a specific outcome
 * const { isConnected } = useRealtimeExperiments({
 *   outcomeId: 123,
 *   onUpdate: (experiment) => {
 *     console.log('Experiment updated:', experiment.title)
 *     refetch()
 *   }
 * })
 * ```
 */
export function useRealtimeExperiments(
  options: UseRealtimeExperimentsOptions = {}
): UseRealtimeExperimentsResult {
  const { outcomeId, onChange, onInsert, onUpdate, onDelete, enabled = true } = options

  // Track last change
  const lastChangeRef = useRef<RealtimeChangePayload<Experiment> | null>(null)

  // Build filter for outcome_id if provided
  const filter: RealtimeFilter | undefined =
    outcomeId !== null && outcomeId !== undefined
      ? { column: 'outcome_id', value: outcomeId }
      : undefined

  // Handle incoming changes
  const handleChange = useCallback(
    (payload: RealtimeChangePayload<Experiment>) => {
      lastChangeRef.current = payload

      const { eventType, new: newExperiment, old: oldExperiment } = payload

      // If we have an outcomeId filter, verify the experiment belongs to that outcome
      // This is a safety check since Supabase filter should handle this
      if (outcomeId !== null && outcomeId !== undefined) {
        const relevantOutcomeId = newExperiment?.outcome_id ?? oldExperiment?.outcome_id
        if (relevantOutcomeId !== outcomeId) {
          return // Skip changes for other outcomes
        }
      }

      // Call the generic onChange callback
      onChange?.(eventType, newExperiment, oldExperiment)

      // Call specific event callbacks
      switch (eventType) {
        case 'INSERT':
          if (newExperiment) {
            onInsert?.(newExperiment)
          }
          break
        case 'UPDATE':
          if (newExperiment) {
            onUpdate?.(newExperiment, oldExperiment)
          }
          break
        case 'DELETE':
          if (oldExperiment) {
            onDelete?.(oldExperiment)
          }
          break
      }
    },
    [outcomeId, onChange, onInsert, onUpdate, onDelete]
  )

  // Subscribe to experiments table
  const subscriptionResult = useRealtimeSubscription(
    'experiments',
    handleChange,
    filter,
    enabled
  )

  return {
    ...subscriptionResult,
    lastChange: lastChangeRef.current,
  }
}

/**
 * Hook for subscribing to changes on a specific experiment
 * Useful for experiment detail pages
 *
 * @param experimentId - The ID of the experiment to watch
 * @param options - Configuration options
 * @returns Subscription result
 */
export function useRealtimeExperiment(
  experimentId: number | null | undefined,
  options: Omit<UseRealtimeExperimentsOptions, 'outcomeId' | 'enabled'> = {}
): UseRealtimeExperimentsResult {
  const { onChange, onInsert, onUpdate, onDelete } = options

  // Filter changes to only this experiment
  const filteredOnChange = useCallback<ExperimentChangeCallback>(
    (eventType, experiment, oldExperiment) => {
      const relevantId = experiment?.id ?? oldExperiment?.id
      if (experimentId && relevantId === experimentId) {
        onChange?.(eventType, experiment, oldExperiment)
      }
    },
    [experimentId, onChange]
  )

  const filteredOnInsert = useCallback(
    (experiment: Experiment) => {
      // Inserts won't match our ID, parent handles it
      onInsert?.(experiment)
    },
    [onInsert]
  )

  const filteredOnUpdate = useCallback(
    (experiment: Experiment, oldExperiment: Experiment | null) => {
      if (experimentId && experiment.id === experimentId) {
        onUpdate?.(experiment, oldExperiment)
      }
    },
    [experimentId, onUpdate]
  )

  const filteredOnDelete = useCallback(
    (experiment: Experiment) => {
      if (experimentId && experiment.id === experimentId) {
        onDelete?.(experiment)
      }
    },
    [experimentId, onDelete]
  )

  return useRealtimeExperiments({
    onChange: filteredOnChange,
    onInsert: filteredOnInsert,
    onUpdate: filteredOnUpdate,
    onDelete: filteredOnDelete,
    enabled: experimentId !== null && experimentId !== undefined,
  })
}
