import { useCallback, useRef } from 'react'
import {
  useRealtimeSubscription,
  type RealtimeChangePayload,
  type UseRealtimeSubscriptionResult,
} from './useRealtimeSubscription'
import type { Database } from '@/types/database'

type Outcome = Database['public']['Tables']['outcomes']['Row']

/** Callback type for outcome changes */
export type OutcomeChangeCallback = (
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  outcome: Outcome | null,
  oldOutcome?: Outcome | null
) => void

/** Options for useRealtimeOutcomes */
export interface UseRealtimeOutcomesOptions {
  /** Callback when any change occurs */
  onChange?: OutcomeChangeCallback
  /** Callback specifically for inserts */
  onInsert?: (outcome: Outcome) => void
  /** Callback specifically for updates */
  onUpdate?: (outcome: Outcome, oldOutcome: Outcome | null) => void
  /** Callback specifically for deletes */
  onDelete?: (outcome: Outcome) => void
  /** Whether the subscription is enabled */
  enabled?: boolean
}

/** Return type extending base subscription result */
export interface UseRealtimeOutcomesResult extends UseRealtimeSubscriptionResult {
  /** Last received change payload */
  lastChange: RealtimeChangePayload<Outcome> | null
}

/**
 * Hook for subscribing to real-time outcome changes
 * Provides callbacks for specific event types and integrates with existing data management
 *
 * @param options - Configuration options including callbacks
 * @returns Subscription result with connection state and last change
 *
 * @example
 * ```tsx
 * const { refetch } = useOutcomes()
 * const { isConnected } = useRealtimeOutcomes({
 *   onInsert: (outcome) => {
 *     console.log('New outcome:', outcome.title)
 *     refetch()
 *   },
 *   onUpdate: (outcome) => {
 *     console.log('Updated outcome:', outcome.title)
 *     refetch()
 *   },
 *   onDelete: (outcome) => {
 *     console.log('Deleted outcome:', outcome.id)
 *     refetch()
 *   }
 * })
 * ```
 */
export function useRealtimeOutcomes(
  options: UseRealtimeOutcomesOptions = {}
): UseRealtimeOutcomesResult {
  const { onChange, onInsert, onUpdate, onDelete, enabled = true } = options

  // Track last change
  const lastChangeRef = useRef<RealtimeChangePayload<Outcome> | null>(null)

  // Handle incoming changes
  const handleChange = useCallback(
    (payload: RealtimeChangePayload<Outcome>) => {
      lastChangeRef.current = payload

      const { eventType, new: newOutcome, old: oldOutcome } = payload

      // Call the generic onChange callback
      onChange?.(eventType, newOutcome, oldOutcome)

      // Call specific event callbacks
      switch (eventType) {
        case 'INSERT':
          if (newOutcome) {
            onInsert?.(newOutcome)
          }
          break
        case 'UPDATE':
          if (newOutcome) {
            onUpdate?.(newOutcome, oldOutcome)
          }
          break
        case 'DELETE':
          if (oldOutcome) {
            onDelete?.(oldOutcome)
          }
          break
      }
    },
    [onChange, onInsert, onUpdate, onDelete]
  )

  // Subscribe to outcomes table
  const subscriptionResult = useRealtimeSubscription('outcomes', handleChange, undefined, enabled)

  return {
    ...subscriptionResult,
    lastChange: lastChangeRef.current,
  }
}

/**
 * Hook for subscribing to changes on a specific outcome
 * Useful for detail pages where you only care about one outcome
 *
 * @param outcomeId - The ID of the outcome to watch
 * @param options - Configuration options
 * @returns Subscription result
 */
export function useRealtimeOutcome(
  outcomeId: number | null | undefined,
  options: Omit<UseRealtimeOutcomesOptions, 'enabled'> = {}
): UseRealtimeOutcomesResult {
  const { onChange, onInsert, onUpdate, onDelete } = options

  // Filter changes to only this outcome
  const filteredOnChange = useCallback<OutcomeChangeCallback>(
    (eventType, outcome, oldOutcome) => {
      // For updates/deletes, check if it matches our outcome ID
      const relevantId = outcome?.id ?? oldOutcome?.id
      if (outcomeId && relevantId === outcomeId) {
        onChange?.(eventType, outcome, oldOutcome)
      }
    },
    [outcomeId, onChange]
  )

  const filteredOnInsert = useCallback(
    (outcome: Outcome) => {
      // Inserts won't have our ID yet, so we skip filtering
      // The parent list subscription will handle inserts
      onInsert?.(outcome)
    },
    [onInsert]
  )

  const filteredOnUpdate = useCallback(
    (outcome: Outcome, oldOutcome: Outcome | null) => {
      if (outcomeId && outcome.id === outcomeId) {
        onUpdate?.(outcome, oldOutcome)
      }
    },
    [outcomeId, onUpdate]
  )

  const filteredOnDelete = useCallback(
    (outcome: Outcome) => {
      if (outcomeId && outcome.id === outcomeId) {
        onDelete?.(outcome)
      }
    },
    [outcomeId, onDelete]
  )

  return useRealtimeOutcomes({
    onChange: filteredOnChange,
    onInsert: filteredOnInsert,
    onUpdate: filteredOnUpdate,
    onDelete: filteredOnDelete,
    enabled: outcomeId !== null && outcomeId !== undefined,
  })
}
