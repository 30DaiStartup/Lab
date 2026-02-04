import { useCallback, useRef } from 'react'
import {
  useRealtimeSubscription,
  type RealtimeChangePayload,
  type UseRealtimeSubscriptionResult,
  type RealtimeFilter,
} from './useRealtimeSubscription'
import type { Database } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row']

/** Callback type for task changes */
export type TaskChangeCallback = (
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  task: Task | null,
  oldTask?: Task | null
) => void

/** Options for useRealtimeTasks */
export interface UseRealtimeTasksOptions {
  /** Filter to a specific experiment's tasks (required for most use cases) */
  experimentId?: number | null
  /** Callback when any change occurs */
  onChange?: TaskChangeCallback
  /** Callback specifically for inserts */
  onInsert?: (task: Task) => void
  /** Callback specifically for updates */
  onUpdate?: (task: Task, oldTask: Task | null) => void
  /** Callback specifically for deletes */
  onDelete?: (task: Task) => void
  /** Whether the subscription is enabled */
  enabled?: boolean
}

/** Return type extending base subscription result */
export interface UseRealtimeTasksResult extends UseRealtimeSubscriptionResult {
  /** Last received change payload */
  lastChange: RealtimeChangePayload<Task> | null
}

/**
 * Hook for subscribing to real-time task changes
 * Critical for Kanban board - other users' changes should appear immediately
 *
 * @param options - Configuration options including experimentId filter and callbacks
 * @returns Subscription result with connection state and last change
 *
 * @example
 * ```tsx
 * // Subscribe to tasks for a specific experiment
 * const { isConnected } = useRealtimeTasks({
 *   experimentId: 456,
 *   onInsert: (task) => {
 *     console.log('New task:', task.title)
 *     // Add to local state
 *   },
 *   onUpdate: (task, oldTask) => {
 *     console.log('Task moved:', oldTask?.status, '->', task.status)
 *     // Update in local state
 *   },
 *   onDelete: (task) => {
 *     console.log('Task deleted:', task.id)
 *     // Remove from local state
 *   }
 * })
 * ```
 */
export function useRealtimeTasks(
  options: UseRealtimeTasksOptions = {}
): UseRealtimeTasksResult {
  const { experimentId, onChange, onInsert, onUpdate, onDelete, enabled = true } = options

  // Track last change
  const lastChangeRef = useRef<RealtimeChangePayload<Task> | null>(null)

  // Build filter for experiment_id if provided
  const filter: RealtimeFilter | undefined =
    experimentId !== null && experimentId !== undefined
      ? { column: 'experiment_id', value: experimentId }
      : undefined

  // Handle incoming changes
  const handleChange = useCallback(
    (payload: RealtimeChangePayload<Task>) => {
      lastChangeRef.current = payload

      const { eventType, new: newTask, old: oldTask } = payload

      // If we have an experimentId filter, verify the task belongs to that experiment
      // This is a safety check since Supabase filter should handle this
      if (experimentId !== null && experimentId !== undefined) {
        const relevantExperimentId = newTask?.experiment_id ?? oldTask?.experiment_id
        if (relevantExperimentId !== experimentId) {
          return // Skip changes for other experiments
        }
      }

      // Call the generic onChange callback
      onChange?.(eventType, newTask, oldTask)

      // Call specific event callbacks
      switch (eventType) {
        case 'INSERT':
          if (newTask) {
            onInsert?.(newTask)
          }
          break
        case 'UPDATE':
          if (newTask) {
            onUpdate?.(newTask, oldTask)
          }
          break
        case 'DELETE':
          if (oldTask) {
            onDelete?.(oldTask)
          }
          break
      }
    },
    [experimentId, onChange, onInsert, onUpdate, onDelete]
  )

  // Subscribe to tasks table
  const subscriptionResult = useRealtimeSubscription(
    'tasks',
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
 * Hook for subscribing to changes on a specific task
 * Useful for task detail modals/pages
 *
 * @param taskId - The ID of the task to watch
 * @param options - Configuration options
 * @returns Subscription result
 */
export function useRealtimeTask(
  taskId: number | null | undefined,
  options: Omit<UseRealtimeTasksOptions, 'experimentId' | 'enabled'> = {}
): UseRealtimeTasksResult {
  const { onChange, onInsert, onUpdate, onDelete } = options

  // Filter changes to only this task
  const filteredOnChange = useCallback<TaskChangeCallback>(
    (eventType, task, oldTask) => {
      const relevantId = task?.id ?? oldTask?.id
      if (taskId && relevantId === taskId) {
        onChange?.(eventType, task, oldTask)
      }
    },
    [taskId, onChange]
  )

  const filteredOnInsert = useCallback(
    (task: Task) => {
      // Inserts won't match our ID, parent handles it
      onInsert?.(task)
    },
    [onInsert]
  )

  const filteredOnUpdate = useCallback(
    (task: Task, oldTask: Task | null) => {
      if (taskId && task.id === taskId) {
        onUpdate?.(task, oldTask)
      }
    },
    [taskId, onUpdate]
  )

  const filteredOnDelete = useCallback(
    (task: Task) => {
      if (taskId && task.id === taskId) {
        onDelete?.(task)
      }
    },
    [taskId, onDelete]
  )

  return useRealtimeTasks({
    onChange: filteredOnChange,
    onInsert: filteredOnInsert,
    onUpdate: filteredOnUpdate,
    onDelete: filteredOnDelete,
    enabled: taskId !== null && taskId !== undefined,
  })
}
