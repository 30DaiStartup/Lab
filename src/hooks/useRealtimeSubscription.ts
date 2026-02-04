import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/services/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/** Available table names in the database */
export type TableName = keyof Database['public']['Tables']

/** Realtime event types */
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE'

/** Filter for realtime subscriptions */
export interface RealtimeFilter {
  column: string
  value: string | number
}

/** Payload for realtime changes */
export interface RealtimeChangePayload<T> {
  eventType: RealtimeEventType
  old: T | null
  new: T | null
  table: string
}

/** Return type for useRealtimeSubscription */
export interface UseRealtimeSubscriptionResult {
  isConnected: boolean
  error: Error | null
  /** Manually reconnect if disconnected */
  reconnect: () => void
}

/** Internal payload shape from Supabase */
interface PostgresChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  old: Record<string, unknown>
  new: Record<string, unknown>
  table: string
  schema: string
  commit_timestamp: string
}

/**
 * Generic hook for subscribing to Supabase Realtime changes on a table
 * Handles connection state, cleanup, and reconnection
 *
 * @param table - The table name to subscribe to
 * @param callback - Function to call when changes occur
 * @param filter - Optional filter to narrow subscription (e.g., { column: 'outcome_id', value: 123 })
 * @param enabled - Whether the subscription should be active (default: true)
 * @returns Object with connection state, error, and reconnect function
 */
export function useRealtimeSubscription<
  T extends TableName,
  Row = Database['public']['Tables'][T]['Row']
>(
  table: T,
  callback: (payload: RealtimeChangePayload<Row>) => void,
  filter?: RealtimeFilter,
  enabled = true
): UseRealtimeSubscriptionResult {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Refs to track channel and callback
  const channelRef = useRef<RealtimeChannel | null>(null)
  const callbackRef = useRef(callback)

  // Keep callback ref current
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Track mounted state
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Subscribe to realtime changes
  const subscribe = useCallback(() => {
    // Skip if Supabase is not configured or subscription is disabled
    if (!supabase || !enabled) {
      if (!supabase) {
        console.warn(`[useRealtimeSubscription] Supabase not configured, skipping subscription to ${table}`)
      }
      return
    }

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Build channel name with optional filter
    const channelName = filter
      ? `${table}_${filter.column}_${filter.value}`
      : table

    // Create channel
    const channel = supabase.channel(channelName)

    // Build filter string if provided
    const filterString = filter ? `${filter.column}=eq.${filter.value}` : undefined

    // Subscribe to postgres changes using the typed method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedChannel = channel as any
    typedChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...(filterString ? { filter: filterString } : {}),
      },
      (payload: PostgresChangePayload) => {
        if (!isMountedRef.current) return

        // Map Supabase event type to our event type
        const eventType = payload.eventType as RealtimeEventType

        // Call the callback with normalized payload
        callbackRef.current({
          eventType,
          old: (payload.old as Row) || null,
          new: (payload.new as Row) || null,
          table: payload.table,
        })
      }
    )

    // Handle subscription state changes
    channel.subscribe((status) => {
      if (!isMountedRef.current) return

      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        setError(null)
        console.log(`[useRealtimeSubscription] Connected to ${channelName}`)
      } else if (status === 'CLOSED') {
        setIsConnected(false)
        console.log(`[useRealtimeSubscription] Disconnected from ${channelName}`)
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false)
        setError(new Error(`Failed to subscribe to ${channelName}`))
        console.error(`[useRealtimeSubscription] Error subscribing to ${channelName}`)
      } else if (status === 'TIMED_OUT') {
        setIsConnected(false)
        setError(new Error(`Subscription to ${channelName} timed out`))
        console.warn(`[useRealtimeSubscription] Subscription to ${channelName} timed out`)
      }
    })

    channelRef.current = channel
  }, [table, filter?.column, filter?.value, enabled])

  // Effect to manage subscription lifecycle
  useEffect(() => {
    subscribe()

    // Cleanup on unmount or when dependencies change
    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [subscribe])

  // Reconnect function
  const reconnect = useCallback(() => {
    if (!isMountedRef.current) return
    setError(null)
    subscribe()
  }, [subscribe])

  return { isConnected, error, reconnect }
}

/**
 * Helper hook to check if Supabase Realtime is available
 * @returns boolean indicating if realtime is available
 */
export function useRealtimeAvailable(): boolean {
  return supabase !== null
}
